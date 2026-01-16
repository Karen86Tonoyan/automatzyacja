/**
 * ATLAS Backend Server
 * LangChain integration, Comet (long-polling), WebSocket, PDF/DOCX generation
 */

const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { ChatOpenAI } = require('langchain/chat_models/openai');
const { ConversationChain } = require('langchain/chains');
const { BufferMemory } = require('langchain/memory');
const { PDFDocument } = require('pdf-lib');
const docx = require('docx');
const xlsx = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Storage
const conversations = new Map();
const longPollQueues = new Map();

// ============ LANGCHAIN SETUP ============

/**
 * Initialize LangChain for conversation
 */
function initLangChain(conversationId) {
  if (conversations.has(conversationId)) {
    return conversations.get(conversationId);
  }

  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7,
    streaming: true
  });

  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: 'history'
  });

  const chain = new ConversationChain({
    llm: model,
    memory: memory
  });

  const conversation = {
    chain,
    memory,
    model,
    createdAt: Date.now(),
    messageCount: 0
  };

  conversations.set(conversationId, conversation);

  console.log('[LangChain] Initialized conversation:', conversationId);

  return conversation;
}

// ============ WEBSOCKET ============

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, req) => {
  console.log('[WebSocket] Client connected');

  let conversationId = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      console.log('[WebSocket] Message received:', message.type);

      switch (message.type) {
        case 'init':
          conversationId = message.conversationId;
          initLangChain(conversationId);
          ws.send(JSON.stringify({ type: 'init_ok', conversationId }));
          break;

        case 'run':
          await handleLangChainRun(conversationId, message, (chunk) => {
            ws.send(JSON.stringify({ type: 'stream_chunk', chunk }));
          });
          break;

        case 'create_chain':
          const result = await handleChainCreation(conversationId, message);
          ws.send(JSON.stringify({ type: 'response', content: result }));
          break;

        case 'tool_result':
          // Handle tool result from extension
          console.log('[WebSocket] Tool result:', message.callId, message.result);
          break;

        case 'clear_memory':
          if (conversationId && conversations.has(conversationId)) {
            conversations.get(conversationId).memory.clear();
            ws.send(JSON.stringify({ type: 'memory_cleared' }));
          }
          break;
      }

    } catch (error) {
      console.error('[WebSocket] Error:', error);
      ws.send(JSON.stringify({ type: 'error', error: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
  });
});

// ============ LONG-POLLING (COMET) ============

/**
 * Long-polling endpoint - Comet pattern
 * Server holds request until new data or timeout
 */
app.post('/langchain/poll', async (req, res) => {
  const { conversationId, timeout = 30000 } = req.body;

  console.log('[Long-poll] Client polling:', conversationId);

  // Initialize queue if needed
  if (!longPollQueues.has(conversationId)) {
    longPollQueues.set(conversationId, []);
  }

  const queue = longPollQueues.get(conversationId);

  // If messages waiting, send immediately
  if (queue.length > 0) {
    const messages = [...queue];
    queue.length = 0; // Clear queue
    return res.json({ messages });
  }

  // Otherwise, hold connection
  const timeoutId = setTimeout(() => {
    // Timeout - send empty response
    res.json({ messages: [] });
  }, timeout);

  // Store response object to send later when data arrives
  queue.responseObj = res;
  queue.timeoutId = timeoutId;
});

/**
 * Send endpoint - for long-poll clients
 */
app.post('/langchain/send', async (req, res) => {
  const { conversationId, type, prompt, ...rest } = req.body;

  console.log('[Send] Message received:', type);

  try {
    let result;

    switch (type) {
      case 'run':
        result = await handleLangChainRun(conversationId, req.body, (chunk) => {
          // Push stream chunk to long-poll queue
          pushToLongPollQueue(conversationId, { type: 'stream_chunk', chunk });
        });
        break;

      case 'create_chain':
        result = await handleChainCreation(conversationId, req.body);
        break;

      default:
        result = { error: 'Unknown type' };
    }

    // Send final response
    pushToLongPollQueue(conversationId, { type: 'response', content: result });

    res.json({ success: true, result });

  } catch (error) {
    console.error('[Send] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Push message to long-poll queue
 */
function pushToLongPollQueue(conversationId, message) {
  if (!longPollQueues.has(conversationId)) {
    longPollQueues.set(conversationId, []);
  }

  const queue = longPollQueues.get(conversationId);

  // If response object waiting, send immediately
  if (queue.responseObj) {
    clearTimeout(queue.timeoutId);
    queue.responseObj.json({ messages: [message] });
    delete queue.responseObj;
    delete queue.timeoutId;
  } else {
    // Queue message for next poll
    queue.push(message);
  }
}

// ============ SERVER-SENT EVENTS ============

app.get('/langchain/sse', (req, res) => {
  const { conversationId } = req.query;

  console.log('[SSE] Client connected:', conversationId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send ping every 15s to keep connection alive
  const pingInterval = setInterval(() => {
    res.write(':\n\n');
  }, 15000);

  // Store SSE response
  if (!longPollQueues.has(conversationId)) {
    longPollQueues.set(conversationId, []);
  }

  const queue = longPollQueues.get(conversationId);
  queue.sseResponse = res;

  req.on('close', () => {
    console.log('[SSE] Client disconnected');
    clearInterval(pingInterval);
    delete queue.sseResponse;
  });
});

/**
 * Push to SSE clients
 */
function pushToSSE(conversationId, data) {
  const queue = longPollQueues.get(conversationId);
  if (queue?.sseResponse) {
    queue.sseResponse.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

// ============ LANGCHAIN HANDLERS ============

/**
 * Handle LangChain run
 */
async function handleLangChainRun(conversationId, message, onChunk) {
  const conversation = initLangChain(conversationId);
  const { prompt, streaming = false } = message;

  console.log('[LangChain] Running prompt:', prompt.substring(0, 50) + '...');

  if (streaming) {
    // Stream response
    const response = await conversation.chain.call({
      input: prompt,
      callbacks: [{
        handleLLMNewToken(token) {
          onChunk(token);
        }
      }]
    });

    return response.response;
  } else {
    // Non-streaming
    const response = await conversation.chain.call({ input: prompt });
    return response.response;
  }
}

/**
 * Handle chain creation
 */
async function handleChainCreation(conversationId, message) {
  const { steps } = message;

  console.log('[LangChain] Creating chain with', steps.length, 'steps');

  let context = {};

  for (const step of steps) {
    switch (step.type) {
      case 'search':
        context.searchResults = await performSearch(step.query, step.sources);
        break;

      case 'summarize':
        context.summary = await summarizeContent(conversationId, context, step.prompt);
        break;

      case 'generate':
        context.generated = await generateContent(conversationId, context, step.prompt);
        break;

      case 'research':
        context.research = await performResearch(step.topic);
        break;

      case 'transform':
        context.transformed = await transformContent(conversationId, context, step);
        break;
    }
  }

  return context;
}

async function performSearch(query, sources) {
  // Mock implementation - integrate with actual APIs
  return {
    query,
    sources,
    results: [
      { source: 'reddit', title: 'Sample post', content: '...' },
      { source: 'twitter', title: 'Sample tweet', content: '...' }
    ]
  };
}

async function summarizeContent(conversationId, context, prompt) {
  const conversation = initLangChain(conversationId);

  const fullPrompt = `${prompt}\n\nContent:\n${JSON.stringify(context, null, 2)}`;

  const response = await conversation.chain.call({ input: fullPrompt });

  return response.response;
}

async function generateContent(conversationId, context, prompt) {
  return await summarizeContent(conversationId, context, prompt);
}

async function performResearch(topic) {
  // Mock - implement actual research logic
  return { topic, findings: [] };
}

async function transformContent(conversationId, context, step) {
  const prompt = `Transform this content for ${step.platform} in ${step.style} style:\n\n${JSON.stringify(context)}`;

  return await summarizeContent(conversationId, {}, prompt);
}

// ============ DOCUMENT GENERATION ============

/**
 * Generate PDF
 */
app.post('/generate/pdf', async (req, res) => {
  try {
    const { content, title } = req.body;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4

    // Add text (simple implementation - use pdf-lib text features)
    page.drawText(title || 'ATLAS Export', {
      x: 50,
      y: 800,
      size: 24
    });

    page.drawText(content.substring(0, 2000), {
      x: 50,
      y: 750,
      size: 12,
      maxWidth: 500
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=atlas-export.pdf');
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('[PDF] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate DOCX
 */
app.post('/generate/docx', async (req, res) => {
  try {
    const { content, title } = req.body;

    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: [
          new docx.Paragraph({
            text: title || 'ATLAS Export',
            heading: docx.HeadingLevel.HEADING_1
          }),
          new docx.Paragraph({
            text: content
          })
        ]
      }]
    });

    const buffer = await docx.Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=atlas-export.docx');
    res.send(buffer);

  } catch (error) {
    console.error('[DOCX] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate XLSX
 */
app.post('/generate/xlsx', async (req, res) => {
  try {
    const { data, sheetName = 'Sheet1' } = req.body;

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);

    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=atlas-export.xlsx');
    res.send(buffer);

  } catch (error) {
    console.error('[XLSX] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ HEALTH CHECK ============

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    conversations: conversations.size,
    uptime: process.uptime()
  });
});

// ============ START SERVER ============

const server = app.listen(PORT, () => {
  console.log(`[ATLAS Backend] Running on http://localhost:${PORT}`);
  console.log('[ATLAS Backend] Features: LangChain, Comet, WebSocket, PDF/DOCX/XLSX');
});

// Upgrade HTTP to WebSocket
server.on('upgrade', (request, socket, head) => {
  if (request.url === '/langchain/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[ATLAS Backend] Shutting down...');
  server.close(() => {
    console.log('[ATLAS Backend] Server closed');
    process.exit(0);
  });
});

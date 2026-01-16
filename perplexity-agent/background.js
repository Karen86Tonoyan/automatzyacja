/**
 * Background Service Worker - Perplexity Agent
 * Zarządza komunikacją z API Perplexity Sonar
 */

const PERPLEXITY_API = 'https://api.perplexity.ai/chat/completions';
const MODEL = 'llama-3.1-sonar-huge-128k-online';

// Słuchaj wiadomości z content scripts
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('📨 Received message:', request);

  switch (request.action) {
    case 'perplexityQuery':
      await handlePerplexityQuery(request, sendResponse);
      return true; // Asynchroniczna odpowiedź

    case 'generateComment':
      await handleGenerateComment(request, sendResponse);
      return true;

    case 'automate':
      await handleAutomation(request, sendResponse);
      return true;

    case 'getStatus':
      sendResponse({ status: 'ready', model: MODEL });
      return false;

    default:
      sendResponse({ error: 'Unknown action' });
      return false;
  }
});

/**
 * Obsługa zapytań do Perplexity API
 */
async function handlePerplexityQuery(request, sendResponse) {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      sendResponse({ error: 'API key not configured' });
      return;
    }

    const response = await fetch(PERPLEXITY_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: request.query
          }
        ],
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 2048,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      sendResponse({ error: error.error?.message || 'API error' });
      return;
    }

    const data = await response.json();
    console.log('✅ API Response:', data);

    sendResponse({
      success: true,
      result: data.choices[0]?.message?.content || '',
      usage: data.usage
    });
  } catch (error) {
    console.error('❌ Error:', error);
    sendResponse({ error: error.message });
  }
}

/**
 * Generuj komentarz na GitHub / Social Media
 */
async function handleGenerateComment(request, sendResponse) {
  try {
    const context = request.context || 'GitHub issue';
    const prompt = `Generate a professional and helpful ${context} comment based on: ${request.content}. Keep it concise and actionable.`;

    const apiKey = await getApiKey();
    if (!apiKey) {
      sendResponse({ error: 'API key not configured' });
      return;
    }

    const response = await fetch(PERPLEXITY_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    const comment = data.choices[0]?.message?.content || '';

    // Kopiuj do schowka
    await copyToClipboard(comment);

    sendResponse({
      success: true,
      comment: comment,
      copied: true
    });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

/**
 * Automatyzacja akcji na stronie
 */
async function handleAutomation(request, sendResponse) {
  try {
    const automationType = request.type; // 'github-comment', 'twitter-post', 'email'
    const data = request.data;

    let prompt = '';

    switch (automationType) {
      case 'github-comment':
        prompt = `Generate a GitHub issue comment for: ${data.issue}. Make it helpful and professional.`;
        break;

      case 'twitter-post':
        prompt = `Create a tweet about: ${data.topic}. Keep it under 280 characters, engaging and informative.`;
        break;

      case 'email':
        prompt = `Write a professional email: To: ${data.recipient}, About: ${data.subject}. Keep it concise.`;
        break;

      default:
        sendResponse({ error: 'Unknown automation type' });
        return;
    }

    const apiKey = await getApiKey();
    const response = await fetch(PERPLEXITY_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const apiResponse = await response.json();
    const generatedText = apiResponse.choices[0]?.message?.content || '';

    // Autouzupełnianie (opcjonalnie)
    if (request.autoFill) {
      await chrome.tabs.sendMessage(request.tabId, {
        action: 'fillContent',
        content: generatedText
      });
    }

    sendResponse({
      success: true,
      generatedText: generatedText
    });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

/**
 * Pobierz API key z storage
 */
async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['perplexity_api_key'], (result) => {
      resolve(result.perplexity_api_key || '');
    });
  });
}

/**
 * Kopiuj tekst do schowka
 */
async function copyToClipboard(text) {
  return new Promise((resolve) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const data = [new ClipboardItem({ 'text/plain': blob })];
    navigator.clipboard.write(data).then(() => resolve(true)).catch(() => resolve(false));
  });
}

// Health check endpoint
chrome.runtime.onInstalled.addListener(() => {
  console.log('✅ Perplexity Agent extension installed');
  chrome.storage.sync.get(['perplexity_api_key'], (result) => {
    if (!result.perplexity_api_key) {
      console.log('⚠️  No API key configured');
    }
  });
});

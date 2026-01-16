/**
 * AI Agent Pro - Background Service Worker
 * Handles: OAuth, AI connections, task orchestration, storage, scheduler, file management
 */

import { AIProviderManager } from '../lib/ai-provider.js';
import { DatabaseManager } from '../lib/database.js';
import { N8NIntegration } from '../lib/n8n-integration.js';
import { TaskScheduler } from '../lib/scheduler.js';
import { FileManager } from '../lib/file-manager.js';

// Global state
let currentUser = null;
let aiProvider = null;
let automationTasks = new Map();
let scheduler = null;

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[AI Agent] Extension installed:', details.reason);

  // Set default configuration
  await chrome.storage.local.set({
    config: {
      aiProvider: 'deepseek',
      automationEnabled: false,
      humanizationLevel: 'high',
      n8nWebhookUrl: '',
      downloadFolder: 'AI-Agent-Downloads',
      tasks: {
        autoLike: false,
        autoComment: false,
        autoEmail: false,
        autoWhatsApp: false,
        autoMessenger: false,
        competitorTracking: false,
        trendMonitoring: false
      }
    },
    scheduledTasks: []
  });

  // Initialize database
  await DatabaseManager.init();

  // Initialize scheduler
  scheduler = new TaskScheduler();
  await scheduler.init();

  // Open welcome page
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'popup/popup.html?welcome=true' });
  }
});

// Restore scheduled tasks on startup
chrome.runtime.onStartup.addListener(async () => {
  scheduler = new TaskScheduler();
  await scheduler.init();
  console.log('[Scheduler] Restored scheduled tasks');
});

// ============ OAUTH2 GOOGLE LOGIN ============
async function loginWithGoogle() {
  try {
    const token = await chrome.identity.getAuthToken({ interactive: true });

    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const userInfo = await response.json();
    currentUser = {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      token: token
    };

    await chrome.storage.local.set({ user: currentUser });

    console.log('[OAuth] Logged in:', currentUser.email);
    notifyUser('Login successful', `Welcome ${currentUser.name}!`);

    return currentUser;
  } catch (error) {
    console.error('[OAuth] Login failed:', error);
    throw error;
  }
}

async function logout() {
  if (currentUser?.token) {
    await chrome.identity.removeCachedAuthToken({ token: currentUser.token });
  }
  currentUser = null;
  await chrome.storage.local.remove('user');
  console.log('[OAuth] Logged out');
}

// ============ AI PROVIDER MANAGEMENT ============
async function connectAI(provider, credentials) {
  try {
    aiProvider = new AIProviderManager(provider);
    await aiProvider.connect(credentials);

    await chrome.storage.local.set({
      aiProviderConnected: true,
      aiProviderType: provider
    });

    console.log(`[AI] Connected to ${provider}`);
    notifyUser('AI Connected', `Successfully connected to ${provider}`);

    return true;
  } catch (error) {
    console.error('[AI] Connection failed:', error);
    throw error;
  }
}

// ============ MESSAGE LISTENERS ============
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message.type);

  (async () => {
    try {
      switch (message.type) {
        case 'LOGIN_GOOGLE':
          const user = await loginWithGoogle();
          sendResponse({ success: true, user });
          break;

        case 'LOGOUT':
          await logout();
          sendResponse({ success: true });
          break;

        case 'CONNECT_AI':
          await connectAI(message.provider, message.credentials);
          sendResponse({ success: true });
          break;

        // ========== FILE MANAGEMENT ==========
        case 'UPLOAD_FILE':
          const uploadResult = await FileManager.uploadFile(message.file, message.destination);
          sendResponse({ success: true, result: uploadResult });
          break;

        case 'DOWNLOAD_FILE':
          await FileManager.downloadFile(message.url, message.filename);
          sendResponse({ success: true });
          break;

        case 'DOWNLOAD_DATA':
          await FileManager.downloadData(message.data, message.filename, message.format);
          sendResponse({ success: true });
          break;

        case 'IMPORT_CONTACTS':
          const contacts = await FileManager.importContacts(message.file);
          sendResponse({ success: true, contacts });
          break;

        case 'EXPORT_DATABASE':
          const dbExport = await DatabaseManager.exportAll();
          await FileManager.downloadData(dbExport, 'ai-agent-export.json', 'json');
          sendResponse({ success: true });
          break;

        // ========== TASK SCHEDULER ==========
        case 'SCHEDULE_TASK':
          const taskId = await scheduler.scheduleTask(
            message.taskType,
            message.config,
            message.schedule
          );
          sendResponse({ success: true, taskId });
          break;

        case 'CANCEL_SCHEDULED_TASK':
          await scheduler.cancelTask(message.taskId);
          sendResponse({ success: true });
          break;

        case 'GET_SCHEDULED_TASKS':
          const tasks = await scheduler.getAllTasks();
          sendResponse({ success: true, tasks });
          break;

        case 'EXECUTE_TASK_NOW':
          await scheduler.executeTaskNow(message.taskId);
          sendResponse({ success: true });
          break;

        // ========== AUTOMATION ==========
        case 'START_AUTOMATION':
          await startAutomation(message.taskType, message.config);
          sendResponse({ success: true });
          break;

        case 'STOP_AUTOMATION':
          stopAutomation(message.taskId);
          sendResponse({ success: true });
          break;

        case 'SEND_WHATSAPP':
          const wpResult = await sendWhatsAppMessage(message.recipients, message.text, message.mediaUrl);
          sendResponse({ success: true, result: wpResult });
          break;

        case 'SEND_MESSENGER':
          const messengerResult = await sendMessengerMessage(message.recipients, message.text);
          sendResponse({ success: true, result: messengerResult });
          break;

        case 'SEND_EMAIL':
          const emailResult = await sendBulkEmail(message.recipients, message.subject, message.body);
          sendResponse({ success: true, result: emailResult });
          break;

        case 'ANALYZE_COMPETITOR':
          const analysis = await analyzeCompetitor(message.url);
          sendResponse({ success: true, data: analysis });
          break;

        case 'GET_TRENDING':
          const trending = await getTrendingTopics(message.platform);
          sendResponse({ success: true, topics: trending });
          break;

        case 'AI_GENERATE':
          const generated = await aiProvider.generate(message.prompt, message.context);
          sendResponse({ success: true, content: generated });
          break;

        case 'TRIGGER_N8N':
          await N8NIntegration.trigger(message.webhook, message.data);
          sendResponse({ success: true });
          break;

        case 'GET_STATUS':
          const status = await getSystemStatus();
          sendResponse({ success: true, status });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[Background] Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true;
});

// ============ WHATSAPP AUTOMATION ============
async function sendWhatsAppMessage(recipients, text, mediaUrl = null) {
  console.log('[WhatsApp] Sending messages to', recipients.length, 'contacts');

  const results = [];

  for (const recipient of recipients) {
    try {
      const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
      let whatsappTab;

      if (tabs.length > 0) {
        whatsappTab = tabs[0];
        await chrome.tabs.update(whatsappTab.id, { active: true });
      } else {
        whatsappTab = await chrome.tabs.create({ url: 'https://web.whatsapp.com' });
        await waitForWhatsAppLoad(whatsappTab.id);
      }

      await chrome.scripting.executeScript({
        target: { tabId: whatsappTab.id },
        func: sendWhatsAppMessageInPage,
        args: [recipient, text, mediaUrl]
      });

      results.push({ recipient, status: 'sent', timestamp: Date.now() });
      await randomDelay(2000, 5000);

    } catch (error) {
      console.error(`[WhatsApp] Failed to send to ${recipient}:`, error);
      results.push({ recipient, status: 'failed', error: error.message });
    }
  }

  await DatabaseManager.saveCampaign('whatsapp', { recipients, results, text });

  const config = await chrome.storage.local.get('config');
  if (config.config?.n8nWebhookUrl) {
    await N8NIntegration.trigger(config.config.n8nWebhookUrl, {
      type: 'whatsapp_campaign',
      results
    });
  }

  return results;
}

function sendWhatsAppMessageInPage(recipient, text, mediaUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      const searchBox = document.querySelector('div[contenteditable="true"][data-tab="3"]');
      if (!searchBox) throw new Error('WhatsApp not loaded');

      searchBox.click();
      await new Promise(r => setTimeout(r, 500));

      searchBox.textContent = recipient;
      searchBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 1500));

      const firstResult = document.querySelector('div[data-testid="cell-frame-container"]');
      if (!firstResult) throw new Error(`Contact ${recipient} not found`);

      firstResult.click();
      await new Promise(r => setTimeout(r, 1000));

      const messageBox = document.querySelector('div[contenteditable="true"][data-tab="10"]');
      if (!messageBox) throw new Error('Message box not found');

      messageBox.click();
      messageBox.textContent = text;
      messageBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 500));

      const sendButton = document.querySelector('button[data-testid="send"]');
      if (!sendButton) throw new Error('Send button not found');

      sendButton.click();

      resolve({ success: true, recipient });

    } catch (error) {
      reject(error);
    }
  });
}

async function waitForWhatsAppLoad(tabId) {
  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      try {
        const result = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => !!document.querySelector('div[data-testid="chat-list"]')
        });

        if (result[0].result) {
          clearInterval(checkInterval);
          resolve();
        }
      } catch (e) {
        // Tab not ready yet
      }
    }, 1000);
  });
}

// ============ MESSENGER AUTOMATION ============
async function sendMessengerMessage(recipients, text) {
  console.log('[Messenger] Sending messages to', recipients.length, 'contacts');

  const results = [];

  for (const recipient of recipients) {
    try {
      const tabs = await chrome.tabs.query({ url: 'https://www.messenger.com/*' });
      let messengerTab;

      if (tabs.length > 0) {
        messengerTab = tabs[0];
        await chrome.tabs.update(messengerTab.id, { active: true });
      } else {
        messengerTab = await chrome.tabs.create({ url: 'https://www.messenger.com' });
        await new Promise(r => setTimeout(r, 3000));
      }

      await chrome.scripting.executeScript({
        target: { tabId: messengerTab.id },
        func: sendMessengerMessageInPage,
        args: [recipient, text]
      });

      results.push({ recipient, status: 'sent', timestamp: Date.now() });
      await randomDelay(2000, 5000);

    } catch (error) {
      console.error(`[Messenger] Failed to send to ${recipient}:`, error);
      results.push({ recipient, status: 'failed', error: error.message });
    }
  }

  await DatabaseManager.saveCampaign('messenger', { recipients, results, text });

  return results;
}

function sendMessengerMessageInPage(recipient, text) {
  return new Promise(async (resolve, reject) => {
    try {
      const newMessageBtn = document.querySelector('a[href="/new"]') ||
                            document.querySelector('div[aria-label="New message"]');
      if (newMessageBtn) newMessageBtn.click();

      await new Promise(r => setTimeout(r, 1000));

      const searchInput = document.querySelector('input[placeholder*="Search"]') ||
                          document.querySelector('input[type="search"]');
      if (!searchInput) throw new Error('Search input not found');

      searchInput.value = recipient;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 1500));

      const firstResult = document.querySelector('div[role="listitem"]') ||
                          document.querySelector('li[role="option"]');
      if (firstResult) firstResult.click();

      await new Promise(r => setTimeout(r, 1000));

      const messageBox = document.querySelector('div[contenteditable="true"][role="textbox"]') ||
                         document.querySelector('div[aria-label*="Message"]');
      if (!messageBox) throw new Error('Message box not found');

      messageBox.textContent = text;
      messageBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 500));

      const sendBtn = document.querySelector('div[aria-label="Press enter to send"]') ||
                      document.querySelector('button[type="submit"]');
      if (sendBtn) sendBtn.click();

      resolve({ success: true, recipient });

    } catch (error) {
      reject(error);
    }
  });
}

// ============ EMAIL AUTOMATION ============
async function sendBulkEmail(recipients, subject, body) {
  if (!currentUser?.token) {
    throw new Error('Not logged in with Google');
  }

  console.log('[Email] Sending bulk email to', recipients.length, 'recipients');
  const results = [];

  for (const recipient of recipients) {
    try {
      const email = createEmail(recipient, subject, body);

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        })
      });

      if (!response.ok) throw new Error('Failed to send email');

      results.push({ recipient, status: 'sent', timestamp: Date.now() });
      await randomDelay(3000, 6000);

    } catch (error) {
      console.error(`[Email] Failed to send to ${recipient}:`, error);
      results.push({ recipient, status: 'failed', error: error.message });
    }
  }

  await DatabaseManager.saveCampaign('email', { recipients, results, subject, body });

  return results;
}

function createEmail(to, subject, body) {
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    body
  ].join('\r\n');

  return email;
}

// ============ AUTOMATION TASKS ============
async function startAutomation(taskType, config) {
  const taskId = `${taskType}_${Date.now()}`;

  console.log(`[Automation] Starting task: ${taskType}`, config);

  const task = {
    id: taskId,
    type: taskType,
    config,
    status: 'running',
    startTime: Date.now(),
    stats: { processed: 0, success: 0, failed: 0 }
  };

  automationTasks.set(taskId, task);

  switch (taskType) {
    case 'auto_browse':
      executeBrowsingTask(task);
      break;
    case 'auto_social':
      executeSocialTask(task);
      break;
    case 'competitor_tracking':
      executeCompetitorTracking(task);
      break;
    case 'trend_monitoring':
      executeTrendMonitoring(task);
      break;
  }

  return taskId;
}

function stopAutomation(taskId) {
  const task = automationTasks.get(taskId);
  if (task) {
    task.status = 'stopped';
    console.log(`[Automation] Stopped task: ${taskId}`);
  }
}

// ============ COMPETITOR ANALYSIS ============
async function analyzeCompetitor(url) {
  console.log('[Analysis] Analyzing competitor:', url);

  const tab = await chrome.tabs.create({ url, active: false });
  await new Promise(r => setTimeout(r, 5000));

  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content,
        keywords: document.querySelector('meta[name="keywords"]')?.content,
        socialLinks: Array.from(document.querySelectorAll('a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"], a[href*="instagram"]'))
          .map(a => ({ platform: a.href.match(/(facebook|twitter|linkedin|instagram)/)?.[1], url: a.href })),
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()),
        images: Array.from(document.querySelectorAll('img')).length,
        links: Array.from(document.querySelectorAll('a')).length,
        technologies: {
          hasGA: !!document.querySelector('script[src*="google-analytics"]'),
          hasFBPixel: !!document.querySelector('script[src*="facebook"]'),
          hasWordPress: !!document.querySelector('meta[name="generator"][content*="WordPress"]')
        }
      };
    }
  });

  const analysis = result[0].result;

  await chrome.tabs.remove(tab.id);

  if (aiProvider) {
    analysis.aiInsights = await aiProvider.generate(
      `Analyze this competitor website data and provide strategic insights:\n${JSON.stringify(analysis, null, 2)}`
    );
  }

  await DatabaseManager.saveCompetitorAnalysis(url, analysis);

  return analysis;
}

// ============ TRENDING TOPICS ============
async function getTrendingTopics(platform) {
  console.log('[Trending] Fetching topics from:', platform);

  const trends = {
    platform,
    timestamp: Date.now(),
    topics: []
  };

  switch (platform) {
    case 'twitter':
      trends.topics = await getTwitterTrends();
      break;
    case 'reddit':
      trends.topics = await getRedditTrends();
      break;
    case 'github':
      trends.topics = await getGitHubTrends();
      break;
  }

  await DatabaseManager.saveTrends(trends);

  return trends;
}

async function getTwitterTrends() {
  const tab = await chrome.tabs.create({ url: 'https://twitter.com/explore/tabs/trending', active: false });
  await new Promise(r => setTimeout(r, 5000));

  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      return Array.from(document.querySelectorAll('[data-testid="trend"]'))
        .slice(0, 10)
        .map(el => ({
          topic: el.querySelector('span')?.textContent,
          tweets: el.querySelector('div[dir="ltr"]')?.textContent
        }));
    }
  });

  await chrome.tabs.remove(tab.id);
  return result[0].result || [];
}

async function getGitHubTrends() {
  const response = await fetch('https://github.com/trending');
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  return Array.from(doc.querySelectorAll('article.Box-row')).slice(0, 10).map(article => ({
    repo: article.querySelector('h2 a')?.textContent.trim(),
    description: article.querySelector('p')?.textContent.trim(),
    stars: article.querySelector('[aria-label*="star"]')?.textContent.trim()
  }));
}

// ============ UTILITIES ============
function randomDelay(min, max) {
  return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
}

function notifyUser(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon128.png',
    title,
    message
  });
}

async function getSystemStatus() {
  const config = await chrome.storage.local.get(['user', 'config', 'aiProviderConnected']);

  return {
    loggedIn: !!currentUser,
    user: currentUser,
    aiConnected: !!config.aiProviderConnected,
    aiProvider: config.aiProviderType,
    activeTasks: Array.from(automationTasks.values()),
    scheduledTasks: await scheduler?.getAllTasks() || [],
    config: config.config
  };
}

console.log('[AI Agent] Background service worker initialized');

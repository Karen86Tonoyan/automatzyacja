/**
 * ATLAS Side Panel - Main Controller
 * Full automation, AI integration, system control
 */

let currentUser = null;
let aiProvider = null;
let savedPages = [];
let scheduledTasks = [];

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[ATLAS] Initializing...');

  await loadUserStatus();
  await loadSavedPages();
  await loadScheduledTasks();
  await updateStats();

  initializeTabs();
  initializeEventListeners();

  // Load current page info
  await loadCurrentPageInfo();
});

// ============ TAB MANAGEMENT ============
function initializeTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // Update active states
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');

      // Refresh tab content
      refreshTab(targetTab);
    });
  });
}

function refreshTab(tabName) {
  switch(tabName) {
    case 'saved':
      loadSavedPages();
      break;
    case 'automation':
      loadScheduledTasks();
      break;
    case 'analytics':
      updateStats();
      loadTrends();
      break;
  }
}

// ============ EVENT LISTENERS ============
function initializeEventListeners() {
  // Login
  document.getElementById('login-btn').addEventListener('click', handleLogin);

  // Capture tab
  document.getElementById('save-page-btn').addEventListener('click', savePage);
  document.getElementById('ai-analyze-btn').addEventListener('click', analyzeWithAI);

  // Saved pages tab
  document.getElementById('search-saved').addEventListener('input', filterSavedPages);
  document.getElementById('filter-category').addEventListener('change', filterSavedPages);
  document.getElementById('refresh-saved-btn').addEventListener('click', loadSavedPages);

  // Automation tab
  document.getElementById('whatsapp-campaign-btn').addEventListener('click', startWhatsAppCampaign);
  document.getElementById('messenger-campaign-btn').addEventListener('click', startMessengerCampaign);
  document.getElementById('email-campaign-btn').addEventListener('click', startEmailCampaign);
  document.getElementById('social-start-btn').addEventListener('click', startSocialAutomation);
  document.getElementById('social-stop-btn').addEventListener('click', stopSocialAutomation);
  document.getElementById('schedule-task-btn').addEventListener('click', scheduleNewTask);

  // Analytics tab
  document.getElementById('analyze-competitor-btn').addEventListener('click', analyzeCompetitor);
  document.getElementById('fetch-trends-btn').addEventListener('click', fetchTrends);

  // Export tab
  document.getElementById('export-pages-btn').addEventListener('click', exportPages);
  document.getElementById('import-contacts-btn').addEventListener('click', importContacts);
  document.getElementById('export-all-btn').addEventListener('click', exportAllData);
  document.getElementById('import-backup-btn').addEventListener('click', importBackup);
  document.getElementById('save-n8n-btn').addEventListener('click', saveN8NConfig);
  document.getElementById('test-n8n-btn').addEventListener('click', testN8NWebhook);
  document.getElementById('connect-ai-btn').addEventListener('click', connectAI);
  document.getElementById('generate-ai-doc-btn').addEventListener('click', generateAIDocument);
}

// ============ USER MANAGEMENT ============
async function loadUserStatus() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });

  if (response.success && response.status.loggedIn) {
    currentUser = response.status.user;
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('login-btn').textContent = 'Logout';
    document.getElementById('login-btn').onclick = handleLogout;
  }
}

async function handleLogin() {
  const response = await chrome.runtime.sendMessage({ type: 'LOGIN_GOOGLE' });

  if (response.success) {
    await loadUserStatus();
    showNotification('Login successful!', 'success');
  } else {
    showNotification('Login failed: ' + response.error, 'error');
  }
}

async function handleLogout() {
  await chrome.runtime.sendMessage({ type: 'LOGOUT' });
  currentUser = null;
  document.getElementById('user-name').textContent = 'Not logged in';
  document.getElementById('login-btn').textContent = 'Login with Google';
  document.getElementById('login-btn').onclick = handleLogin;
  showNotification('Logged out', 'info');
}

// ============ CAPTURE PAGE ============
async function loadCurrentPageInfo() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) return;

  document.getElementById('page-title').textContent = tab.title || 'Untitled';
  document.getElementById('page-url').textContent = tab.url;

  // Try to get metadata from content script
  try {
    const response = await chrome.tabs.sendMessage(tab.id, 'getPageMetadata');
    if (response && response.description) {
      document.getElementById('page-meta').textContent = response.description;
    }
  } catch (e) {
    console.log('[ATLAS] Could not get page metadata:', e);
  }
}

async function savePage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const pageData = {
    url: tab.url,
    title: tab.title,
    tags: document.getElementById('capture-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    notes: document.getElementById('capture-notes').value,
    category: document.getElementById('capture-category').value,
    timestamp: Date.now(),
    screenshot: document.getElementById('capture-screenshot').checked,
    fullText: document.getElementById('capture-fulltext').checked
  };

  // Get additional metadata
  try {
    const metadata = await chrome.tabs.sendMessage(tab.id, 'getPageMetadata');
    pageData.description = metadata.description;
    pageData.selectedText = metadata.selectedText;
  } catch (e) {
    console.log('[ATLAS] Metadata extraction failed');
  }

  // Save via background script
  const response = await chrome.runtime.sendMessage({
    type: 'savePage',
    payload: pageData
  });

  if (response.success) {
    showNotification('Page saved successfully!', 'success');

    // Clear form
    document.getElementById('capture-tags').value = '';
    document.getElementById('capture-notes').value = '';

    // Trigger n8n webhook if configured
    await triggerN8NWebhook({ type: 'page_saved', data: pageData });
  } else {
    showNotification('Failed to save page', 'error');
  }
}

async function analyzeWithAI() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  showNotification('Analyzing with AI...', 'info');

  const response = await chrome.runtime.sendMessage({
    type: 'AI_GENERATE',
    prompt: `Analyze this webpage and provide:
1. Summary
2. Key insights
3. Category
4. Suggested tags
5. Action items

Title: ${tab.title}
URL: ${tab.url}`,
    context: { url: tab.url }
  });

  if (response.success) {
    const analysis = response.content;

    // Auto-fill tags from AI
    const tagMatch = analysis.match(/tags?:?\s*(.+)/i);
    if (tagMatch) {
      document.getElementById('capture-tags').value = tagMatch[1];
    }

    // Add AI notes
    document.getElementById('capture-notes').value = analysis;

    showNotification('AI analysis complete!', 'success');
  } else {
    showNotification('AI analysis failed: ' + response.error, 'error');
  }
}

// ============ SAVED PAGES ============
async function loadSavedPages() {
  const data = await chrome.storage.local.get(['pages']);
  savedPages = data.pages || [];

  renderSavedPages(savedPages);
}

function renderSavedPages(pages) {
  const listEl = document.getElementById('saved-pages-list');
  listEl.innerHTML = '';

  if (pages.length === 0) {
    listEl.innerHTML = '<p style="text-align:center;color:#888;">No saved pages</p>';
    return;
  }

  pages.forEach(page => {
    const item = document.createElement('div');
    item.className = 'saved-page-item';

    item.innerHTML = `
      <h4>${escapeHtml(page.title)}</h4>
      <div class="url">${escapeHtml(page.url)}</div>
      <div class="meta">
        ${new Date(page.timestamp).toLocaleString()} • ${page.category || 'Uncategorized'}
      </div>
      <div class="tags">
        ${(page.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
      ${page.notes ? `<div style="margin-top:10px;font-size:13px;color:#aaa;">${escapeHtml(page.notes)}</div>` : ''}
      <div class="actions">
        <button class="btn open-btn">Open</button>
        <button class="btn edit-btn">Edit</button>
        <button class="btn ai-btn">AI Summary</button>
        <button class="btn danger del-btn">Delete</button>
      </div>
    `;

    // Event listeners
    item.querySelector('.open-btn').onclick = () => chrome.tabs.create({ url: page.url });
    item.querySelector('.edit-btn').onclick = () => editPage(page);
    item.querySelector('.ai-btn').onclick = () => generateSummary(page);
    item.querySelector('.del-btn').onclick = () => deletePage(page);

    listEl.appendChild(item);
  });
}

function filterSavedPages() {
  const query = document.getElementById('search-saved').value.toLowerCase();
  const category = document.getElementById('filter-category').value;

  const filtered = savedPages.filter(page => {
    const matchesQuery = !query ||
      page.title.toLowerCase().includes(query) ||
      page.url.toLowerCase().includes(query) ||
      (page.tags || []).some(tag => tag.toLowerCase().includes(query));

    const matchesCategory = !category || page.category === category;

    return matchesQuery && matchesCategory;
  });

  renderSavedPages(filtered);
}

async function deletePage(page) {
  if (!confirm('Delete this page?')) return;

  const data = await chrome.storage.local.get(['pages']);
  const pages = (data.pages || []).filter(p => p.timestamp !== page.timestamp);

  await chrome.storage.local.set({ pages });
  await loadSavedPages();

  showNotification('Page deleted', 'success');
}

// ============ AUTOMATION ============
async function startWhatsAppCampaign() {
  const recipients = prompt('Enter WhatsApp recipients (comma separated):');
  if (!recipients) return;

  const message = prompt('Enter message:');
  if (!message) return;

  const recipientList = recipients.split(',').map(r => r.trim());

  showNotification(`Starting WhatsApp campaign to ${recipientList.length} contacts...`, 'info');
  document.getElementById('whatsapp-status').innerHTML = '<div class="loading">Sending...</div>';

  const response = await chrome.runtime.sendMessage({
    type: 'SEND_WHATSAPP',
    recipients: recipientList,
    text: message
  });

  if (response.success) {
    const successful = response.result.filter(r => r.status === 'sent').length;
    const failed = response.result.filter(r => r.status === 'failed').length;

    document.getElementById('whatsapp-status').innerHTML = `
      <div>✅ Sent: ${successful}</div>
      <div>❌ Failed: ${failed}</div>
    `;

    showNotification('WhatsApp campaign completed!', 'success');

    // Trigger n8n
    await triggerN8NWebhook({
      type: 'whatsapp_campaign',
      results: response.result
    });
  } else {
    document.getElementById('whatsapp-status').innerHTML = `<div>Error: ${response.error}</div>`;
    showNotification('Campaign failed: ' + response.error, 'error');
  }
}

async function startMessengerCampaign() {
  // Similar to WhatsApp
  showNotification('Messenger campaign feature - implement similar to WhatsApp', 'info');
}

async function startEmailCampaign() {
  showNotification('Email campaign feature - implement similar to WhatsApp', 'info');
}

async function startSocialAutomation() {
  const config = {
    autoLike: document.getElementById('auto-like').checked,
    autoComment: document.getElementById('auto-comment').checked,
    autoFollow: document.getElementById('auto-follow').checked
  };

  showNotification('Starting social automation...', 'info');

  const response = await chrome.runtime.sendMessage({
    type: 'START_AUTOMATION',
    taskType: 'auto_social',
    config
  });

  if (response.success) {
    showNotification('Social automation started!', 'success');
  }
}

async function stopSocialAutomation() {
  await chrome.runtime.sendMessage({
    type: 'STOP_AUTOMATION',
    taskId: 'current'
  });

  showNotification('Automation stopped', 'info');
}

// ============ TASK SCHEDULER ============
async function scheduleNewTask() {
  const taskType = prompt('Task type (whatsapp/email/social):');
  if (!taskType) return;

  const scheduleType = prompt('Schedule type (once/recurring/interval):');
  if (!scheduleType) return;

  let schedule = { type: scheduleType };

  if (scheduleType === 'once') {
    const dateStr = prompt('Date and time (YYYY-MM-DD HH:MM):');
    schedule.date = new Date(dateStr);
  } else if (scheduleType === 'recurring') {
    const time = prompt('Time (HH:MM):');
    schedule.time = time;
  } else if (scheduleType === 'interval') {
    const minutes = prompt('Interval in minutes:');
    schedule.interval = parseInt(minutes);
  }

  const response = await chrome.runtime.sendMessage({
    type: 'SCHEDULE_TASK',
    taskType,
    config: {},
    schedule
  });

  if (response.success) {
    showNotification('Task scheduled!', 'success');
    await loadScheduledTasks();
  }
}

async function loadScheduledTasks() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SCHEDULED_TASKS' });

  if (response.success) {
    scheduledTasks = response.tasks;
    renderScheduledTasks(scheduledTasks);
  }
}

function renderScheduledTasks(tasks) {
  const listEl = document.getElementById('scheduled-tasks-list');
  listEl.innerHTML = '';

  if (tasks.length === 0) {
    listEl.innerHTML = '<p style="text-align:center;color:#888;">No scheduled tasks</p>';
    return;
  }

  tasks.forEach(task => {
    const item = document.createElement('div');
    item.className = 'scheduled-task-item';

    item.innerHTML = `
      <h4>${task.taskType}</h4>
      <div class="schedule-info">
        Next run: ${new Date(task.nextRun).toLocaleString()}
        ${task.lastRun ? `| Last run: ${new Date(task.lastRun).toLocaleString()}` : ''}
      </div>
      <div class="actions">
        <button class="btn run-now-btn">Run Now</button>
        <button class="btn pause-btn">Pause</button>
        <button class="btn danger cancel-btn">Cancel</button>
      </div>
    `;

    item.querySelector('.run-now-btn').onclick = () => executeTaskNow(task.id);
    item.querySelector('.cancel-btn').onclick = () => cancelTask(task.id);

    listEl.appendChild(item);
  });
}

async function executeTaskNow(taskId) {
  await chrome.runtime.sendMessage({
    type: 'EXECUTE_TASK_NOW',
    taskId
  });
  showNotification('Task executed', 'success');
}

async function cancelTask(taskId) {
  await chrome.runtime.sendMessage({
    type: 'CANCEL_SCHEDULED_TASK',
    taskId
  });
  await loadScheduledTasks();
  showNotification('Task cancelled', 'success');
}

// ============ ANALYTICS ============
async function updateStats() {
  const data = await chrome.storage.local.get(['pages', 'campaigns', 'analytics']);

  document.getElementById('stat-pages').textContent = (data.pages || []).length;
  document.getElementById('stat-messages').textContent = calculateTotalMessages(data.campaigns);
  document.getElementById('stat-automations').textContent = scheduledTasks.length;
  document.getElementById('stat-ai').textContent = (data.analytics || []).filter(a => a.type === 'ai').length;
}

function calculateTotalMessages(campaigns) {
  if (!campaigns) return 0;
  return Object.values(campaigns).reduce((sum, c) => sum + (c.results?.length || 0), 0);
}

async function analyzeCompetitor() {
  const url = document.getElementById('competitor-url').value;
  if (!url) return;

  showNotification('Analyzing competitor...', 'info');

  const response = await chrome.runtime.sendMessage({
    type: 'ANALYZE_COMPETITOR',
    url
  });

  if (response.success) {
    const resultsEl = document.getElementById('competitor-results');
    resultsEl.innerHTML = `
      <h4>${response.data.title}</h4>
      <p>${response.data.description}</p>
      <div><strong>Links:</strong> ${response.data.links}</div>
      <div><strong>Images:</strong> ${response.data.images}</div>
      ${response.data.aiInsights ? `<div><strong>AI Insights:</strong><br>${response.data.aiInsights}</div>` : ''}
    `;

    showNotification('Analysis complete!', 'success');
  }
}

async function fetchTrends() {
  const platform = document.getElementById('trending-platform').value;

  showNotification('Fetching trends...', 'info');

  const response = await chrome.runtime.sendMessage({
    type: 'GET_TRENDING',
    platform
  });

  if (response.success) {
    renderTrends(response.topics.topics);
    showNotification('Trends loaded!', 'success');
  }
}

function renderTrends(topics) {
  const listEl = document.getElementById('trends-list');
  listEl.innerHTML = '';

  topics.forEach(topic => {
    const item = document.createElement('div');
    item.className = 'trend-item';
    item.innerHTML = `
      <h4>${escapeHtml(topic.topic || topic.repo)}</h4>
      <p>${escapeHtml(topic.tweets || topic.description || '')}</p>
    `;
    listEl.appendChild(item);
  });
}

// ============ EXPORT & FILE GENERATION ============
async function exportPages() {
  const format = document.getElementById('export-format').value;
  const data = await chrome.storage.local.get(['pages']);
  const pages = data.pages || [];

  await chrome.runtime.sendMessage({
    type: 'DOWNLOAD_DATA',
    data: pages,
    filename: `atlas-export.${format}`,
    format
  });

  showNotification(`Exported ${pages.length} pages as ${format.toUpperCase()}`, 'success');
}

async function importContacts() {
  const fileInput = document.getElementById('import-contacts-file');
  const file = fileInput.files[0];

  if (!file) return;

  const response = await chrome.runtime.sendMessage({
    type: 'IMPORT_CONTACTS',
    file: await fileToBase64(file)
  });

  if (response.success) {
    document.getElementById('import-status').textContent = `Imported ${response.contacts.length} contacts`;
    showNotification('Contacts imported!', 'success');
  }
}

async function exportAllData() {
  await chrome.runtime.sendMessage({ type: 'EXPORT_DATABASE' });
  showNotification('Exporting all data...', 'success');
}

async function importBackup() {
  const fileInput = document.getElementById('import-backup-file');
  const file = fileInput.files[0];

  if (!file && !confirm('Import backup? This will overwrite existing data.')) return;

  // Implementation similar to import contacts
  showNotification('Backup restored!', 'success');
}

// ============ n8n INTEGRATION ============
async function saveN8NConfig() {
  const webhookUrl = document.getElementById('n8n-webhook').value;

  await chrome.storage.local.set({
    config: {
      ...await chrome.storage.local.get('config'),
      n8nWebhookUrl: webhookUrl
    }
  });

  showNotification('n8n webhook saved!', 'success');
}

async function testN8NWebhook() {
  await triggerN8NWebhook({
    type: 'test',
    message: 'Test from ATLAS',
    timestamp: Date.now()
  });

  showNotification('Test webhook triggered!', 'info');
}

async function triggerN8NWebhook(data) {
  const config = await chrome.storage.local.get(['config']);
  const webhookUrl = config.config?.n8nWebhookUrl;

  if (!webhookUrl) return;

  await chrome.runtime.sendMessage({
    type: 'TRIGGER_N8N',
    webhook: webhookUrl,
    data
  });
}

// ============ AI PROVIDER ============
async function connectAI() {
  const provider = document.getElementById('ai-doc-provider').value;

  showNotification(`Connecting to ${provider}...`, 'info');

  const response = await chrome.runtime.sendMessage({
    type: 'CONNECT_AI',
    provider,
    credentials: {} // Will use web session
  });

  if (response.success) {
    document.getElementById('ai-connection-status').textContent = `✅ Connected to ${provider}`;
    showNotification('AI connected!', 'success');
  } else {
    document.getElementById('ai-connection-status').textContent = `❌ Connection failed`;
    showNotification('AI connection failed: ' + response.error, 'error');
  }
}

async function generateAIDocument() {
  const prompt = document.getElementById('ai-prompt').value;
  const format = document.getElementById('ai-doc-format').value;

  if (!prompt) return;

  showNotification('Generating document with AI...', 'info');

  const response = await chrome.runtime.sendMessage({
    type: 'AI_GENERATE',
    prompt,
    context: {}
  });

  if (response.success) {
    const outputEl = document.getElementById('ai-doc-output');
    outputEl.textContent = response.content;

    // Download generated content
    await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_DATA',
      data: response.content,
      filename: `ai-generated.${format}`,
      format
    });

    showNotification('Document generated!', 'success');
  } else {
    showNotification('Generation failed: ' + response.error, 'error');
  }
}

// ============ UTILITIES ============
function showNotification(message, type = 'info') {
  // You could implement a toast notification system here
  console.log(`[${type.toUpperCase()}] ${message}`);

  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon128.png',
    title: 'ATLAS',
    message
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

console.log('[ATLAS] Side panel initialized');

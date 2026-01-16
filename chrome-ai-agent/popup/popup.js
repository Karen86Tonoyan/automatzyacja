/**
 * ATLAS Popup - Quick Actions
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadStatus();
  await loadRecentPages();

  initializeEventListeners();
});

function initializeEventListeners() {
  document.getElementById('open-sidepanel-btn').addEventListener('click', openSidePanel);
  document.getElementById('quick-save-btn').addEventListener('click', quickSavePage);
  document.getElementById('quick-ai-btn').addEventListener('click', quickAIAnalyze);
  document.getElementById('quick-whatsapp-btn').addEventListener('click', quickWhatsApp);
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('export-btn').addEventListener('click', quickExport);
}

async function openSidePanel() {
  chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
}

async function loadStatus() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });

  if (response.success) {
    const status = response.status;

    document.getElementById('status-user').textContent = status.loggedIn
      ? status.user.name
      : 'Not logged in';

    document.getElementById('status-ai').textContent = status.aiConnected
      ? `✅ ${status.aiProvider}`
      : '❌ Not connected';

    document.getElementById('status-tasks').textContent = `${status.activeTasks.length} active`;
  }
}

async function loadRecentPages() {
  const data = await chrome.storage.local.get(['pages']);
  const pages = (data.pages || []).slice(0, 5); // Last 5

  const listEl = document.getElementById('recent-list');
  listEl.innerHTML = '';

  if (pages.length === 0) {
    listEl.innerHTML = '<div style="text-align:center;color:#888;padding:10px;">No saved pages</div>';
    return;
  }

  pages.forEach(page => {
    const item = document.createElement('div');
    item.className = 'recent-item';

    item.innerHTML = `
      <div class="title">${escapeHtml(page.title)}</div>
      <div class="url">${escapeHtml(page.url)}</div>
    `;

    item.onclick = () => chrome.tabs.create({ url: page.url });

    listEl.appendChild(item);
  });
}

async function quickSavePage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const pageData = {
    url: tab.url,
    title: tab.title,
    timestamp: Date.now(),
    tags: [],
    category: 'quick-save'
  };

  const response = await chrome.runtime.sendMessage({
    type: 'savePage',
    payload: pageData
  });

  if (response.success) {
    showStatus('✅ Page saved!');
    await loadRecentPages();
  } else {
    showStatus('❌ Failed to save');
  }
}

async function quickAIAnalyze() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  showStatus('🤖 Analyzing...');

  const response = await chrome.runtime.sendMessage({
    type: 'AI_GENERATE',
    prompt: `Quick analysis of: ${tab.title} - ${tab.url}`,
    context: {}
  });

  if (response.success) {
    showStatus('✅ AI analysis complete!');
    // Could show analysis in a modal or copy to clipboard
    navigator.clipboard.writeText(response.content);
  } else {
    showStatus('❌ AI analysis failed');
  }
}

async function quickWhatsApp() {
  const recipient = prompt('WhatsApp recipient:');
  if (!recipient) return;

  const message = prompt('Message:');
  if (!message) return;

  showStatus('💬 Sending...');

  const response = await chrome.runtime.sendMessage({
    type: 'SEND_WHATSAPP',
    recipients: [recipient],
    text: message
  });

  if (response.success) {
    showStatus('✅ Message sent!');
  } else {
    showStatus('❌ Send failed');
  }
}

function openSettings() {
  chrome.runtime.openOptionsPage();
}

async function quickExport() {
  const data = await chrome.storage.local.get(['pages']);
  const pages = data.pages || [];

  await chrome.runtime.sendMessage({
    type: 'DOWNLOAD_DATA',
    data: pages,
    filename: 'atlas-quick-export.json',
    format: 'json'
  });

  showStatus('📥 Exported!');
}

function showStatus(message) {
  // Simple status display - you could make this fancier
  const statusEl = document.getElementById('status-user');
  const original = statusEl.textContent;

  statusEl.textContent = message;
  statusEl.style.color = '#00ff88';

  setTimeout(() => {
    statusEl.textContent = original;
    statusEl.style.color = '';
  }, 2000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

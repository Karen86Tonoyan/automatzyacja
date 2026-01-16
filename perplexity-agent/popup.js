/**
 * Popup Script - Perplexity Agent UI
 */

// DOM Elements
const queryInput = document.getElementById('queryInput');
const queryType = document.getElementById('queryType');
const responseBox = document.getElementById('responseBox');
const sendQueryBtn = document.getElementById('sendQuery');
const clearQueryBtn = document.getElementById('clearQuery');
const copyResponseBtn = document.getElementById('copyResponse');
const apiKeyInput = document.getElementById('apiKey');
const modelSelect = document.getElementById('modelSelect');
const temperatureInput = document.getElementById('temperature');
const tempValue = document.getElementById('tempValue');
const saveSettingsBtn = document.getElementById('saveSettings');
const clearHistoryBtn = document.getElementById('clearHistory');
const historyList = document.getElementById('historyList');
const statusBar = document.getElementById('statusBar');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Załaduj ustawienia
document.addEventListener('DOMContentLoaded', loadSettings);

// Tab switching
tabButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    const tabName = e.target.dataset.tab;
    switchTab(tabName);
  });
});

function switchTab(tabName) {
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));

  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Wyślij zapytanie
sendQueryBtn.addEventListener('click', async () => {
  const query = queryInput.value.trim();
  if (!query) {
    showStatus('Wpisz pytanie!', 'error');
    return;
  }

  showStatus('⏳ Wysyłanie...', '');
  responseBox.value = '';

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'perplexityQuery',
      query: query,
      temperature: parseFloat(temperatureInput.value),
      maxTokens: 2048
    });

    if (response.success) {
      responseBox.value = response.result;
      showStatus('✅ Odpowiedź otrzymana!', 'success');
      saveToHistory(query, response.result);
    } else {
      showStatus('❌ Błąd: ' + response.error, 'error');
    }
  } catch (error) {
    showStatus('❌ Błąd komunikacji: ' + error.message, 'error');
  }
});

// Wyczyść zapytanie
clearQueryBtn.addEventListener('click', () => {
  queryInput.value = '';
  responseBox.value = '';
  queryInput.focus();
});

// Kopiuj odpowiedź
copyResponseBtn.addEventListener('click', () => {
  if (responseBox.value) {
    navigator.clipboard.writeText(responseBox.value);
    showStatus('📋 Skopiowano!', 'success');
  }
});

// Temperatura
temperatureInput.addEventListener('input', (e) => {
  tempValue.textContent = e.target.value;
});

// Zapisz ustawienia
saveSettingsBtn.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  const model = modelSelect.value;
  const temperature = temperatureInput.value;

  if (!apiKey) {
    showStatus('❌ Wpisz API key!', 'error');
    return;
  }

  chrome.storage.sync.set({
    perplexity_api_key: apiKey,
    perplexity_model: model,
    perplexity_temperature: temperature
  }, () => {
    showStatus('✅ Ustawienia zapisane!', 'success');
  });
});

// Wyczyść historię
clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Czy na pewno wyczyścić historię?')) {
    chrome.storage.local.set({ queryHistory: [] }, () => {
      historyList.innerHTML = '<p style="color: #999; font-size: 12px;">Brak historii</p>';
      showStatus('✅ Historia wyczyszczona!', 'success');
    });
  }
});

// Załaduj ustawienia z storage
function loadSettings() {
  chrome.storage.sync.get(['perplexity_api_key', 'perplexity_model', 'perplexity_temperature'], (result) => {
    if (result.perplexity_api_key) {
      apiKeyInput.value = result.perplexity_api_key;
    }
    if (result.perplexity_model) {
      modelSelect.value = result.perplexity_model;
    }
    if (result.perplexity_temperature) {
      temperatureInput.value = result.perplexity_temperature;
      tempValue.textContent = result.perplexity_temperature;
    }
  });

  loadHistory();
}

// Załaduj historię
function loadHistory() {
  chrome.storage.local.get(['queryHistory'], (result) => {
    const history = result.queryHistory || [];
    if (history.length === 0) {
      historyList.innerHTML = '<p style="color: #999; font-size: 12px;">Brak historii</p>';
      return;
    }

    historyList.innerHTML = history
      .slice(-10)
      .reverse()
      .map((item, index) => `
        <div style="padding: 10px; border-bottom: 1px solid #e0e0e0; cursor: pointer; hover: background: #f5f5f5;" onclick="useFromHistory('${item.query}')">
          <div style="font-size: 12px; font-weight: 600; color: #333;">${item.query.substring(0, 50)}...</div>
          <div style="font-size: 11px; color: #999;">${new Date(item.timestamp).toLocaleString()}</div>
        </div>
      `)
      .join('');
  });
}

// Zapisz do historii
function saveToHistory(query, response) {
  chrome.storage.local.get(['queryHistory'], (result) => {
    const history = result.queryHistory || [];
    history.push({
      query: query,
      response: response,
      timestamp: new Date().toISOString()
    });

    // Przechowuj ostatnie 50 zapytań
    if (history.length > 50) {
      history.shift();
    }

    chrome.storage.local.set({ queryHistory: history }, loadHistory);
  });
}

// Użyj z historii
function useFromHistory(query) {
  queryInput.value = query;
  switchTab('query');
  queryInput.focus();
}

// Pokaż status
function showStatus(message, type) {
  statusBar.textContent = message;
  statusBar.className = 'status-bar' + (type ? ' ' + type : '');
  if (type === 'success') {
    setTimeout(() => {
      statusBar.textContent = 'Gotowy do użytku ✅';
      statusBar.className = 'status-bar';
    }, 3000);
  }
}

// Enter do wysłania
queryInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    sendQueryBtn.click();
  }
});

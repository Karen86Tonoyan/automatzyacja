/**
 * Content Script - Perplexity Agent
 * Interakcja ze stroną i komunikacja z background
 */

console.log('🚀 Perplexity Agent loaded');

// Dodaj kontekstowe menu
document.addEventListener('contextmenu', (e) => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    chrome.runtime.sendMessage({
      action: 'showContextMenu',
      selectedText: selectedText
    });
  }
});

// Słuchaj wiadomości z background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📬 Content script received:', request);

  if (request.action === 'fillContent') {
    fillPageContent(request.content);
    sendResponse({ success: true });
  } else if (request.action === 'executeScript') {
    executeScript(request.script);
    sendResponse({ success: true });
  }
});

/**
 * Automatyczne wypełnianie treści na stronie
 */
function fillPageContent(content) {
  // GitHub issue comment
  const githubEditor = document.querySelector('[data-test-id="comment-box"]') ||
    document.querySelector('textarea[aria-label*="comment"]') ||
    document.querySelector('.js-comment-field');

  if (githubEditor) {
    githubEditor.value = content;
    githubEditor.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ GitHub comment filled');
    return;
  }

  // Twitter / X
  const twitterEditor = document.querySelector('[contenteditable="true"][role="textbox"]');
  if (twitterEditor) {
    twitterEditor.textContent = content;
    twitterEditor.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Twitter post filled');
    return;
  }

  // Email (Gmail)
  const gmailEditor = document.querySelector('[role="textbox"][aria-label*="Compose"]');
  if (gmailEditor) {
    gmailEditor.textContent = content;
    gmailEditor.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Email filled');
    return;
  }

  // Generic textarea
  const textarea = document.querySelector('textarea');
  if (textarea) {
    textarea.value = content;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Generic textarea filled');
    return;
  }

  // Fallback: kopiuj do schowka
  navigator.clipboard.writeText(content).then(() => {
    alert('✅ Content copied to clipboard - paste it manually');
    console.log('📋 Content copied to clipboard');
  });
}

/**
 * Wykonaj custom script
 */
function executeScript(script) {
  try {
    const fn = new Function(script);
    fn();
    console.log('✅ Script executed');
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

/**
 * Dodaj toolbar z przyciskami
 */
function addToolbar() {
  if (document.getElementById('perplexity-toolbar')) return;

  const toolbar = document.createElement('div');
  toolbar.id = 'perplexity-toolbar';
  toolbar.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    padding: 10px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  toolbar.innerHTML = `
    <div style="display: flex; gap: 5px; flex-direction: column;">
      <button id="perplexity-ask" style="padding: 8px 12px; background: #10a37f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
        🔍 Ask Perplexity
      </button>
      <button id="perplexity-comment" style="padding: 8px 12px; background: #0969da; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
        💬 Auto Comment
      </button>
      <button id="perplexity-settings" style="padding: 8px 12px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
        ⚙️ Settings
      </button>
    </div>
  `;

  document.body.appendChild(toolbar);

  // Event listeners
  document.getElementById('perplexity-ask').addEventListener('click', async () => {
    const query = prompt('🔍 Ask Perplexity:');
    if (query) {
      const response = await chrome.runtime.sendMessage({
        action: 'perplexityQuery',
        query: query
      });

      if (response.success) {
        alert(response.result);
      } else {
        alert('❌ Error: ' + response.error);
      }
    }
  });

  document.getElementById('perplexity-comment').addEventListener('click', async () => {
    const selectedText = window.getSelection().toString() || document.title;
    const response = await chrome.runtime.sendMessage({
      action: 'generateComment',
      content: selectedText,
      context: 'GitHub issue or social post'
    });

    if (response.success) {
      alert('✅ Comment generated and copied!\n\n' + response.comment);
    } else {
      alert('❌ Error: ' + response.error);
    }
  });

  document.getElementById('perplexity-settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// Dodaj toolbar po załadowaniu strony
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addToolbar);
} else {
  addToolbar();
}

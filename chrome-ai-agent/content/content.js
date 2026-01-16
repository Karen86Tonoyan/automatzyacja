/**
 * Content Script - Runs on every webpage
 * Handles: DOM manipulation, data extraction, humanized interactions
 */

console.log('[AI Agent] Content script loaded on:', window.location.href);

// State
let automationActive = false;
let currentTask = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content] Message received:', message.type);

  switch (message.type) {
    case 'START_AUTO_LIKE':
      startAutoLike(message.config);
      sendResponse({ success: true });
      break;

    case 'START_AUTO_COMMENT':
      startAutoComment(message.config);
      sendResponse({ success: true });
      break;

    case 'EXTRACT_DATA':
      const data = extractPageData(message.selectors);
      sendResponse({ success: true, data });
      break;

    case 'SCRAPE_PAGE':
      const scrapedData = scrapePage();
      sendResponse({ success: true, data: scrapedData });
      break;

    case 'CLICK_ELEMENT':
      clickElement(message.selector);
      sendResponse({ success: true });
      break;

    case 'FILL_FORM':
      fillForm(message.formData);
      sendResponse({ success: true });
      break;

    case 'STOP_AUTOMATION':
      automationActive = false;
      sendResponse({ success: true });
      break;

    case 'GET_PAGE_INFO':
      const pageInfo = getPageInfo();
      sendResponse({ success: true, info: pageInfo });
      break;

    case 'TAKE_SCREENSHOT':
      takeScreenshot();
      sendResponse({ success: true });
      break;
  }

  return true;
});

// ============ AUTO LIKE FUNCTIONALITY ============
async function startAutoLike(config) {
  console.log('[Content] Starting auto-like...');
  automationActive = true;

  const platform = detectPlatform();

  while (automationActive) {
    try {
      let likeButtons = [];

      switch (platform) {
        case 'facebook':
          likeButtons = document.querySelectorAll('[aria-label="Like"]');
          break;
        case 'linkedin':
          likeButtons = document.querySelectorAll('button[aria-label*="React"][aria-label*="Like"]');
          break;
        case 'twitter':
          likeButtons = document.querySelectorAll('[data-testid="like"]');
          break;
        case 'instagram':
          likeButtons = document.querySelectorAll('button[aria-label="Like"]');
          break;
        default:
          likeButtons = document.querySelectorAll('button[aria-label*="like" i], button.like, .like-button');
      }

      for (const button of likeButtons) {
        if (!automationActive) break;

        // Check if already liked
        const alreadyLiked = button.getAttribute('aria-pressed') === 'true' ||
                             button.classList.contains('liked') ||
                             button.classList.contains('active');

        if (!alreadyLiked && isElementVisible(button)) {
          // Humanized click
          await humanClick(button);

          // Random delay between likes
          await randomDelay(2000, 5000);

          // Occasionally scroll to find more content
          if (Math.random() < 0.3) {
            await humanScroll(300, 600);
            await randomDelay(1000, 2000);
          }
        }
      }

      // Scroll to load more content
      await humanScroll(400, 800);
      await randomDelay(2000, 4000);

    } catch (error) {
      console.error('[Content] Auto-like error:', error);
      await randomDelay(5000, 10000);
    }
  }
}

// ============ AUTO COMMENT FUNCTIONALITY ============
async function startAutoComment(config) {
  console.log('[Content] Starting auto-comment...');
  automationActive = true;

  const { comments, maxComments = 10 } = config;
  let commentCount = 0;

  const platform = detectPlatform();

  while (automationActive && commentCount < maxComments) {
    try {
      // Find comment buttons
      let commentButtons = [];

      switch (platform) {
        case 'facebook':
          commentButtons = document.querySelectorAll('[aria-label="Leave a comment"]');
          break;
        case 'linkedin':
          commentButtons = document.querySelectorAll('button[aria-label*="Comment"]');
          break;
        case 'twitter':
          commentButtons = document.querySelectorAll('[data-testid="reply"]');
          break;
      }

      for (const button of commentButtons) {
        if (!automationActive || commentCount >= maxComments) break;

        if (isElementVisible(button)) {
          // Click comment button
          await humanClick(button);
          await randomDelay(1000, 2000);

          // Find comment input
          const commentInput = findCommentInput(platform);

          if (commentInput) {
            // Select random comment from list
            const comment = comments[Math.floor(Math.random() * comments.length)];

            // Type comment with humanization
            await humanTypeText(commentInput, comment);

            await randomDelay(1000, 2000);

            // Find and click submit button
            const submitButton = findCommentSubmit(platform);
            if (submitButton) {
              await humanClick(submitButton);

              commentCount++;

              // Longer delay after posting comment
              await randomDelay(5000, 10000);
            }
          }
        }
      }

      // Scroll to find more posts
      await humanScroll(400, 800);
      await randomDelay(3000, 6000);

    } catch (error) {
      console.error('[Content] Auto-comment error:', error);
      await randomDelay(5000, 10000);
    }
  }

  automationActive = false;
  console.log('[Content] Auto-comment completed:', commentCount, 'comments posted');
}

function findCommentInput(platform) {
  switch (platform) {
    case 'facebook':
      return document.querySelector('[aria-label="Write a comment..."]') ||
             document.querySelector('div[contenteditable="true"][role="textbox"]');
    case 'linkedin':
      return document.querySelector('[placeholder*="Add a comment"]');
    case 'twitter':
      return document.querySelector('[data-testid="tweetTextarea_0"]');
    default:
      return document.querySelector('textarea[placeholder*="comment" i]') ||
             document.querySelector('div[contenteditable="true"]');
  }
}

function findCommentSubmit(platform) {
  switch (platform) {
    case 'facebook':
      return document.querySelector('[aria-label="Comment"][type="submit"]');
    case 'linkedin':
      return document.querySelector('button[aria-label*="Post"]');
    case 'twitter':
      return document.querySelector('[data-testid="tweetButton"]');
    default:
      return document.querySelector('button[type="submit"]');
  }
}

// ============ DATA EXTRACTION ============
function extractPageData(selectors) {
  const data = {};

  for (const [key, selector] of Object.entries(selectors)) {
    const elements = document.querySelectorAll(selector);
    data[key] = Array.from(elements).map(el => ({
      text: el.textContent.trim(),
      html: el.innerHTML,
      href: el.href,
      src: el.src
    }));
  }

  return data;
}

function scrapePage() {
  return {
    url: window.location.href,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content,
    keywords: document.querySelector('meta[name="keywords"]')?.content,
    headings: {
      h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
      h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()),
      h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim())
    },
    links: Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.textContent.trim(),
      href: a.href
    })),
    images: Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      alt: img.alt
    })),
    forms: Array.from(document.querySelectorAll('form')).map(form => ({
      action: form.action,
      method: form.method,
      inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
        name: input.name,
        type: input.type,
        placeholder: input.placeholder
      }))
    })),
    text: document.body.innerText.substring(0, 5000)
  };
}

function getPageInfo() {
  return {
    url: window.location.href,
    title: document.title,
    platform: detectPlatform(),
    loggedIn: isUserLoggedIn(),
    hasContent: document.body.innerText.length > 100
  };
}

// ============ INTERACTION HELPERS ============
function clickElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.click();
    return true;
  }
  return false;
}

async function fillForm(formData) {
  for (const [selector, value] of Object.entries(formData)) {
    const input = document.querySelector(selector);
    if (input) {
      if (input.tagName === 'SELECT') {
        input.value = value;
      } else if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = value;
      } else {
        await humanTypeText(input, value);
      }

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      await randomDelay(500, 1000);
    }
  }
}

// ============ HUMANIZATION FUNCTIONS ============
async function humanClick(element) {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await randomDelay(300, 600);

  const rect = element.getBoundingClientRect();
  const x = rect.left + Math.random() * rect.width;
  const y = rect.top + Math.random() * rect.height;

  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
  await randomDelay(50, 150);

  element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
}

async function humanTypeText(element, text) {
  element.focus();

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (element.contentEditable === 'true') {
      element.textContent += char;
      element.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }

    await randomDelay(50, 150);

    // Occasional pause (thinking)
    if (Math.random() < 0.05) {
      await randomDelay(300, 800);
    }
  }
}

async function humanScroll(min, max) {
  const distance = Math.random() * (max - min) + min;
  const steps = 10;
  const stepSize = distance / steps;

  for (let i = 0; i < steps; i++) {
    window.scrollBy(0, stepSize);
    await randomDelay(50, 100);
  }
}

function randomDelay(min, max) {
  return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
}

// ============ UTILITY FUNCTIONS ============
function detectPlatform() {
  const hostname = window.location.hostname;

  if (hostname.includes('facebook.com')) return 'facebook';
  if (hostname.includes('linkedin.com')) return 'linkedin';
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
  if (hostname.includes('instagram.com')) return 'instagram';
  if (hostname.includes('youtube.com')) return 'youtube';
  if (hostname.includes('reddit.com')) return 'reddit';
  if (hostname.includes('github.com')) return 'github';
  if (hostname.includes('web.whatsapp.com')) return 'whatsapp';
  if (hostname.includes('messenger.com')) return 'messenger';

  return 'unknown';
}

function isUserLoggedIn() {
  // Common indicators of logged-in state
  return !!(
    document.querySelector('[aria-label*="Profile"]') ||
    document.querySelector('[data-testid="user-avatar"]') ||
    document.querySelector('.user-menu') ||
    document.cookie.includes('session') ||
    localStorage.getItem('user') ||
    sessionStorage.getItem('token')
  );
}

function isElementVisible(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= 0 &&
    rect.bottom <= window.innerHeight
  );
}

function takeScreenshot() {
  chrome.runtime.sendMessage({
    type: 'CAPTURE_SCREENSHOT',
    url: window.location.href,
    title: document.title
  });
}

// ============ AUTO-SCROLL FOR INFINITE FEEDS ============
let autoScrolling = false;

async function startAutoScroll() {
  autoScrolling = true;

  while (autoScrolling) {
    const currentHeight = document.body.scrollHeight;

    await humanScroll(400, 800);
    await randomDelay(2000, 4000);

    // Check if new content loaded
    const newHeight = document.body.scrollHeight;

    if (newHeight === currentHeight) {
      // Reached end of feed
      break;
    }
  }
}

function stopAutoScroll() {
  autoScrolling = false;
}

console.log('[AI Agent] Content script ready on', detectPlatform());

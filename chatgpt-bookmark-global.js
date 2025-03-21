// Optimized ChatGPT Global Bookmarklet (Performance + Storage)
javascript:(function(){
  // Clear any previous instance first to allow proper reinitialization
  if (window.ChatGPTBookmarkUI) {
    document.querySelectorAll('.bookmark-toggle').forEach(el => el.remove());
    if (window.ChatGPTBookmarkObserver) window.ChatGPTBookmarkObserver.disconnect();
    window.ChatGPTBookmarkUI = false;
    const existingPanel = document.getElementById('chatgpt-bookmark-ui');
    if (existingPanel) existingPanel.remove();
  }
  
  window.ChatGPTBookmarks = JSON.parse(localStorage.getItem('chatgpt-bookmarks-global') || '[]');
  window.ChatGPTBookmarkUI = true;

  const panel = document.createElement('div');
  panel.id = 'chatgpt-bookmark-ui';
  panel.style = 'position:fixed;bottom:20px;left:20px;z-index:9999;background:#f0f4f9;border:1px solid #c9d7e8;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);font-family:Arial,sans-serif;font-size:14px;color:#333;width:300px;max-height:500px;display:flex;flex-direction:column;';
  panel.innerHTML = `<div style="background:#6b4fbb;color:white;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;cursor:move;border-top-left-radius:8px;border-top-right-radius:8px;"><span style="font-weight:bold;">📌 Message Bookmarks</span><div><button id="close-bookmarks" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;">✕</button></div></div><div id="bookmark-search" style="padding:8px;border-bottom:1px solid #e0e7f1;"><input type="text" placeholder="Search bookmarks..." style="width:100%;padding:6px;border:1px solid #c9d7e8;border-radius:4px;"></div><div id="bookmarks-container" style="padding:8px;overflow-y:auto;flex-grow:1;"><div id="empty-bookmarks-message" style="text-align:center;color:#777;padding:20px;">No bookmarks yet. Click the 📌 icon on any ChatGPT message to bookmark it.</div></div>`;
  document.body.appendChild(panel);

  const header = panel.querySelector('div');
  let isDragging = false, offsetX, offsetY;
  header.addEventListener('mousedown', e => {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;
    offsetX = e.clientX - panel.getBoundingClientRect().left;
    offsetY = e.clientY - panel.getBoundingClientRect().top;
  });
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    panel.style.left = `${e.clientX - offsetX}px`;
    panel.style.top = `${e.clientY - offsetY}px`;
  });
  document.addEventListener('mouseup', () => { isDragging = false; });

  function findMessages() {
    // Only target assistant messages
    return Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'))
      .filter(el => !el.closest('[data-testid="conversation-turn-counter"]'));
  }

  function setupBookmarkToggles() {
    findMessages().forEach(message => {
      // Reset to allow re-adding pins when reopening
      const existingToggle = message.querySelector('.bookmark-toggle');
      if (existingToggle) existingToggle.remove();
      
      // Set a consistent ID for the message if not already set
      if (!message.dataset.bookmarkId) {
        message.dataset.bookmarkId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      }
      
      const toggle = document.createElement('div');
      toggle.className = 'bookmark-toggle';
      toggle.innerHTML = '📌';
      toggle.style = 'position:absolute;top:10px;right:40px;background:#f0f4f9;border:1px solid #c9d7e8;border-radius:4px;padding:2px 4px;font-size:16px;cursor:pointer;z-index:1000;opacity:0.6;transition:opacity 0.2s;';
      const cs = window.getComputedStyle(message);
      if (cs.position === 'static') message.style.position = 'relative';
      message.appendChild(toggle);
      toggle.addEventListener('mouseover', () => toggle.style.opacity = '1');
      toggle.addEventListener('mouseout', () => toggle.style.opacity = '0.6');
      toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        const messageId = message.dataset.bookmarkId;
        const existingIndex = window.ChatGPTBookmarks.findIndex(b => b.id === messageId);
        if (existingIndex >= 0) {
          window.ChatGPTBookmarks.splice(existingIndex, 1);
          toggle.style.color = '#000';
          toggle.style.fontWeight = 'normal';
        } else {
          const contentElement = message.querySelector('.markdown-content, .markdown, .whitespace-pre-wrap');
          if (!contentElement) return;
          const fullContent = contentElement.innerHTML;
          const plainText = contentElement.textContent.trim();
          const preview = plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;
          const bookmark = {
            id: messageId,
            preview,
            fullContent,
            chatTitle: document.title,
            chatUrl: window.location.href,
            timestamp: Date.now() // For sorting only
          };
          window.ChatGPTBookmarks.push(bookmark);
          toggle.style.color = '#6b4fbb';
          toggle.style.fontWeight = 'bold';
        }
        localStorage.setItem('chatgpt-bookmarks-global', JSON.stringify(window.ChatGPTBookmarks));
        renderBookmarks();
      });
      const isBookmarked = window.ChatGPTBookmarks.some(b => b.id === message.dataset.bookmarkId);
      if (isBookmarked) {
        toggle.style.color = '#6b4fbb';
        toggle.style.fontWeight = 'bold';
      }
    });
  }

  function renderBookmarks(searchTerm = '') {
    const container = document.getElementById('bookmarks-container');
    const emptyMessage = document.getElementById('empty-bookmarks-message');
    container.innerHTML = '';
    let filtered = window.ChatGPTBookmarks;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = window.ChatGPTBookmarks.filter(b => b.preview.toLowerCase().includes(term));
    }
    if (filtered.length === 0) {
      container.appendChild(emptyMessage);
      return;
    }
    
    // Sort bookmarks by timestamp (newest first)
    filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    const grouped = {};
    filtered.forEach(b => {
      const key = b.chatUrl;
      if (!grouped[key]) grouped[key] = { title: b.chatTitle, url: b.chatUrl, items: [] };
      grouped[key].items.push(b);
    });
    
    Object.values(grouped).forEach(group => {
      const groupDiv = document.createElement('div');
      const title = document.createElement('div');
      title.innerHTML = `<a href="${group.url}" target="_blank" style="font-weight:bold;text-decoration:none;color:#1a73e8">${group.title}</a>`;
      title.style = 'margin-bottom:4px;';
      groupDiv.appendChild(title);
      group.items.forEach(bookmark => {
        const item = document.createElement('div');
        item.style = 'border-bottom:1px solid #e0e7f1;padding:8px 0;margin-bottom:4px;';
        item.innerHTML = `<div style="font-size:13px;color:#333;white-space:normal;word-break:break-word;">${bookmark.preview}</div><div style="margin-top:6px;"><button class="copy-bookmark" data-id="${bookmark.id}" style="background:none;border:none;cursor:pointer;font-size:12px;color:#777;margin-right:4px;">📋</button><button class="delete-bookmark" data-id="${bookmark.id}" style="background:none;border:none;cursor:pointer;font-size:12px;color:#777;">🗑</button></div>`;
        groupDiv.appendChild(item);
      });
      container.appendChild(groupDiv);
    });
    
    document.querySelectorAll('.copy-bookmark').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        const b = window.ChatGPTBookmarks.find(b => b.id === id);
        if (!b) return;
        const htmlContent = `<div>${b.fullContent}</div>`;
        const plainText = b.preview;
        try {
          if (!navigator.clipboard.write || !ClipboardItem) {
            navigator.clipboard.writeText(plainText);
          } else {
            navigator.clipboard.write([
              new ClipboardItem({
                'text/html': new Blob([htmlContent], {type:'text/html'}),
                'text/plain': new Blob([plainText], {type:'text/plain'})
              })
            ]);
          }
        } catch(e) {
          navigator.clipboard.writeText(plainText);
        }
      });
    });
    
    document.querySelectorAll('.delete-bookmark').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        const i = window.ChatGPTBookmarks.findIndex(b => b.id === id);
        if (i !== -1) {
          window.ChatGPTBookmarks.splice(i, 1);
          localStorage.setItem('chatgpt-bookmarks-global', JSON.stringify(window.ChatGPTBookmarks));
          renderBookmarks();
        }
      });
    });
  }

  function initObserver() {
    const observer = new MutationObserver(setupBookmarkToggles);
    const chatContainer = document.querySelector('main') || document.body;
    observer.observe(chatContainer, { childList: true, subtree: true });
    window.ChatGPTBookmarkObserver = observer;
  }

  setupBookmarkToggles();
  initObserver();
  renderBookmarks();

  const searchInput = document.querySelector('#bookmark-search input');
  searchInput.addEventListener('input', function() {
    renderBookmarks(this.value);
  });

  document.getElementById('close-bookmarks').addEventListener('click', function() {
    panel.remove();
    document.querySelectorAll('.bookmark-toggle').forEach(el => el.remove());
    if (window.ChatGPTBookmarkObserver) window.ChatGPTBookmarkObserver.disconnect();
    window.ChatGPTBookmarkUI = false;
  });
})();
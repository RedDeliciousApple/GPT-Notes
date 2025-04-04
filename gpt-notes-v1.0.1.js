// ==UserScript==
// @name         GPT Notes
// @namespace    https://chat.openai.com/
// @version      1.0.1
// @description  A lightweight tool for saving ChatGPT messages without performance impact
// @author       Original author + Claude optimizations
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
  'use strict';
  
  // Prevent multiple initializations
  if (window.GPTNotesUI) {
    // If already open, just toggle visibility
    const panel = document.getElementById('gptnotes-ui');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
      return;
    }
  }
  
  // Setup global state
  window.GPTNotes = JSON.parse(localStorage.getItem('gptnotes-quick') || '[]');
  window.GPTNotesUI = true;
  window.notesModeActive = false;
  window.notes_eventListeners = [];

  // Create and style the panel
  const panel = document.createElement('div');
  panel.id = 'gptnotes-ui';
  panel.style = 'position:fixed;bottom:20px;left:20px;z-index:9999;background:#f0f4f9;border:1px solid #c9d7e8;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);font-family:Arial,sans-serif;font-size:14px;color:#333;width:300px;max-height:500px;display:flex;flex-direction:column;';
  
  // Set up panel HTML
  panel.innerHTML = `
    <div style="background:#6b4fbb;color:white;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;cursor:move;border-top-left-radius:8px;border-top-right-radius:8px;">
      <span style="font-weight:bold;">📝 GPT Notes</span>
      <div>
        <button id="notes-mode" style="background:none;border:none;color:white;font-size:14px;cursor:pointer;margin-right:8px;" title="Enter save mode">Save</button>
        <button id="export-notes" style="background:none;border:none;color:white;font-size:14px;cursor:pointer;margin-right:8px;" title="Export notes">Export</button>
        <button id="close-notes" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;" title="Close panel">✕</button>
      </div>
    </div>
    <div id="notes-panel-content">
      <div id="notes-search" style="padding:8px;border-bottom:1px solid #e0e7f1;">
        <input type="text" placeholder="Search notes..." style="width:100%;padding:6px;border:1px solid #c9d7e8;border-radius:4px;">
      </div>
      <div id="notes-container" style="padding:8px;overflow-y:auto;flex-grow:1;max-height:400px;">
        <div id="empty-notes-message" style="text-align:center;color:#777;padding:20px;">
          No notes yet. Click "Save" to enter save mode, then click on any ChatGPT message to save it.
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);

  // Function to add event listener with tracking for cleanup
  function addEventListenerWithTracking(element, type, listener, options) {
    element.addEventListener(type, listener, options);
    window.notes_eventListeners.push({ element, type, listener, options });
  }

  // Make panel draggable with bounds checking
  const header = panel.querySelector('div');
  let isDragging = false, offsetX, offsetY;
  
  addEventListenerWithTracking(header, 'mousedown', e => {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;
    offsetX = e.clientX - panel.getBoundingClientRect().left;
    offsetY = e.clientY - panel.getBoundingClientRect().top;
  });
  
  addEventListenerWithTracking(document, 'mousemove', e => {
    if (!isDragging) return;
    
    // Calculate new position
    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;
    
    // Get panel dimensions
    const panelWidth = panel.offsetWidth;
    const panelHeight = panel.offsetHeight;
    
    // Calculate boundaries to keep panel on screen
    const maxX = window.innerWidth - panelWidth;
    const maxY = window.innerHeight - panelHeight;
    
    // Apply constraints
    newLeft = Math.max(0, Math.min(newLeft, maxX));
    newTop = Math.max(0, Math.min(newTop, maxY));
    
    // Apply new position
    panel.style.left = `${newLeft}px`;
    panel.style.top = `${newTop}px`;
  });
  
  addEventListenerWithTracking(document, 'mouseup', () => { 
    isDragging = false; 
  });

  // Create launcher button
  function createLauncher() {
    // Check if launcher already exists
    if (document.getElementById('gptnotes-launcher')) {
      return;
    }
    
    const launcher = document.createElement('div');
    launcher.id = 'gptnotes-launcher';
    launcher.style = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 48px;
      height: 48px;
      background: #6b4fbb;
      border-radius: 50%;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9998;
      transition: all 0.2s ease;
    `;
    launcher.innerHTML = `<div style="color: white; font-size: 24px;">📝</div>`;
    document.body.appendChild(launcher);
    
    // Add click event
    launcher.addEventListener('click', function() {
      const panel = document.getElementById('gptnotes-ui');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
      }
    });
  }
  
  // Improved toast notification system
  function showToast(message, isError = false, duration = 1500) {
    // Remove any existing toast
    const existingToast = document.querySelector('.gptnotes-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'gptnotes-toast';
    toast.style = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(60, 60, 60, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      opacity: 1;
      transition: opacity 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Automatically remove toast after duration
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  // Main function for notes mode
  window.initNotesMode = function() {
    if (window.notesModeActive) return;
    window.notesModeActive = true;
    
    // Find all assistant messages
    const assistantMessages = Array.from(
      document.querySelectorAll('[data-message-author-role="assistant"]')
    ).filter(el => !el.closest('[data-testid="conversation-turn-counter"]'));
    
    // Highlight all assistant messages
    assistantMessages.forEach(message => {
      message.style.transition = "outline 0.3s ease";
      message.style.outline = "2px dashed #6b4fbb";
      message.style.cursor = "pointer";
      
      // Store the original styles to restore later
      message.dataset.originalOutline = message.style.outline;
      message.dataset.originalCursor = message.style.cursor;
      
      // Check if already has handler
      if (!message.dataset.notesHandlerAttached) {
        // Add click listener
        addEventListenerWithTracking(message, 'click', handleMessageClick);
        message.dataset.notesHandlerAttached = 'true';
      }
    });
    
    // Add escape key listener to exit notes mode
    addEventListenerWithTracking(document, 'keydown', handleEscapeKey);
    
    // Update status in UI
    const notesButton = document.getElementById('notes-mode');
    if (notesButton) {
      notesButton.style.color = "#ffcc00";
      notesButton.title = "Exit save mode (ESC)";
    }
    
    // Show toast notification
    showToast("Save mode active. Click any ChatGPT message to save it, or press ESC to cancel.");
  };
  
  // Exit notes mode
  function exitNotesMode() {
    if (!window.notesModeActive) return;
    
    // Remove highlighting and event listeners
    document.querySelectorAll('[data-message-author-role="assistant"]').forEach(message => {
      message.style.outline = "";
      message.style.cursor = "";
      
      // Remove handler reference
      if (message.dataset.notesHandlerAttached) {
        message.removeAttribute('data-notesHandlerAttached');
      }
    });
    
    // Remove the escape key listener
    document.removeEventListener('keydown', handleEscapeKey);
    
    // Reset state
    window.notesModeActive = false;
    
    // Update button
    const notesButton = document.getElementById('notes-mode');
    if (notesButton) {
      notesButton.style.color = "white";
      notesButton.title = "Enter save mode";
    }
  }
  
  // Handle ESC key to exit notes mode
  function handleEscapeKey(e) {
    if (e.key === 'Escape' && window.notesModeActive) {
      exitNotesMode();
      showToast("Save mode cancelled.");
    }
  }
  
  // Handle clicking on a message
  function handleMessageClick(e) {
    // Don't interfere with links or buttons
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || 
        e.target.closest('a') || e.target.closest('button')) {
      return;
    }
    
    const message = this;
    
    // Find content element
    const contentElement = message.querySelector('.markdown-content, .markdown, .whitespace-pre-wrap');
    if (!contentElement) {
      showToast("Couldn't find message content.", true);
      return;
    }
    
    // Generate a unique ID if not already assigned
    if (!message.dataset.noteId) {
      message.dataset.noteId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    // Check if this message is already saved
    const messageId = message.dataset.noteId;
    const existingNote = window.GPTNotes.find(note => note.id === messageId);
    
    if (existingNote) {
      showToast("Note already saved");
      exitNotesMode(); // Exit save mode
      return;
    }
    
    // Extract content
    const fullContent = simplifyHTML(contentElement.innerHTML);
    const plainText = contentElement.textContent.trim();
    const preview = plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;
    
    // Normalize the URL to prevent duplicates
    const normalizedUrl = getNormalizedUrl();
    const chatId = location.pathname.split('/').pop();
    
    // Create note object with optimized storage
    const note = {
      id: messageId,
      preview: preview,
      fullContent: fullContent,
      plainText: plainText.substring(0, 1000), // Limit plain text size
      chatTitle: document.title,
      chatUrl: location.href, // Keep full URL for reference
      normalizedUrl: normalizedUrl, // Use for grouping
      chatId: chatId,
      timestamp: new Date().toISOString()
    };
    
    // Add to notes
    window.GPTNotes.push(note);
    
    // Save to localStorage with error handling
    try {
      localStorage.setItem('gptnotes-quick', JSON.stringify(window.GPTNotes));
    } catch (e) {
      // If storage fails (quota exceeded), remove oldest items and try again
      if (e.name === 'QuotaExceededError') {
        window.GPTNotes = window.GPTNotes.slice(-50); // Keep only most recent 50
        localStorage.setItem('gptnotes-quick', JSON.stringify(window.GPTNotes));
        showToast("Storage limit reached. Keeping only recent notes.");
      }
    }
    
    // Update UI
    renderNotes();
    
    // Visual feedback
    message.style.outline = "2px solid #6b4fbb";
    setTimeout(() => {
      message.style.outline = message.dataset.originalOutline || "";
    }, 1000);
    
    // Exit notes mode
    exitNotesMode();
    
    // Show success notification
    showToast("Note saved");
  }
  
  // Get normalized URL for grouping
  function getNormalizedUrl() {
    // Extract path without query parameters
    const path = location.pathname;
    // Check if it's a chat path
    if (path.includes('/c/')) {
      // Return just the chat ID portion
      return path;
    }
    return path; // Default to full path if not a specific chat
  }
  
  // Helper function to simplify HTML content for storage
  function simplifyHTML(html) {
    // Create a temporary element
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove unnecessary attributes to reduce size
    const elements = temp.querySelectorAll('*');
    elements.forEach(el => {
      const attributes = Array.from(el.attributes);
      attributes.forEach(attr => {
        // Keep only essential attributes
        if (!['href', 'src', 'class'].includes(attr.name)) {
          el.removeAttribute(attr.name);
        }
      });
    });
    
    return temp.innerHTML;
  }
  
  // Render notes in the panel
  function renderNotes(searchTerm = '') {
    const container = document.getElementById('notes-container');
    const emptyMessage = document.getElementById('empty-notes-message');
    container.innerHTML = '';
    
    let filtered = window.GPTNotes;
    
    // Apply search filter if provided
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = window.GPTNotes.filter(n => 
        n.preview.toLowerCase().includes(term) || 
        (n.chatTitle && n.chatTitle.toLowerCase().includes(term))
      );
    }
    
    // Show empty message if no notes
    if (filtered.length === 0) {
      container.appendChild(emptyMessage);
      return;
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB - dateA;
    });
    
    // Group by normalized URL
    const grouped = {};
    filtered.forEach(n => {
      const key = n.normalizedUrl || n.chatUrl;
      if (!grouped[key]) grouped[key] = { 
        title: n.chatTitle || 'Untitled Chat', 
        url: n.chatUrl, 
        items: [] 
      };
      grouped[key].items.push(n);
    });
    
    // Check if we need to limit displayed notes
    let totalNotes = 0;
    Object.values(grouped).forEach(group => {
      totalNotes += group.items.length;
    });
    
    // Show limit message if needed
    if (totalNotes > 50) {
      const limitMessage = document.createElement('div');
      limitMessage.style = 'text-align:center;color:#6b4fbb;font-size:12px;padding:4px;margin-bottom:8px;background:#f0f4f9;border-radius:4px;';
      limitMessage.textContent = 'Panel limit reached: only showing 50 latest notes';
      container.appendChild(limitMessage);
    }
    
    // Counter for limiting displayed notes
    let displayCount = 0;
    
    // Render each group
    Object.values(grouped).forEach(group => {
      if (displayCount >= 50) return;
      
      const groupDiv = document.createElement('div');
      groupDiv.style = 'margin-bottom: 16px;';
      
      // Create group header with chat title and link
      const title = document.createElement('div');
      title.innerHTML = `<a href="${group.url}" target="_blank" style="font-weight:bold;text-decoration:none;color:#1a73e8">${group.title}</a>`;
      title.style = 'margin-bottom:8px;';
      groupDiv.appendChild(title);
      
      // Create note items (limit to remaining slots in our 50 max)
      const itemsToShow = Math.min(group.items.length, 50 - displayCount);
      
      group.items.slice(0, itemsToShow).forEach(note => {
        const item = document.createElement('div');
        item.className = 'note-item';
        item.dataset.noteId = note.id;
        item.style = 'border:1px solid #e0e7f1;border-radius:4px;padding:8px;margin-bottom:8px;background:white;';
        
        // Populate item content without timestamp
        item.innerHTML = `
          <div style="font-size:13px;color:#333;white-space:normal;word-break:break-word;">${note.preview}</div>
          <div style="margin-top:8px;display:flex;justify-content:flex-end;">
            <button class="copy-note" style="background:none;border:1px solid #c9d7e8;border-radius:4px;cursor:pointer;font-size:12px;color:#1a73e8;margin-right:8px;padding:2px 6px;">Copy</button>
            <button class="delete-note" style="background:none;border:1px solid #c9d7e8;border-radius:4px;cursor:pointer;font-size:12px;color:#f44336;padding:2px 6px;">Delete</button>
          </div>
        `;
        
        groupDiv.appendChild(item);
        displayCount++;
      });
      
      container.appendChild(groupDiv);
    });
    
    // Add event listeners for note actions using delegation
    setupNoteActions();
  }
  
  // Setup event listeners for note actions using delegation
  function setupNoteActions() {
    // Use delegation for the container instead of individual buttons
    const container = document.getElementById('notes-container');
    
    // Remove existing handler if any
    if (window.noteActionHandler) {
      container.removeEventListener('click', window.noteActionHandler);
    }
    
    // Create the delegated event handler
    window.noteActionHandler = function(e) {
      // Copy button handler
      if (e.target.classList.contains('copy-note')) {
        const noteItem = e.target.closest('.note-item');
        const id = noteItem.dataset.noteId;
        const note = window.GPTNotes.find(n => n.id === id);
        if (!note) return;
        
        const htmlContent = `<div>${note.fullContent}</div>`;
        const plainText = note.plainText;
        
        // Try to copy with formatting, fall back to plain text
        try {
          if (navigator.clipboard.write && window.ClipboardItem) {
            navigator.clipboard.write([
              new ClipboardItem({
                'text/html': new Blob([htmlContent], {type:'text/html'}),
                'text/plain': new Blob([plainText], {type:'text/plain'})
              })
            ]).then(() => {
              showToast("Copied with formatting!");
            }).catch(err => {
              navigator.clipboard.writeText(plainText).then(() => {
                showToast("Copied as plain text (formatting not supported)");
              });
            });
          } else {
            navigator.clipboard.writeText(plainText).then(() => {
              showToast("Copied as plain text");
            });
          }
        } catch(e) {
          // Final fallback if all else fails
          navigator.clipboard.writeText(plainText).then(() => {
            showToast("Copied as plain text");
          }).catch(() => {
            showToast("Failed to copy to clipboard", true);
          });
        }
      }
      
      // Delete button handler
      if (e.target.classList.contains('delete-note')) {
        const noteItem = e.target.closest('.note-item');
        const id = noteItem.dataset.noteId;
        const index = window.GPTNotes.findIndex(n => n.id === id);
        
        if (index !== -1) {
          // Remove from array
          window.GPTNotes.splice(index, 1);
          
          // Update localStorage
          localStorage.setItem('gptnotes-quick', JSON.stringify(window.GPTNotes));
          
          // Re-render notes
          renderNotes();
          
          showToast("Note deleted");
        }
      }
    };
    
    // Add the delegated handler
    addEventListenerWithTracking(container, 'click', window.noteActionHandler);
  }
  
  // Helper function to strip HTML tags but keep line breaks
  function stripHtmlPreservingLineBreaks(html) {
    // First replace <br>, <p>, <div> etc. with newlines
    let text = html.replace(/<br\s*\/?>/gi, '\n')
                  .replace(/<\/p>/gi, '\n')
                  .replace(/<\/div>/gi, '\n')
                  .replace(/<\/h[1-6]>/gi, '\n\n');
    
    // Strip all other HTML tags
    text = text.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    text = textarea.value;
    
    // Remove multiple consecutive line breaks
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text.trim();
  }
  
  // Export notes as JSON, TXT, or Markdown
  function exportNotes(format) {
    if (window.GPTNotes.length === 0) {
      showToast("No notes to export", true);
      return;
    }
    
    let content, filename, type;
    
    if (format === 'json') {
      // Export as JSON with all data
      content = JSON.stringify(window.GPTNotes, null, 2);
      filename = "gptnotes-" + new Date().toISOString().split('T')[0] + ".json";
      type = "application/json";
    } else if (format === 'markdown') {
      // Export as Markdown with formatting
      
      // Sort by timestamp (newest first)
      const sortedNotes = [...window.GPTNotes].sort((a, b) => {
        const dateA = new Date(a.timestamp || 0);
        const dateB = new Date(b.timestamp || 0);
        return dateB - dateA;
      });
      
      // Group by chat title
      const grouped = {};
      sortedNotes.forEach(n => {
        const key = n.chatTitle || 'Untitled Chat';
        if (!grouped[key]) grouped[key] = {
          title: key,
          url: n.chatUrl,
          items: []
        };
        grouped[key].items.push(n);
      });
      
      // Format as Markdown
      content = "# GPT Notes Export\n\n";
      content += "Generated on " + new Date().toLocaleString() + "\n\n";
      
      Object.values(grouped).forEach(group => {
        content += `## ${group.title}\n\n`;
        
        group.items.forEach(note => {
          // Get clean text but preserve basic formatting
          const cleanText = stripHtmlPreservingLineBreaks(note.fullContent);
          const dateStr = new Date(note.timestamp).toLocaleString();
          
          content += `### ${dateStr}\n\n`;
          content += cleanText + "\n\n";
          content += `[Open Chat](${note.chatUrl})\n\n`;
          content += "---\n\n";
        });
      });
      
      filename = "gptnotes-" + new Date().toISOString().split('T')[0] + ".md";
      type = "text/markdown";
    } else {
      // Export as TXT with just text content and chat info
      content = window.GPTNotes.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0);
        const dateB = new Date(b.timestamp || 0);
        return dateB - dateA;
      }).map(n => {
        const cleanText = stripHtmlPreservingLineBreaks(n.fullContent);
        const dateStr = new Date(n.timestamp).toLocaleString();
        return `--- ${n.chatTitle || 'Untitled Chat'} ---\n${cleanText}\n\nSource: ${n.chatUrl}\nDate: ${dateStr}\n\n`;
      }).join('-------------------\n\n');
      
      filename = "gptnotes-" + new Date().toISOString().split('T')[0] + ".txt";
      type = "text/plain";
    }
    
    // Create download link
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    showToast(`Notes exported as ${format.toUpperCase()}`);
  }
  
  // Setup export menu
  function showExportMenu(button) {
    // Remove existing menu if any
    const existingMenu = document.getElementById('export-menu');
    if (existingMenu) {
      existingMenu.remove();
      return;
    }
    
    // Get button position
    const rect = button.getBoundingClientRect();
    
    // Create menu
    const menu = document.createElement('div');
    menu.id = 'export-menu';
    menu.style = `
      position: absolute;
      top: ${rect.bottom + 5}px;
      left: ${rect.left}px;
      background: white;
      border: 1px solid #c9d7e8;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 10000;
    `;
    
    menu.innerHTML = `
      <div style="padding: 8px;">
        <div id="export-markdown" style="padding: 8px; cursor: pointer; border-bottom: 1px solid #e0e7f1;">
          Export as Markdown
        </div>
        <div id="export-json" style="padding: 8px; cursor: pointer; border-bottom: 1px solid #e0e7f1;">
          Export as JSON
        </div>
        <div id="export-txt" style="padding: 8px; cursor: pointer;">
          Export as Text
        </div>
      </div>
    `;
    
    document.body.appendChild(menu);
    
    // Use delegation for export menu
    addEventListenerWithTracking(menu, 'click', function(e) {
      const target = e.target;
      
      if (target.id === 'export-markdown') {
        exportNotes('markdown');
        menu.remove();
      } else if (target.id === 'export-json') {
        exportNotes('json');
        menu.remove();
      } else if (target.id === 'export-txt') {
        exportNotes('txt');
        menu.remove();
      }
    });
    
    // Close menu when clicking outside
    function closeMenu(e) {
      if (!menu.contains(e.target) && e.target !== button) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    }
    
    // Delay adding listener to prevent immediate closing
    setTimeout(() => {
      addEventListenerWithTracking(document, 'click', closeMenu);
    }, 10);
  }
  
  // Set up event listeners
  addEventListenerWithTracking(document.getElementById('notes-mode'), 'click', function() {
    if (window.notesModeActive) {
      exitNotesMode();
      showToast("Save mode cancelled");
    } else {
      window.initNotesMode();
    }
  });
  
  addEventListenerWithTracking(document.getElementById('export-notes'), 'click', function(e) {
    showExportMenu(this);
    e.stopPropagation();
  });
  
  addEventListenerWithTracking(document.getElementById('close-notes'), 'click', function() {
    // Just hide the panel, don't deactivate
    if (window.notesModeActive) {
      exitNotesMode(); // Make sure save mode is exited
    }
    panel.style.display = 'none';
  });
  
  const searchInput = document.querySelector('#notes-search input');
  addEventListenerWithTracking(searchInput, 'input', function() {
    renderNotes(this.value);
  });
  
  // Function to clean up resources
  window.cleanupGPTNotes = function() {
    // Exit notes mode if active
    if (window.notesModeActive) {
      exitNotesMode();
    }
    
    // Remove panel from DOM
    const panel = document.getElementById('gptnotes-ui');
    if (panel) panel.remove();
    
    // Remove any export menus
    const exportMenu = document.getElementById('export-menu');
    if (exportMenu) exportMenu.remove();
    
    // Remove any toasts
    const toasts = document.querySelectorAll('.gptnotes-toast');
    toasts.forEach(toast => toast.remove());
    
    // Cleanup of event listeners
    if (window.notes_eventListeners) {
      window.notes_eventListeners.forEach(({ element, type, listener, options }) => {
        element.removeEventListener(type, listener, options);
      });
      window.notes_eventListeners = [];
    }
    
    // Remove message styles and data attributes
    document.querySelectorAll('[data-message-author-role="assistant"]').forEach(message => {
      message.style.outline = "";
      message.style.cursor = "";
      message.removeAttribute('data-notesHandlerAttached');
    });
    
    // Reset state
    window.notesModeActive = false;
    window.GPTNotesUI = false;
  };
  
  // Global utility to reset and cleanup manually if needed
  window.resetGPTNotes = window.cleanupGPTNotes;
  
  // Initial render of notes
  renderNotes();
  
  // Create launcher button
  createLauncher();
})();
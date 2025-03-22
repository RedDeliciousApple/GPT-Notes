// ChatGPT Notes Panel - Performance-Optimized and Refined Version
// A lightweight tool for saving ChatGPT messages without performance impact

(function() {
  // Prevent multiple initializations
  if (window.GPTNotesUI) {
    // If already open, just toggle visibility
    const panel = document.getElementById('gptnotes-panel-ui');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
      return;
    }
  }
  
  // Setup global state
  window.GPTNotes = JSON.parse(localStorage.getItem('gptnotes-quick') || '[]');
  window.GPTNotesUI = true;
  window.notesModeActive = false;

  // Create and style the panel
  const panel = document.createElement('div');
  panel.id = 'gptnotes-panel-ui';
  panel.style = 'position:fixed;bottom:20px;left:20px;z-index:9999;background:#f0f4f9;border:1px solid #c9d7e8;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);font-family:Arial,sans-serif;font-size:14px;color:#333;width:300px;max-height:500px;display:flex;flex-direction:column;';
  
  // Set up panel HTML
  panel.innerHTML = `
    <div style="background:#6b4fbb;color:white;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;cursor:move;border-top-left-radius:8px;border-top-right-radius:8px;">
      <span style="font-weight:bold;">📝 GPTNotes Panel</span>
      <div>
        <button id="notes-mode" style="background:none;border:none;color:white;font-size:14px;cursor:pointer;margin-right:8px;" title="Enter save mode">Save</button>
        <button id="export-notes" style="background:none;border:none;color:white;font-size:14px;cursor:pointer;margin-right:8px;" title="Export notes">Export</button>
        <button id="minimize-notes" style="background:none;border:none;color:white;font-size:14px;cursor:pointer;margin-right:4px;" title="Minimize panel">–</button>
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

  // Make panel draggable
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
  
  document.addEventListener('mouseup', () => { 
    isDragging = false; 
  });

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
      
      // Add click listener
      message.addEventListener('click', handleMessageClick);
    });
    
    // Add escape key listener to exit notes mode
    document.addEventListener('keydown', handleEscapeKey);
    
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
    
    // Remove highlighting
    document.querySelectorAll('[data-message-author-role="assistant"]').forEach(message => {
      message.style.outline = "";
      message.style.cursor = "";
      message.removeEventListener('click', handleMessageClick);
    });
    
    // Remove escape key listener
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
    
    // Extract content
    const messageId = message.dataset.noteId;
    const fullContent = contentElement.innerHTML;
    const plainText = contentElement.textContent.trim();
    const preview = plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;
    
    // Normalize the URL to prevent duplicates
    const normalizedUrl = location.origin + location.pathname;
    const chatId = location.pathname.split('/').pop();
    
    // Create note object
    const note = {
      id: messageId,
      preview: preview,
      fullContent: fullContent,
      plainText: plainText,
      chatTitle: document.title,
      chatUrl: normalizedUrl,
      chatId: chatId,
      timestamp: new Date().toISOString()
    };
    
    // Add to notes
    window.GPTNotes.push(note);
    
    // Save to localStorage
    localStorage.setItem('gptnotes-quick', JSON.stringify(window.GPTNotes));
    
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
    showToast("Message saved successfully!");
  }
  
  // Simple toast notification
  function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.style = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${isError ? '#f44336' : '#6b4fbb'};
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, 3000);
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
    
    // Group by chat URL
    const grouped = {};
    filtered.forEach(n => {
      const key = n.chatUrl;
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
        item.style = 'border:1px solid #e0e7f1;border-radius:4px;padding:8px;margin-bottom:8px;background:white;';
        
        // Populate item content without timestamp
        item.innerHTML = `
          <div style="font-size:13px;color:#333;white-space:normal;word-break:break-word;">${note.preview}</div>
          <div style="margin-top:8px;display:flex;justify-content:flex-end;">
            <button class="copy-note" data-id="${note.id}" style="background:none;border:1px solid #c9d7e8;border-radius:4px;cursor:pointer;font-size:12px;color:#1a73e8;margin-right:8px;padding:2px 6px;">Copy</button>
            <button class="delete-note" data-id="${note.id}" style="background:none;border:1px solid #c9d7e8;border-radius:4px;cursor:pointer;font-size:12px;color:#f44336;padding:2px 6px;">Delete</button>
          </div>
        `;
        
        groupDiv.appendChild(item);
        displayCount++;
      });
      
      container.appendChild(groupDiv);
    });
    
    // Add event listeners for note actions
    setupNoteActions();
  }
  
  // Setup event listeners for note actions
  function setupNoteActions() {
    // Copy button handler
    document.querySelectorAll('.copy-note').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        const note = window.GPTNotes.find(n => n.id === id);
        if (!note) return;
        
        const htmlContent = `<div>${note.fullContent}</div>`;
        const plainText = note.plainText;
        
        // Try to copy with formatting, fall back to plain text
        try {
          if (navigator.clipboard.write && ClipboardItem) {
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
      });
    });
    
    // Delete button handler
    document.querySelectorAll('.delete-note').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
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
      });
    });
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
      content = "# GPTNotes Export\n\n";
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
      right: ${window.innerWidth - rect.right}px;
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
    
    // Add event listeners
    document.getElementById('export-markdown').addEventListener('click', () => {
      exportNotes('markdown');
      menu.remove();
    });
    
    document.getElementById('export-json').addEventListener('click', () => {
      exportNotes('json');
      menu.remove();
    });
    
    document.getElementById('export-txt').addEventListener('click', () => {
      exportNotes('txt');
      menu.remove();
    });
    
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== button) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 10);
  }
  
  // Set up event listeners
  document.getElementById('notes-mode').addEventListener('click', function() {
    if (window.notesModeActive) {
      exitNotesMode();
      showToast("Save mode cancelled");
    } else {
      window.initNotesMode();
    }
  });
  
  document.getElementById('export-notes').addEventListener('click', function(e) {
    showExportMenu(this);
    e.stopPropagation();
  });
  
  document.getElementById('minimize-notes').addEventListener('click', function() {
    const content = document.getElementById('notes-panel-content');
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
    this.textContent = content.style.display === 'none' ? '+' : '–';
  });
  
  document.getElementById('close-notes').addEventListener('click', function() {
    // Clean up
    exitNotesMode();
    panel.remove();
    window.GPTNotesUI = false;
  });
  
  const searchInput = document.querySelector('#notes-search input');
  searchInput.addEventListener('input', function() {
    renderNotes(this.value);
  });
  
  // Initial render
  renderNotes();
})();

# GPT-Notes

A lightweight bookmarklet to save and organize important ChatGPT responses across multiple conversations.

## 🌟 Features

- **Save Important Responses:** Select and save any ChatGPT response as a note
- **🌐 Works Globally:** Notes persist across all your chats
- **🔍 Search:** Filter notes by key words
- **🗂️ Auto-Organization:** Notes are grouped by conversation
- **📋 Copy Support:** Copy formatted message content with a single click
- **🗑️ Easy Management:** Delete notes you no longer need

## 🚀 Installation

### Desktop Browsers:
1. Create a new bookmark in your browser
2. Name it "GPT-Notes" (or any name you prefer)
3. Copy the entire code and paste it in the URL field:

```javascript
javascript:(function(){if(window.GPTNotesUI){const e=document.getElementById("gptnotes-panel-ui");if(e){e.style.display=e.style.display==="none"?"flex":"none";return}}window.GPTNotes=JSON.parse(localStorage.getItem("gptnotes-quick")||"[]");window.GPTNotesUI=true;window.notesModeActive=false;const t=document.createElement("div");t.id="gptnotes-panel-ui";t.style="position:fixed;bottom:20px;left:20px;z-index:9999;background:#f0f4f9;border:1px solid #c9d7e8;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);font-family:Arial,sans-serif;font-size:14px;color:#333;width:300px;max-height:500px;display:flex;flex-direction:column;";t.innerHTML=`<div style="background:#6b4fbb;color:white;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;cursor:move;border-top-left-radius:8px;border-top-right-radius:8px;"><span style="font-weight:bold;">📝 GPTNotes Panel</span><div><button id="notes-mode" style="background:none;border:none;color:white;font-size:14px;cursor:pointer;margin-right:8px;" title="Enter save mode">Save</button><button id="export-notes" style="background:none;border:none;color:white;font-size:14px;cursor:pointer;margin-right:8px;" title="Export notes">Export</button><button id="minimize-notes" style="background:none;border:none;color:white;font-size:14px;cursor:pointer;margin-right:4px;" title="Minimize panel">–</button><button id="close-notes" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;" title="Close panel">✕</button></div></div><div id="notes-panel-content"><div id="notes-search" style="padding:8px;border-bottom:1px solid #e0e7f1;"><input type="text" placeholder="Search notes..." style="width:100%;padding:6px;border:1px solid #c9d7e8;border-radius:4px;"></div><div id="notes-container" style="padding:8px;overflow-y:auto;flex-grow:1;max-height:400px;"><div id="empty-notes-message" style="text-align:center;color:#777;padding:20px;">No notes yet. Click "Save" to enter save mode, then click on any ChatGPT message to save it.</div></div></div>`;document.body.appendChild(t);const n=t.querySelector("div");let o=false,i,r;n.addEventListener("mousedown",e=>{if(e.target.tagName==="BUTTON")return;o=true;i=e.clientX-t.getBoundingClientRect().left;r=e.clientY-t.getBoundingClientRect().top});document.addEventListener("mousemove",e=>{if(!o)return;t.style.left=`${e.clientX-i}px`;t.style.top=`${e.clientY-r}px`});document.addEventListener("mouseup",()=>{o=false});window.initNotesMode=function(){if(window.notesModeActive)return;window.notesModeActive=true;const e=Array.from(document.querySelectorAll('[data-message-author-role="assistant"]')).filter(e=>!e.closest('[data-testid="conversation-turn-counter"]'));e.forEach(e=>{e.style.transition="outline 0.3s ease";e.style.outline="2px dashed #6b4fbb";e.style.cursor="pointer";e.dataset.originalOutline=e.style.outline;e.dataset.originalCursor=e.style.cursor;e.addEventListener("click",s)});document.addEventListener("keydown",c);const t=document.getElementById("notes-mode");if(t){t.style.color="#ffcc00";t.title="Exit save mode (ESC)"}d("Save mode active. Click any ChatGPT message to save it, or press ESC to cancel.")};function a(){if(!window.notesModeActive)return;document.querySelectorAll('[data-message-author-role="assistant"]').forEach(e=>{e.style.outline="";e.style.cursor="";e.removeEventListener("click",s)});document.removeEventListener("keydown",c);window.notesModeActive=false;const e=document.getElementById("notes-mode");if(e){e.style.color="white";e.title="Enter save mode"}}function c(e){if(e.key==="Escape"&&window.notesModeActive){a();d("Save mode cancelled.")}}function s(e){if(e.target.tagName==="A"||e.target.tagName==="BUTTON"||e.target.closest("a")||e.target.closest("button")){return}const t=this;const n=t.querySelector(".markdown-content, .markdown, .whitespace-pre-wrap");if(!n){d("Couldn't find message content.",true);return}if(!t.dataset.noteId){t.dataset.noteId=Date.now()+"-"+Math.random().toString(36).substr(2,9)}const o=t.dataset.noteId;
```
5. Save the bookmark

### iPad/Mobile Setup:
While bookmarklets sync across devices when using Chrome sync, mobile browsers have security restrictions that prevent running bookmarklets by simply tapping them.

**For iPad/iOS users:**
1. **Use Safari** (more bookmarklet-friendly than Chrome on iOS)
2. Create a new bookmark in Safari
3. Edit the bookmark and paste the entire JavaScript code into the URL field
4. Visit chat.openai.com
5. Tap the bookmark while on the ChatGPT page

If that doesn't work:
1. Copy the entire JavaScript code (starting with `javascript:`)
2. Visit chat.openai.com in Safari
3. Tap the address bar
4. Paste the code and tap Go

## 📖 Usage

1. Visit [ChatGPT](https://chat.openai.com)
2. Click the bookmark to activate the tool
3. A panel will appear at the bottom left of the screen
4. Click any ChatGPT response to save it
5. Use the search bar to filter notes
6. Click 📋 to copy or 🗑️ to delete notes

## ⚠️ Performance Considerations

This bookmarklet works well on most conversations but may cause performance issues on:
- Very long conversations (hundreds of messages)
- Low-end devices with limited RAM/CPU
- Browsers with many tabs open
- Mobile devices with limited processing power

If you experience lag, refresh the page and avoid using the tool on extremely large conversations. If you experience continued lag, copy paste this into the console and run it: (function(){if(window.ChatGPTCopyPasterActive){const e=document.getElementById("chatgpt-export-widget");e&&e.remove();window.ChatGPTCopyPasterActive=false}if(window.GPTNotesUI){const t=document.getElementById("gptnotes-panel-ui");t&&t.remove();window.GPTNotesUI=false;window.notesModeActive=false}document.querySelectorAll("[data-message-author-role]").forEach(e=>{e.style.outline="";e.style.cursor="";e.style.boxShadow=""});const n=document.querySelectorAll(".message-selection-checkbox");n.forEach(e=>e.remove())})();

## 🔒 Security & Privacy

- All data is stored locally in your browser using localStorage
- No data is sent to any external servers
- Works with ChatGPT's strict Content Security Policy

## 🧰 Technical Details

- Pure vanilla JavaScript, no dependencies
- Works with Chrome, Edge, Brave, Firefox, and Safari on desktop
- Limited mobile support (see iPad/Mobile Setup)
- CSP-compatible (no eval, no external scripts)
- MutationObserver watches for new messages
- Designed to maintain consistent state across multiple runs

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgements

Developed as a proof-of-concept for bookmarking ChatGPT messages without requiring a browser extension.

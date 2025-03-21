# ChatGPT Global Bookmarker

A lightweight bookmarklet to save and organize important ChatGPT responses across multiple conversations.

## 🌟 Features

- **📌 Pin Important Responses:** Add bookmark pins to any ChatGPT response
- **🌐 Works Globally:** Bookmarks persist across all your chats
- **🔍 Search:** Filter bookmarks by content
- **🗂️ Auto-Organization:** Bookmarks are grouped by conversation
- **📋 Copy Support:** Copy formatted message content with a single click
- **🗑️ Easy Management:** Delete bookmarks you no longer need

## 🚀 Installation

### Desktop Browsers:
1. Create a new bookmark in your browser
2. Name it "ChatGPT Bookmarker" (or any name you prefer)
3. Copy the entire code from [bookmarklet.js](bookmarklet.js) and paste it in the URL field
4. Save the bookmark

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
4. Click the 📌 pin icon next to any ChatGPT response to bookmark it
5. Use the search bar to filter bookmarks
6. Click 📋 to copy or 🗑️ to delete bookmarks

## ⚠️ Performance Considerations

This bookmarklet works well on most conversations but may cause performance issues on:
- Very long conversations (hundreds of messages)
- Low-end devices with limited RAM/CPU
- Browsers with many tabs open
- Mobile devices with limited processing power

If you experience lag, refresh the page and avoid using the tool on extremely large conversations.

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

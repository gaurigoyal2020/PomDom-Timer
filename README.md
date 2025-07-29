# 🐾 PomDom – The Cat-Inspired Pomodoro Timer Extension

**PomDom** is a minimalist yet quirky Chrome extension that helps you stay productive using the Pomodoro Technique — with cute vibes and clean code. Built for makers, students, deep workers, and anyone trying to focus without frying their brain.

> "Even cats take breaks. So should you."

---

## 🧠 Features

- ✅ 25-minute **Focus Timer** (default)
- ✅ 5-minute **Short Breaks**
- ✅ 15-minute **Long Breaks**
- ✅ **Custom timers** if you're feeling spicy
- ✅ Elegant **system notifications** when a session ends
- ✅ Real-time syncing between popup and background
- ❌ No cat meow (yet) — Chrome blocked the vibe, but we’re respecting system focus modes

---

## ⚙️ Tech Stack

- JavaScript ES6
- Chrome Extensions Manifest V3
- Chrome Alarms, Notifications & Storage APIs
- HTML/CSS with subtle aesthetics
- Designed for future enhancements (like sound toggles, badges, dark mode, etc.)

---

## 💡 Known Limitations

🚫 **Focus Mode / Do Not Disturb (DND) suppresses system notifications**

> If you're using macOS "Focus" or Windows "Focus Assist" / DND mode, Chrome's system notifications (like PomDom's alert) **will not appear**. This is a platform-level behavior and cannot be bypassed by extensions for security and sanity reasons.

**Tips to mitigate:**
- Use Chrome’s built-in notification center (`chrome://flags/#enable-message-center-new-style`) on some platforms.
- Keep the popup open if you want to manually track the timer visually.

---

## 🧳 Installation (Developer Mode)

1. Clone or download this repo
2. Go to `chrome://extensions` and enable **Developer Mode**
3. Click **"Load unpacked"** and select the project folder
4. Start Pomodoro-ing like a focused feline

---

## 📦 Coming Soon (v1.1 Ideas)

- 🐱 Optional sound alerts (toggleable in settings)
- 🎨 Themes (Dark mode, pastel mode, and maybe... cat mode?)
- 🧠 AI-based break reminders (🤯)
- 🌐 Cross-browser support (Edge, Brave, Arc?)

---

## 📸 Screenshots

> _[Insert screenshots or a GIF demo here]_  
> (_Popup with timers, break modes, notification preview, etc._)

---

## 🛡️ Privacy

PomDom does **not** collect or transmit any user data. All timer data is stored locally using `chrome.storage.local`.

---

## 👤 Author

**Gauri Goyal**  
[LinkedIn](https://linkedin.com/in/your-profile) | [GitHub](https://github.com/your-handle) | Product + Code + Cats

---

## 🐾 Final Note

This was built not just to time focus... but to **respect it**. If you believe in intentional work, humane tech, and the occasional meow — PomDom is for you.

> Give it a ⭐ on GitHub if it made you smile (or made you stop scrolling Instagram for 25 minutes).
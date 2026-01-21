# Flask Stack - Testing Guide

## Quick Start

1. **Install Dependencies**:
```bash
cd flask-stack
pip install flask
```

2. **Run the Application**:
```bash
export FLASK_APP=app
export FLASK_DEBUG=1
python -m flask run
```

3. **Test the Reactive Features**:
   - Visit http://localhost:5000/auth/login
   - Register a new account
   - Try these dialog-based features:
     - Click "Compose" button (opens dialog)
     - Click reply button on a post (opens reply dialog)
     - Click like/retweet buttons (form POST with redirect)
     - Notice the smooth CSS animations

## Key Features to Test

### 1. **Dialog-Based Composition**
- Click "Compose" in header
- Dialog opens without navigation
- Type a post (max 280 chars)
- Submit - page refreshes with new post
- Flash message appears

### 2. **In-Place Replies**
- Click reply icon on any post
- Dialog shows original post
- Submit reply - page updates
- Reply count increments

### 3. **Instant Feedback**
- Click like button
- CSS animation plays immediately
- Form submits to server
- Page refreshes with updated count
- Like state persists

### 4. **Flash Messages**
- Auto-appear after actions
- Slide in from right
- Click × to dismiss
- Different colors for success/error/info

## JavaScript Usage (Minimal)

The entire application uses **only 4 one-line JS statements**:

1. `dialog.showModal()` - Opens dialog
2. `dialog.close()` - Closes dialog
3. `element.remove()` - Dismisses flash messages
4. `navigator.share()` - Native share (optional)

Everything else is pure HTML/CSS + Python!

## How It Works

### Reactive Pattern:
```
User clicks button
  ↓
Dialog opens (CSS animation)
  ↓
User fills form
  ↓
Form POSTs to Flask
  ↓
Flask processes data
  ↓
Flask redirects back to same page
  ↓
Page refreshes (but feels smooth due to CSS)
  ↓
Updated data appears with animation
  ↓
Flash message confirms action
```

### Benefits:
- ✅ Works without JavaScript
- ✅ SEO friendly (server-rendered)
- ✅ Accessible (semantic HTML)
- ✅ Fast (no heavy JS frameworks)
- ✅ Simple to maintain

## Browser Requirements

- Modern browser with `<dialog>` support (Chrome 37+, Firefox 98+, Safari 15.4+)
- JavaScript enabled (but degrades gracefully)
- CSS Grid and Flexbox support (universal)

## Development Notes

- All state is server-side (sessions)
- Forms use POST/Redirect/GET pattern
- No client-side routing
- No virtual DOM
- No build step required

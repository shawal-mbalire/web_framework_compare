# Reactive Patterns Without AJAX/HTMX

This Flask application achieves a reactive, dynamic user experience using **only HTML, CSS, and minimal JavaScript** (limited to one statement per use).

## Core Techniques

### 1. HTML `<dialog>` Elements
Native browser modal dialogs provide popup functionality without navigation:
- **Compose Dialog**: Create posts without leaving the feed
- **Reply Dialogs**: Reply to posts in-place
- Opened with one line of JS: `dialog.showModal()`
- Closed with: `dialog.close()`

### 2. Form POST + Redirect Pattern
Creates a "reactive" feel without full page reloads:

```python
@bp.route('/posts/<post_id>/like', methods=['POST'])
def like_post(post_id):
    # Process the action
    toggle_like(post_id, current_user)
    
    # Redirect back to referring page
    return redirect(request.referrer or url_for('feed.home'))
```

**Benefits**:
- Form submits asynchronously from user perspective (dialog stays open)
- Page refreshes with updated data
- Flash messages provide feedback
- Browser history maintained properly
- Works with browser back/forward buttons

### 3. CSS Animations for Smooth Transitions
Make page updates feel instant and reactive:

```css
/* Fade in new content */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.post-card {
  animation: fadeInUp 0.4s ease;
}
```

**Used for**:
- Post cards appearing
- Flash messages sliding in
- Dialog opening/closing
- Button press feedback

### 4. Optimistic UI with CSS
Instant visual feedback before server response:

```css
.action-btn:active {
  transform: scale(0.95);
}

.action-liked {
  animation: pulse 0.3s ease;
}
```

### 5. HTML5 Form Validation
Built-in validation without JavaScript:

```html
<textarea 
  name="content" 
  required 
  maxlength="280"
  oninput="this.nextElementSibling.textContent = this.value.length + '/280'"
></textarea>
<div class="char-counter">0/280</div>
```

### 6. CSS-Only Interactive Elements

**Details/Summary for Dropdowns**:
```html
<details class="user-menu">
  <summary>Menu</summary>
  <div class="dropdown-content">
    <a href="/profile">Profile</a>
    <a href="/settings">Settings</a>
  </div>
</details>
```

**CSS Target Pseudo-class**:
```css
#notification:target {
  display: block;
  animation: slideIn 0.3s ease;
}
```

### 7. Web Share API (One Line of JS)
Native sharing without custom code:

```html
<button onclick="navigator.share({url: location.href}).catch(() => {})">
  Share
</button>
```

## Reactive Features Implemented

### ✅ Create Posts (Dialog)
- Opens in modal dialog
- Form submits to Flask
- Redirects back to same page
- Post appears with animation
- Flash message confirms success

### ✅ Like/Unlike Posts
- Form POST to toggle state
- Immediate visual feedback (CSS :active)
- Page refreshes with updated count
- Liked state persists

### ✅ Retweet/Unretweet
- Same pattern as likes
- Different animation
- Count updates

### ✅ Reply to Posts
- Dialog with original post context
- Form includes parent_id
- Creates threaded reply
- Updates reply count

### ✅ Delete Posts
- Form POST with confirmation
- Owner-only (server-side check)
- Smooth removal animation

### ✅ Flash Messages
- Appear after form submissions
- Auto-dismiss with CSS animation
- Manual close button (one line JS)

## Performance Optimizations

### 1. CSS Containment
```css
.post-card {
  contain: layout style paint;
}
```

### 2. Efficient Animations
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 3. Lazy Loading Images
```html
<img loading="lazy" src="avatar.jpg" alt="User">
```

## Browser Compatibility

- **Dialog Element**: Supported in all modern browsers (2022+)
- **CSS Grid/Flexbox**: Universal support
- **CSS Animations**: Universal support
- **Form Validation**: Universal support
- **Web Share API**: Fallbacks gracefully

## Accessibility

- **Semantic HTML**: Proper use of `<dialog>`, `<form>`, `<button>`
- **ARIA labels**: On all interactive elements
- **Keyboard navigation**: Full support
- **Focus management**: Trapped in dialogs
- **Screen reader friendly**: Proper announcements

## Why This Approach?

1. **No JavaScript Framework**: Faster load times, smaller bundle
2. **Progressive Enhancement**: Works without JS (form still submits)
3. **Server-Side Rendering**: SEO friendly, works everywhere
4. **Maintainable**: Standard HTML/CSS patterns
5. **Accessible**: Native elements have built-in a11y
6. **Performant**: No runtime JavaScript execution

## Limitations & Tradeoffs

- ❌ Page refreshes on every action (but feels smooth with CSS)
- ❌ No real-time updates (use WebSockets if needed)
- ❌ More server requests than SPA approach
- ✅ But: Simpler codebase, better accessibility, works everywhere

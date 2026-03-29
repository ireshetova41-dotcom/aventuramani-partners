

## Plan: Replace favicon with uploaded logo

### Steps

1. Copy uploaded image to `public/favicon.png`
2. Delete existing `public/favicon.ico`
3. Update `index.html` to add `<link rel="icon" href="/favicon.png" type="image/png">`

### File changes

| File | Change |
|------|--------|
| `public/favicon.png` | New file (copied from upload) |
| `public/favicon.ico` | Delete |
| `index.html` | Add favicon link tag in `<head>` |


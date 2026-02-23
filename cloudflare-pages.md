# Cloudflare Pages Configuration

## Build Settings

Use these settings in your Cloudflare Pages dashboard:

- **Framework preset:** None
- **Build command:** (leave empty)
- **Build output directory:** /
- **Root directory:** (leave empty)

## Why No Build?

This is a static HTML/CSS/JS website. It doesn't require:
- No npm packages
- No build tools
- No compilation

The files are already production-ready!

## Files Deployed

Cloudflare will serve these files directly:
- index.html
- app.js
- styles.css
- data/clubs_index.json
- (and other static assets)

## Alternative: Use a Simple Build Command

If Cloudflare requires a build command, use:
```
echo "Static site - no build needed"
```

# Deployment Guide

## Files Required for Production

### Core Files (Required)
- index.html
- app.js
- styles.css
- data/clubs_index.json

### Optional Files
- map.html
- map.js

## Quick Deploy

Upload the 4 core files to any static web host.

## Deployment Options

### GitHub Pages
1. Push code to GitHub
2. Settings → Pages → Source: main branch
3. Live at: https://username.github.io/repo-name/

### Netlify
1. Create account at netlify.com
2. Import GitHub repository
3. Publish directory: /
4. Deploy

## Checklist

- [ ] Test locally first
- [ ] Verify data/clubs_index.json exists
- [ ] Check browser console for errors
- [ ] Test on mobile
- [ ] Verify GPS works
- [ ] Test autocomplete

## Custom Domain

1. Purchase domain
2. Configure DNS (CNAME or A record)
3. Enable HTTPS

## Updating Data

Run: python3 fetch_clubs.py
Upload new data/clubs_index.json

---

Ready to deploy!

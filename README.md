# CaddyCompare

**Compare membership costs & fees at 2,500+ UK golf clubs**

Your helpful caddy for finding and comparing golf club memberships across the UK. Features location-based search, detailed club information including membership fees, and an intuitive interface to help you find the perfect club.

## Features

- **Smart Search** - Type-ahead autocomplete for towns, counties, and postcodes
- **Location-Based** - Find the 20 nearest golf clubs from any UK location
- **GPS "Near Me"** - One-click access to nearby clubs using your device location
- **Regional Filters** - Filter by England, Scotland, Wales, or All UK
- **Detailed Club Info** - Websites, emails, facilities, membership details, and more
- **Cloudflare D1 Database** - Fast, scalable database with enhanced club data
- **Responsive Design** - Works beautifully on desktop, tablet, and mobile

## Data Coverage

- 2,544 Total Clubs
  - 1,808 clubs in England
  - 590 clubs in Scotland
  - 149 clubs in Wales
- 98% GPS Coverage - Nearly all clubs include coordinates
- Data Sources: England Golf API, Scottish Golf API, Wales Golf API

## Quick Start

### Running Locally

Start a local web server:
```bash
python3 -m http.server 8000
```

Open your browser to: http://localhost:8000/index.html

### Deploying to Production

The site is static - upload these files to any web host:
- index.html
- app.js
- styles.css
- data/clubs_index.json

## Project Structure

- index.html - Main application page
- app.js - Search logic & UI functionality
- styles.css - Modern, responsive styling
- data/clubs_index.json - Lightweight club database (429KB)
- fetch_clubs.py - Data fetching script (development)
- map.html & map.js - Optional map view feature

## Updating Club Data

To refresh the database:
```bash
python3 fetch_clubs.py
```

## Customization

### Adding Club Images

Add an image field to clubs in data/clubs_index.json:
```json
{
  "id": 102383,
  "name": "Example Golf Club",
  "image": "https://your-cdn.com/club-logo.jpg"
}
```

The site will use the image or fall back to a stock golf course photo.

## License

Data sourced from England Golf, Scottish Golf, and Wales Golf APIs.

---

TeeTime Finder - Making it easy to discover your next round of golf across the UK

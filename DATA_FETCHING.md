# Data Fetching Guide

The `fetch_clubs.py` script can fetch both basic and detailed club information.

## Basic Fetch (Fast)

Fetches just the essential data (name, location, contact):

```bash
python3 fetch_clubs.py
```

**Time:** ~5 seconds
**File size:** ~400-500 KB

## Detailed Fetch (Comprehensive)

Fetches additional data for each club including:
- Website URLs
- Email addresses
- Club descriptions
- Facilities information
- Course details (holes, par, length)
- Club images/logos
- Green fees
- Course types

```bash
python3 fetch_clubs.py --detailed
```

**Time:** ~20-30 minutes (2,547 clubs × API calls with delays)
**File size:** ~2-5 MB (depending on data availability)

## What Gets Added?

With `--detailed` flag, each club may include:

```json
{
  "id": 102383,
  "name": "Example Golf Club",
  "region": "england",
  "postcode": "SW1A 1AA",
  "latitude": 51.5,
  "longitude": -0.1,
  "address": "123 Golf Road",
  "phone": "020 1234 5678",
  
  // Additional detailed fields:
  "website": "https://www.examplegolfclub.com",
  "email": "info@examplegolfclub.com",
  "image": "https://cdn.example.com/logo.jpg",
  "description": "A beautiful 18-hole championship course...",
  "facilities": "Clubhouse, Pro Shop, Driving Range...",
  "holes": 18,
  "par": 72,
  "length": "6,500 yards",
  "course_type": "Parkland",
  "green_fee": "£45 weekday, £60 weekend"
}
```

## Usage in Your Website

Once you've fetched detailed data, your website will automatically:
- Display club logos/images instead of stock photos
- Show website links for each club
- Display course information
- Show facilities and descriptions

## Performance Considerations

### Basic Fetch
- ✅ Fast and lightweight
- ✅ Suitable for frequent updates
- ✅ Small file size for fast loading

### Detailed Fetch
- ⚠️ Takes 20-30 minutes
- ⚠️ Larger file size (but still acceptable)
- ✅ Much richer user experience
- ✅ Professional club presentation
- ℹ️ Includes rate limiting (0.5s delay between requests)

## Recommendations

**For initial setup:** Use detailed fetch to get all data once

**For regular updates:** Use basic fetch, then optionally fetch details for new/updated clubs

**Production:** The detailed data significantly improves the user experience and is worth the larger file size.

## Example Commands

```bash
# Quick basic fetch
python3 fetch_clubs.py

# Full detailed fetch (recommended for production)
python3 fetch_clubs.py --detailed

# Or use short flag
python3 fetch_clubs.py -d
```

## API Rate Limiting

The script includes a 0.5 second delay between detail requests to be respectful to the APIs. This means:
- 2,547 clubs × 0.5s = ~21 minutes total time
- Adjust in code if needed: `time.sleep(0.5)`

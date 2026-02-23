# Map View Setup

The map view feature (map.html and map.js) requires a Mapbox API token.

## Setup Instructions

1. Get a free Mapbox token:
   - Go to https://account.mapbox.com/
   - Sign up for a free account
   - Create a new access token

2. Add your token to map.js:
   - Open map.js
   - Replace 'YOUR_MAPBOX_TOKEN_HERE' with your actual token
   - Example: mapboxgl.accessToken = 'pk.eyJ1Ijoi...';

3. Test the map:
   - Open map.html in your browser
   - The map should load with golf club markers

## Security Note

Never commit your Mapbox token to public repositories!
- Keep it in a separate config file
- Use environment variables for production
- Or use the GitHub URL to allow the secret (one-time use)

## Free Tier Limits

Mapbox free tier includes:
- 50,000 map loads per month
- More than enough for most personal projects

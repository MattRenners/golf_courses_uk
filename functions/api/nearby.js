/**
 * Cloudflare Pages Function for finding nearby golf clubs
 * GET /api/nearby?lat=51.5074&lng=-0.1278&radius=10&limit=20
 */

// Haversine formula to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const lat = parseFloat(url.searchParams.get('lat'));
  const lng = parseFloat(url.searchParams.get('lng'));
  const radius = parseFloat(url.searchParams.get('radius') || '10'); // miles
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  if (isNaN(lat) || isNaN(lng)) {
    return new Response(JSON.stringify({
      error: 'Invalid coordinates. Please provide lat and lng parameters.'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Get clubs within a bounding box (faster than calculating distance for all)
    const latDelta = radius / 69; // Approximate miles per degree latitude
    const lngDelta = radius / (69 * Math.cos(lat * Math.PI / 180));
    
    const sql = `
      SELECT * FROM clubs 
      WHERE latitude BETWEEN ? AND ?
        AND longitude BETWEEN ? AND ?
    `;
    
    const { results } = await env.DB.prepare(sql)
      .bind(
        lat - latDelta,
        lat + latDelta,
        lng - lngDelta,
        lng + lngDelta
      )
      .all();
    
    // Calculate exact distances and filter by radius
    const clubsWithDistance = results
      .map(club => ({
        ...club,
        distance: calculateDistance(lat, lng, club.latitude, club.longitude)
      }))
      .filter(club => club.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
    
    return new Response(JSON.stringify({
      clubs: clubsWithDistance,
      count: clubsWithDistance.length,
      center: { lat, lng },
      radius
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

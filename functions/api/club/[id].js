// Cloudflare Pages Function - Get individual club details with facilities
export async function onRequestGet(context) {
  const { params, env } = context;
  const clubId = params.id;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // Get club details
    const clubQuery = 'SELECT * FROM clubs WHERE id = ?';
    const clubResult = await env.DB.prepare(clubQuery).bind(clubId).first();

    if (!clubResult) {
      return new Response(JSON.stringify({ error: 'Club not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Get facilities for this club
    const facilitiesQuery = `
      SELECT 
        ft.id,
        ft.name,
        ft.icon,
        ft.facility_group_id,
        ft.facility_group_name,
        cf.quantity,
        cf.is_available
      FROM club_facilities cf
      JOIN facility_types ft ON cf.facility_type_id = ft.id
      WHERE cf.club_id = ? AND cf.is_available = 1
      ORDER BY ft.facility_group_id, ft.name
    `;

    const facilitiesResult = await env.DB.prepare(facilitiesQuery).bind(clubId).all();

    // Group facilities by category
    const facilitiesByGroup = {};
    for (const facility of facilitiesResult.results || []) {
      const groupName = facility.facility_group_name || 'Other';
      if (!facilitiesByGroup[groupName]) {
        facilitiesByGroup[groupName] = [];
      }
      facilitiesByGroup[groupName].push({
        id: facility.id,
        name: facility.name,
        icon: facility.icon,
        quantity: facility.quantity
      });
    }

    const response = {
      club: clubResult,
      facilities: facilitiesByGroup,
      facilityCount: facilitiesResult.results?.length || 0
    };

    return new Response(JSON.stringify(response), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Database error',
      message: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

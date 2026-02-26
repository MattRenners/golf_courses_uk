/**
 * Cloudflare Pages Function for searching golf clubs
 * GET /api/clubs?q=search&region=england&limit=50
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const query = url.searchParams.get('q') || '';
  const region = url.searchParams.get('region') || '';
  const limit = parseInt(url.searchParams.get('limit') || '50');
  
  try {
    let sql = 'SELECT * FROM clubs WHERE 1=1';
    const params = [];
    
    if (query) {
      sql += ' AND (name LIKE ? OR town LIKE ? OR county LIKE ? OR postcode LIKE ?)';
      const searchPattern = `%${query}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    if (region) {
      sql += ' AND region = ?';
      params.push(region);
    }
    
    sql += ' ORDER BY name LIMIT ?';
    params.push(limit);
    
    const { results } = await env.DB.prepare(sql).bind(...params).all();
    
    return new Response(JSON.stringify({
      clubs: results,
      count: results.length
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

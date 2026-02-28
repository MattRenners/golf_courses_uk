// API endpoint to check if a club is claimed
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const clubId = url.searchParams.get('clubId');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (!clubId) {
    return new Response(JSON.stringify({ error: 'Club ID required' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    // Check if club is claimed
    const claim = await env.DB.prepare(
      'SELECT * FROM club_claims WHERE club_id = ? AND verified = 1'
    ).bind(clubId).first();

    // Get user from authorization header (if provided)
    const authHeader = request.headers.get('Authorization');
    let claimedByCurrentUser = false;
    
    if (claim && authHeader) {
      // Extract user ID from JWT token (Clerk)
      // In production, validate the token with Clerk
      const token = authHeader.replace('Bearer ', '');
      // For now, we'll just check if user ID matches
      // You'll need to properly validate the Clerk JWT token
      claimedByCurrentUser = false; // Implement proper check
    }

    return new Response(JSON.stringify({
      claimed: !!claim,
      verified: claim?.verified || false,
      claimedByCurrentUser,
      claimedAt: claim?.claimed_at
    }), {
      headers: corsHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// API endpoint to submit a club claim
export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();
    const { clubId, email, clerk_user_id } = body;

    if (!clubId || !email || !clerk_user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get club details to verify email domain
    const club = await env.DB.prepare('SELECT * FROM clubs WHERE id = ?')
      .bind(clubId)
      .first();

    if (!club) {
      return new Response(JSON.stringify({ error: 'Club not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Extract expected domain
    let expectedDomain = '';
    if (club.website) {
      try {
        expectedDomain = new URL(club.website).hostname.replace('www.', '');
      } catch (e) {
        // Invalid URL
      }
    }
    
    if (!expectedDomain && club.email) {
      expectedDomain = club.email.split('@')[1];
    }

    // Verify email domain
    const userDomain = email.split('@')[1];
    if (expectedDomain && !email.endsWith('@' + expectedDomain)) {
      return new Response(JSON.stringify({ 
        error: `Email must be from ${expectedDomain} domain` 
      }), {
        status: 403,
        headers: corsHeaders
      });
    }

    // Check if already claimed
    const existing = await env.DB.prepare(
      'SELECT * FROM club_claims WHERE club_id = ?'
    ).bind(clubId).first();

    if (existing) {
      return new Response(JSON.stringify({ 
        error: 'This club has already been claimed' 
      }), {
        status: 409,
        headers: corsHeaders
      });
    }

    // Create claim
    const verificationToken = Math.random().toString(36).substring(2, 15);
    
    await env.DB.prepare(`
      INSERT INTO club_claims (club_id, clerk_user_id, email, verified, verification_token)
      VALUES (?, ?, ?, 1, ?)
    `).bind(clubId, clerk_user_id, email, verificationToken).run();

    // In production, send verification email here
    // For now, we'll auto-verify

    return new Response(JSON.stringify({
      success: true,
      message: 'Club claimed successfully'
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

// Handle OPTIONS for CORS
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

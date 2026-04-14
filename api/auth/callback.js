/**
 * Vercel Serverless Function — Google OAuth callback.
 *
 * Flow:
 * 1. Google redirects here with an authorization `code`
 * 2. We exchange the code for tokens (server-side, secrets never exposed)
 * 3. We redirect back to the SPA with the Google ID token
 * 4. The SPA calls Supabase's signInWithIdToken to create a session
 */
export default async function handler(req, res) {
  const { code, state, error: oauthError } = req.query;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const origin = `${protocol}://${host}`;

  // Handle OAuth errors from Google (user denied, etc.)
  if (oauthError) {
    return res.redirect(302, `${origin}/login?auth_error=${encodeURIComponent(oauthError)}`);
  }

  if (!code) {
    return res.redirect(302, `${origin}/login?auth_error=missing_code`);
  }

  // Verify CSRF state against the cookie set in /api/auth/google
  const cookies = parseCookies(req.headers.cookie || '');
  if (!state || state !== cookies.oauth_state) {
    return res.redirect(302, `${origin}/login?auth_error=invalid_state`);
  }

  // Clear the state cookie
  res.setHeader(
    'Set-Cookie',
    'oauth_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/'
  );

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/callback`;

  if (!clientId || !clientSecret) {
    return res.redirect(302, `${origin}/login?auth_error=server_misconfigured`);
  }

  try {
    // Exchange authorization code for Google tokens (server-side)
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();

    if (tokens.error || !tokens.id_token) {
      console.error('[OAuth Callback] Token exchange failed:', tokens.error);
      return res.redirect(302, `${origin}/login?auth_error=token_exchange_failed`);
    }

    // Redirect back to the SPA with the ID token.
    // The AuthProvider will use signInWithIdToken to create a Supabase session.
    return res.redirect(
      302,
      `${origin}/login?google_id_token=${encodeURIComponent(tokens.id_token)}`
    );
  } catch (err) {
    console.error('[OAuth Callback] Error:', err);
    return res.redirect(302, `${origin}/login?auth_error=server_error`);
  }
}

function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) cookies[name] = rest.join('=');
  });
  return cookies;
}

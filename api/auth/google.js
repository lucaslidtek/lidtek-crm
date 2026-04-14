import { randomBytes } from 'crypto';

/**
 * Vercel Serverless Function — Initiates Google OAuth flow.
 *
 * By handling OAuth from our own domain (instead of Supabase),
 * Google's consent screen shows our Vercel URL instead of the
 * ugly `hwtxotbpdqyjymfnpopw.supabase.co` hash.
 */
export default function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' });
  }

  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const redirectUri = `${protocol}://${host}/api/auth/callback`;

  // CSRF protection: random state stored in a secure cookie
  const state = randomBytes(16).toString('hex');
  res.setHeader(
    'Set-Cookie',
    `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`
  );

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state,
  });

  res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

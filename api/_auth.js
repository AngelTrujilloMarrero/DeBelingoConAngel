import admin from 'firebase-admin';

if (!admin.apps.length) {
  console.log('🔥 Initializing Firebase Admin for project:', process.env.FIREBASE_PROJECT_ID);
  if (!process.env.FIREBASE_DATABASE_URL) {
    console.warn('⚠️ FIREBASE_DATABASE_URL is missing, using fallback. This might cause timeouts.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app'
  });
}

/**
 * Verifies security credentials
 * Can use Cloudflare Turnstile (priority for expensive AI/Upload)
 * Or an Internal Secret Key (for background queries like geocoding/aemet)
 */
export async function verifySecurity(req) {
  const turnstileToken = req.headers['x-turnstile-token'];
  const internalKey = req.headers['x-app-internal-key'];

  // Check Internal Key first (used for non-billable background tasks)
  if (internalKey && internalKey === process.env.APP_INTERNAL_SECRET) {
    return { claims: { internal: true }, error: null };
  }

  if (!turnstileToken) {
    return { error: 'Unauthorized: No valid credentials provided', status: 401 };
  }

  // Validar por Cloudflare Turnstile
  try {
    const CLOUDFLARE_SECRET = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';

    const formData = new URLSearchParams();
    formData.append('secret', CLOUDFLARE_SECRET);
    formData.append('response', turnstileToken);
    formData.append('remoteip', req.headers['x-forwarded-for'] || req.socket.remoteAddress);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: formData,
      method: 'POST',
    });

    const outcome = await result.json();
    if (outcome.success) {
      return { claims: { turnstile: true }, error: null };
    }

    const errorCodes = outcome['error-codes'] ? outcome['error-codes'].join(', ') : 'unknown';
    console.error('Turnstile verification failed:', errorCodes);
    return { error: 'Unauthorized: Security check failed', status: 401 };
  } catch (err) {
    console.error('Security verification error:', err.message);
    return { error: 'Internal Security Error', status: 401 };
  }
}



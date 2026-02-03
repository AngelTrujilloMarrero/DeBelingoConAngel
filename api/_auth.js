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
 * Verifies security credentials (Turnstile)
 */
export async function verifySecurity(req) {
  const turnstileToken = req.headers['x-turnstile-token'];

  // Validar por Cloudflare Turnstile (MÉTODO ÚNICO Y PRIORITARIO)
  if (turnstileToken) {
    try {
      const CLOUDFLARE_SECRET = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA'; // Test key

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
      console.error('Turnstile verification failed:', outcome['error-codes']);
    } catch (err) {
      console.error('Turnstile error:', err.message);
    }
  }

  return { error: 'Unauthorized: Missing or invalid security credentials', status: 401 };
}

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
 * Verifies security credentials (Turnstile, App Check, or Shared Secret)
 */
export async function verifyAppCheck(req) {
  const turnstileToken = req.headers['x-turnstile-token'];
  const appCheckToken = req.headers['x-firebase-appcheck'];
  const internalSecret = req.headers['x-debelingo-secret'];

  // 1. Validar por Secreto Interno (Método de emergencia/alternativo)
  const masterSecret = process.env.INTERNAL_API_SECRET || 'debelingo-super-secret-2026';
  if (internalSecret && internalSecret === masterSecret) {
    return { claims: { internal: true }, error: null };
  }

  // 2. Validar por Cloudflare Turnstile (NUEVO MÉTODO PRIORITARIO)
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

  // 3. Validar por App Check (Legacy/Backup)
  if (appCheckToken) {
    try {
      const appCheckClaims = await admin.appCheck().verifyToken(appCheckToken);
      return { claims: appCheckClaims, error: null };
    } catch (err) {
      console.error('App Check verification failed:', err.message);
    }
  }

  return { error: 'Unauthorized: Missing or invalid security credentials', status: 401 };
}

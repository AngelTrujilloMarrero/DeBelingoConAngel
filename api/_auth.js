import admin from 'firebase-admin';

if (!admin.apps.length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Limpieza de formato para Vercel
    privateKey = privateKey.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n');

    // Autorreparación PEM (por si se pegó sin saltos de línea)
    if (!privateKey.includes('\n') && privateKey.length > 100) {
      const body = privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
      const lines = body.match(/.{1,64}/g) || [];
      privateKey = ['-----BEGIN PRIVATE KEY-----', ...lines, '-----END PRIVATE KEY-----', ''].join('\n');
    }
  }

  // Forzamos la URL de Europa si la de Vercel está mal o falta
  const rawUrl = process.env.FIREBASE_DATABASE_URL || '';
  const dbUrl = (rawUrl.includes('firebaseio.com') || !rawUrl)
    ? 'https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app'
    : rawUrl;

  console.log('🔥 Initializing Firebase Admin...');
  console.log('📍 Project:', process.env.FIREBASE_PROJECT_ID);
  console.log('🌐 Region: Europe (forced)');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'debelingoconangel',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    databaseURL: dbUrl
  });
}

export async function verifySecurity(req) {
  // ... (mismo código de verifySecurity que ya tenías)
  const turnstileToken = req.headers['x-turnstile-token'];
  const internalKey = req.headers['x-app-internal-key'];

  if (internalKey && internalKey === process.env.APP_INTERNAL_SECRET) {
    return { claims: { internal: true }, error: null };
  }

  if (!turnstileToken) {
    return { error: 'Unauthorized: No valid credentials provided', status: 401 };
  }

  try {
    const CLOUDFLARE_SECRET = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
    const formData = new URLSearchParams();
    formData.append('secret', CLOUDFLARE_SECRET);
    formData.append('response', turnstileToken);
    formData.append('remoteip', req.headers['x-forwarded-for'] || req.socket.remoteAddress);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: formData,
      method: 'POST'
    });

    const outcome = await result.json();
    if (outcome.success) return { claims: { turnstile: true }, error: null };

    return { error: 'Unauthorized: Security check failed', status: 401 };
  } catch (err) {
    console.error('Security verification error:', err.message);
    return { error: 'Internal Security Error', status: 401 };
  }
}

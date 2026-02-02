import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
  });
}

export async function verifyAppCheck(req) {
  const appCheckToken = req.headers['x-firebase-appcheck'];

  if (!appCheckToken) {
    return { error: 'App Check token missing', status: 401 };
  }

  try {
    const appCheckClaims = await admin.appCheck().verifyToken(appCheckToken);
    return { claims: appCheckClaims, error: null };
  } catch (err) {
    console.error('App Check verification failed. Error details:', err);
    // Log if the error is related to project mismatch or key issues
    if (err.code === 'app-check/invalid-argument') {
      console.error('App Check error: Invalid argument. Check if FIREBASE_PROJECT_ID is correct.');
    }
    return { error: `Invalid App Check token: ${err.message}`, status: 401 };
  }
}

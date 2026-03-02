import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app'
  });
}

const db = admin.database();

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const trashedRef = db.ref('trashedEvents');
    const snapshot = await trashedRef.once('value');
    
    const now = new Date();
    const trashedEvents = snapshot.val() || {};
    const keysToDelete = [];

    Object.entries(trashedEvents).forEach(([key, trashedEvent]) => {
      if (trashedEvent.expiresAt) {
        const expiresAt = new Date(trashedEvent.expiresAt);
        if (expiresAt < now) {
          keysToDelete.push(key);
        }
      }
    });

    if (keysToDelete.length > 0) {
      const deletePromises = keysToDelete.map(key => 
        trashedRef.child(key).remove()
      );
      await Promise.all(deletePromises);
      console.log(`Eliminados ${keysToDelete.length} eventos expirados de la papelera`);
    }

    res.json({
      success: true,
      deletedCount: keysToDelete.length,
      cleanedAt: now.toISOString()
    });
  } catch (error) {
    console.error('Error en limpieza:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

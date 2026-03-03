import admin from 'firebase-admin';

// Nombre único para evitar colisiones con otros procesos de Vercel
const APP_NAME = 'cleanup_deletions_app';

function getFirebaseApp() {
    const existingApp = admin.apps.find(app => app.name === APP_NAME);
    if (existingApp) return existingApp;

    let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY;
    if (privateKey) {
        privateKey = privateKey.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n');
        if (!privateKey.includes('\n')) {
            const body = privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
            const lines = body.match(/.{1,64}/g) || [];
            privateKey = ['-----BEGIN PRIVATE KEY-----', ...lines, '-----END PRIVATE KEY-----', ''].join('\n');
        }
    }

    const dbUrl = process.env.FIREBASE_DATABASE_URL ||
        process.env.VITE_FIREBASE_DATABASE_URL ||
        'https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app';

    return admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'debelingoconangel',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
        databaseURL: dbUrl
    }, APP_NAME);
}

export default async function handler(req, res) {
    try {
        const app = getFirebaseApp();
        const db = app.database();
        const deletionsRef = db.ref('eventDeletions');

        const snapshot = await Promise.race([
            deletionsRef.once('value'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase Connection Timeout')), 25000))
        ]);

        const data = snapshot.val() || {};
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - 40);

        const keysToDelete = Object.entries(data)
            .filter(([_, value]) => value.deletedAt && new Date(value.deletedAt) < thresholdDate)
            .map(([key]) => key);

        if (keysToDelete.length > 0) {
            const updates = {};
            keysToDelete.forEach(key => { updates[key] = null; });
            await deletionsRef.update(updates);
        }

        return res.status(200).json({
            success: true,
            deletedCount: keysToDelete.length
        });
    } catch (error) {
        console.error('[Cleanup Error]:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

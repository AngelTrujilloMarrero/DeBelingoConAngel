import admin from 'firebase-admin';

// Función para inicializar Firebase de forma segura
function getFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY;
    if (privateKey) {
        privateKey = privateKey.replace(/^"|"$/g, '');
        privateKey = privateKey.replace(/\\n/g, '\n');
        if (!privateKey.includes('\n')) {
            privateKey = privateKey.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
            privateKey = privateKey.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
        }
    }

    const dbUrl = process.env.FIREBASE_DATABASE_URL ||
        process.env.VITE_FIREBASE_DATABASE_URL ||
        'https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app';

    console.log('[Firebase Init] URL:', dbUrl);

    return admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'debelingoconangel',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
        databaseURL: dbUrl
    });
}

export default async function handler(req, res) {
    console.log('[Cron] Iniciando limpieza...');

    try {
        const app = getFirebaseAdmin();
        const db = app.database();
        const deletionsRef = db.ref('eventDeletions');

        // Timeout de 20s para la consulta
        const snapshot = await Promise.race([
            deletionsRef.once('value'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase Timeout')), 20000))
        ]);

        const data = snapshot.val() || {};
        const now = new Date();
        const thresholdDate = new Date();
        thresholdDate.setDate(now.getDate() - 400);

        const keysToDelete = [];
        Object.entries(data).forEach(([key, value]) => {
            if (value.deletedAt) {
                const deletedAt = new Date(value.deletedAt);
                if (deletedAt < thresholdDate) {
                    keysToDelete.push(key);
                }
            }
        });

        if (keysToDelete.length > 0) {
            const updates = {};
            keysToDelete.forEach(key => { updates[key] = null; });
            await deletionsRef.update(updates);
            console.log(`[Cron] Éxito: ${keysToDelete.length} borrados.`);
        }

        return res.status(200).json({
            success: true,
            deletedCount: keysToDelete.length,
            dbUrl: deletionsRef.toString() // Esto confirmará en el JSON qué URL se usó
        });
    } catch (error) {
        console.error('[Cron Error]:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

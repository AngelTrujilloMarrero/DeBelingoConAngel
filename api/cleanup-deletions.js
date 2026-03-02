import admin from 'firebase-admin';

if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
        privateKey = privateKey.replace(/^"|"$/g, '');
        privateKey = privateKey.replace(/\\n/g, '\n');
        if (!privateKey.includes('\n')) {
            privateKey = privateKey.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
            privateKey = privateKey.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
        }
    }

    // Priorizar la URL de Europa que sabemos que es la correcta
    const dbUrl = process.env.FIREBASE_DATABASE_URL ||
        process.env.VITE_FIREBASE_DATABASE_URL ||
        'https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app';

    console.log('[Init] Usando Database URL:', dbUrl);

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'debelingoconangel',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
        databaseURL: dbUrl
    });
}

const db = admin.database();

export default async function handler(req, res) {
    console.log('[Cron] Iniciando limpieza de eliminaciones antiguas...');

    try {
        const deletionsRef = db.ref('eventDeletions');

        // Configurar un timeout manual para la consulta a Firebase
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firebase query timeout')), 25000)
        );

        const snapshot = await Promise.race([
            deletionsRef.once('value'),
            timeoutPromise
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
            keysToDelete.forEach(key => {
                updates[key] = null;
            });
            await deletionsRef.update(updates);
            console.log(`[Cron] Éxito: ${keysToDelete.length} registros eliminados.`);
        } else {
            console.log('[Cron] No hay registros antiguos para eliminar.');
        }

        return res.status(200).json({
            success: true,
            deletedCount: keysToDelete.length,
            thresholdDate: thresholdDate.toISOString()
        });
    } catch (error) {
        console.error('[Cron Error]:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

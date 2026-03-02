import admin from 'firebase-admin';

if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
        // Si la clave viene envuelta en comillas dobles innecesarias por error de pegado
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.substring(1, privateKey.length - 1);
        }
        // Reemplazar saltos de línea de texto por reales
        privateKey = privateKey.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app'
    });
}

const db = admin.database();

/**
 * Endpoint para limpieza automática de historial de eliminaciones (eventDeletions)
 * Borra registros con más de 400 días de antigüedad.
 */
export default async function handler(req, res) {
    // Opcional: Validar que la petición venga de Vercel Cron
    // En producción Vercel añade la cabecera 'x-vercel-cron': '1'

    try {
        const deletionsRef = db.ref('eventDeletions');
        // Para eficiencia con muchos datos, podríamos usar query de Firebase, 
        // pero eventDeletions no suele ser masivo comparado con otros nodos.
        const snapshot = await deletionsRef.once('value');
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
            console.log(`[Cron] Limpieza completada: ${keysToDelete.length} registros antiguos eliminados.`);
        }

        return res.status(200).json({
            success: true,
            deletedCount: keysToDelete.length,
            thresholdDate: thresholdDate.toISOString(),
            action: 'cleanup-event-deletions'
        });
    } catch (error) {
        console.error('[Cron Error] cleanup-deletions:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

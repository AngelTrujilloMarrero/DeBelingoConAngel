import admin from 'firebase-admin';

const APP_NAME = 'cleanup_analytics_app';

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
        const analyticsRef = db.ref('analytics/visits');
        const statsRef = db.ref('Estadisticas');

        const snapshot = await Promise.race([
            analyticsRef.once('value'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase Connection Timeout')), 25000))
        ]);

        const data = snapshot.val() || {};
        
        // Determinar el mes anterior
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthName = `${String(lastMonth.getMonth() + 1).padStart(2, '0')}-${lastMonth.getFullYear()}`;
        
        // Calcular el rango de timestamps del mes anterior
        const startOfLastMonth = lastMonth.getTime();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        
        // Filtrar visitas del mes anterior y contar
        const monthKeys = Object.entries(data)
            .filter(([_, value]) => value.timestamp && value.timestamp >= startOfLastMonth && value.timestamp < endOfLastMonth)
            .map(([key]) => key);
        
        const totalVisits = monthKeys.length;
        
        // Guardar estadísticas del mes anterior antes de borrar
        if (totalVisits > 0) {
            await statsRef.child(lastMonthName).set({
                visitas: totalVisits,
                mes: lastMonthName,
                guardadoEl: new Date().toISOString()
            });
            console.log(`Guardadas ${totalVisits} visitas en Estadisticas/${lastMonthName}`);
        }
        
        // El usuario quiere que el 1 de cada mes se borren los datos.
        // Si ejecutamos esto el día 1, borramos todo lo anterior al inicio de hoy.
        const thresholdDate = new Date();
        thresholdDate.setHours(0, 0, 0, 0);
        const thresholdMs = thresholdDate.getTime();

        const keysToDelete = Object.entries(data)
            .filter(([_, value]) => !value.timestamp || value.timestamp < thresholdMs)
            .map(([key]) => key);

        if (keysToDelete.length > 0) {
            const updates = {};
            keysToDelete.forEach(key => { updates[key] = null; });
            await analyticsRef.update(updates);
        }

        return res.status(200).json({
            success: true,
            deletedCount: keysToDelete.length,
            savedStats: { mes: lastMonthName, visitas: totalVisits },
            cutoffDate: thresholdDate.toISOString()
        });
    } catch (error) {
        console.error('[Cleanup Analytics Error]:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

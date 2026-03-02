import admin from 'firebase-admin';

export default async function handler(req, res) {
    const diagnostics = {
        env_keys: Object.keys(process.env).filter(k => k.includes('FIREBASE') || k.includes('VITE')),
        projectId: process.env.FIREBASE_PROJECT_ID || 'missing',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'present' : 'MISSING',
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? `present (length: ${process.env.FIREBASE_PRIVATE_KEY.length})` : 'MISSING',
        databaseUrl: process.env.FIREBASE_DATABASE_URL || 'missing',
    };

    console.log('[Diag] Environment Check:', diagnostics);

    try {
        // Intentar inicialización mínima para testeo
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID || 'debelingoconangel',
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
                }),
                databaseURL: 'https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app'
            });
        }

        const db = admin.database();
        // Test rápido de lectura (1 nodo pequeño)
        const test = await Promise.race([
            db.ref('.info/connected').once('value'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Firebase')), 5000))
        ]);

        return res.status(200).json({
            status: 'success',
            connected: test.val(),
            diagnostics
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message,
            diagnostics
        });
    }
}

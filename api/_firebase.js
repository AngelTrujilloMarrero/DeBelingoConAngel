import admin from 'firebase-admin';

const APP_NAME = 'debelingo_api_app';

export function getFirebaseApp() {
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

export function getDb() {
    return getFirebaseApp().database();
}

export async function getEvents() {
    const snapshot = await getDb().ref('events').once('value');
    const data = snapshot.val() || {};
    return Object.entries(data).map(([key, value]) => ({ id: key, ...value }));
}

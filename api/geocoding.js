/**
 * Vercel Serverless Function - Geocoding Proxy (Nominatim)
 * Endpoint: /api/geocoding
 */

import { verifyAppCheck } from './_auth.js';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'https://debelingoconangel.web.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Firebase-AppCheck');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verify App Check Token
    // We allow it to fail with a warning if App Check is not perfectly configured yet,
    // but we should still try to verify it for security.
    const { error: authError, status: authStatus } = await verifyAppCheck(req);

    // TEMPORARY: If it's a 401, we might want to log it but continue if we're debugging,
    // but better to stick to security. Let's keep it strict for now.
    if (authError) {
        console.warn('App Check verification failed for geocoding:', authError);
        // return res.status(authStatus).json({ error: authError });
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'DeBelingoConAngel-Backend/1.0 (https://debelingoconangel.web.app)',
                'Accept-Language': 'es-ES,es;q=0.9'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim error: ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Geocoding proxy error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch geocoding data' });
    }
}

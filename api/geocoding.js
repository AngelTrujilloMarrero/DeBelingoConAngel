/**
 * Vercel Serverless Function - Geocoding Proxy (Nominatim)
 * Endpoint: /api/geocoding
 */

import { verifySecurity } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
    // Set CORS headers
    const origin = req.headers.origin;
    const allowedOrigins = [
        'https://debelingoconangel.web.app',
        'https://de-belingo-con-angel.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ];

    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', 'https://debelingoconangel.web.app');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-debelingo-secret, x-turnstile-token');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verify Security Token
    const { error: authError, status: authStatus } = await verifySecurity(req);
    if (authError) {
        return res.status(authStatus).json({ error: authError });
    }

    // Rate Limit: 300 requests per hour globally
    const { allowed, error: rateError } = await checkRateLimit('geocoding', 300, 60 * 60 * 1000);
    if (!allowed) {
        return res.status(429).json({ error: rateError });
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

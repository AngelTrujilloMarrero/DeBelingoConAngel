/**
 * Vercel Serverless Function - Geocoding Proxy (Nominatim)
 * Endpoint: /api/geocoding
 */

import { verifySecurity } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';
import { applySecurityHeaders } from './_cors.js';

export default async function handler(req, res) {
    // Apply Security Headers & CORS
    if (applySecurityHeaders(req, res)) return;

    // Verify Security removed for public Geocoding Proxy to avoid race conditions with Turnstile
    // IP Rate Limiting is sufficient for this public endpoint
    // const { error: authError, status: authStatus } = await verifySecurity(req);
    // if (authError) {
    //     return res.status(authStatus).json({ error: authError });
    // }

    // Rate Limit: 300 requests per hour globally
    const { allowed, error: rateError } = await checkRateLimit('geocoding', 300, 60 * 60 * 1000);
    if (!allowed) {
        return res.status(429).json({ error: rateError });
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let { q } = req.query;

    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Invalid search query' });
    }

    // Sanitization: Limit length and allowed characters (alphanumeric, spaces, commas, hyphens)
    q = q.substring(0, 100).replace(/[^\w\s,áéíóúÁÉÍÓÚñÑ-]/g, '');

    if (q.length < 3) {
        return res.status(400).json({ error: 'Search query too short' });
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
            throw new Error(`External API error: ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Geocoding error:', error.message);
        res.status(500).json({ error: 'Service temporarily unavailable' });
    }
}

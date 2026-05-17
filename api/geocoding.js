/**
 * Vercel Serverless Function - Geocoding Proxy (Nominatim)
 * Endpoint: /api/geocoding
 */

import { checkRateLimit } from './_rateLimit.js';
import { applySecurityHeaders } from './_cors.js';

export default async function handler(req, res) {
    if (applySecurityHeaders(req, res)) return;

    const { allowed, error: rateError } = await checkRateLimit('geocoding', 300, 60 * 60 * 1000);
    if (!allowed) return res.status(429).json({ error: rateError });

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    let { q } = req.query;
    if (!q || typeof q !== 'string') return res.status(400).json({ error: 'Invalid search query' });

    q = q.substring(0, 100).replace(/[^\w\s,áéíóúÁÉÍÓÚñÑ-]/g, '');

    if (q.length < 3) return res.status(400).json({ error: 'Search query too short' });

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'DeBelingoConAngel/1.0 (https://debelingoconangel.web.app)',
                'Accept-Language': 'es-ES,es;q=0.9'
            }
        });

        if (!response.ok) throw new Error(`Nominatim error: ${response.status}`);

        const data = await response.json();
        if (data && data.length > 0) return res.status(200).json(data);
        res.status(404).json({ error: 'No results found' });
    } catch (error) {
        console.error('Geocoding error:', error.message);
        res.status(500).json({ error: 'Service temporarily unavailable' });
    }
}

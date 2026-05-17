/**
 * Vercel Serverless Function - Geocoding Proxy (Photon + Nominatim fallback)
 * Endpoint: /api/geocoding
 */

import { verifySecurity } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';
import { applySecurityHeaders } from './_cors.js';

async function fetchPhoton(query) {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'DeBelingoConAngel-Backend/1.0',
            'Accept-Language': 'es-ES,es;q=0.9'
        }
    });
    if (!response.ok) throw new Error(`Photon error: ${response.status}`);
    const data = await response.json();
    if (data.features && data.features.length > 0) {
        const props = data.features[0].properties;
        const coords = data.features[0].geometry.coordinates;
        return [{
            lat: coords[1],
            lon: coords[0],
            display_name: [props.name, props.street, props.city, props.country].filter(Boolean).join(', ')
        }];
    }
    return null;
}

async function fetchNominatim(query) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=es`;
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'DeBelingoConAngel-Backend/1.0 (https://debelingoconangel.web.app)',
            'Accept-Language': 'es-ES,es;q=0.9'
        }
    });
    if (!response.ok) throw new Error(`Nominatim error: ${response.status}`);
    return response.json();
}

export default async function handler(req, res) {
    if (applySecurityHeaders(req, res)) return;

    const { allowed, error: rateError } = await checkRateLimit('geocoding', 300, 60 * 60 * 1000);
    if (!allowed) {
        return res.status(429).json({ error: rateError });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let { q } = req.query;

    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Invalid search query' });
    }

    q = q.substring(0, 100).replace(/[^\w\s,áéíóúÁÉÍÓÚñÑ-]/g, '');

    if (q.length < 3) {
        return res.status(400).json({ error: 'Search query too short' });
    }

    const query = `${q}, Tenerife, España`;

    try {
        const photonResult = await fetchPhoton(query);
        if (photonResult && photonResult.length > 0) {
            return res.status(200).json(photonResult);
        }

        const nominatimResult = await fetchNominatim(query);
        if (nominatimResult && nominatimResult.length > 0) {
            return res.status(200).json(nominatimResult);
        }

        res.status(404).json({ error: 'No results found' });
    } catch (error) {
        console.error('Geocoding error:', error.message);

        try {
            const fallback = await fetchNominatim(query);
            return res.status(200).json(fallback);
        } catch {
            res.status(500).json({ error: 'Service temporarily unavailable' });
        }
    }
}

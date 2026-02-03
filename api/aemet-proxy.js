/**
 * Vercel Serverless Function - AEMET Proxy
 * Endpoint: /api/aemet-proxy
 * 
 * Fetches RSS feed from AEMET to avoid CORS issues on frontend
 */

import { verifySecurity } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'https://debelingoconangel.web.app',
        'https://debe-lingo-con-angel.web.app',
        'https://de-belingo-con-angel.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ];

    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        // Fallback al dominio principal si no hay origen o no coincide
        res.setHeader('Access-Control-Allow-Origin', 'https://debelingoconangel.web.app');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

    // Rate Limit: 500 requests per hour globally
    const { allowed, error: rateError } = await checkRateLimit('aemet', 500, 60 * 60 * 1000);
    if (!allowed) {
        return res.status(429).json({ error: rateError });
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const response = await fetch('https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/rss/CAP_AFAP6596_RSS.xml');

        if (!response.ok) {
            throw new Error(`AEMET fetch error: ${response.status}`);
        }

        const xmlText = await response.text();

        // AEMET returns XML, set correct Content-Type
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.status(200).send(xmlText);
    } catch (error) {
        console.error('AEMET proxy error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch AEMET data' });
    }
}

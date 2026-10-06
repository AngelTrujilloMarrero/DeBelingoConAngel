/**
 * Vercel Serverless Function - AEMET Proxy
 * Endpoint: /api/aemet-proxy
 * 
 * Fetches RSS feed from AEMET to avoid CORS issues on frontend
 */

import { verifySecurity } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';

import { applySecurityHeaders } from './_cors.js';

export default async function handler(req, res) {
    // Apply Security Headers & CORS
    if (applySecurityHeaders(req, res)) return;


    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verify Security removed for public AEMET Proxy to avoid race conditions with Turnstile
    // Rate Limiting is sufficient for this public fetching endpoint
    // const { error: authError, status: authStatus } = await verifySecurity(req);
    // if (authError) {
    //     return res.status(authStatus).json({ error: authError });
    // }



    // 1. Rate Limit Global: 500 requests per hour
    const { allowed: globalAllowed, error: globalError } = await checkRateLimit('aemet_global', 500, 60 * 60 * 1000);
    if (!globalAllowed) {
        return res.status(429).json({ error: globalError });
    }

    // 2. Rate Limit por IP: 30 requests per hour per user
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const { allowed: userAllowed, error: userError } = await checkRateLimit(`aemet_user:${clientIp}`, 30, 60 * 60 * 1000);
    if (!userAllowed) {
        return res.status(429).json({ error: 'Has consultado el tiempo demasiadas veces. Espera una hora.' });
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const response = await fetch('https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/rss/CAP_AFAP6596_RSS.xml');

        if (!response.ok) {
            throw new Error(`External API error: ${response.status}`);
        }

        const xmlText = await response.text();

        // AEMET returns XML, set correct Content-Type
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.status(200).send(xmlText);
    } catch (error) {
        console.error('AEMET proxy error:', error.message);
        res.status(500).json({ error: 'Service temporarily unavailable' });
    }
}


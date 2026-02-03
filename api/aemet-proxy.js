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

    // Verify Security (Turnstile or Internal Key)
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


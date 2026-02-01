/**
 * Vercel Serverless Function - AEMET Proxy
 * Endpoint: /api/aemet-proxy
 * 
 * Fetches RSS feed from AEMET to avoid CORS issues on frontend
 */

export default async function handler(req, res) {
    // Set CORS headers to allow requests from any origin (including Firebase Hosting)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
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

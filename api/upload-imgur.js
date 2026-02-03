/**
 * Vercel Serverless Function - Upload to Imgur
 * Endpoint: /api/upload-imgur
 * 
 * Called from Firebase Hosting frontend
 */

import { verifySecurity } from './_auth.js';
import { applySecurityHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

/**
 * Validates image magic numbers (signatures) for common formats
 */
function isValidImageSignature(base64Data) {
    if (!base64Data || typeof base64Data !== 'string') return false;

    // Remove data:image/...;base64, prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

    // Get first 16 bytes/characters to check signature
    const header = cleanBase64.substring(0, 32);

    // Common Image Signatures in Base64
    // JPEG starts with '/9j/'
    // PNG starts with 'iVBORw0KGgo'
    // GIF starts with 'R0lGOD'
    // WEBP starts with 'UklGR'
    const validSignatures = ['/9j/', 'iVBORw0KGgo', 'R0lGODhl', 'R0lGODdh', 'UklGR'];

    return validSignatures.some(sig => header.startsWith(sig));
}


export default async function handler(req, res) {
    // Apply Security Headers & CORS
    if (applySecurityHeaders(req, res)) return;

    // Verify Security Token
    const { error: authError, status: authStatus } = await verifySecurity(req);
    if (authError) {
        return res.status(authStatus).json({ error: authError });
    }

    // Rate Limit por IP: 10 imágenes por hora por usuario
    const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const { allowed: ipAllowed, error: ipError } = await checkRateLimit(`upload-imgur:${userIP}`, 10, 60 * 60 * 1000);
    if (!ipAllowed) {
        return res.status(429).json({ error: 'Has subido demasiadas imágenes a Imgur. Inténtalo más tarde.' });
    }


    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'Image data is required' });
        }

        // Magic Number Verification
        if (!isValidImageSignature(image)) {
            console.warn('⚠️ Rejected upload: Invalid image signature');
            return res.status(400).json({ error: 'Invalid image format. Only JPG, PNG, GIF and WEBP are allowed.' });
        }


        // Get Client IDs from environment variable (configured in Vercel)
        const IMGUR_CLIENT_IDS = process.env.IMGUR_CLIENT_IDS;

        if (!IMGUR_CLIENT_IDS) {
            console.error('Imgur client IDs not configured');
            return res.status(500).json({ error: 'Service not configured' });
        }

        const clientIds = IMGUR_CLIENT_IDS.split(',').map(id => id.trim());
        let lastError = null;

        // Try multiple client IDs for rate limit protection
        for (let i = 0; i < clientIds.length; i++) {
            const clientId = clientIds[i];

            try {
                const formData = new FormData();
                formData.append('image', image);
                formData.append('type', 'base64');

                const response = await fetch('https://api.imgur.com/3/image', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Client-ID ${clientId}`,
                        'Accept': 'application/json'
                    },
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();

                    // Check for NSFW content
                    if (result.data.nsfw) {
                        return res.status(400).json({
                            success: false,
                            error: 'Content not appropriate'
                        });
                    }

                    return res.status(200).json({
                        success: true,
                        url: result.data.link,
                        deleteHash: result.data.deletehash,
                        data: {
                            width: result.data.width,
                            height: result.data.height,
                            size: result.data.size
                        }
                    });
                } else if (response.status === 429) {
                    // Rate limited, try next client ID
                    console.log(`Client ID ${i + 1} rate limited, trying next...`);
                    lastError = new Error('Rate limited');
                    continue;
                } else {
                    const errorText = await response.text();
                    lastError = new Error(`Upload failed with status ${response.status}: ${errorText}`);
                }
            } catch (error) {
                console.error(`Client ID ${i + 1} failed:`, error);
                lastError = error;
            }
        }

        throw lastError || new Error('All Imgur client IDs failed');
    } catch (error) {
        console.error('Imgur upload error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to upload image'
        });
    }
}

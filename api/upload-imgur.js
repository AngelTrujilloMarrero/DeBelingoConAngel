/**
 * Vercel Serverless Function - Upload to Imgur
 * Endpoint: /api/upload-imgur
 * 
 * Called from Firebase Hosting frontend
 */

import { verifySecurity } from './_auth.js';
import { applySecurityHeaders } from './_cors.js';

export default async function handler(req, res) {
    // Apply Security Headers & CORS
    if (applySecurityHeaders(req, res)) return;

    // Verify Security Token
    const { error: authError, status: authStatus } = await verifySecurity(req);
    if (authError) {
        return res.status(authStatus).json({ error: authError });
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

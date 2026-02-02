/**
 * Vercel Serverless Function - Upload to ImgBB
 * Endpoint: /api/upload-imgbb
 * 
 * Called from Firebase Hosting frontend
 */

export default async function handler(req, res) {
    // Set CORS headers to allow requests from allowed origins
    const allowedOrigins = [
        'https://debelingoconangel.web.app',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:4173'
    ];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', 'https://debelingoconangel.web.app');
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
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

        // Get API key from environment variable (configured in Vercel)
        const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

        if (!IMGBB_API_KEY) {
            console.error('ImgBB API key not configured');
            return res.status(500).json({ error: 'Service not configured' });
        }

        // Create form data
        const formData = new FormData();
        formData.append('image', image);

        // Upload to ImgBB
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            return res.status(200).json({
                success: true,
                url: result.data.url,
                deleteUrl: result.data.delete_url,
                data: {
                    width: result.data.width,
                    height: result.data.height,
                    size: result.data.size
                }
            });
        } else {
            throw new Error(result.error?.message || 'Upload failed');
        }
    } catch (error) {
        console.error('ImgBB upload error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to upload image'
        });
    }
}

import { verifySecurity } from './_auth.js';
import { applySecurityHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

function isValidImageSignature(base64Data) {
    if (!base64Data || typeof base64Data !== 'string') return false;
    const clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const header = clean.substring(0, 32);
    const validSignatures = ['/9j/', 'iVBORw0KGgo', 'R0lGODhl', 'R0lGODdh', 'UklGR'];
    return validSignatures.some(sig => header.startsWith(sig));
}

async function handleImgBB(image, res) {
    const key = process.env.IMGBB_API_KEY;
    if (!key) return res.status(500).json({ error: 'ImgBB not configured' });
    const formData = new FormData();
    formData.append('image', image);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, { method: 'POST', body: formData });
    const result = await response.json();
    if (result.success) return res.status(200).json({ success: true, url: result.data.url, deleteUrl: result.data.delete_url });
    throw new Error(result.error?.message || 'ImgBB failed');
}

async function handleImgur(image, res) {
    const ids = (process.env.IMGUR_CLIENT_IDS || '').split(',').map(id => id.trim());
    if (!ids.length) return res.status(500).json({ error: 'Imgur not configured' });
    for (const clientId of ids) {
        try {
            const formData = new FormData();
            formData.append('image', image);
            formData.append('type', 'base64');
            const response = await fetch('https://api.imgur.com/3/image', {
                method: 'POST',
                headers: { 'Authorization': `Client-ID ${clientId}` },
                body: formData
            });
            if (response.ok) {
                const result = await response.json();
                return res.status(200).json({ success: true, url: result.data.link, deleteHash: result.data.deletehash });
            }
        } catch (e) { continue; }
    }
    throw new Error('All Imgur IDs failed');
}

export default async function handler(req, res) {
    if (applySecurityHeaders(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { error: authError, status: authStatus } = await verifySecurity(req);
    if (authError) return res.status(authStatus).json({ error: authError });

    const { image, provider = 'imgbb' } = req.body;
    if (!image || !isValidImageSignature(image)) return res.status(400).json({ error: 'Invalid image data' });

    try {
        if (provider === 'imgur') return await handleImgur(image, res);
        return await handleImgBB(image, res);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

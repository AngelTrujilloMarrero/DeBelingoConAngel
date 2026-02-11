import { verifySecurity } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';
import { applySecurityHeaders } from './_cors.js';

async function callOpenRouter(prompt, apiKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s limit for the first attempt

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://de-belingo-con-angel.vercel.app',
                'X-Title': 'De Belingo con Angel',
            },
            body: JSON.stringify({
                model: 'openrouter/free',
                messages: [
                    { role: 'system', content: 'Debes indicar siempre qué orquesta está en cada sitio basándote en el listado. Sé exacto, concreto y al grano. Al final de tu respuesta añade siempre "(S)".' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 350,
            }),
        });
        clearTimeout(timeoutId);
        if (!response.ok) return null;
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        return null;
    }
}

async function callMistral(prompt, apiKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s limit for the fallback

    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'mistral-medium-latest',
                messages: [
                    { role: 'system', content: 'Debes indicar siempre qué orquesta está en cada sitio basándote en el listado. Sé exacto, concreto y al grano. Al final de tu respuesta añade siempre "(M)".' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 350,
            }),
        });
        clearTimeout(timeoutId);
        if (!response.ok) return null;
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        return null;
    }
}

export default async function handler(req, res) {
    if (applySecurityHeaders(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt missing' });

        // 1. Verify Security (DO IT ONCE)
        const { error: authError, status: authStatus } = await verifySecurity(req);
        if (authError) return res.status(authStatus).json({ error: authError });

        // 2. Global Rate Limit
        const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const [globalLimit, ipLimit] = await Promise.all([
            checkRateLimit('angel-ia-global', 120, 60 * 60 * 1000),
            checkRateLimit(`angel-ia-ip:${userIP}`, 30, 60 * 60 * 1000)
        ]);

        if (!globalLimit.allowed) return res.status(429).json({ error: globalLimit.error });
        if (!ipLimit.allowed) return res.status(429).json({ error: 'Límite de mensajes excedido, puntal.' });

        // 3. Try OpenRouter First
        let aiResponse = await callOpenRouter(prompt, process.env.API_OPENROUTER);

        // 4. Fallback to Mistral if failed
        if (!aiResponse) {
            console.warn("Falling back to Mistral...");
            aiResponse = await callMistral(prompt, process.env.API_TOLETE);
        }

        if (aiResponse) {
            return res.status(200).json({ response: aiResponse });
        } else {
            return res.status(503).json({ error: 'La IA ha tardado demasiado en responder. ¡Reintenta, puntal!' });
        }

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

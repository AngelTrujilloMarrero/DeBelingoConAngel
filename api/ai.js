import { verifySecurity } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';
import { applySecurityHeaders } from './_cors.js';

async function callOpenRouter(prompt, apiKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

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
        if (!response.ok) throw new Error('OpenRouter not ok');
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        clearTimeout(timeoutId);
        return null;
    }
}

async function callMistral(prompt, apiKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

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
        if (!response.ok) throw new Error('Mistral not ok');
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        clearTimeout(timeoutId);
        return null;
    }
}

export default async function handler(req, res) {
    if (applySecurityHeaders(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt missing' });

        // 1. Auth + Rate Limits in parallel (~1-2s max)
        const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const [authResult, globalLimit, ipLimit] = await Promise.all([
            verifySecurity(req),
            checkRateLimit('angel-ia-global', 120, 60 * 60 * 1000),
            checkRateLimit(`angel-ia-ip:${userIP}`, 30, 60 * 60 * 1000)
        ]);

        if (authResult.error) return res.status(authResult.status).json({ error: authResult.error });
        if (!globalLimit.allowed) return res.status(429).json({ error: globalLimit.error });
        if (!ipLimit.allowed) return res.status(429).json({ error: 'Límite de mensajes excedido, puntal.' });

        // 2. RACE both AIs simultaneously - first to respond wins
        const openRouterKey = process.env.API_OPENROUTER;
        const mistralKey = process.env.API_TOLETE;

        const results = await Promise.allSettled([
            callOpenRouter(prompt, openRouterKey),
            callMistral(prompt, mistralKey)
        ]);

        // Pick the first successful, non-null result
        let aiResponse = null;
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
                aiResponse = result.value;
                break;
            }
        }

        if (aiResponse) {
            return res.status(200).json({ response: aiResponse });
        } else {
            return res.status(503).json({ error: 'Ninguna IA respondió a tiempo. ¡Reintenta, puntal!' });
        }

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

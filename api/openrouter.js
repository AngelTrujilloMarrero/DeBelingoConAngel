import { verifySecurity } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';
import { applySecurityHeaders } from './_cors.js';

export default async function handler(req, res) {
    // Apply Security Headers & CORS
    if (applySecurityHeaders(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt } = req.body;

        // Strict Input Validation (fast, no async)
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt must be a non-empty string' });
        }
        if (prompt.length > 2000) {
            return res.status(400).json({ error: 'Prompt is too long (max 2000 characters)' });
        }

        const apiKey = process.env.API_OPENROUTER;
        if (!apiKey) return res.status(500).json({ error: 'OpenRouter API key not configured' });

        // Run auth + rate limits IN PARALLEL to save time on cold starts
        const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const [authResult, globalLimit, ipLimit] = await Promise.all([
            verifySecurity(req),
            checkRateLimit('angel-ia-global', 100, 60 * 60 * 1000),
            checkRateLimit(`openrouter:${userIP}`, 20, 60 * 60 * 1000)
        ]);

        if (authResult.error) return res.status(authResult.status).json({ error: authResult.error });
        if (!globalLimit.allowed) return res.status(429).json({ error: globalLimit.error });
        if (!ipLimit.allowed) return res.status(429).json({ error: 'Has excedido el límite de mensajes por hora para Ángel IA. ¡Tómate un descanso, puntal!' });

        // AI call with aggressive timeout (8s to stay under Vercel's 10s limit)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

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
                model: 'openrouter/free', // Uses the best available free model to avoid 404s
                messages: [
                    {
                        role: 'system',
                        content: 'Eres Ángel "De Belingo con Ángel", experto en verbenas de Tenerife. Tono alegre, canario (usa "¡fuerte viaje!", "ñoos", "de belingo", "puntal"). ¡Sácala a bailar!'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 350, // More conservative for speed
            }),
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        if (!response.ok) {
            console.error('OpenRouter API error:', data);
            return res.status(response.status).json({ error: data.error?.message || 'Error calling OpenRouter API' });
        }

        return res.status(200).json({ response: data.choices[0].message.content });
    } catch (error) {
        if (error.name === 'AbortError') {
            return res.status(408).json({ error: 'La IA está tardando demasiado. ¡Prueba otra vez, puntal!' });
        }
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

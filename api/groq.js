import { verifySecurity } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';
import { applySecurityHeaders } from './_cors.js';

export default async function handler(req, res) {
    if (applySecurityHeaders(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt must be a non-empty string' });
        }
        if (prompt.length > 2000) {
            return res.status(400).json({ error: 'Prompt is too long (max 2000 characters)' });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured' });

        const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const [authResult, globalLimit, ipLimit] = await Promise.all([
            verifySecurity(req),
            checkRateLimit('angel-ia-global', 100, 60 * 60 * 1000),
            checkRateLimit(`groq:${userIP}`, 20, 60 * 60 * 1000)
        ]);

        if (authResult.error) return res.status(authResult.status).json({ error: authResult.error });
        if (!globalLimit.allowed) return res.status(429).json({ error: globalLimit.error });
        if (!ipLimit.allowed) return res.status(429).json({ error: 'Has excedido el límite de mensajes por hora para Ángel IA. ¡Tómate un descanso, puntal!' });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-specdec', // High performance model on Groq
                messages: [
                    {
                        role: 'system',
                        content: 'Eres Ángel de "De Belingo con Ángel", un experto en las verbenas y fiestas de Tenerife. Tu tono es alegre, cercano, muy canario (usa expresiones como "¡fuerte viaje!", "ñoos", "de belingo", "puntal") y entusiasta. Tu objetivo es dar una respuesta detallada y divertida, animando a la gente a ir a las verbenas. Explícate bien, cuenta detalles y transmite mucho ánimo.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 600,
            }),
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        if (!response.ok) {
            console.error('Groq API error:', data);
            return res.status(response.status).json({ error: data.error?.message || 'Error calling Groq API' });
        }

        return res.status(200).json({ response: data.choices[0].message.content });
    } catch (error) {
        if (error.name === 'AbortError') {
            return res.status(408).json({ error: 'La IA de Groq está tardando demasiado. ¡Prueba otra vez, puntal!' });
        }
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

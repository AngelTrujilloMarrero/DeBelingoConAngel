import { verifySecurity } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';
import { applySecurityHeaders } from './_cors.js';

export default async function handler(req, res) {
    // Apply Security Headers & CORS
    if (applySecurityHeaders(req, res)) return; // Returns true if it was an OPTIONS request

    // Verify Security Token
    const { error: authError, status: authStatus } = await verifySecurity(req);
    if (authError) {
        return res.status(authStatus).json({ error: authError });
    }

    // Rate Limit: 100 requests per hour globally
    const { allowed: globalAllowed, error: globalError } = await checkRateLimit('angel-ia-global', 100, 60 * 60 * 1000);
    if (!globalAllowed) {
        return res.status(429).json({ error: globalError });
    }

    // Rate Limit por IP: 20 peticiones por hora por usuario
    const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const { allowed: ipAllowed, error: ipError } = await checkRateLimit(`mistral:${userIP}`, 20, 60 * 60 * 1000);
    if (!ipAllowed) {
        return res.status(429).json({ error: 'Has excedido el límite de mensajes por hora para Ángel IA. ¡Tómate un descanso, puntal!' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body;

    // Strict Input Validation
    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt must be a non-empty string' });
    }

    if (prompt.length > 2000) {
        return res.status(400).json({ error: 'Prompt is too long (max 2000 characters)' });
    }

    const apiKey = process.env.API_TOLETE;

    if (!apiKey) {
        return res.status(500).json({ error: 'Mistral API key not configured' });
    }

    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'mistral-medium-latest', // Or any other suitable model
                messages: [
                    {
                        role: 'system',
                        content: 'Eres Ángel de "De Belingo con Ángel", un experto en las verbenas y fiestas de Tenerife. Tu tono es alegre, cercano, muy canario (usa expresiones como "¡fuerte viaje!", "ñoos", "de belingo", "puntal") y entusiasta. Tu objetivo es animar a la gente a ir a las verbenas basándote en su ubicación y lo que hay cerca.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Mistral API error:', data);
            return res.status(response.status).json({ error: data.error?.message || 'Error calling Mistral API' });
        }

        return res.status(200).json({ response: data.choices[0].message.content });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

import { verifyAppCheck } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
    // Lista blanca de orígenes permitidos
    const allowedOrigins = [
        'https://debelingoconangel.web.app',
        'https://de-belingo-con-angel.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:4173'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Firebase-AppCheck'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verify App Check Token
    const { error: authError, status: authStatus } = await verifyAppCheck(req);
    if (authError) {
        return res.status(authStatus).json({ error: authError });
    }

    // Rate Limit: 100 requests per hour globally
    const { allowed, error: rateError } = await checkRateLimit('angel-ia', 100, 60 * 60 * 1000);
    if (!allowed) {
        return res.status(429).json({ error: rateError });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const apiKey = process.env.API_OPENROUTER;

        if (!apiKey) {
            return res.status(500).json({ error: 'OpenRouter API key not configured' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://de-belingo-con-angel.vercel.app',
                'X-Title': 'De Belingo con Angel',
            },
            body: JSON.stringify({
                model: 'stepfun/step-3.5-flash:free',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres Ángel de "De Belingo con Ángel", un experto en las verbenas y fiestas de Tenerife. Tu tono es alegre, cercano, muy canario (usa expresiones como "¡fuerte viaje!", "ñoos", "de belingo", "puntal") y entusiasta. NO seas breve. Tu objetivo es dar una respuesta detallada y divertida, animando a la gente a ir a las verbenas. Explícate bien, cuenta detalles y transmite mucho ánimo.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter API error:', data);
            return res.status(response.status).json({ error: data.error?.message || 'Error calling OpenRouter API' });
        }

        return res.status(200).json({ response: data.choices[0].message.content });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

import { verifyAppCheck } from './_auth.js';

export default async function handler(req, res) {
    // Enable CORS
    const origin = req.headers.origin;
    const allowedOrigins = [
        'https://debelingoconangel.web.app',
        'https://de-belingo-con-angel.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ];

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Firebase-AppCheck'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verify App Check Token
    const { error: authError, status: authStatus } = await verifyAppCheck(req);
    if (authError) {
        return res.status(authStatus).json({ error: authError });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
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

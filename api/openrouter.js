export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', 'https://debelingoconangel.web.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.API_OPENROUTER;

    if (!apiKey) {
        return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    try {
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

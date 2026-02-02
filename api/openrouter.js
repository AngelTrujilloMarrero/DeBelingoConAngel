export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // Manejo de CORS manual para Edge Runtime
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': 'https://debelingoconangel.web.app',
                'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'https://debelingoconangel.web.app',
            },
        });
    }

    try {
        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            return new Response(JSON.stringify({ error: 'Prompt is required' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'https://debelingoconangel.web.app',
                },
            });
        }

        const apiKey = process.env.API_OPENROUTER;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'OpenRouter API key not configured' }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'https://debelingoconangel.web.app',
                },
            });
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
            return new Response(JSON.stringify({ error: data.error?.message || 'Error calling OpenRouter API' }), {
                status: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'https://debelingoconangel.web.app',
                },
            });
        }

        return new Response(JSON.stringify({ response: data.choices[0].message.content }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'https://debelingoconangel.web.app',
            },
        });
    } catch (error) {
        console.error('Server error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'https://debelingoconangel.web.app',
            },
        });
    }
}

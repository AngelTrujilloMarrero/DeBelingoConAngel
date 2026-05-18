import { verifySecurity } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';
import { applySecurityHeaders } from './_cors.js';

const MUNICIPIOS = [
  'Adeje', 'Arafo', 'Arico', 'Arona', 'Buenavista', 'Candelaria',
  'Rosario', 'Sauzal', 'Tanque', 'Fasnia', 'Garachico', 'Granadilla',
  'Guancha', 'Guía', 'Güímar', 'Icod', 'Matanza', 'Orotava', 'Puerto',
  'Realejos', 'Laguna', 'San Juan Rambla', 'San Miguel', 'Santa Cruz',
  'Santa Úrsula', 'Santiago Teide', 'Tacoronte', 'Tegueste', 'Victoria',
  'Vilaflor', 'Silos'
];

const TIPOS_EVENTO = [
  'Baile Normal', 'Romería', 'Baile Magos', 'Tapas y Vinos', 'Paseo Romero',
  'Tapas', 'Romería Chica', 'Carnaval', 'Taifa', 'Infantil', 'Inclusiva',
  'Vinos', 'Aniversario', 'Solidario', 'Romería Barquera', 'Pamela', 'Blanco',
  'Sombrero', 'Sardinada', 'FIN DE AÑO', 'Cerveza', 'Otro'
];

export default async function handler(req, res) {
    if (applySecurityHeaders(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fecha, lugar, municipio, orquesta, accion, historial } = req.body;

        // Security check
        const authResult = await verifySecurity(req);
        if (authResult.error) {
            return res.status(authResult.status).json({ error: authResult.error });
        }

        // Rate limit for admin use (more permissive)
        const globalLimit = await checkRateLimit('admin-ia-events', 200, 60 * 60 * 1000);
        if (!globalLimit.allowed) {
            return res.status(429).json({ error: 'Rate limit exceeded for admin AI services.' });
        }

        const apiKey = process.env.API_TOLETE;
        if (!apiKey) {
            return res.status(500).json({ error: 'Mistral API key not configured' });
        }

        const systemPrompt = `Eres un experto en fiestas populares y eventos tradicionales de Tenerife. 
Tu tarea es sugerir detalles para completar un nuevo evento en el panel de administración de "De Belingo".

REGLAS ESTRICTAS:
1. Solo puedes sugerir municipios de esta lista: ${MUNICIPIOS.join(', ')}.
2. Solo puedes sugerir tipos de evento de esta lista: ${TIPOS_EVENTO.join(', ')}.
3. Las orquestas DEBEN ser reales y basarse en los datos históricos proporcionados si existen.
4. Si hay historial, PRIORIZA que las sugerencias coincidan con lo que ocurrió otros años en estas mismas fechas/lugares.
5. El horario suele ser nocturno para verbenas (22:00, 23:00) o tarde para romerías (12:00, 16:00).
6. DEBES RESPONDER ÚNICAMENTE CON UN OBJETO JSON VÁLIDO.

Formato de respuesta esperado (DEBE SER JSON PURO, SIN MARKDOWN):
{
  "orquestas": ["Sugerencia 1", "Sugerencia 2"],
  "lugares": ["Lugar típico 1", "Lugar típico 2"],
  "tipos": ["Tipo 1", "Tipo 2"],
  "hora": "HH:MM",
  "programa": "Breve descripción",
  "explicacion": "Razonamiento"
}
`;

        let historialText = '';
        if (historial && historial.length > 0) {
          historialText = `CONTEXTO HISTÓRICO (Eventos pasados similares):
${historial.map(h => `- ${h.fecha}: ${h.orquesta} en ${h.lugar} (${h.municipio}). Tipo: ${h.tipo}. Hora: ${h.hora || 'Desconocida'}. Programa: ${h.programa || '-'}`).join('\n')}

IMPORTANTE: Si en el CONTEXTO HISTÓRICO aparece un Tipo de evento o una Hora específicos, ÚSALOS.
`;
        }

        const userPrompt = `${historialText}

Basado EN EL HISTORIAL y en esta información parcial, completa el evento:
Fecha: ${fecha || 'No especificada'}
Municipio: ${municipio || 'No especificada'}
Lugar: ${lugar || 'No especificado'}
Orquesta: ${orquesta || 'No especificada'}

Responde SOLO en JSON.`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-v4-flash',
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.5
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json({ error: error.message || 'Error calling DeepSeek' });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        try {
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const suggestions = JSON.parse(cleanContent);
            return res.status(200).json(suggestions);
        } catch (parseError) {
            console.error('Error parsing AI response:', content);
            return res.status(500).json({ error: 'Failed to parse AI response' });
        }

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

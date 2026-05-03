import { sendTelegramMessage } from './_telegram.js';

const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const dayName = daysOfWeek[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    return `${dayName} ${dayNum} de ${monthName}`;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { type, event, reason } = req.body;

        if (!type || !event) {
            return res.status(400).json({ success: false, error: 'Missing type or event data' });
        }

        let message = '';

        if (type === 'delete') {
            message += `⚠️ <b>CANCELACIÓN - INMEDIATO</b>\n\n`;
            message += `❌ <b>${event.tipo} cancelada${event.municipio ? ' en ' + event.municipio : ''}</b>\n`;
            message += `📅 ${formatDate(event.day)}\n`;
            if (event.orquesta) {
                message += `🎻 ${event.orquesta}\n`;
            }
            if (reason || event.motivoEliminacion) {
                message += `\nMotivo: ${reason || event.motivoEliminacion}\n`;
            }
        } else if (type === 'add' || type === 'reagregado') {
            message += `➕ <b>${type === 'reagregado' ? 'VERBENA REAGREGADA' : 'NUEVA VERBENA'}</b>\n\n`;
            message += `🎵 ${event.tipo} ${event.municipio || ''}\n`;
            if (event.lugar) message += `📍 ${event.lugar}\n`;
            message += `📅 ${formatDate(event.day)} · ${event.hora}\n`;
            if (event.orquesta) message += `🎻 ${event.orquesta}\n`;
        } else if (type === 'edit') {
            message += `✏️ <b>CAMBIO EN VERBENA</b>\n\n`;
            message += `🎵 ${event.tipo} ${event.municipio || ''}\n`;
            if (event.lugar) message += `📍 ${event.lugar}\n`;
            message += `📅 ${formatDate(event.day)} · ${event.hora}\n`;
            if (event.orquesta) message += `🎻 ${event.orquesta}\n`;
        } else {
            return res.status(400).json({ success: false, error: 'Invalid type' });
        }

        message += `\n━━━━━━━━━━ ✦ ━━━━━━━━━━━`;

        const result = await sendTelegramMessage(message);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in notify-change:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

import { sendTelegramMessage } from './_telegram.js';
import { getEvents } from './_firebase.js';

const daysOfWeek = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];

function getEventActivityType(event, sinceTime) {
    if (event.reAgregado) return 'reagregado';
    const agregado = event.FechaAgregado ? new Date(event.FechaAgregado) : null;
    const editado = event.FechaEditado ? new Date(event.FechaEditado) : null;
    if (agregado && agregado >= sinceTime) {
        if (!editado || Math.abs(editado.getTime() - agregado.getTime()) < 5000) {
            return 'add';
        }
    }
    return 'edit';
}

function formatEvent(event, sinceTime) {
    const type = getEventActivityType(event, sinceTime);
    const typeLabels = {
        add: { label: 'NUEVO', icon: '➕' },
        edit: { label: 'MODIFICADO', icon: '✏️' },
        reagregado: { label: 'RE-AGREGADO', icon: '🔄' }
    };
    const info = typeLabels[type] || typeLabels.edit;

    let text = `${info.icon} <b>${info.label}</b>\n`;
    let locationParts = [];
    if (event.lugar) locationParts.push(event.lugar);
    if (event.municipio) locationParts.push(event.municipio);
    if (locationParts.length > 0) text += `📍 ${locationParts.join(', ')}\n`;
    
    text += `🎵 <b>${event.hora} | ${event.tipo}</b>\n`;
    if (event.orquesta) text += `🎻 ${event.orquesta}\n`;
    
    const eventDate = new Date(event.day);
    text += `📅 ${eventDate.toLocaleDateString('es-ES')}\n`;

    if (type === 'edit' && event.cambios && event.cambios.length > 0) {
        const changeLabels = {
            hora: '🕐 Hora',
            dia: '📅 Día',
            orquestas: '🎵 Formación',
            orquesta_add: '➕ Nueva orquesta',
            orquesta_rem: '➖ Orquesta quitada',
            lugar: '📍 Lugar',
            municipio: '🏘️ Municipio',
            tipo: '🏷️ Tipo',
            programa: '📋 Programa'
        };
        const changes = event.cambios
            .map(c => changeLabels[c] || `✏️ ${c}`)
            .join(', ');
        text += `📝 <i>Cambios: ${changes}</i>\n`;
    }
    return text;
}

export default async function handler(req, res) {
    try {
        const events = await getEvents();
        const now = new Date();
        const dayOfWeek = now.getDay();
        const windowHours = (dayOfWeek === 1 || dayOfWeek === 5) ? 48 : 24;
        const sinceTime = new Date(now.getTime() - (windowHours * 60 * 60 * 1000));

        const modifiedEvents = events.filter(e => {
            if (e.cancelado) return false;
            const eventDate = new Date(e.day);
            eventDate.setHours(23, 59, 59, 999);
            if (eventDate < now) return false;

            const agregado = e.FechaAgregado ? new Date(e.FechaAgregado) : null;
            const editado = e.FechaEditado ? new Date(e.FechaEditado) : null;
            return (agregado && agregado >= sinceTime) || (editado && editado >= sinceTime);
        });

        if (modifiedEvents.length === 0) {
            return res.status(200).json({ success: true, message: `No events modified in the last ${windowHours} hours.` });
        }

        modifiedEvents.sort((a, b) => new Date(a.day) - new Date(b.day) || a.hora.localeCompare(b.hora));

        const grouped = {};
        modifiedEvents.forEach(e => {
            const d = e.day.split('T')[0];
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push(e);
        });

        let message = `🆕 <b>NOVEDADES Y MODIFICACIONES DE HOY</b>\n\n`;
        Object.keys(grouped).sort().forEach(d => {
            const dateObj = new Date(d);
            message += `━━━━━━━━━━ <b>${daysOfWeek[dateObj.getDay()]} ${dateObj.getDate()}</b> ━━━━━━━━━━\n\n`;
            grouped[d].forEach(e => message += formatEvent(e, sinceTime) + '\n');
        });
        message += `━━━━━━━━━━ ✦ ━━━━━━━━━━━\n\n🔗 <a href="https://debelingoconangel.web.app">debelingoconangel.web.app</a>`;
        
        const result = await sendTelegramMessage(message);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error in daily telegram cron:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

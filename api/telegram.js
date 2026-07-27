import { sendTelegramMessage } from './_telegram.js';
import { getEvents } from './_firebase.js';

const daysOfWeek = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const daysOfWeekNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const monthsNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

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
    const isAgendaMode = !sinceTime;
    let text = '';
    
    if (!isAgendaMode) {
        const type = getEventActivityType(event, sinceTime);
        const typeLabels = {
            add: { label: 'NUEVO', icon: '➕' },
            edit: { label: 'MODIFICADO', icon: '✏️' },
            reagregado: { label: 'RE-AGREGADO', icon: '🔄' }
        };
        const info = typeLabels[type] || typeLabels.edit;
        text += `${info.icon} <b>${info.label}</b>\n`;
    }
    
    let locationParts = [];
    if (event.lugar) locationParts.push(event.lugar);
    if (event.municipio) locationParts.push(event.municipio);
    if (locationParts.length > 0) text += `📍 ${locationParts.join(', ')}\n`;
    
    text += `🎵 <b>${event.hora} | ${event.tipo}</b>\n`;
    if (event.orquesta) text += `🎻 ${event.orquesta}\n`;
    
    const eventDate = new Date(event.day);
    text += `📅 ${eventDate.toLocaleDateString('es-ES')}\n`;

    if (!isAgendaMode) {
        const type = getEventActivityType(event, sinceTime);
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
    }
    
    return text;
}

function formatDateFull(dateStr) {
    const date = new Date(dateStr);
    return `${daysOfWeekNames[date.getDay()]} ${date.getDate()} de ${monthsNames[date.getMonth()]}`;
}

function getCanaryTime() {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Atlantic/Canary',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const getVal = (type) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
    return {
        year: getVal('year'),
        month: getVal('month') - 1,
        day: getVal('day'),
        hour: getVal('hour'),
        minute: getVal('minute'),
        dayOfWeek: new Date(getVal('year'), getVal('month') - 1, getVal('day')).getDay(),
    };
}

async function handleWeekdays(req, res) {
    const canary = getCanaryTime();
    try {
        const monday = new Date(canary.year, canary.month, canary.day);
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
        monday.setHours(0, 0, 0, 0);

        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);
        friday.setHours(23, 59, 59, 999);

        const events = await getEvents();
        const weekdayEvents = events.filter(e => {
            if (e.cancelado) return false;
            const d = new Date(e.day);
            return d >= monday && d <= friday;
        });

        if (weekdayEvents.length === 0) {
            console.log(JSON.stringify({ timestamp: new Date().toISOString(), action: 'weekdays', result: 'no_events' }));
            return res.status(200).json({ success: true, message: 'No events this week.' });
        }

        weekdayEvents.sort((a, b) => new Date(a.day) - new Date(b.day) || a.hora.localeCompare(b.hora));

        const grouped = {};
        weekdayEvents.forEach(e => {
            const d = e.day.split('T')[0];
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push(e);
        });

        let message = `🎵 <b>VERBENAS DE TENERIFE</b>\n`;
        message += `Lunes ${monday.getDate()} al viernes ${friday.getDate()} de ${months[monday.getMonth()]}\n\n`;

        Object.keys(grouped).sort().forEach(d => {
            const dateObj = new Date(d);
            message += `━━━━━━━━━━ <b>${daysOfWeek[dateObj.getDay()]} ${dateObj.getDate()}</b> ━━━━━━━━━━\n\n`;
            grouped[d].forEach(e => message += formatEvent(e, null) + '\n');
        });

        message += `━━━━━━━━━━ ✦ ━━━━━━━━━━━\n\n🔗 <a href="https://debelingoconangel.web.app">debelingoconangel.web.app</a>`;

        const result = await sendTelegramMessage(message);
        console.log(JSON.stringify({ timestamp: new Date().toISOString(), action: 'weekdays', result: 'sent', count: weekdayEvents.length }));
        return res.status(200).json(result);
    } catch (error) {
        console.error(JSON.stringify({ timestamp: new Date().toISOString(), action: 'weekdays', success: false, error: error.message }));
        const alertMsg = `❌ <b>Error en la agenda semanal</b>\n\n${error.message}`;
        await sendTelegramMessage(alertMsg);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function handleSaturday(req, res) {
    const canary = getCanaryTime();
    try {
        const tomorrow = new Date(canary.year, canary.month, canary.day + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);

        const events = await getEvents();
        const saturdayEvents = events.filter(e => {
            if (e.cancelado) return false;
            const d = new Date(e.day);
            return d >= tomorrow && d <= endOfTomorrow;
        });

        if (saturdayEvents.length === 0) {
            console.log(JSON.stringify({ timestamp: new Date().toISOString(), action: 'saturday', result: 'no_events' }));
            return res.status(200).json({ success: true, message: 'No events for Saturday.' });
        }

        saturdayEvents.sort((a, b) => a.hora.localeCompare(b.hora));

        let message = `🔔 <b>VERBENAS DEL SÁBADO</b>\n`;
        message += `${daysOfWeekNames[tomorrow.getDay()]} ${tomorrow.getDate()} de ${monthsNames[tomorrow.getMonth()]}\n\n`;

        saturdayEvents.forEach(e => message += formatEvent(e, null) + '\n');

        message += `━━━━━━━━━━ ✦ ━━━━━━━━━━━\n\n🔗 <a href="https://debelingoconangel.web.app">debelingoconangel.web.app</a>`;

        const result = await sendTelegramMessage(message);
        console.log(JSON.stringify({ timestamp: new Date().toISOString(), action: 'saturday', result: 'sent', count: saturdayEvents.length }));
        return res.status(200).json(result);
    } catch (error) {
        console.error(JSON.stringify({ timestamp: new Date().toISOString(), action: 'saturday', success: false, error: error.message }));
        const alertMsg = `❌ <b>Error en el recordatorio del sábado</b>\n\n${error.message}`;
        await sendTelegramMessage(alertMsg);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function handleSunday(req, res) {
    const canary = getCanaryTime();
    try {
        const tomorrow = new Date(canary.year, canary.month, canary.day + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);

        const events = await getEvents();
        const sundayEvents = events.filter(e => {
            if (e.cancelado) return false;
            const d = new Date(e.day);
            return d >= tomorrow && d <= endOfTomorrow;
        });

        if (sundayEvents.length === 0) {
            console.log(JSON.stringify({ timestamp: new Date().toISOString(), action: 'sunday', result: 'no_events' }));
            return res.status(200).json({ success: true, message: 'No events for Sunday.' });
        }

        sundayEvents.sort((a, b) => a.hora.localeCompare(b.hora));

        let message = `🔔 <b>VERBENAS DEL DOMINGO</b>\n`;
        message += `${daysOfWeekNames[tomorrow.getDay()]} ${tomorrow.getDate()} de ${monthsNames[tomorrow.getMonth()]}\n\n`;

        sundayEvents.forEach(e => message += formatEvent(e, null) + '\n');

        message += `━━━━━━━━━━ ✦ ━━━━━━━━━━━\n\n🔗 <a href="https://debelingoconangel.web.app">debelingoconangel.web.app</a>`;

        const result = await sendTelegramMessage(message);
        console.log(JSON.stringify({ timestamp: new Date().toISOString(), action: 'sunday', result: 'sent', count: sundayEvents.length }));
        return res.status(200).json(result);
    } catch (error) {
        console.error(JSON.stringify({ timestamp: new Date().toISOString(), action: 'sunday', success: false, error: error.message }));
        const alertMsg = `❌ <b>Error en el recordatorio del domingo</b>\n\n${error.message}`;
        await sendTelegramMessage(alertMsg);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function handleNotifyChange(req, res) {
    const { type, event, reason } = req.body;
    if (!type || !event) return res.status(400).json({ success: false, error: 'Missing data' });

    let message = '';
    if (type === 'delete') {
        message += `⚠️ <b>CANCELACIÓN - INMEDIATO</b>\n\n❌ <b>${event.tipo} cancelada</b>\n`;
        let locationParts = [];
        if (event.lugar) locationParts.push(event.lugar);
        if (event.municipio) locationParts.push(event.municipio);
        if (locationParts.length > 0) message += `📍 ${locationParts.join(', ')}\n`;
        message += `📅 ${formatDateFull(event.day)}\n`;
        if (event.orquesta) message += `🎻 ${event.orquesta}\n`;
        if (reason || event.motivoEliminacion) message += `\nMotivo: ${reason || event.motivoEliminacion}\n`;
    } else {
        const titles = { add: 'NUEVA VERBENA', reagregado: 'VERBENA REAGREGADA', edit: 'CAMBIO EN VERBENA' };
        const emojis = { add: '➕', reagregado: '➕', edit: '✏️' };
        message += `${emojis[type]} <b>${titles[type]}</b>\n\n🎵 ${event.tipo}\n`;
        let locationParts = [];
        if (event.lugar) locationParts.push(event.lugar);
        if (event.municipio) locationParts.push(event.municipio);
        if (locationParts.length > 0) message += `📍 ${locationParts.join(', ')}\n`;
        message += `📅 ${formatDateFull(event.day)} · ${event.hora}\n`;
        if (event.orquesta) message += `🎻 ${event.orquesta}\n`;
    }
    message += `\n━━━━━━━━━━ ✦ ━━━━━━━━━━━`;
    return res.status(200).json(await sendTelegramMessage(message));
}

import { applySecurityHeaders } from './_cors.js';

export default async function handler(req, res) {
    if (applySecurityHeaders(req, res)) return;

    if (req.method === 'POST') return handleNotifyChange(req, res);
    const { action } = req.query;
    if (action === 'weekdays') return handleWeekdays(req, res);
    if (action === 'saturday') return handleSaturday(req, res);
    if (action === 'sunday') return handleSunday(req, res);
    return res.status(400).json({ error: 'Invalid action' });
}

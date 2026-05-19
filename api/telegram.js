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
    
    // Si se añadió en el periodo de reporte
    if (agregado && agregado >= sinceTime) {
        // Si no hay edición o la edición fue inmediata tras añadirlo
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

async function handleWeekly(req, res) {
    const today = new Date();
    const monday = new Date(today);
    const daysUntilMonday = today.getDay() === 0 ? 1 : 8 - today.getDay();
    monday.setDate(today.getDate() + daysUntilMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const events = await getEvents();
    const weeklyEvents = events.filter(e => !e.cancelado && new Date(e.day) >= monday && new Date(e.day) <= sunday);

    if (weeklyEvents.length === 0) return res.status(200).json({ success: true, message: 'No events next week.' });

    weeklyEvents.sort((a, b) => new Date(a.day) - new Date(b.day) || a.hora.localeCompare(b.hora));

    const grouped = {};
    weeklyEvents.forEach(e => {
        const d = e.day.split('T')[0];
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(e);
    });

    let message = `🎵 <b>VERBENAS DE TENERIFE - SEMANA DEL ${monday.getDate()} DE ${months[monday.getMonth()]} AL ${sunday.getDate()} DE ${months[sunday.getMonth()]}</b>\n\n`;
    Object.keys(grouped).sort().forEach(d => {
        const dateObj = new Date(d);
        message += `━━━━━━━━━━ <b>${daysOfWeek[dateObj.getDay()]} ${dateObj.getDate()}</b> ━━━━━━━━━━\n\n`;
        grouped[d].forEach(e => message += formatEvent(e, null) + '\n'); // Pass null for window check as it's a weekly summary
    });
    message += `━━━━━━━━━━ ✦ ━━━━━━━━━━━\n\n🔗 <a href="https://debelingoconangel.web.app">debelingoconangel.web.app</a>`;
    
    return res.status(200).json(await sendTelegramMessage(message));
}

async function handleReminder(req, res) {
    const today = new Date();
    const friday = new Date(today);
    friday.setDate(today.getDate() + 1);
    friday.setHours(0, 0, 0, 0);
    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);
    sunday.setHours(23, 59, 59, 999);

    const events = await getEvents();
    const weekendEvents = events.filter(e => !e.cancelado && new Date(e.day) >= friday && new Date(e.day) <= sunday);

    if (weekendEvents.length === 0) return res.status(200).json({ success: true, message: 'No events this weekend.' });

    weekendEvents.sort((a, b) => new Date(a.day) - new Date(b.day) || a.hora.localeCompare(b.hora));

    const grouped = {};
    weekendEvents.forEach(e => {
        const d = e.day.split('T')[0];
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(e);
    });

    let message = `🔔 <b>RECORDATORIO DEL FIN DE SEMANA</b>\n\n`;
    Object.keys(grouped).sort().forEach(d => {
        const dateObj = new Date(d);
        message += `━━━━━━━━━━ <b>${daysOfWeek[dateObj.getDay()]} ${dateObj.getDate()}</b> ━━━━━━━━━━\n\n`;
        grouped[d].forEach(e => message += formatEvent(e, null) + '\n');
    });
    message += `━━━━━━━━━━ ✦ ━━━━━━━━━━━\n\n🔗 <a href="https://debelingoconangel.web.app">debelingoconangel.web.app</a>`;
    
    return res.status(200).json(await sendTelegramMessage(message));
}

async function handleDaily(req, res) {
    const events = await getEvents();
    const now = new Date();
    
    const dayOfWeek = now.getDay();
    // Lunes (1) y Viernes (5) usamos ventana de 48h porque Domingo y Jueves no hay reporte diario (se publica la agenda completa)
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

    if (modifiedEvents.length === 0) return res.status(200).json({ success: true, message: `No events modified in the last ${windowHours} hours.` });

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
    
    return res.status(200).json(await sendTelegramMessage(message));
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
    if (action === 'weekly') return handleWeekly(req, res);
    if (action === 'reminder') return handleReminder(req, res);
    if (action === 'daily') return handleDaily(req, res);
    return res.status(400).json({ error: 'Invalid action' });
}

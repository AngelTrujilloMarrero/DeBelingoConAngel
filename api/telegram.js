import { sendTelegramMessage } from './_telegram.js';
import { getEvents } from './_firebase.js';

const daysOfWeek = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const daysOfWeekNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const monthsNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatEvent(event) {
    let text = `🎵 <b>${event.hora} | ${event.tipo}</b>\n`;
    
    let locationParts = [];
    if (event.lugar) locationParts.push(event.lugar);
    if (event.municipio) locationParts.push(event.municipio);
    if (locationParts.length > 0) text += `📍 ${locationParts.join(', ')}\n`;
    
    if (event.orquesta) text += `🎻 ${event.orquesta}\n`;
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
        grouped[d].forEach(e => message += formatEvent(e) + '\n');
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
        grouped[d].forEach(e => message += formatEvent(e) + '\n');
    });
    message += `━━━━━━━━━━ ✦ ━━━━━━━━━━━\n\n🔗 <a href="https://debelingoconangel.web.app">debelingoconangel.web.app</a>`;
    
    return res.status(200).json(await sendTelegramMessage(message));
}

async function handleDaily(req, res) {
    const events = await getEvents();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    const modifiedEvents = events.filter(e => {
        if (e.cancelado) return false;
        
        const eventDate = new Date(e.day);
        eventDate.setHours(23, 59, 59, 999);
        if (eventDate < now) return false;

        const agregado = e.FechaAgregado ? new Date(e.FechaAgregado) : null;
        const editado = e.FechaEditado ? new Date(e.FechaEditado) : null;
        
        return (agregado && agregado >= twentyFourHoursAgo) || (editado && editado >= twentyFourHoursAgo);
    });

    if (modifiedEvents.length === 0) return res.status(200).json({ success: true, message: 'No events modified today.' });

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
        grouped[d].forEach(e => message += formatEvent(e) + '\n');
    });
    message += `━━━━━━━━━━ ✦ ━━━━━━━━━━━\n\n🔗 <a href="https://debelingoconangel.web.app">debelingoconangel.web.app</a>`;
    
    return res.status(200).json(await sendTelegramMessage(message));
}

async function handleNotifyChange(req, res) {
    const { type, event, reason } = req.body;
    if (!type || !event) return res.status(400).json({ success: false, error: 'Missing data' });

    let message = '';
    if (type === 'delete') {
        message += `⚠️ <b>CANCELACIÓN - INMEDIATO</b>\n\n❌ <b>${event.tipo} cancelada${event.municipio ? ' en ' + event.municipio : ''}</b>\n📅 ${formatDateFull(event.day)}\n`;
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

export default async function handler(req, res) {
    if (req.method === 'POST') return handleNotifyChange(req, res);
    const { action } = req.query;
    if (action === 'weekly') return handleWeekly(req, res);
    if (action === 'reminder') return handleReminder(req, res);
    if (action === 'daily') return handleDaily(req, res);
    return res.status(400).json({ error: 'Invalid action' });
}

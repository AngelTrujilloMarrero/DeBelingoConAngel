import { sendTelegramMessage } from './_telegram.js';
import { getEvents } from './_firebase.js';

const daysOfWeek = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

function getNextWeekRange() {
    const today = new Date();
    const monday = new Date(today);
    // Si hoy es domingo (0), el próximo lunes es mañana (+1). Si no, calculamos.
    const daysUntilMonday = today.getDay() === 0 ? 1 : 8 - today.getDay();
    monday.setDate(today.getDate() + daysUntilMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
}

function formatEvent(event) {
    let text = `🎵 <b>${event.hora} | ${event.tipo} ${event.municipio}</b>\n`;
    if (event.lugar) {
        text += `📍 ${event.lugar}\n`;
    }
    if (event.orquesta) {
        text += `🎻 ${event.orquesta}\n`;
    }
    return text;
}

export default async function handler(req, res) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.warn('Unauthorized cron attempt');
            // Allow manual execution if we want, but better to protect it.
            // For now, allow it to continue so Vercel can run it if CRON_SECRET is not set.
        }

        const events = await getEvents();
        const { start, end } = getNextWeekRange();

        // Filter events for next week that are not canceled
        const weeklyEvents = events.filter(e => {
            if (e.cancelado) return false;
            const eventDate = new Date(e.day);
            return eventDate >= start && eventDate <= end;
        });

        if (weeklyEvents.length === 0) {
            return res.status(200).json({ success: true, message: 'No events next week.' });
        }

        // Sort by date and time
        weeklyEvents.sort((a, b) => {
            const dateA = new Date(a.day);
            const dateB = new Date(b.day);
            if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
            return a.hora.localeCompare(b.hora);
        });

        // Group by day
        const grouped = {};
        weeklyEvents.forEach(e => {
            const date = new Date(e.day);
            // Formato YYYY-MM-DD
            const dateString = date.toISOString().split('T')[0];
            if (!grouped[dateString]) grouped[dateString] = [];
            grouped[dateString].push(e);
        });

        const startDayStr = `${start.getDate()} DE ${months[start.getMonth()]}`;
        const endDayStr = `${end.getDate()} DE ${months[end.getMonth()]}`;

        let message = `🎵 <b>VERBENAS DE TENERIFE - SEMANA DEL ${startDayStr} AL ${endDayStr}</b>\n\n`;

        Object.keys(grouped).sort().forEach(dateString => {
            const dateObj = new Date(dateString);
            const dayName = daysOfWeek[dateObj.getDay()];
            const dayNum = dateObj.getDate();
            
            message += `━━━━━━━━━━ <b>${dayName} ${dayNum}</b> ━━━━━━━━━━\n\n`;
            
            grouped[dateString].forEach(e => {
                message += formatEvent(e) + '\n';
            });
        });

        message += `━━━━━━━━━━ ✦ ━━━━━━━━━━━\n\n`;
        message += `🔗 <a href="https://debelingoconangel.web.app">debelingoconangel.web.app</a>`;

        const result = await sendTelegramMessage(message);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in send-weekly:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

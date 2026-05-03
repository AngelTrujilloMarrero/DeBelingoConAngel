import { sendTelegramMessage } from './_telegram.js';
import { getEvents } from './_firebase.js';

const daysOfWeek = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];

function getWeekendRange() {
    const today = new Date();
    // Assuming today is Thursday, weekend starts tomorrow (Friday) to Sunday
    const friday = new Date(today);
    friday.setDate(today.getDate() + 1);
    friday.setHours(0, 0, 0, 0);

    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);
    sunday.setHours(23, 59, 59, 999);

    return { start: friday, end: sunday };
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
        }

        const events = await getEvents();
        const { start, end } = getWeekendRange();

        // Filter events for the weekend that are not canceled
        const weekendEvents = events.filter(e => {
            if (e.cancelado) return false;
            const eventDate = new Date(e.day);
            return eventDate >= start && eventDate <= end;
        });

        if (weekendEvents.length === 0) {
            return res.status(200).json({ success: true, message: 'No events this weekend.' });
        }

        weekendEvents.sort((a, b) => {
            const dateA = new Date(a.day);
            const dateB = new Date(b.day);
            if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
            return a.hora.localeCompare(b.hora);
        });

        const grouped = {};
        weekendEvents.forEach(e => {
            const date = new Date(e.day);
            const dateString = date.toISOString().split('T')[0];
            if (!grouped[dateString]) grouped[dateString] = [];
            grouped[dateString].push(e);
        });

        let message = `🔔 <b>RECORDATORIO DEL FIN DE SEMANA</b>\n\n`;

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
        console.error('Error in send-reminder:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

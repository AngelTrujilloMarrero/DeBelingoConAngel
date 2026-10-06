/**
 * AEMET helpers for server-side Telegram listings.
 * Mirrors the parsing/matching logic of src/hooks/useAemetAlerts.ts
 */

const AEMET_RSS_URL = 'https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/rss/CAP_AFAP6596_RSS.xml';

const ZONE_MAPPING = {
    "Santa Cruz": "Metropolitana",
    "Laguna": "Metropolitana",
    "Rosario": "Metropolitana",
    "Tegueste": "Metropolitana",
    "Buenavista": "Norte",
    "Silos": "Norte",
    "Tanque": "Norte",
    "Garachico": "Norte",
    "Icod": "Norte",
    "Guancha": "Norte",
    "San Juan Rambla": "Norte",
    "Realejos": "Norte",
    "Puerto": "Norte",
    "Orotava": "Norte",
    "Santa Úrsula": "Norte",
    "Victoria": "Norte",
    "Matanza": "Norte",
    "Sauzal": "Norte",
    "Tacoronte": "Norte",
    "Candelaria": "Sur",
    "Arafo": "Sur",
    "Güímar": "Sur",
    "Fasnia": "Sur",
    "Arona": "Sur",
    "Adeje": "Sur",
    "Guía": "Sur",
    "Santiago Teide": "Sur",
    "San Miguel": "Sur",
    "Granadilla": "Sur",
    "Vilaflor": "Sur"
};

function parseXml(xmlText) {
    let doc;
    if (typeof DOMParser !== 'undefined') {
        doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    } else {
        // Minimal XML parser for the serverless runtime (Node)
        const textItems = [];
        const itemPattern = /<item>([\s\S]*?)<\/item>/g;
        let m;
        while ((m = itemPattern.exec(xmlText)) !== null) {
            const block = m[1];
            const extract = (tag) => {
                const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
                const mm = block.match(re);
                return mm ? mm[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
            };
            textItems.push({
                title: extract('title'),
                description: extract('description'),
                link: extract('link'),
                pubDate: extract('pubDate'),
            });
        }
        return { items: textItems };
    }
    const items = [];
    doc.querySelectorAll('item').forEach((item) => {
        const extract = (tag) => item.querySelector(tag)?.textContent || '';
        items.push({
            title: extract('title'),
            description: extract('description'),
            link: extract('link'),
            pubDate: extract('pubDate'),
        });
    });
    return { items };
}

function parseAlerts(items) {
    const alerts = [];
    for (const item of items) {
        const title = item.title || '';
        const description = item.description || '';
        const link = item.link || '';

        if (title.toLowerCase().includes('no hay avisos')) continue;

        let level = null;
        if (title.toLowerCase().includes('rojo')) level = 'red';
        else if (title.toLowerCase().includes('naranja')) level = 'orange';
        else if (title.toLowerCase().includes('amarillo')) level = 'yellow';
        if (!level) continue;

        let zone = '';
        if (title.toLowerCase().includes('metropolitana')) zone = 'Metropolitana';
        else if (title.toLowerCase().includes('norte')) zone = 'Norte';
        else if (title.toLowerCase().includes('este, sur y oeste')) zone = 'Sur';
        else if (title.toLowerCase().includes('cumbres')) zone = 'Cumbres';

        let phenomenon = 'Fenómeno adverso';
        if (title.includes(' por ')) {
            phenomenon = title.split(' por ')[1]?.split('.')[0]?.split(' en ')[0]?.trim() || phenomenon;
        } else if (title.includes('.')) {
            const parts = title.split('.').map(p => p.trim()).filter(Boolean);
            if (parts.length >= 3) {
                phenomenon = parts[2];
            }
        }

        const dateMatch = description.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
        let alertDate = '';
        if (dateMatch) {
            alertDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
        } else if (item.pubDate) {
            const d = new Date(item.pubDate);
            if (!isNaN(d)) {
                const pad = (n) => String(n).padStart(2, '0');
                alertDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            }
        }

        let onset;
        let expires;
        const onsetMatch = description.match(/de\s+(\d{2}):(\d{2})/);
        if (onsetMatch) onset = `${onsetMatch[1]}:${onsetMatch[2]}`;
        const expiresMatch = description.match(/a\s+(\d{2}):(\d{2})/);
        if (expiresMatch) expires = `${expiresMatch[1]}:${expiresMatch[2]}`;

        alerts.push({ level, phenomenon, zone, description, link, date: alertDate, onset, expires });
    }
    return alerts;
}

export async function getAemetAlerts() {
    const response = await fetch(AEMET_RSS_URL);
    if (!response.ok) {
        throw new Error(`AEMET RSS error: ${response.status}`);
    }
    const xmlText = await response.text();
    const { items } = parseXml(xmlText);
    return parseAlerts(items);
}

export function getEventZone(municipio) {
    if (!municipio) return '';
    const munSearch = municipio.toLowerCase();
    for (const [key, zone] of Object.entries(ZONE_MAPPING)) {
        if (munSearch.includes(key.toLowerCase())) return zone;
    }
    return '';
}

/**
 * Determina si un evento está afectado por alguna alerta AEMET,
 * replicando la lógica de useAemetAlerts.getAlertForEvent.
 */
export function getAlertsForEvent(event, alerts) {
    if (!event || !event.municipio || !event.day) return [];
    const eventDate = event.day.split('T')[0].trim();
    const eventTime = event.hora ? String(event.hora).trim() : null;
    const eventZone = getEventZone(event.municipio);
    if (!eventZone) return [];

    return alerts.filter(a => {
        const zoneMatch = (a.zone.trim() === eventZone || a.zone.trim() === 'Cumbres');
        const dateMatch = (a.date.trim() === eventDate);
        if (!zoneMatch || !dateMatch) return false;

        if (!eventTime || !a.onset) return true;

        const toMin = (t) => {
            const [hh, mm] = t.split(':').map(n => parseInt(n, 10) || 0);
            return hh * 60 + mm;
        };
        const eventMinutes = toMin(eventTime);
        const onsetMinutes = toMin(a.onset);
        const expiresMinutes = a.expires ? toMin(a.expires) : 24 * 60;
        return eventMinutes >= onsetMinutes && eventMinutes <= expiresMinutes;
    });
}

export function formatAemetAlertLine(alert, events) {
    const levelEmoji = { red: '🔴', orange: '🟠', yellow: '🟡' };
    const levelLabel = { red: 'Rojo', orange: 'Naranja', yellow: 'Amarillo' };
    const zone = alert.zone || '';
    const affected = events
        .map(e => `${e.municipio} ${e.hora}`)
        .join(', ');
    return `${levelEmoji[alert.level] || '⚠️'} ${levelLabel[alert.level] || alert.level} · ${alert.phenomenon} (${zone}): ${affected}`;
}

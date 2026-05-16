import { sendTelegramPhoto } from './_telegram.js';
import { getEvents, getDb } from './_firebase.js';
import fs from 'fs';
import path from 'path';

const daysOfWeek = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];

/**
 * Normalize text for matching image filenames
 */
function normalize(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n');
}

/**
 * Generate possible image URLs for a festival background
 */
function generateImageUrls(lugar, municipio) {
    const urls = [];
    const baseUrls = ['https://debelingoconangel.web.app/fotos/'];
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];

    const variations = [];
    const addVariations = (text) => {
        if (!text) return;
        const norm = normalize(text);
        variations.push(norm.replace(/\s+/g, ''));
        if (text.includes(' ')) {
            variations.push(norm.replace(/\s+/g, '-'));
            variations.push(norm.replace(/\s+/g, '_'));
        }
    };

    if (lugar) {
        addVariations(lugar);
        const nLugar = normalize(lugar).replace(/\s+/g, '');
        const nMunicipio = normalize(municipio).replace(/\s+/g, '');
        variations.push(`${nLugar}_${nMunicipio}`);
        variations.push(`${nMunicipio}_${nLugar}`);
    }
    addVariations(municipio);

    const uniqueVariations = [...new Set(variations)];
    for (const base of baseUrls) {
        for (const variant of uniqueVariations) {
            for (const ext of extensions) {
                urls.push(`${base}${variant}.${ext}`);
            }
        }
    }
    return urls;
}

/**
 * Try to download a background image
 */
async function tryDownloadBackground(lugar, municipio) {
    const urls = generateImageUrls(lugar, municipio);
    for (const url of urls) {
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (response.ok) {
                const contentType = response.headers.get('content-type') || '';
                if (contentType.startsWith('image/')) {
                    return Buffer.from(await response.arrayBuffer());
                }
            }
        } catch (e) {}
    }
    return null;
}

/**
 * Download and register fonts
 */
let fontsRegistered = false;
async function ensureFonts() {
    if (fontsRegistered) return;
    const { GlobalFonts } = await import('@napi-rs/canvas');
    try {
        const antonPath = path.join(process.cwd(), 'api', 'fonts', 'Anton-Regular.ttf');
        GlobalFonts.register(fs.readFileSync(antonPath), 'Anton');
        const robotoPath = path.join(process.cwd(), 'api', 'fonts', 'Roboto-Regular.ttf');
        GlobalFonts.register(fs.readFileSync(robotoPath), 'Roboto');
    } catch (e) {
        console.warn('Font registration error:', e.message);
    }
    fontsRegistered = true;
}

/**
 * Generate a festival poster image
 */
async function generateCartel(festivalEvents, lugar, municipio, backgroundBuffer) {
    const { createCanvas, loadImage } = await import('@napi-rs/canvas');
    await ensureFonts();

    const TITLE_FONT = 'Anton';
    const BODY_FONT = 'Roboto';
    const WIDTH = 1080;
    const PADDING = 30;

    const isSmallFestival = festivalEvents.length <= 5;
    const titleFontSize = Math.round(24 * 3.2); 
    const subtitleFontSize = Math.round(24 * 2.5);
    const dayFontSize = isSmallFestival ? Math.round(24 * 2.2) : Math.round(24 * 1.8);
    const eventFontSize = isSmallFestival ? Math.round(24 * 2.5) : Math.round(24 * 1.8);

    const eventsByDay = {};
    festivalEvents.forEach(event => {
        const dayKey = event.day.split('T')[0];
        if (!eventsByDay[dayKey]) eventsByDay[dayKey] = [];
        eventsByDay[dayKey].push(event);
    });

    Object.values(eventsByDay).forEach(dayEvents => {
        dayEvents.sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'));
    });

    const sortedDays = Object.keys(eventsByDay).sort();
    
    // Height estimation
    let contentHeight = PADDING + 150;
    contentHeight += titleFontSize + (lugar ? subtitleFontSize + 10 : 0);
    
    sortedDays.forEach(dayKey => {
        contentHeight += dayFontSize + 50;
        const dayEvents = eventsByDay[dayKey];
        const useColumns = dayEvents.length > 1;
        const rows = useColumns ? Math.ceil(dayEvents.length / 2) : dayEvents.length;
        contentHeight += rows * (isSmallFestival ? 150 : 120);
        contentHeight += 30;
    });
    contentHeight += 120;

    const canvasHeight = Math.max(1080, contentHeight);
    const canvas = createCanvas(WIDTH, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Background
    if (backgroundBuffer) {
        try {
            const bgImage = await loadImage(backgroundBuffer);
            const scale = Math.max(WIDTH / bgImage.width, canvasHeight / bgImage.height);
            const sw = WIDTH / scale;
            const sh = canvasHeight / scale;
            const sx = (bgImage.width - sw) / 2;
            const sy = (bgImage.height - sh) / 2;
            ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, WIDTH, canvasHeight);
        } catch (e) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, WIDTH, canvasHeight);
        }
    } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, WIDTH, canvasHeight);
    }

    // Overlay Box
    const boxMargin = 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxMargin, boxMargin, WIDTH - boxMargin*2, canvasHeight - boxMargin*2, 10);
    ctx.fill();
    ctx.stroke();

    let currentY = boxMargin + 25;

    // Gen Date
    ctx.font = `19px ${BODY_FONT}`;
    ctx.fillStyle = '#444444';
    ctx.textAlign = 'right';
    const genDate = new Date().toLocaleString('es-ES', { timeZone: 'Atlantic/Canary' });
    ctx.fillText(`Generado ${genDate}`, WIDTH - boxMargin - 20, currentY);

    currentY += 25;

    // Pill
    const hueRanges = [{ min: 0, max: 30 }, { min: 45, max: 150 }, { min: 170, max: 260 }, { min: 280, max: 330 }];
    const selectedRange = hueRanges[Math.floor(Math.random() * hueRanges.length)];
    const randomHue = Math.floor(Math.random() * (selectedRange.max - selectedRange.min)) + selectedRange.min;
    const bgColor = `hsl(${randomHue}, 75%, 45%)`;

    ctx.font = `${titleFontSize}px ${TITLE_FONT}`;
    const titleText = lugar ? `VERBENAS ${lugar.toUpperCase()}` : `VERBENAS ${municipio.toUpperCase()}`;
    const subtitleText = lugar ? municipio.toUpperCase() : null;
    
    let maxTextWidth = ctx.measureText(titleText).width;
    if (subtitleText) {
        ctx.font = `${subtitleFontSize}px ${TITLE_FONT}`;
        maxTextWidth = Math.max(maxTextWidth, ctx.measureText(subtitleText).width);
    }

    const pillW = Math.min(maxTextWidth + 100, WIDTH - boxMargin*2 - 40);
    const pillH = subtitleText ? titleFontSize + subtitleFontSize + 55 : titleFontSize + 55;
    const pillX = WIDTH / 2 - pillW / 2;
    const pillY = currentY;

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 40);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 5;
    ctx.stroke();

    const drawTitleText = (txt, y, fontSize) => {
        ctx.font = `${fontSize}px ${TITLE_FONT}`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeText(txt, WIDTH / 2 + 4, y + 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(txt, WIDTH / 2, y);
    };

    currentY += titleFontSize + 10;
    drawTitleText(titleText, currentY, titleFontSize);
    if (subtitleText) {
        currentY += subtitleFontSize + 10;
        drawTitleText(subtitleText, currentY, subtitleFontSize);
    }

    currentY = pillY + pillH + 70; // Added more top margin for the first day

    // Days Loop
    sortedDays.forEach(dayKey => {
        const dayDate = new Date(dayKey + 'T12:00:00');
        const dayName = dayDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

        ctx.font = `${dayFontSize}px ${TITLE_FONT}`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#FFD700';
        ctx.strokeText(dayName, WIDTH / 2, currentY);
        ctx.fillStyle = '#006400';
        ctx.fillText(dayName, WIDTH / 2, currentY);
        
        const dayWidth = ctx.measureText(dayName).width;
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(WIDTH / 2 - dayWidth / 2, currentY + 10);
        ctx.lineTo(WIDTH / 2 + dayWidth / 2, currentY + 10);
        ctx.stroke();

        currentY += dayFontSize + 25;

        const dayEvents = eventsByDay[dayKey];
        const useColumns = dayEvents.length > 1;
        
        const colGap = 40;
        const colWidth = useColumns ? (WIDTH - boxMargin * 2 - 80 - colGap) / 2 : WIDTH - boxMargin * 2 - 120;
        const leftX = useColumns ? boxMargin + 40 : WIDTH / 2 - colWidth / 2;
        const rightX = WIDTH / 2 + colGap / 2;
        
        let colY = [currentY, currentY];

        dayEvents.forEach((event, idx) => {
            const colIdx = useColumns ? idx % 2 : 0;
            const baseX = useColumns ? (colIdx === 0 ? leftX : rightX) : leftX;
            const centerX = baseX + colWidth / 2;
            let drawY = colY[colIdx];

            // Card BG
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.beginPath();
            ctx.roundRect(baseX - 15, drawY - eventFontSize, colWidth + 30, eventFontSize + (isSmallFestival ? 80 : 60), 15);
            ctx.fill();

            // Prefix
            ctx.textAlign = 'center';
            const timeText = `${event.hora}H`;
            const typeText = event.tipo !== 'Baile Normal' ? ` | ${event.tipo.toUpperCase()}` : '';
            
            ctx.font = `bold ${eventFontSize * 0.9}px ${TITLE_FONT}`;
            const timeW = ctx.measureText(timeText).width;
            let typeW = 0;
            if (typeText) {
                ctx.font = `${eventFontSize * 0.75}px ${TITLE_FONT}`;
                typeW = ctx.measureText(typeText).width;
            }
            
            const totalPrefixW = timeW + typeW + 5;
            let startX = centerX - totalPrefixW / 2;
            
            ctx.textAlign = 'left';
            ctx.font = `bold ${eventFontSize * 0.9}px ${TITLE_FONT}`;
            ctx.fillStyle = '#0000FF';
            ctx.fillText(timeText, startX, drawY);
            
            if (typeText) {
                startX += timeW + 5;
                ctx.font = `${eventFontSize * 0.75}px ${TITLE_FONT}`;
                ctx.fillStyle = '#222';
                ctx.fillText(typeText, startX, drawY);
            }

            drawY += eventFontSize + 15;

            // Orchestra
            ctx.font = `${eventFontSize}px ${TITLE_FONT}`;
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            
            const orchestraText = event.orquesta;
            const words = orchestraText.split(' ');
            let line = '';
            let lines = [];
            for(let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                if (ctx.measureText(testLine).width > colWidth && n > 0) {
                    lines.push(line.trim());
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line.trim());

            lines.forEach(l => {
                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 1;
                ctx.strokeText(l, centerX, drawY);
                ctx.fillText(l, centerX, drawY);
                drawY += eventFontSize + 10;
            });

            colY[colIdx] = drawY + 20;
        });

        currentY = Math.max(colY[0], colY[1]) + 25;
    });

    currentY = Math.max(currentY, canvasHeight - boxMargin - 40);
    ctx.font = `bold 28px ${BODY_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.fillText('Más info en: debelingoconangel.web.app', WIDTH / 2, currentY);

    return canvas.toBuffer('image/png');
}

/**
 * Build a caption
 */
function buildCaption(lugar, municipio, eventCount) {
    let caption = `🎵 <b>VERBENAS${lugar ? ' ' + lugar.toUpperCase() + ',' : ''} ${municipio.toUpperCase()}</b>\n`;
    caption += `📋 ${eventCount} evento${eventCount !== 1 ? 's' : ''}\n`;
    caption += `\n🔗 <a href="https://debelingoconangel.web.app">debelingoconangel.web.app</a>`;
    return caption;
}

/**
 * Main handler
 */
export default async function handler(req, res) {
    try {
        const db = getDb();
        const queueSnapshot = await db.ref('telegramPhotoQueue').once('value');
        const queue = queueSnapshot.val();
        if (!queue) return res.status(200).json({ success: true, message: 'Queue empty' });
        const allEvents = await getEvents();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 2);
        cutoff.setHours(0, 0, 0, 0);
        const cutoffStr = cutoff.toISOString().split('T')[0];
        const activeEvents = allEvents.filter(e => !e.cancelado && e.day >= cutoffStr);
        const results = [];
        const queueEntries = Object.entries(queue);
        for (const [queueId, entry] of queueEntries) {
            const { lugar, municipio } = entry;
            const festivalEvents = activeEvents.filter(e => (e.lugar || '') === (lugar || '') && e.municipio === municipio);
            if (festivalEvents.length === 0) {
                await db.ref(`telegramPhotoQueue/${queueId}`).remove();
                continue;
            }
            festivalEvents.sort((a, b) => new Date(`${a.day}T${a.hora || '00:00'}`).getTime() - new Date(`${b.day}T${b.hora || '00:00'}`).getTime());
            const bgBuffer = await tryDownloadBackground(lugar, municipio);
            const cartelBuffer = await generateCartel(festivalEvents, lugar, municipio, bgBuffer);
            const caption = buildCaption(lugar, municipio, festivalEvents.length);
            const sendResult = await sendTelegramPhoto(cartelBuffer, caption);
            if (sendResult.success) {
                await db.ref(`telegramPhotoQueue/${queueId}`).remove();
                results.push({ label: entry.label, status: 'sent' });
            }
            if (queueEntries.indexOf([queueId, entry]) < queueEntries.length - 1) await new Promise(r => setTimeout(r, 1000));
        }
        return res.status(200).json({ success: true, results });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

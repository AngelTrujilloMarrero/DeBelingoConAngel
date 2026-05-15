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
    // Prioritize Firebase Hosting (fastest, most reliable)
    const baseUrls = [
        'https://debelingoconangel.web.app/fotos/'
    ];
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
 * Try to download a background image from known URLs
 * Returns the image buffer or null if none found
 */
async function tryDownloadBackground(lugar, municipio) {
    const urls = generateImageUrls(lugar, municipio);
    for (const url of urls) {
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (response.ok) {
                const contentType = response.headers.get('content-type') || '';
                if (contentType.startsWith('image/')) {
                    console.log(`Background image found: ${url}`);
                    return Buffer.from(await response.arrayBuffer());
                }
            }
        } catch (e) {
            // Skip this URL, try next
        }
    }
    console.log(`No background image found for ${lugar || ''} ${municipio}`);
    return null;
}

/**
 * Download and register fonts for @napi-rs/canvas (serverless has no system fonts)
 */
let fontsRegistered = false;
async function ensureFonts() {
    if (fontsRegistered) return;
    const { GlobalFonts } = await import('@napi-rs/canvas');

    // Load Anton from local file system
    try {
        const antonPath = path.join(process.cwd(), 'api', 'fonts', 'Anton-Regular.ttf');
        GlobalFonts.register(fs.readFileSync(antonPath), 'Anton');
        console.log('✅ Anton font registered from local file');
    } catch (e) {
        console.warn('Failed to load Anton font:', e.message);
    }

    // Load Roboto from local file system
    try {
        const robotoPath = path.join(process.cwd(), 'api', 'fonts', 'Roboto-Regular.ttf');
        GlobalFonts.register(fs.readFileSync(robotoPath), 'Roboto');
        console.log('✅ Roboto font registered from local file');
    } catch (e) {
        console.warn('Failed to load Roboto font:', e.message);
    }

    fontsRegistered = true;
}

/**
 * Generate a festival poster image using @napi-rs/canvas
 */
async function generateCartel(festivalEvents, lugar, municipio, backgroundBuffer) {
    const { createCanvas, loadImage } = await import('@napi-rs/canvas');
    await ensureFonts();

    const TITLE_FONT = 'Anton';
    const BODY_FONT = 'Roboto';

    const WIDTH = 1080;
    const PADDING = 30;

    // Font sizes based on web base size of 24px
    const titleFontSize = Math.round(24 * 3.5); // 84px
    const subtitleFontSize = Math.round(24 * 2.8); // 67px
    const dayFontSize = Math.round(24 * 2.0); // 48px
    const eventFontSize = Math.round(24 * 2.2); // 53px (increased further)

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
    
    // Estimate height
    let contentHeight = PADDING;
    contentHeight += 60; // Generation date
    contentHeight += 40; // Top padding of pill
    contentHeight += titleFontSize;
    if (lugar) contentHeight += subtitleFontSize + 10;
    contentHeight += 40; // Bottom padding of pill
    contentHeight += 50; // Margin after pill

    sortedDays.forEach(dayKey => {
        contentHeight += dayFontSize + 20; // Day header
        eventsByDay[dayKey].forEach(() => {
            contentHeight += eventFontSize + 15; // Event line
        });
        contentHeight += 30; // Margin after day
    });
    contentHeight += 80; // Footer
    contentHeight += PADDING;

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
            ctx.globalAlpha = 1.0; // Max background visibility
            ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, WIDTH, canvasHeight);
            ctx.globalAlpha = 1.0;
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'; // Even more transparent to see background
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxMargin, boxMargin, WIDTH - boxMargin*2, canvasHeight - boxMargin*2, 10);
    ctx.fill();
    ctx.stroke();

    let currentY = boxMargin + 25;

    // Generation Date
    ctx.font = `19px ${BODY_FONT}`;
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'right';
    const genDate = new Date().toLocaleString('es-ES', { timeZone: 'Atlantic/Canary' });
    ctx.fillText(`Generado ${genDate}`, WIDTH - boxMargin - 20, currentY);

    currentY += 40;

    // Pill Background
    const hueRanges = [
        { min: 0, max: 30 }, { min: 45, max: 150 },
        { min: 170, max: 260 }, { min: 280, max: 330 }
    ];
    const selectedRange = hueRanges[Math.floor(Math.random() * hueRanges.length)];
    const randomHue = Math.floor(Math.random() * (selectedRange.max - selectedRange.min)) + selectedRange.min;
    const randomSat = Math.floor(Math.random() * 40) + 60;
    const randomLight = Math.floor(Math.random() * 25) + 45;
    const bgColor = `hsl(${randomHue}, ${randomSat}%, ${randomLight}%)`;

    ctx.font = `${titleFontSize}px ${TITLE_FONT}`;
    const titleText = lugar ? `VERBENAS ${lugar.toUpperCase()}` : `VERBENAS ${municipio.toUpperCase()}`;
    const subtitleText = lugar ? municipio.toUpperCase() : null;
    
    let maxTextWidth = ctx.measureText(titleText).width;
    if (subtitleText) {
        ctx.font = `${subtitleFontSize}px ${TITLE_FONT}`;
        maxTextWidth = Math.max(maxTextWidth, ctx.measureText(subtitleText).width);
    }

    const pillW = Math.min(maxTextWidth + 80, WIDTH - boxMargin*2 - 40);
    const pillH = subtitleText ? titleFontSize + subtitleFontSize + 60 : titleFontSize + 60;
    const pillX = WIDTH / 2 - pillW / 2;
    const pillY = currentY;

    // Draw Pill
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 40);
    ctx.fill();

    // White Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Text helper
    const drawThickText = (txt, y, fontSize, fillCol, strokeCol, strokeWidth) => {
        ctx.font = `${fontSize}px ${TITLE_FONT}`;
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        
        // Shadow/stroke
        if (strokeWidth > 0 && strokeCol) {
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = strokeCol;
            ctx.strokeText(txt, WIDTH / 2, y);
        }
        
        ctx.fillStyle = fillCol;
        ctx.fillText(txt, WIDTH / 2, y);
    };

    const drawTitleText = (txt, y, fontSize) => {
        ctx.font = `${fontSize}px ${TITLE_FONT}`;
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        
        // Offset shadow (black)
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; // FIX: Ensure shadow is actually black, not background color
        ctx.strokeText(txt, WIDTH / 2 + 4, y + 4);
        ctx.fillText(txt, WIDTH / 2 + 4, y + 4);
        
        // White text main
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(txt, WIDTH / 2, y);
    };

    currentY += titleFontSize + 15;
    drawTitleText(titleText, currentY, titleFontSize);

    if (subtitleText) {
        currentY += subtitleFontSize + 10;
        drawTitleText(subtitleText, currentY, subtitleFontSize);
    }

    currentY = pillY + pillH + 60; // Absolute positioning relative to pill bottom to avoid overlap

    // Events Loop
    sortedDays.forEach(dayKey => {
        const dayDate = new Date(dayKey + 'T12:00:00');
        const dayName = dayDate.toLocaleDateString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }).toUpperCase();

        drawThickText(dayName, currentY, dayFontSize, '#006400', '#FFD700', 6);
        
        // Underline
        const dayWidth = ctx.measureText(dayName).width;
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(WIDTH / 2 - dayWidth / 2, currentY + 10);
        ctx.lineTo(WIDTH / 2 + dayWidth / 2, currentY + 10);
        ctx.stroke();

        currentY += dayFontSize + 15;

        eventsByDay[dayKey].forEach(event => {
            const maxAllowedWidth = WIDTH - boxMargin * 2 - 100;
            
            // 1. Prepare prefix (Hora | Tipo)
            const prefixParts = [];
            prefixParts.push({ text: `${event.hora}H`, fill: '#0000FF', stroke: '#FFD700' });
            if (event.tipo !== 'Baile Normal') {
                prefixParts.push({ text: `|${event.tipo}`, fill: '#000000', stroke: '#FFD700' });
            }
            
            ctx.font = `${eventFontSize}px ${TITLE_FONT}`;
            let prefixWidth = 0;
            prefixParts.forEach(p => { prefixWidth += ctx.measureText(p.text).width; });

            // 2. Wrap Orchestra Name
            const orchestraText = `|${event.orquesta}`;
            const words = orchestraText.split(' ');
            const lines = [];
            let currentLine = '';
            
            words.forEach(word => {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const testWidth = ctx.measureText(testLine).width;
                if (testWidth + prefixWidth > maxAllowedWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                    prefixWidth = 0; // After first line, prefix is gone
                } else {
                    currentLine = testLine;
                }
            });
            lines.push(currentLine);

            // 3. Draw Lines
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            
            lines.forEach((lineText, index) => {
                const parts = [];
                if (index === 0) {
                    // First line includes the prefix
                    prefixParts.forEach(p => parts.push(p));
                    parts.push({ text: lineText, fill: '#000000', stroke: '#FF0000' });
                } else {
                    // Subsequent lines are just orchestra
                    parts.push({ text: lineText, fill: '#000000', stroke: '#FF0000' });
                }

                let totalWidth = 0;
                parts.forEach(p => { totalWidth += ctx.measureText(p.text).width; });
                
                let drawX = WIDTH / 2 - totalWidth / 2;
                ctx.textAlign = 'left';

                parts.forEach(p => {
                    const w = ctx.measureText(p.text).width;
                    ctx.lineWidth = 6;
                    ctx.strokeStyle = p.stroke;
                    ctx.strokeText(p.text, drawX, currentY);
                    ctx.fillStyle = p.fill;
                    ctx.fillText(p.text, drawX, currentY);
                    drawX += w;
                });

                currentY += eventFontSize + 15;
            });

            currentY += 15; // Gap between events
        });

        currentY += 40; // More spacing between days
    });

    // Footer
    currentY = Math.max(currentY, canvasHeight - boxMargin - 30);
    ctx.font = `26px ${BODY_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.fillText('Más info en: debelingoconangel.web.app', WIDTH / 2, currentY);

    return canvas.toBuffer('image/png');
}

/**
 * Build a caption for the Telegram photo
 */
function buildCaption(lugar, municipio, eventCount) {
    let caption = `🎵 <b>VERBENAS${lugar ? ' ' + lugar.toUpperCase() + ',' : ''} ${municipio.toUpperCase()}</b>\n`;
    caption += `📋 ${eventCount} evento${eventCount !== 1 ? 's' : ''}\n`;
    caption += `\n🔗 <a href="https://debelingoconangel.web.app">debelingoconangel.web.app</a>`;
    return caption;
}

/**
 * Main handler: reads queue, generates cartels, sends photos to Telegram
 */
export default async function handler(req, res) {
    try {
        const db = getDb();

        // 1. Read the queue
        const queueSnapshot = await db.ref('telegramPhotoQueue').once('value');
        const queue = queueSnapshot.val();

        if (!queue || Object.keys(queue).length === 0) {
            return res.status(200).json({ success: true, message: 'Queue empty, nothing to send.' });
        }

        // 2. Get all current events
        const allEvents = await getEvents();

        // Cutoff: events from 2 days ago onwards
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 2);
        cutoff.setHours(0, 0, 0, 0);
        const cutoffStr = cutoff.toISOString().split('T')[0];

        const activeEvents = allEvents.filter(e =>
            !e.cancelado && e.day >= cutoffStr
        );

        // 3. Process each queue entry
        const results = [];
        const queueEntries = Object.entries(queue);

        for (const [queueId, entry] of queueEntries) {
            const { lugar, municipio } = entry;

            // Find matching events
            const festivalEvents = activeEvents.filter(e =>
                (e.lugar || '') === (lugar || '') && e.municipio === municipio
            );

            if (festivalEvents.length === 0) {
                console.log(`No events found for ${lugar || ''} ${municipio}, skipping.`);
                // Remove from queue even if no events
                await db.ref(`telegramPhotoQueue/${queueId}`).remove();
                results.push({ label: entry.label, status: 'skipped', reason: 'no events' });
                continue;
            }

            // Sort events
            festivalEvents.sort((a, b) =>
                new Date(`${a.day}T${a.hora || '00:00'}`).getTime() -
                new Date(`${b.day}T${b.hora || '00:00'}`).getTime()
            );

            // Try to get background image
            const bgBuffer = await tryDownloadBackground(lugar, municipio);

            // Generate cartel
            const cartelBuffer = await generateCartel(festivalEvents, lugar, municipio, bgBuffer);

            // Build caption
            const caption = buildCaption(lugar, municipio, festivalEvents.length);

            // Send to Telegram
            const sendResult = await sendTelegramPhoto(cartelBuffer, caption);

            if (sendResult.success) {
                // Remove from queue
                await db.ref(`telegramPhotoQueue/${queueId}`).remove();
                results.push({ label: entry.label, status: 'sent' });
                console.log(`✅ Cartel sent for ${entry.label}`);
            } else {
                results.push({ label: entry.label, status: 'error', error: sendResult.error });
                console.error(`❌ Failed to send cartel for ${entry.label}:`, sendResult.error);
            }

            // Small delay between sends to avoid Telegram rate limits
            if (queueEntries.indexOf([queueId, entry]) < queueEntries.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const sentCount = results.filter(r => r.status === 'sent').length;
        return res.status(200).json({
            success: true,
            sent: sentCount,
            total: queueEntries.length,
            results
        });
    } catch (error) {
        console.error('Error in telegram-photo handler:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

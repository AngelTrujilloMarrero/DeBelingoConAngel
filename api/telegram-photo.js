import { sendTelegramPhoto } from './_telegram.js';
import { getEvents, getDb } from './_firebase.js';

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

    // Download Anton (Impact-like bold font) from Google Fonts
    try {
        const antonUrl = 'https://fonts.gstatic.com/s/anton/v25/1Ptgg87GROyAm3K9-C8CSKlv.ttf';
        const antonResp = await fetch(antonUrl);
        if (antonResp.ok) {
            const buffer = Buffer.from(await antonResp.arrayBuffer());
            GlobalFonts.register(buffer, 'Anton');
            console.log('✅ Anton font registered');
        }
    } catch (e) {
        console.warn('Failed to load Anton font:', e.message);
    }

    // Download Roboto for body text
    try {
        const robotoUrl = 'https://fonts.gstatic.com/s/roboto/v47/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbGmT.ttf';
        const robotoResp = await fetch(robotoUrl);
        if (robotoResp.ok) {
            const buffer = Buffer.from(await robotoResp.arrayBuffer());
            GlobalFonts.register(buffer, 'Roboto');
            console.log('✅ Roboto font registered');
        }
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

    // Font families to use (with fallbacks)
    const TITLE_FONT = 'Anton';
    const BODY_FONT = 'Roboto';

    const WIDTH = 1200;
    const MIN_HEIGHT = 1200;
    const PADDING = 20;

    // Group events by day
    const eventsByDay = {};
    festivalEvents.forEach(event => {
        const dayKey = event.day.split('T')[0];
        if (!eventsByDay[dayKey]) eventsByDay[dayKey] = [];
        eventsByDay[dayKey].push(event);
    });

    // Sort each day's events by time
    Object.values(eventsByDay).forEach(dayEvents => {
        dayEvents.sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'));
    });

    const sortedDays = Object.keys(eventsByDay).sort();
    const totalEvents = festivalEvents.length;

    // --- Phase 1: Calculate required height ---
    // We need to estimate the height before creating the canvas
    const titleText = lugar
        ? `VERBENAS ${lugar.toUpperCase()}`
        : `VERBENAS ${municipio.toUpperCase()}`;
    const subtitleText = lugar ? municipio.toUpperCase() : null;

    // Rough height calculation
    const titleAreaHeight = subtitleText ? 200 : 160;
    const headerMargin = 40;
    const dayHeaderHeight = 60;
    const eventLineHeight = 50;
    const footerHeight = 80;
    const dateGenHeight = 30;

    let estimatedContentHeight = titleAreaHeight + headerMargin + dateGenHeight;
    sortedDays.forEach(dayKey => {
        estimatedContentHeight += dayHeaderHeight;
        eventsByDay[dayKey].forEach(() => {
            estimatedContentHeight += eventLineHeight;
        });
        estimatedContentHeight += 20; // spacing between days
    });
    estimatedContentHeight += footerHeight;

    const canvasHeight = Math.max(MIN_HEIGHT, estimatedContentHeight + PADDING * 2);

    // --- Phase 2: Create canvas and draw ---
    const canvas = createCanvas(WIDTH, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Background
    if (backgroundBuffer) {
        try {
            const bgImage = await loadImage(backgroundBuffer);
            // Draw with cover behavior
            const scale = Math.max(WIDTH / bgImage.width, canvasHeight / bgImage.height);
            const sw = WIDTH / scale;
            const sh = canvasHeight / scale;
            const sx = (bgImage.width - sw) / 2;
            const sy = (bgImage.height - sh) / 2;
            ctx.globalAlpha = 0.5;
            ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, WIDTH, canvasHeight);
            ctx.globalAlpha = 1.0;
        } catch (e) {
            console.warn('Failed to draw background image:', e.message);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, WIDTH, canvasHeight);
        }
    } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, WIDTH, canvasHeight);
    }

    // Content overlay (semi-transparent white box)
    const overlayMargin = PADDING;
    const overlayX = overlayMargin;
    const overlayY = overlayMargin;
    const overlayW = WIDTH - overlayMargin * 2;
    const overlayH = canvasHeight - overlayMargin * 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    // Rounded rectangle
    const radius = 15;
    ctx.beginPath();
    ctx.moveTo(overlayX + radius, overlayY);
    ctx.lineTo(overlayX + overlayW - radius, overlayY);
    ctx.arcTo(overlayX + overlayW, overlayY, overlayX + overlayW, overlayY + radius, radius);
    ctx.lineTo(overlayX + overlayW, overlayY + overlayH - radius);
    ctx.arcTo(overlayX + overlayW, overlayY + overlayH, overlayX + overlayW - radius, overlayY + overlayH, radius);
    ctx.lineTo(overlayX + radius, overlayY + overlayH);
    ctx.arcTo(overlayX, overlayY + overlayH, overlayX, overlayY + overlayH - radius, radius);
    ctx.lineTo(overlayX, overlayY + radius);
    ctx.arcTo(overlayX, overlayY, overlayX + radius, overlayY, radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    let currentY = overlayY + 30;

    // Generation date (top right)
    ctx.font = `18px ${BODY_FONT}`;
    ctx.fillStyle = '#555555';
    ctx.textAlign = 'right';
    const genDate = new Date().toLocaleString('es-ES', { timeZone: 'Atlantic/Canary' });
    ctx.fillText(`Generado ${genDate}`, overlayX + overlayW - 20, currentY);
    ctx.textAlign = 'center';
    currentY += 30;

    // Random color for title background
    const hueRanges = [
        { min: 0, max: 30 }, { min: 45, max: 150 },
        { min: 170, max: 260 }, { min: 280, max: 330 }
    ];
    const selectedRange = hueRanges[Math.floor(Math.random() * hueRanges.length)];
    const randomHue = Math.floor(Math.random() * (selectedRange.max - selectedRange.min)) + selectedRange.min;
    const bgColor = `hsl(${randomHue}, 70%, 50%)`;

    // Title pill background
    const titleFontSize = 56;
    const subtitleFontSize = 44;
    ctx.font = `${titleFontSize}px ${TITLE_FONT}`;
    const titleMetrics = ctx.measureText(titleText);
    const titleWidth = Math.min(titleMetrics.width + 120, overlayW - 40);

    const pillHeight = subtitleText ? 140 : 100;
    const pillX = WIDTH / 2 - titleWidth / 2;
    const pillY = currentY;
    const pillRadius = 50;

    // Draw pill
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.moveTo(pillX + pillRadius, pillY);
    ctx.lineTo(pillX + titleWidth - pillRadius, pillY);
    ctx.arcTo(pillX + titleWidth, pillY, pillX + titleWidth, pillY + pillRadius, pillRadius);
    ctx.lineTo(pillX + titleWidth, pillY + pillHeight - pillRadius);
    ctx.arcTo(pillX + titleWidth, pillY + pillHeight, pillX + titleWidth - pillRadius, pillY + pillHeight, pillRadius);
    ctx.lineTo(pillX + pillRadius, pillY + pillHeight);
    ctx.arcTo(pillX, pillY + pillHeight, pillX, pillY + pillHeight - pillRadius, pillRadius);
    ctx.lineTo(pillX, pillY + pillRadius);
    ctx.arcTo(pillX, pillY, pillX + pillRadius, pillY, pillRadius);
    ctx.closePath();
    ctx.fill();

    // White border on pill
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Title text with shadow
    ctx.font = `${titleFontSize}px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillText(titleText, WIDTH / 2 + 4, pillY + (subtitleText ? 55 : 65) + 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(titleText, WIDTH / 2, pillY + (subtitleText ? 55 : 65));

    // Subtitle (municipio)
    if (subtitleText) {
        ctx.font = `${subtitleFontSize}px ${TITLE_FONT}`;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillText(subtitleText, WIDTH / 2 + 3, pillY + 105 + 3);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(subtitleText, WIDTH / 2, pillY + 105);
    }

    currentY = pillY + pillHeight + 40;

    // Events section
    sortedDays.forEach(dayKey => {
        const dayDate = new Date(dayKey + 'T12:00:00');
        const dayName = dayDate.toLocaleDateString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }).toUpperCase();

        // Day header with yellow text shadow (matching current cartel style)
        ctx.font = `36px ${TITLE_FONT}`;
        ctx.textAlign = 'center';

        // Yellow shadow
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.fillText(dayName, WIDTH / 2 + 2, currentY + 2);
        ctx.fillText(dayName, WIDTH / 2 - 2, currentY - 2);

        // Green text
        ctx.fillStyle = '#006400';
        ctx.fillText(dayName, WIDTH / 2, currentY);

        // Underline
        const dayWidth = ctx.measureText(dayName).width;
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(WIDTH / 2 - dayWidth / 2, currentY + 8);
        ctx.lineTo(WIDTH / 2 + dayWidth / 2, currentY + 8);
        ctx.stroke();

        currentY += dayHeaderHeight;

        // Events for this day
        eventsByDay[dayKey].forEach(event => {
            const eventFontSize = totalEvents >= 7 ? 28 : 34;
            ctx.font = `${eventFontSize}px ${TITLE_FONT}`;
            ctx.textAlign = 'center';

            // Build event text parts and draw with different colors
            const parts = [];
            parts.push({ text: `${event.hora}H`, color: 'blue' });
            if (event.tipo !== 'Baile Normal') {
                parts.push({ text: `|${event.tipo}`, color: '#000000' });
            }
            parts.push({ text: `|${event.orquesta}`, color: '#000000', shadow: 'red' });

            // Calculate total width
            let totalWidth = 0;
            parts.forEach(p => {
                totalWidth += ctx.measureText(p.text).width;
            });

            // Draw centered
            let drawX = WIDTH / 2 - totalWidth / 2;
            parts.forEach(p => {
                const w = ctx.measureText(p.text).width;

                // Yellow/gold text shadow (cartel style)
                ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
                ctx.textAlign = 'left';
                ctx.fillText(p.text, drawX + 2, currentY + 2);
                ctx.fillText(p.text, drawX - 2, currentY - 2);

                // Red shadow for orchestra name
                if (p.shadow) {
                    ctx.fillStyle = p.shadow;
                    ctx.fillText(p.text, drawX + 2, currentY + 2);
                    ctx.fillText(p.text, drawX - 2, currentY - 2);
                }

                // Main text
                ctx.fillStyle = p.color;
                ctx.fillText(p.text, drawX, currentY);
                drawX += w;
            });

            currentY += eventLineHeight;
        });

        currentY += 15; // spacing between days
    });

    // Footer
    currentY = Math.max(currentY, canvasHeight - footerHeight - PADDING);
    ctx.font = `bold 36px ${BODY_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FF0000';
    ctx.fillText('Más info en: debelingoconangel.web.app', WIDTH / 2, currentY + 20);

    // Convert to PNG buffer
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

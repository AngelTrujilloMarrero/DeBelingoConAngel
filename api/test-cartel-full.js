import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const { createCanvas, GlobalFonts } = await import('@napi-rs/canvas');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const antonPath = path.join(__dirname, 'fonts', 'Anton-Regular.ttf');
GlobalFonts.register(fs.readFileSync(antonPath), 'Anton');

const robotoPath = path.join(__dirname, 'fonts', 'Roboto-Regular.ttf');
GlobalFonts.register(fs.readFileSync(robotoPath), 'Roboto');

const festivalEvents = [
    { day: '2026-06-06T00:00:00', hora: '20:00', tipo: 'Baile Magos', orquesta: 'Parranda Muchachos, Grupo Pa Ti' },
    { day: '2026-06-12T00:00:00', hora: '23:00', tipo: 'Baile Normal', orquesta: 'Saoco' },
    { day: '2026-06-13T00:00:00', hora: '23:00', tipo: 'Cerveza', orquesta: 'David Pérez, Swing Na Ma' }
];

const lugar = 'Malpaís';
const municipio = 'Candelaria';

// --- paste generateCartel logic ---
const TITLE_FONT = 'Anton';
const BODY_FONT = 'Roboto';
const WIDTH = 1080;
const PADDING = 30;

const titleFontSize = Math.round(24 * 3.5); // 84px
const subtitleFontSize = Math.round(24 * 2.8); // 67px
const dayFontSize = Math.round(24 * 1.8); // 43px
const eventFontSize = Math.round(24 * 1.3); // 31px

const eventsByDay = {};
festivalEvents.forEach(event => {
    const dayKey = event.day.split('T')[0];
    if (!eventsByDay[dayKey]) eventsByDay[dayKey] = [];
    eventsByDay[dayKey].push(event);
});
const sortedDays = Object.keys(eventsByDay).sort();
let contentHeight = PADDING + 60 + 40 + titleFontSize + subtitleFontSize + 10 + 40 + 50;
sortedDays.forEach(dayKey => {
    contentHeight += dayFontSize + 20;
    eventsByDay[dayKey].forEach(() => { contentHeight += eventFontSize + 15; });
    contentHeight += 30;
});
contentHeight += 80 + PADDING;

const canvasHeight = Math.max(1080, contentHeight);
const canvas = createCanvas(WIDTH, canvasHeight);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0, 0, WIDTH, canvasHeight);

const boxMargin = 20;
ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
ctx.strokeStyle = '#000000';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.roundRect(boxMargin, boxMargin, WIDTH - boxMargin*2, canvasHeight - boxMargin*2, 10);
ctx.fill();
ctx.stroke();

let currentY = boxMargin + 25;
currentY += 40;

const bgColor = `hsl(10, 70%, 50%)`;
ctx.font = `${titleFontSize}px ${TITLE_FONT}`;
const titleText = `VERBENAS ${lugar.toUpperCase()}`;
const subtitleText = municipio.toUpperCase();

let maxTextWidth = Math.max(ctx.measureText(titleText).width, ctx.measureText(subtitleText).width);
const pillW = Math.min(maxTextWidth + 80, WIDTH - boxMargin*2 - 40);
const pillH = titleFontSize + subtitleFontSize + 60;
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
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.strokeText(txt, WIDTH / 2 + 4, y + 4);
    ctx.fillText(txt, WIDTH / 2 + 4, y + 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(txt, WIDTH / 2, y);
};
currentY += titleFontSize + 15;
drawTitleText(titleText, currentY, titleFontSize);
currentY += subtitleFontSize;
drawTitleText(subtitleText, currentY, subtitleFontSize);
currentY += 70;

const drawThickText = (txt, y, fontSize, fillCol, strokeCol, strokeWidth) => {
    ctx.font = `${fontSize}px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    if (strokeWidth > 0 && strokeCol) {
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = strokeCol;
        ctx.strokeText(txt, WIDTH / 2, y);
    }
    ctx.fillStyle = fillCol;
    ctx.fillText(txt, WIDTH / 2, y);
};

sortedDays.forEach(dayKey => {
    const dayDate = new Date(dayKey + 'T12:00:00');
    const dayName = dayDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    drawThickText(dayName, currentY, dayFontSize, '#006400', '#FFD700', 6);
    currentY += dayFontSize + 15;

    eventsByDay[dayKey].forEach(event => {
        const parts = [];
        parts.push({ text: `${event.hora}H`, fill: '#0000FF', stroke: '#FFD700' });
        if (event.tipo !== 'Baile Normal') {
            parts.push({ text: `|${event.tipo}`, fill: '#000000', stroke: '#FFD700' });
        }
        parts.push({ text: `|${event.orquesta}`, fill: '#000000', stroke: '#FF0000' });

        ctx.font = `${eventFontSize}px ${TITLE_FONT}`;
        let totalWidth = 0;
        parts.forEach(p => { totalWidth += ctx.measureText(p.text).width; });
        let drawX = WIDTH / 2 - totalWidth / 2;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
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
    currentY += 20;
});

fs.writeFileSync('test_cartel_full.png', canvas.toBuffer('image/png'));
console.log("Done");

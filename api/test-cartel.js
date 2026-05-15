import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const { createCanvas, GlobalFonts } = await import('@napi-rs/canvas');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const antonPath = path.join(__dirname, 'fonts', 'Anton-Regular.ttf');
GlobalFonts.register(fs.readFileSync(antonPath), 'Anton');

const WIDTH = 1200;
const canvasHeight = 1200;
const canvas = createCanvas(WIDTH, canvasHeight);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0, 0, WIDTH, canvasHeight);

const currentY = 300;
const TITLE_FONT = 'Anton';
const dayName = "SÁBADO, 6 DE JUNIO DE 2026";

ctx.font = `36px ${TITLE_FONT}`;
ctx.textAlign = 'center';
ctx.lineJoin = 'round';

ctx.lineWidth = 6;
ctx.strokeStyle = '#FFD700'; // Gold
ctx.strokeText(dayName, WIDTH / 2, currentY);

ctx.fillStyle = '#006400';
ctx.fillText(dayName, WIDTH / 2, currentY);

fs.writeFileSync('test_cartel.png', canvas.toBuffer('image/png'));
console.log("Done");

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_URL = "https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app/events.json";
const ORCH_DB_URL = "https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app/orchestras.json";
const OUTPUT_FILE = path.join(__dirname, '../src/data/historicalStats.json');
const ORCH_OUTPUT_FILE = path.join(__dirname, '../src/data/orchestraArchive.json');

async function generate() {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;
    const isForce = process.argv.includes('--force');

    // Comprobar si ya tenemos los datos del año pasado
    if (fs.existsSync(OUTPUT_FILE) && !isForce) {
        try {
            const existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
            if (existingData.years && existingData.years[prevYear.toString()]) {
                console.log(`ℹ️  Los datos de ${prevYear} ya están presentes en el archivo estático. Saltando consulta a DB.`);
                return;
            }
        } catch (e) {
            console.log("⚠️  Error leyendo archivo existente, regenerando...");
        }
    }

    console.log("🚀 Iniciando generación de estadísticas históricas (Consultando Firebase)...");

    try {
        const response = await fetch(DB_URL);
        const eventsData = await response.json();

        const historicalStats = {
            years: {},
            events: [] // Todos los eventos históricos para análisis detallado
        };

        function getMonthName(dateStr) {
            const date = new Date(dateStr);
            const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
            return months[date.getMonth()];
        }

        Object.entries(eventsData).forEach(([id, event]) => {
            if (event.cancelado) return;

            const dayStr = event.day;
            if (!dayStr) return;

            const eventDate = new Date(dayStr);
            const year = eventDate.getFullYear();

            // Solo procesar años anteriores al actual
            if (year >= currentYear) return;

            historicalStats.events.push({ id, ...event });

            const yearStr = year.toString();
            if (!historicalStats.years[yearStr]) {
                historicalStats.years[yearStr] = {
                    orquestaCount: {},
                    monthlyOrquestaCount: {},
                    monthlyEventCount: {}
                };
            }

            const month = getMonthName(dayStr);
            const orquestas = (event.orquesta || "")
                .split(',')
                .map(o => o.trim())
                .filter(o => o && o !== 'DJ');

            const stats = historicalStats.years[yearStr];

            stats.monthlyEventCount[month] = (stats.monthlyEventCount[month] || 0) + 1;

            orquestas.forEach(orq => {
                stats.orquestaCount[orq] = (stats.orquestaCount[orq] || 0) + 1;

                if (!stats.monthlyOrquestaCount[month]) {
                    stats.monthlyOrquestaCount[month] = {};
                }
                stats.monthlyOrquestaCount[month][orq] = (stats.monthlyOrquestaCount[month][orq] || 0) + 1;
            });
        });

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(historicalStats, null, 2));
        console.log(`✅ ¡Éxito! Archivo generado en ${OUTPUT_FILE}`);
        console.log(`Años procesados: ${Object.keys(historicalStats.years).join(', ')}`);
        console.log(`Total eventos históricos: ${historicalStats.events.length}`);

        console.log(`Total eventos históricos: ${historicalStats.events.length}`);

        // --- NUEVO: MIGRACIÓN DE ORQUESTAS ---
        console.log("🎻 Generando archivo de orquestas archivadas...");
        const orchResponse = await fetch(ORCH_DB_URL);
        const orchestrasData = await orchResponse.json();

        if (orchestrasData) {
            const orchestras = [];
            Object.entries(orchestrasData).forEach(([id, orch]) => {
                const hasData = orch.phone || orch.facebook || orch.instagram || orch.other || orch.type;
                if (hasData) {
                    orchestras.push({ ...orch, id });
                }
            });

            fs.writeFileSync(ORCH_OUTPUT_FILE, JSON.stringify({
                orchestras,
                lastUpdated: new Date().toISOString(),
                total: orchestras.length,
                generatedBy: "Build Script"
            }, null, 2));
            console.log(`✅ ¡Éxito! Archivo de orquestas generado: ${orchestras.length} orquestas.`);
        }

    } catch (error) {
        console.error("❌ Error generando estadísticas/orquestas:", error);
    }
}

generate();

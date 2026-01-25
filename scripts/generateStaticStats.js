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

        let historicalStats = {
            years: {},
            events: [] // Todos los eventos históricos para análisis detallado
        };

        // CARGAR DATOS PREVIOS SI EXISTEN PARA NO PERDERLOS (ya que en FB se borran tras migrar)
        if (fs.existsSync(OUTPUT_FILE)) {
            try {
                const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
                historicalStats = {
                    years: existing.years || {},
                    events: existing.events || []
                };
                console.log(`📂 Cargados ${historicalStats.events.length} eventos históricos del archivo local.`);
            } catch (e) {
                console.warn("⚠️ No se pudo cargar el archivo historicalStats previo.");
            }
        }

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

            // Solo procesar años anteriores al actual que NO estén ya en el archive
            // O procesarlos todos si queremos actualizar (overlap manual)
            if (year >= currentYear) return;

            // Evitar duplicados (por ID)
            if (historicalStats.events.find(e => e.id === id)) return;

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

        let archivedOrchestras = [];
        if (fs.existsSync(ORCH_OUTPUT_FILE)) {
            try {
                const existingOrch = JSON.parse(fs.readFileSync(ORCH_OUTPUT_FILE, 'utf8'));
                archivedOrchestras = existingOrch.orchestras || [];
            } catch (e) { }
        }

        if (orchestrasData) {
            const orchestraMap = new Map();
            // 1. Empezar con lo que ya tenemos archivado
            archivedOrchestras.forEach(o => orchestraMap.set(o.name, o));

            // 2. Sobrescribir con lo que venga de Firebase (ediciones recientes)
            Object.entries(orchestrasData).forEach(([id, orch]) => {
                const hasData = orch.phone || orch.facebook || orch.instagram || orch.other || orch.type;
                if (hasData) {
                    orchestraMap.set(orch.name, { ...orch, id });
                }
            });

            const finalOrchestras = Array.from(orchestraMap.values());

            fs.writeFileSync(ORCH_OUTPUT_FILE, JSON.stringify({
                orchestras: finalOrchestras,
                lastUpdated: new Date().toISOString(),
                total: finalOrchestras.length,
                generatedBy: "Build Script (Merged)"
            }, null, 2));
            console.log(`✅ ¡Éxito! Archivo de orquestas actualizado: ${finalOrchestras.length} orquestas.`);
        }

    } catch (error) {
        console.error("❌ Error generando estadísticas/orquestas:", error);
    }
}

generate();

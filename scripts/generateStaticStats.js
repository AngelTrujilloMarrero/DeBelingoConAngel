import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_URL = "https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app/events.json";
const ORCH_DB_URL = "https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app/orchestras.json";
const OUTPUT_FILE = path.join(__dirname, '../src/data/historicalStats.json');
const ORCH_OUTPUT_FILE = path.join(__dirname, '../src/data/orchestraArchive.json');
const EVENTS_ARCHIVE_DIR = path.join(__dirname, '../public/events-archive');
const CLEANUP_MANIFEST = path.join(__dirname, '../cleanup-events.json');

async function generate() {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;
    const isForce = process.argv.includes('--force');

    // Asegurarse de que el directorio de eventos archive existe
    if (!fs.existsSync(EVENTS_ARCHIVE_DIR)) {
        fs.mkdirSync(EVENTS_ARCHIVE_DIR, { recursive: true });
        console.log(`📁 Creado directorio ${EVENTS_ARCHIVE_DIR}`);
    }

    // Limpiar manifiesto previo si existe
    if (fs.existsSync(CLEANUP_MANIFEST)) {
        fs.unlinkSync(CLEANUP_MANIFEST);
    }

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

        if (!eventsData) {
            console.log("ℹ️ No hay eventos en la base de datos para procesar.");
            return;
        }

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

        const eventsToDelete = {};
        let pastYearEventsCount = 0;
        const existingEventIds = new Set(historicalStats.events.map(e => e.id));

        Object.entries(eventsData).forEach(([id, event]) => {
            const dayStr = event.day;
            if (!dayStr) return;

            const eventDate = new Date(dayStr);
            const year = eventDate.getFullYear();

            // Solo procesar años anteriores al actual
            if (year >= currentYear) return;

            pastYearEventsCount++;

            // Añadir al manifiesto de eliminación
            eventsToDelete[id] = null;

            // No procesar estadísticas para eventos cancelados, pero sí los borramos de la DB activa
            if (event.cancelado) return;

            // Evitar duplicados en el archive (por ID)
            if (existingEventIds.has(id)) return;

            historicalStats.events.push({ id, ...event });
            existingEventIds.add(id);

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

        // --- VERIFICACIÓN DE SEGURIDAD ---
        console.log(`🔍 Verificando: ${pastYearEventsCount} eventos detectados de años anteriores.`);
        
        // Verificar que todos los eventos a borrar existen en el archive (excepto los cancelados que decidimos no archivar en stats pero sí borrar)
        const archiveIds = new Set(historicalStats.events.map(e => e.id));
        let verifiedCount = 0;
        let cancelledCount = 0;

        Object.keys(eventsToDelete).forEach(id => {
            if (archiveIds.has(id)) {
                verifiedCount++;
            } else if (eventsData[id].cancelado) {
                cancelledCount++;
            }
        });

        if (verifiedCount + cancelledCount === pastYearEventsCount) {
            console.log(`✅ Verificación exitosa: ${verifiedCount} eventos archivados y ${cancelledCount} cancelados listos para limpieza.`);
            if (pastYearEventsCount > 0) {
                fs.writeFileSync(CLEANUP_MANIFEST, JSON.stringify(eventsToDelete, null, 2));
                console.log(`📝 Manifiesto de limpieza generado: ${CLEANUP_MANIFEST}`);
            }
        } else {
            console.error("❌ ERROR DE VERIFICACIÓN: No todos los eventos antiguos están respaldados en el archive.");
            console.error(`Detectados: ${pastYearEventsCount}, Archivados: ${verifiedCount}, Cancelados: ${cancelledCount}`);
            // No generamos el manifiesto si falla la verificación
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(historicalStats, null, 2));
        console.log(`✅ ¡Éxito! Archivo generado en ${OUTPUT_FILE}`);
        console.log(`Años procesados: ${Object.keys(historicalStats.years).join(', ')}`);
        console.log(`Total eventos históricos: ${historicalStats.events.length}`);

        // --- NUEVO: GENERAR ARCHIVOS DE EVENTOS POR AÑO PARA FRONTEND ---
        console.log("📂 Generando archivos de eventos por año para el frontend...");
        
        // Agrupar eventos por año para archivos separados
        const eventsByYear = {};
        historicalStats.events.forEach(event => {
            const eventYear = new Date(event.day).getFullYear();
            if (!eventsByYear[eventYear]) {
                eventsByYear[eventYear] = [];
            }
            eventsByYear[eventYear].push(event);
        });

        // Generar un archivo JSON por cada año
        Object.entries(eventsByYear).forEach(([year, yearEvents]) => {
            const yearFilePath = path.join(EVENTS_ARCHIVE_DIR, `${year}.json`);
            const yearData = {
                year: parseInt(year),
                totalEvents: yearEvents.length,
                events: yearEvents,
                exportDate: new Date().toISOString(),
                migratedFromFirebase: true,
                migrationVersion: "1.0-frontend-script"
            };
            
            fs.writeFileSync(yearFilePath, JSON.stringify(yearData, null, 2));
            console.log(`✅ Archivo generado: ${year}.json con ${yearEvents.length} eventos`);
        });

        // Generar índice de años disponibles
        const indexPath = path.join(EVENTS_ARCHIVE_DIR, 'index.json');
        const availableYears = Object.keys(eventsByYear).map(Number).sort((a, b) => b - a);
        fs.writeFileSync(indexPath, JSON.stringify({
            years: availableYears,
            lastUpdated: new Date().toISOString(),
            generatedBy: "Frontend Build Script"
        }, null, 2));
        console.log(`✅ Índice de años actualizado: ${availableYears.join(', ')}`);

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

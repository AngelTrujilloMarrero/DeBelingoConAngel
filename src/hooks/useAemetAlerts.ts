import { useState, useEffect, useRef } from 'react';
import { getSecurityHeaders } from '../utils/firebase';
import { useTurnstile } from '../components/TurnstileProvider';

export type AlertLevel = 'yellow' | 'orange' | 'red' | null;

export interface AemetAlert {
    level: AlertLevel;
    phenomenon: string;
    zone: string;
    description: string;
    link: string;
    date: string; // YYYY-MM-DD
}

const ZONE_MAPPING: Record<string, string> = {
    // Metropolitana
    "Santa Cruz": "Metropolitana",
    "Laguna": "Metropolitana",
    "Rosario": "Metropolitana",
    "Tegueste": "Metropolitana",
    // Norte
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
    // Este, Sur y Oeste
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

export const useAemetAlerts = () => {
    const [alerts, setAlerts] = useState<AemetAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const { token } = useTurnstile();

    useEffect(() => {
        let isMounted = true;

        const fetchAlerts = async () => {
            try {
                setLoading(true);
                const headers = await getSecurityHeaders();

                // Determinar URL base
                const API_BASE_URL = import.meta.env.VITE_VERCEL_API_URL ||
                    (import.meta.env.PROD ? 'https://de-belingo-con-angel.vercel.app' : '');

                const proxyUrl = `${API_BASE_URL}/api/aemet-proxy`;

                console.log(`[AEMET] Fetching alerts from: ${proxyUrl}`);
                const response = await fetch(proxyUrl, { headers });

                if (!response.ok) {
                    console.warn(`[AEMET] Proxy unavailable (${response.status})`);
                    if (isMounted) {
                        setAlerts([]);
                        setLoading(false);
                    }
                    return;
                }

                const xmlText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "text/xml");
                const items = xmlDoc.querySelectorAll("item");

                const parsedAlerts: AemetAlert[] = [];

                items.forEach(item => {
                    const title = item.querySelector("title")?.textContent || "";
                    const description = item.querySelector("description")?.textContent || "";
                    const link = item.querySelector("link")?.textContent || "";

                    if (title.toLowerCase().includes("no hay avisos")) return;

                    // Extraer nivel
                    let level: AlertLevel = null;
                    if (title.toLowerCase().includes("rojo")) level = 'red';
                    else if (title.toLowerCase().includes("naranja")) level = 'orange';
                    else if (title.toLowerCase().includes("amarillo")) level = 'yellow';

                    if (!level) return;

                    // Extraer zona (Norte, Metropolitana, Este, sur y oeste, Cumbres)
                    let zone = "";
                    if (title.toLowerCase().includes("metropolitana")) zone = "Metropolitana";
                    else if (title.toLowerCase().includes("norte")) zone = "Norte";
                    else if (title.toLowerCase().includes("este, sur y oeste")) zone = "Sur";
                    else if (title.toLowerCase().includes("cumbres")) zone = "Cumbres";

                    // Extraer fenómeno (Formato: Aviso. Nivel X. Fenómeno. Zona)
                    // Intentamos split por punto o por " por "
                    let phenomenon = "Fenómeno adverso";
                    const parts = title.split(".");
                    if (parts.length >= 3) {
                        phenomenon = parts[2].trim();
                    } else if (title.includes(" por ")) {
                        phenomenon = title.split(" por ")[1]?.split(" en ")[0] || phenomenon;
                    }

                    // Extraer fecha (AEMET RSS usa formato DD-MM-YYYY en descripción)
                    // Soportamos tanto guiones como barras
                    const dateMatch = description.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
                    let alertDate = "";
                    if (dateMatch) {
                        alertDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
                    } else {
                        const pubDate = item.querySelector("pubDate")?.textContent;
                        if (pubDate) {
                            const d = new Date(pubDate);
                            alertDate = d.toISOString().split('T')[0];
                        }
                    }

                    parsedAlerts.push({
                        level,
                        phenomenon,
                        zone,
                        description,
                        link,
                        date: alertDate
                    });
                });

                console.log(`[AEMET] Parsed ${parsedAlerts.length} active alerts.`, parsedAlerts);

                // Forzamos el setAlerts siempre para que el componente reciba los datos
                // React gestiona perfectamente setStates en componentes desmontados en versiones modernas
                setAlerts(parsedAlerts);
            } catch (error) {
                console.error("[AEMET] Error fetching alerts:", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchAlerts();

        return () => {
            isMounted = false;
        };
    }, []);


    const getAlertForEvent = (municipio: string, date: string) => {
        if (!municipio || !date) return undefined;

        // 1. Normalizar fecha del evento (YYYY-MM-DD)
        const eventDate = date.split('T')[0].trim();

        // 2. Normalizar municipio del evento
        const munSearch = municipio.toLowerCase();

        let eventZone = "";
        for (const [key, zone] of Object.entries(ZONE_MAPPING)) {
            if (munSearch.includes(key.toLowerCase())) {
                eventZone = zone;
                break;
            }
        }

        if (!eventZone) {
            // console.log(`[AEMET] ❌ No se encontró zona para: ${municipio}`);
            return undefined;
        }

        // 3. Buscar coincidencia exacta
        const found = alerts.find(a => {
            // Normalizar zona de la alerta (por si acaso viene con espacios)
            const alertZone = a.zone.trim();
            const alertDate = a.date.trim();

            const zoneMatch = (alertZone === eventZone || alertZone === "Cumbres");
            const dateMatch = (alertDate === eventDate);

            return zoneMatch && dateMatch;
        });

        if (found) {
            console.log(`[AEMET] ✅ MATCH! ${municipio} (${eventZone}) coincide con alerta ${found.level} del ${eventDate}`);
        } else {
            // Si hay alertas pero ninguna coincide, investigamos por qué
            const alertsInZone = alerts.filter(a => a.zone === eventZone || a.zone === "Cumbres");
            if (alertsInZone.length > 0) {
                console.warn(`[AEMET] ⚠️ ${municipio} tiene zona (${eventZone}), pero la fecha ${eventDate} no coincide con las alertas disponibles:`,
                    alertsInZone.map(a => a.date)
                );
            }
        }

        return found;
    };

    return { alerts, loading, getAlertForEvent };
};

import { useState, useEffect } from 'react';
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
    const [hasFetched, setHasFetched] = useState(false);
    const { token } = useTurnstile();

    useEffect(() => {
        if (hasFetched) return;

        let isMounted = true;
        setHasFetched(true);

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

                if (isMounted) {
                    setAlerts(parsedAlerts);
                }
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
    }, [hasFetched]);


    const getAlertForEvent = (municipio: string, date: string) => {
        if (!municipio || !date) return undefined;

        // CORRECCIÓN CRÍTICA: Buscar si el municipio contiene la clave del mapeo
        // Esto permite que "Santa Cruz de Tenerife" coincida con "Santa Cruz"
        let eventZone = "";
        const munLower = municipio.toLowerCase();

        for (const [key, zone] of Object.entries(ZONE_MAPPING)) {
            if (munLower.includes(key.toLowerCase())) {
                eventZone = zone;
                break;
            }
        }

        if (!eventZone) return undefined;

        return alerts.find(a =>
            (a.zone === eventZone || a.zone === "Cumbres") &&
            a.date === date
        );
    };

    return { alerts, loading, getAlertForEvent };
};


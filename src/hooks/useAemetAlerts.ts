import { useState, useEffect } from 'react';
import { getSecurityHeaders } from '../utils/firebase';

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

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                // Determinar URL base (igual que en secureImageUpload.ts)
                const API_BASE_URL = import.meta.env.VITE_VERCEL_API_URL ||
                    (import.meta.env.PROD ? 'https://de-belingo-con-angel.vercel.app' : '');

                // Usamos nuestro propio proxy en Vercel para evitar problemas de CORS
                const proxyUrl = `${API_BASE_URL}/api/aemet-proxy`;

                // Obtener cabeceras de seguridad unificadas
                const headers = await getSecurityHeaders();

                const response = await fetch(proxyUrl, {
                    headers
                });

                if (!response.ok) {
                    console.warn(`AEMET Proxy unavailable (${response.status}). Alerts disabled.`);
                    setAlerts([]);
                    setLoading(false);
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

                    // Extraer fecha (AEMET RSS usa formato DD-MM-YYYY en descripción)
                    // Formato en descripción: "de 00:00 18-01-2026 WET (UTC) a 23:59 18-01-2026 WET (UTC)"
                    const dateMatch = description.match(/(\d{2})-(\d{2})-(\d{4})/);
                    let alertDate = "";
                    if (dateMatch) {
                        alertDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
                    } else {
                        // Si no hay fecha en descripción, buscar en pubDate
                        const pubDate = item.querySelector("pubDate")?.textContent;
                        if (pubDate) {
                            const d = new Date(pubDate);
                            alertDate = d.toISOString().split('T')[0];
                        }
                    }

                    parsedAlerts.push({
                        level,
                        phenomenon: title.split(" por ")[1]?.split(" en ")[0] || "Fenómeno adverso",
                        zone,
                        description,
                        link,
                        date: alertDate
                    });
                });

                setAlerts(parsedAlerts);
            } catch (error) {
                console.error("Error fetching AEMET alerts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, []);

    const getAlertForEvent = (municipio: string, date: string) => {
        const eventZone = ZONE_MAPPING[municipio] || "";
        return alerts.find(a =>
            (a.zone === eventZone || a.zone === "Cumbres") &&
            a.date === date
        );
    };

    return { alerts, loading, getAlertForEvent };
};

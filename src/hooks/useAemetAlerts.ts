import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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
    onset?: string; // HH:MM - hora de inicio del aviso
    expires?: string; // HH:MM - hora de fin del aviso
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
    const { token } = useTurnstile();

    const fetchAlerts = async (): Promise<AemetAlert[]> => {
        const headers = await getSecurityHeaders();

        const API_BASE_URL = import.meta.env.VITE_VERCEL_API_URL ||
            (import.meta.env.PROD ? 'https://de-belingo-con-angel.vercel.app' : '');

        const proxyUrl = `${API_BASE_URL}/api/aemet-proxy`;

        console.log(`[AEMET] Fetching alerts from: ${proxyUrl}`);
        const response = await fetch(proxyUrl, { headers });

        if (!response.ok) {
            console.warn(`[AEMET] Proxy unavailable (${response.status})`);
            return [];
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

            let level: AlertLevel = null;
            if (title.toLowerCase().includes("rojo")) level = 'red';
            else if (title.toLowerCase().includes("naranja")) level = 'orange';
            else if (title.toLowerCase().includes("amarillo")) level = 'yellow';

            if (!level) return;

            let zone = "";
            if (title.toLowerCase().includes("metropolitana")) zone = "Metropolitana";
            else if (title.toLowerCase().includes("norte")) zone = "Norte";
            else if (title.toLowerCase().includes("este, sur y oeste")) zone = "Sur";
            else if (title.toLowerCase().includes("cumbres")) zone = "Cumbres";

            let phenomenon = "Fenómeno adverso";
            const parts = title.split(".");
            if (parts.length >= 3) {
                phenomenon = parts[2].trim();
            } else if (title.includes(" por ")) {
                phenomenon = title.split(" por ")[1]?.split(" en ")[0] || phenomenon;
            }

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

            let onset: string | undefined;
            let expires: string | undefined;

            const onsetMatch = description.match(/de\s+(\d{2}):(\d{2})/);
            if (onsetMatch) {
                onset = `${onsetMatch[1]}:${onsetMatch[2]}`;
            }

            const expiresMatch = description.match(/a\s+(\d{2}):(\d{2})/);
            if (expiresMatch) {
                expires = `${expiresMatch[1]}:${expiresMatch[2]}`;
            }

            parsedAlerts.push({
                level,
                phenomenon,
                zone,
                description,
                link,
                date: alertDate,
                onset,
                expires
            });
        });

        console.log(`[AEMET] Parsed ${parsedAlerts.length} active alerts.`, parsedAlerts);
        return parsedAlerts;
    };

    const { data: alerts = [], isLoading: loading } = useQuery({
        queryKey: ['aemetAlerts'],
        queryFn: fetchAlerts,
        staleTime: 1000 * 60 * 15,
    });


    const getAlertForEvent = (municipio: string, date: string, hora?: string) => {
        if (!municipio || !date) return undefined;

        const eventDate = date.split('T')[0].trim();
        const eventTime = hora ? hora.trim() : null;

        const munSearch = municipio.toLowerCase();

        let eventZone = "";
        for (const [key, zone] of Object.entries(ZONE_MAPPING)) {
            if (munSearch.includes(key.toLowerCase())) {
                eventZone = zone;
                break;
            }
        }

        if (!eventZone) {
            return undefined;
        }

        const found = alerts.find(a => {
            const alertZone = a.zone.trim();
            const alertDate = a.date.trim();
            const zoneMatch = (alertZone === eventZone || alertZone === "Cumbres");
            const dateMatch = (alertDate === eventDate);

            if (!zoneMatch || !dateMatch) return false;

            if (!eventTime || !a.onset) {
                console.log(`[AEMET] Showing alert (no time check): eventTime=${eventTime}, onset=${a.onset}`);
                return true;
            }

            const eventMinutes = parseInt(eventTime.split(':')[0]) * 60 + parseInt(eventTime.split(':')[1]);
            const onsetMinutes = parseInt(a.onset.split(':')[0]) * 60 + parseInt(a.onset.split(':')[1]);
            const expiresMinutes = a.expires ? parseInt(a.expires.split(':')[0]) * 60 + parseInt(a.expires.split(':')[1]) : 24 * 60;

            const inRange = eventMinutes >= onsetMinutes && eventMinutes <= expiresMinutes;
            console.log(`[AEMET] Time check: event=${eventTime}(${eventMinutes}) onset=${a.onset}(${onsetMinutes}) expires=${a.expires || '23:59'}(${expiresMinutes}) inRange=${inRange}`);

            return inRange;
        });

        return found;
    };

    return { alerts, loading, getAlertForEvent };
};

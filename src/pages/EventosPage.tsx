import React, { useState, useCallback } from 'react';
import EventsList from '../components/EventsList';
import { Event as AppEvent, RecentActivityItem } from '../types';
import { runTransaction, exportUsageRef } from '../utils/firebase';
import { isEmbeddedBrowser } from '../utils/helpers';
import html2canvas from 'html2canvas';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface EventosPageProps {
    events: AppEvent[];
    recentActivity: RecentActivityItem[];
}

const EventosPage: React.FC<EventosPageProps> = ({ events, recentActivity }) => {
    const [festivalSelectionVisible, setFestivalSelectionVisible] = useState(false);
    const [selectedFestival, setSelectedFestival] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const checkRateLimit = (limit: number): boolean => {
        const key = 'user_export_history';
        try {
            const now = Date.now();
            const timeWindow = 60 * 60 * 1000;
            const stored = localStorage.getItem(key);
            let timestamps: number[] = stored ? JSON.parse(stored) : [];
            timestamps = timestamps.filter(ts => now - ts < timeWindow);

            if (timestamps.length >= limit) {
                return false;
            }

            timestamps.push(now);
            localStorage.setItem(key, JSON.stringify(timestamps));
            return true;
        } catch (e) {
            console.error("Error in rate limit check:", e);
            return true;
        }
    };

    const checkGlobalRateLimit = async (limit: number): Promise<boolean> => {
        try {
            const result = await runTransaction(exportUsageRef, (currentData) => {
                const now = Date.now();
                const timeWindow = 60 * 60 * 1000;

                let timestamps: number[] = [];
                if (currentData) {
                    if (Array.isArray(currentData)) {
                        timestamps = currentData;
                    } else if (typeof currentData === 'object') {
                        timestamps = Object.values(currentData).filter((v): v is number => typeof v === 'number');
                    }
                }

                timestamps = timestamps.filter(ts => typeof ts === 'number' && now - ts < timeWindow);

                if (timestamps.length >= limit) {
                    return undefined;
                }

                timestamps.push(now);
                return timestamps;
            });

            return result.committed;
        } catch (e) {
            console.error("Error in global rate limit check:", e);
            return true;
        }
    };

    const exportByDateToImage = useCallback(async (startDateStr?: string, endDateStr?: string) => {
        let startDate: Date, endDate: Date;

        if (startDateStr && endDateStr) {
            startDate = new Date(startDateStr);
            endDate = new Date(endDateStr);
        } else {
            const currentDate = new Date();
            startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - 1);
            endDate = new Date(currentDate);
            const daysUntilSunday = 7 - currentDate.getDay();
            if (currentDate.getDay() === 0) {
                endDate.setDate(currentDate.getDate());
            } else {
                endDate.setDate(currentDate.getDate() + daysUntilSunday);
            }
        }

        const filteredEvents = events.filter(event => {
            const eventDate = new Date(event.day + 'T00:00:00');
            const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
            return eventDate >= start && eventDate <= end;
        });

        if (filteredEvents.length === 0) {
            alert('No hay eventos en el intervalo seleccionado.');
            return;
        }

        if (!checkRateLimit(20)) {
            alert('Has alcanzado el límite de 20 descargas por hora por usuario.');
            return;
        }

        if (!await checkGlobalRateLimit(40)) {
            alert('Se ha alcanzado el límite global de 40 descargas por hora. Inténtalo más tarde.');
            return;
        }

        const groupedEvents = filteredEvents.reduce((acc, event) => {
            const date = event.day;
            if (!acc[date]) acc[date] = [];
            acc[date].push(event);
            return acc;
        }, {} as Record<string, AppEvent[]>);

        for (const date in groupedEvents) {
            groupedEvents[date].sort((a, b) => {
                const timeA = a.hora || '00:00';
                const timeB = b.hora || '00:00';
                return timeA.localeCompare(timeB);
            });
        }

        const sortedDates = Object.keys(groupedEvents).sort();

        const maxWidth = 1200;
        const colors = {
            dia: '#5c4033',
            hora: '#00008b',
            municipio: '#006400',
            lugar: '#006400',
            tipo: '#9400d3',
            texto: '#000000'
        };
        const maxFontSize = 24;
        const minFontSize = 10;
        const initialFontSize = Math.max(minFontSize, Math.min(maxFontSize, Math.floor(maxWidth / 25)));
        const lineHeightFactor = 1.2;
        const maxHeight = 1200;

        function getFittingSubstring(text: string, ctx: CanvasRenderingContext2D, maxWidth: number) {
            let fitIndex = 0;
            let lastSpaceIndex = -1;
            let currentWidth = 0;

            for (let i = 0; i < text.length; i++) {
                if (text[i] === ' ') lastSpaceIndex = i;
                currentWidth = ctx.measureText(text.substring(0, i + 1)).width;

                if (currentWidth > maxWidth) {
                    if (lastSpaceIndex !== -1 && lastSpaceIndex < i) {
                        return text.substring(0, lastSpaceIndex + 1);
                    }
                    return text.substring(0, i > 0 ? i : 0);
                }
                fitIndex = i + 1;
            }
            return text.substring(0, fitIndex);
        }

        function calculateEventLines(event: AppEvent, ctx: CanvasRenderingContext2D, maxWidth: number) {
            let lines = 0;
            let currentLineWidth = 0;
            const segments = [
                { text: event.orquesta || '', color: colors.texto },
                { text: event.lugar ? ` - ${event.lugar}` : '', color: colors.lugar },
                { text: event.municipio ? ` - ${event.municipio}` : '', color: colors.municipio },
                { text: event.hora ? ` - ${event.hora}` : '', color: colors.hora },
                { text: event.tipo ? ` - ${event.tipo}` : '', color: colors.tipo }
            ];
            let isFirstSegmentOnLine = true;
            segments.forEach(({ text }) => {
                if (!text) return;
                let remainingText = text.trim();
                while (remainingText.length > 0) {
                    const prefix = (currentLineWidth > 0 || !isFirstSegmentOnLine) ? ' ' : '';
                    const effectiveText = prefix + remainingText;
                    const availableWidth = maxWidth - currentLineWidth;
                    let substring = getFittingSubstring(effectiveText, ctx, availableWidth);
                    if (substring.length === 0 || (substring === prefix && remainingText.length > 0)) {
                        lines++;
                        currentLineWidth = 0;
                        isFirstSegmentOnLine = true;
                        continue;
                    }
                    if (substring.startsWith(prefix)) {
                        substring = substring.substring(prefix.length);
                    }
                    currentLineWidth += ctx.measureText(prefix + substring).width;
                    remainingText = remainingText.substring(substring.length).trimStart();
                    if (isFirstSegmentOnLine) {
                        lines++;
                        isFirstSegmentOnLine = false;
                    }
                    if (remainingText.length > 0) {
                        currentLineWidth = 0;
                        isFirstSegmentOnLine = true;
                    }
                }
            });
            return Math.max(1, lines);
        }

        const formatDate = (dateStr: string) => {
            const date = new Date(dateStr + 'T12:00:00');
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase();
            const formattedDate = date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
            return `${formattedDate} (${dayName})`;
        };

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.font = `bold ${initialFontSize}px Arial`;

        let requiredHeight = 0;
        const initialLineHeight = initialFontSize * lineHeightFactor;
        sortedDates.forEach((fecha) => {
            requiredHeight += initialLineHeight;
            groupedEvents[fecha].forEach(event => {
                const eventLines = calculateEventLines(event, tempCtx, maxWidth);
                requiredHeight += initialLineHeight * eventLines;
            });
        });

        let fontSize = initialFontSize;
        let finalLineHeight = initialLineHeight;

        if (requiredHeight > maxHeight) {
            const scaleFactor = maxHeight / requiredHeight;
            fontSize = Math.max(minFontSize, Math.floor(initialFontSize * scaleFactor));
            finalLineHeight = fontSize * lineHeightFactor;
            tempCtx.font = `bold ${fontSize}px Arial`;
            requiredHeight = 0;
            sortedDates.forEach((fecha) => {
                requiredHeight += finalLineHeight;
                groupedEvents[fecha].forEach(event => {
                    const eventLines = calculateEventLines(event, tempCtx, maxWidth);
                    requiredHeight += finalLineHeight * eventLines;
                });
            });
        }
        const canvasHeight = requiredHeight;

        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textBaseline = 'top';
        ctx.font = `bold ${fontSize}px Arial`;

        let currentY = 0;
        sortedDates.forEach((fecha, index) => {
            ctx.fillStyle = colors.dia;
            const dateText = formatDate(fecha);
            ctx.fillText(dateText, 0, currentY);

            if (index === 0) {
                const dateWidth = ctx.measureText(dateText).width;
                const generationDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const additionalText = ` - https://debelingoconangel.web.app - Generado ${generationDate}`;
                ctx.fillStyle = 'red';
                if (dateWidth + ctx.measureText(additionalText).width <= maxWidth) {
                    ctx.fillText(additionalText, dateWidth, currentY);
                }
            }

            ctx.strokeStyle = colors.dia;
            ctx.lineWidth = 1;
            const underlineMargin = 2;
            const lineY = currentY + fontSize + underlineMargin;
            ctx.beginPath();
            ctx.moveTo(0, lineY);
            ctx.lineTo(maxWidth, lineY);
            ctx.stroke();
            currentY += finalLineHeight;

            groupedEvents[fecha].forEach(event => {
                const segments = [
                    { text: event.orquesta || '', color: colors.texto },
                    { text: event.lugar ? ` - ${event.lugar}` : '', color: colors.lugar },
                    { text: event.municipio ? ` - ${event.municipio}` : '', color: colors.municipio },
                    { text: event.hora ? ` - ${event.hora}` : '', color: colors.hora },
                    { text: event.tipo ? ` - ${event.tipo}` : '', color: colors.tipo }
                ];
                let currentX = 0;
                segments.forEach(({ text, color }) => {
                    if (!text) return;
                    ctx.fillStyle = color;
                    let remainingText = text.trim();
                    while (remainingText.length > 0) {
                        const availableWidth = maxWidth - currentX;
                        let substring = getFittingSubstring(remainingText, ctx, availableWidth);
                        if (substring === '' && currentX === 0 && ctx.measureText(remainingText.split(' ')[0]).width > maxWidth) {
                            let breakIndex = 0;
                            for (let k = 1; k <= remainingText.length; k++) {
                                if (ctx.measureText(remainingText.substring(0, k)).width > maxWidth) {
                                    breakIndex = k - 1;
                                    break;
                                }
                                breakIndex = k;
                            }
                            substring = remainingText.substring(0, breakIndex);
                            if (substring === '') substring = remainingText[0];
                        }
                        else if (substring === '') {
                            currentY += finalLineHeight;
                            currentX = 0;
                            continue;
                        }
                        ctx.fillText(substring, currentX, currentY);
                        currentX += ctx.measureText(substring).width;
                        remainingText = remainingText.substring(substring.length).trimStart();
                        if (remainingText.length > 0) {
                            currentY += finalLineHeight;
                            currentX = 0;
                        }
                    }
                });
                currentY += finalLineHeight;
            });
        });

        try {
            const dataURL = canvas.toDataURL('image/png');
            if (isEmbeddedBrowser()) {
                setGeneratedImage(dataURL);
            } else {
                const downloadLink = document.createElement('a');
                downloadLink.href = dataURL;
                downloadLink.download = 'eventos.png';
                downloadLink.click();
            }
        } catch (e) {
            console.error("Error generando data URL:", e);
            alert("Error al generar la imagen. Puede deberse a restricciones de seguridad del navegador.");
        }
    }, [events]);

    const getUniqueFestivals = useCallback(() => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 2);
        cutoffDate.setHours(0, 0, 0, 0);

        const currentEvents = events.filter(event => {
            const eventDate = new Date(event.day);
            return eventDate >= cutoffDate;
        });

        currentEvents.sort((a, b) => {
            const parseDate = (dateStr?: string) => {
                if (!dateStr) return 0;
                const dmy = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
                if (dmy) {
                    return new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1])).getTime();
                }
                return new Date(dateStr).getTime();
            };

            const dateA = parseDate(a.FechaAgregado);
            const dateB = parseDate(b.FechaAgregado);
            return dateB - dateA;
        });

        const uniqueFestivalsMap = new Map();
        currentEvents.forEach(event => {
            const label = event.lugar ? `${event.lugar}, ${event.municipio}` : event.municipio;
            if (!uniqueFestivalsMap.has(label)) {
                uniqueFestivalsMap.set(label, {
                    label,
                    lugar: event.lugar || '',
                    municipio: event.municipio
                });
            }
        });

        return Array.from(uniqueFestivalsMap.values());
    }, [events]);

    const exportFestivalToImage = useCallback(async (festivalJson: string) => {
        if (!festivalJson) return;

        if (!checkRateLimit(20)) {
            alert('Has alcanzado el límite de 20 descargas por hora por usuario.');
            return;
        }

        if (!await checkGlobalRateLimit(40)) {
            alert('Se ha alcanzado el límite global de 40 descargas por hora. Inténtalo más tarde.');
            return;
        }

        let lugar: string, municipio: string;
        try {
            const parsed = JSON.parse(festivalJson);
            lugar = parsed.lugar;
            municipio = parsed.municipio;
        } catch (e) {
            console.error("Error parsing festival JSON", e);
            return;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 2);
        cutoffDate.setHours(0, 0, 0, 0);
        const cutoffDateString = cutoffDate.toISOString().split('T')[0];

        const festivalEvents = events.filter(event =>
            (event.lugar || '') === lugar &&
            event.municipio === municipio &&
            event.day >= cutoffDateString
        );

        const COLUMN_THRESHOLD = 7;
        const totalEvents = festivalEvents.length;

        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
        width: 1200px;
        height: 1200px;
        position: relative;
        padding: 20px;
        text-align: center;
        margin: 0 auto;
        border-radius: 10px;
        box-sizing: border-box;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        max-width: 1200px;
        position: absolute;
        top: -9999px;
        left: -9999px;
    `;

        const backgroundDiv = document.createElement('div');
        backgroundDiv.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        opacity: 0.5;
    `;

        const generateImageUrls = () => {
            const urls: string[] = [];
            const baseUrls = [
                'https://debelingoconangel.web.app/fotos/',
                'https://debelingo.webcindario.com/',
                'http://debelingoconangel.infy.uk/fotos/'
            ];
            const extensions = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'];

            const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n');

            const variations: string[] = [];

            const addVariations = (text: string) => {
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
        };

        const possibleImages = generateImageUrls();

        const createContent = () => {
            const contentDiv = document.createElement('div');
            contentDiv.style.cssText = `
            position: relative;
            z-index: 10;
            background-color: rgba(255, 255, 255, 0.6);
            border: 1px solid #000000;
            padding: 20px;
            border-radius: 10px;
            max-width: 100%;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
            width: 98%;
            margin-left: 1%;
            margin-right: 1%;
        `;

            const generationDate = document.createElement('p');
            generationDate.style.cssText = `
            font-size: 0.8em;
            color: #888888;
            margin-bottom: 5px;
            font-family: Arial, sans-serif;
        `;
            generationDate.textContent = `Generado ${new Date().toLocaleString('es-ES')}`;
            contentDiv.appendChild(generationDate);

            const festivalHeader = document.createElement('div');
            const randomRotation = (Math.random() * 2 - 1).toFixed(2);
            const randomHue = Math.floor(Math.random() * 360);
            const randomBgColor = `hsla(${randomHue}, 70%, 50%, 0.8)`;

            festivalHeader.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                font-weight: bold;
                margin-bottom: 25px;
                font-family: Impact, sans-serif;
                text-shadow: 4px 4px 0px rgba(0,0,0,0.8);
                border: 5px solid #ffffff;
                background: ${randomBgColor};
                padding: 20px 40px;
                border-radius: 40px;
                transform: rotate(${randomRotation}deg);
                box-shadow: 12px 12px 25px rgba(0,0,0,0.5), inset 0 0 60px rgba(255,255,255,0.3);
                width: auto;
                max-width: 95%;
                letter-spacing: 2px;
                line-height: 1.1;
                text-align: center;
            `;

            const createHeaderLine = (text: string, baseSize: number) => {
                const line = document.createElement('div');
                line.textContent = text;
                line.style.whiteSpace = 'nowrap';
                line.style.fontSize = `${baseSize}em`;
                return line;
            };

            if (lugar) {
                festivalHeader.appendChild(createHeaderLine(`VERBENAS ${lugar.toUpperCase()}`, 3.5));
                festivalHeader.appendChild(createHeaderLine(municipio.toUpperCase(), 2.8));
            } else {
                festivalHeader.appendChild(createHeaderLine(`VERBENAS ${municipio.toUpperCase()}`, 3.5));
            }
            contentDiv.appendChild(festivalHeader);

            festivalEvents.sort((a, b) => new Date(`${a.day}T${a.hora}`).getTime() - new Date(`${b.day}T${b.hora}`).getTime());

            const eventsByDay: { [key: string]: AppEvent[] } = {};
            festivalEvents.forEach(event => {
                const dayKey = new Date(event.day).toISOString().split('T')[0];
                if (!eventsByDay[dayKey]) eventsByDay[dayKey] = [];
                eventsByDay[dayKey].push(event);
            });

            const dayKeys = Object.keys(eventsByDay);
            const eventsContainer = document.createElement('div');
            eventsContainer.style.width = '100%';
            eventsContainer.style.margin = '0 auto';

            if (totalEvents >= COLUMN_THRESHOLD) {
                eventsContainer.style.columnCount = '2';
                eventsContainer.style.columnGap = '30px';
                eventsContainer.style.columnFill = 'balance';

                dayKeys.forEach(dayKey => {
                    const daySection = document.createElement('div');
                    daySection.style.breakInside = 'avoid';
                    daySection.style.marginBottom = '15px';

                    const dayEvents = eventsByDay[dayKey];
                    const dayDate = new Date(dayKey);
                    const dayName = dayDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

                    const dayHeader = document.createElement('h3');
                    dayHeader.textContent = dayName;
                    dayHeader.style.cssText = `
                    color: #006400;
                    font-weight: bold;
                    text-decoration: underline;
                    text-decoration-color: #006400;
                    margin-bottom: 8px;
                    font-size: 1.8em;
                    font-family: Impact, sans-serif;
                    text-shadow: -2px -2px 0 yellow, 2px 2px 0 gold;
                `;
                    daySection.appendChild(dayHeader);

                    dayEvents.forEach(event => {
                        let eventText = `<strong style="font-size: 1.3em; color: blue;">${event.hora}H</strong>|`;
                        if (event.tipo !== 'Baile Normal') {
                            eventText += `<strong style="font-size: 1.3em;">${event.tipo}</strong>|`;
                        }
                        eventText += `<strong style="font-size: 1.3em; color: black; font-family: Helvetica Black, sans-serif; text-shadow: -2px -2px 0 red, 2px 2px 0 red;">${event.orquesta}</strong>`;

                        const eventParagraph = document.createElement('p');
                        eventParagraph.innerHTML = eventText;
                        eventParagraph.style.cssText = `
                        color: #000000;
                        margin: 3px 0;
                        font-size: 1.3em;
                        font-family: Impact, sans-serif;
                        text-shadow: -2px -2px 0 yellow, 2px 2px 0 gold;
                    `;
                        daySection.appendChild(eventParagraph);
                    });
                    eventsContainer.appendChild(daySection);
                });
            } else {
                dayKeys.forEach(dayKey => {
                    const dayEvents = eventsByDay[dayKey];
                    const dayDate = new Date(dayKey);
                    const dayName = dayDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

                    const dayHeader = document.createElement('h3');
                    dayHeader.textContent = dayName;
                    dayHeader.style.cssText = `
                    color: #006400;
                    font-weight: bold;
                    text-decoration: underline;
                    text-decoration-color: #006400;
                    margin-bottom: 8px;
                    font-size: 2em;
                    font-family: Impact, sans-serif;
                    text-shadow: -2px -2px 0 yellow, 2px 2px 0 gold;
                `;
                    eventsContainer.appendChild(dayHeader);

                    dayEvents.forEach(event => {
                        let eventText = `<strong style="font-size: 1.5em; color: blue;">${event.hora}H</strong>|`;
                        if (event.tipo !== 'Baile Normal') {
                            eventText += `<strong style="font-size: 1.5em;">${event.tipo}</strong>|`;
                        }
                        eventText += `<strong style="font-size: 1.5em; color: black; font-family: Helvetica Black, sans-serif; text-shadow: -2px -2px 0 red, 2px 2px 0 red;">${event.orquesta}</strong>`;

                        const eventParagraph = document.createElement('p');
                        eventParagraph.innerHTML = eventText;
                        eventParagraph.style.cssText = `
                        color: #000000;
                        margin: 3px 0;
                        font-size: 1.5em;
                        font-family: Impact, sans-serif;
                        text-shadow: -2px -2px 0 yellow, 2px 2px 0 gold;
                    `;
                        eventsContainer.appendChild(eventParagraph);
                    });
                });
            }
            contentDiv.appendChild(eventsContainer);

            const infoText = document.createElement('p');
            infoText.style.cssText = `
            font-size: 1.8em;
            color: #FF0000;
            margin-top: 15px;
            font-family: Arial, sans-serif;
        `;
            infoText.innerHTML = '<strong>Más info en: https://debelingoconangel.web.app </strong>';

            tempContainer.appendChild(backgroundDiv);
            tempContainer.appendChild(contentDiv);
            tempContainer.appendChild(infoText);
            document.body.appendChild(tempContainer);

            setTimeout(() => {
                const containerHeight = 1200;
                const containerPadding = 40;
                const minRequiredHeight = containerHeight * 0.7 - containerPadding;
                const maxAllowedHeight = containerHeight * 0.96 - containerPadding;

                let fontSizeMultiplier = 1;
                const contentHeight = contentDiv.scrollHeight;

                if (contentHeight < minRequiredHeight) {
                    const neededMultiplier = minRequiredHeight / contentHeight;
                    fontSizeMultiplier = Math.min(neededMultiplier, 2);
                }

                if (contentHeight * fontSizeMultiplier > maxAllowedHeight) {
                    fontSizeMultiplier = maxAllowedHeight / contentHeight;
                }

                fontSizeMultiplier = Math.max(fontSizeMultiplier, 0.7);
                fontSizeMultiplier = Math.min(fontSizeMultiplier, 2);

                // 1. Ajuste general de escala basado en el volumen de contenido
                Array.from(contentDiv.querySelectorAll('h3')).forEach(h3 => {
                    const baseSize = totalEvents >= COLUMN_THRESHOLD ? 1.8 : 2.2;
                    (h3 as HTMLElement).style.fontSize = `${baseSize * fontSizeMultiplier}em`;
                });

                // Solo aplicar a los párrafos que son eventos (dentro de eventsContainer)
                Array.from(eventsContainer.querySelectorAll('p')).forEach(p => {
                    const baseSize = totalEvents >= COLUMN_THRESHOLD ? 1.3 : 1.6;
                    (p as HTMLElement).style.fontSize = `${baseSize * fontSizeMultiplier}em`;
                    (p as HTMLElement).style.lineHeight = "1.4";
                });

                // 2. Ajuste del titular: escalar según el contenido y reducir si desborda el ancho
                Array.from(festivalHeader.children).forEach((line) => {
                    const el = line as HTMLElement;
                    let currentFontSize = parseFloat(el.style.fontSize);

                    // Aplicamos el multiplicador para que crezca si hay poco contenido
                    currentFontSize *= fontSizeMultiplier;
                    el.style.fontSize = `${currentFontSize}em`;

                    const containerMaxWidth = 1100;
                    // Reducir tamaño de fuente solo si quepa en una línea (evitar desborde horizontal)
                    while (el.scrollWidth > containerMaxWidth && currentFontSize > 0.5) {
                        currentFontSize -= 0.1;
                        el.style.fontSize = `${currentFontSize}em`;
                    }
                });

                // 3. Centrado vertical y espaciado proporcional
                contentDiv.style.minHeight = `${minRequiredHeight}px`;
                contentDiv.style.display = 'flex';
                contentDiv.style.flexDirection = 'column';
                contentDiv.style.justifyContent = 'center';
                contentDiv.style.gap = `${20 * fontSizeMultiplier}px`;

                html2canvas(tempContainer, {
                    width: 1200,
                    height: 1200,
                    backgroundColor: null,
                    useCORS: true
                }).then(canvas => {
                    const dataURL = canvas.toDataURL('image/png');
                    if (isEmbeddedBrowser()) {
                        setGeneratedImage(dataURL);
                    } else {
                        const link = document.createElement('a');
                        link.download = `${lugar || municipio}_${municipio}_2025.png`;
                        link.href = dataURL;
                        link.click();
                    }
                    document.body.removeChild(tempContainer);
                }).catch(err => {
                    console.error("Error generating image with html2canvas:", err);
                    alert("Hubo un error al generar la imagen. Por favor, inténtalo de nuevo.");
                    document.body.removeChild(tempContainer);
                });
            }, 100);
        };

        const tryNextImage = (index: number) => {
            if (index >= possibleImages.length) {
                console.warn("No se encontró ninguna imagen de fondo válida. Usando fondo blanco.");
                backgroundDiv.style.backgroundColor = 'white';
                createContent();
                return;
            }
            const img = new Image();
            img.src = possibleImages[index];
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                console.log("Imagen cargada correctamente:", possibleImages[index]);
                backgroundDiv.style.backgroundImage = `url('${possibleImages[index]}')`;
                createContent();
            };
            img.onerror = () => {
                tryNextImage(index + 1);
            };
        };

        tryNextImage(0);
    }, [events]);

    const showFestivalSelection = useCallback(() => {
        setFestivalSelectionVisible(!festivalSelectionVisible);
    }, [festivalSelectionVisible]);

    return (
        <>
            <EventsList
                events={events}
                recentActivity={recentActivity}
                onExportWeek={exportByDateToImage}
                onExportFestival={showFestivalSelection}
            />

            {/* Festival Selection Modal */}
            {
                festivalSelectionVisible && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 text-center">
                                Exportar Fiesta
                            </h3>

                            {getUniqueFestivals().length > 0 ? (
                                <>
                                    <div className="mb-8">
                                        <label className="block text-sm font-semibold text-gray-600 mb-3 text-center">
                                            Selecciona una fiesta de la lista:
                                        </label>
                                        <Select
                                            value={selectedFestival}
                                            onValueChange={setSelectedFestival}
                                        >
                                            <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-12 text-gray-800 focus:ring-2 focus:ring-blue-500 rounded-xl">
                                                <SelectValue placeholder="Toca para ver las fiestas..." />
                                            </SelectTrigger>
                                            <SelectContent
                                                position="item-aligned"
                                                className="z-[120] min-w-[320px] md:min-w-[700px] border-zinc-200 shadow-2xl"
                                                viewportClassName="max-h-[60vh] md:max-h-[500px] overflow-y-auto"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1">
                                                    {getUniqueFestivals().map((festival, index) => (
                                                        <SelectItem
                                                            key={index}
                                                            value={JSON.stringify(festival)}
                                                            className="py-3 px-4 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                                                        >
                                                            <span className="font-medium text-sm">Verbenas de {festival.label}</span>
                                                        </SelectItem>
                                                    ))}
                                                </div>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => {
                                                setFestivalSelectionVisible(false);
                                                setSelectedFestival('');
                                            }}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (selectedFestival) {
                                                    exportFestivalToImage(selectedFestival);
                                                    setFestivalSelectionVisible(false);
                                                    setSelectedFestival('');
                                                } else {
                                                    alert('Por favor selecciona una fiesta');
                                                }
                                            }}
                                            disabled={!selectedFestival}
                                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300"
                                        >
                                            Exportar
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-600 mb-4">No hay fiestas disponibles para exportar en este momento.</p>
                                    <button
                                        onClick={() => setFestivalSelectionVisible(false)}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                    >
                                        Cerrar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Generated Image Modal */}
            {
                generatedImage && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[120] p-4">
                        <div className="bg-white rounded-2xl p-4 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                            <h3 className="text-xl font-bold mb-4 text-gray-800 text-center">
                                Imagen Generada
                            </h3>
                            <div className="text-center mb-4 text-sm text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                                {isEmbeddedBrowser() ? 
                                    "Mantén pulsada la imagen para guardarla en tu dispositivo." : 
                                    "Si la descarga no comenzó automáticamente, puedes guardar la imagen desde aquí."}
                            </div>
                            
                            <div className="flex-1 overflow-auto mb-4 flex justify-center bg-gray-100 rounded p-2">
                                <img src={generatedImage} alt="Eventos Exportados" className="max-w-full h-auto object-contain" />
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setGeneratedImage(null)}
                                    className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default EventosPage;

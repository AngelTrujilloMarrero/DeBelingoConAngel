import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import EventsList from './components/EventsList';
import MapComponent from './components/MapComponent';
import Statistics from './components/Statistics';
import Analizador from './components/Analizador';
import VisitCounter from './components/VisitCounter';
import SocialMedia from './components/SocialMedia';
import { useEvents } from './hooks/useEvents';
import { Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Event } from './types';
import { groupEventsByDay, sortEventsByDateTime } from './utils/helpers';

function App() {
  const { events, loading } = useEvents();
  const [festivalSelectionVisible, setFestivalSelectionVisible] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState('');

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

    const groupedEvents = filteredEvents.reduce((acc, event) => {
        const date = event.day;
        if (!acc[date]) acc[date] = [];
        acc[date].push(event);
        return acc;
    }, {} as Record<string, Event[]>);

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

    function calculateEventLines(event: Event, ctx: CanvasRenderingContext2D, maxWidth: number) {
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
            const additionalText = ` - https://admindebelingo.web.app - Generado ${generationDate}`;
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
                        for(let k=1; k <= remainingText.length; k++){
                            if(ctx.measureText(remainingText.substring(0, k)).width > maxWidth){
                                breakIndex = k-1;
                                break;
                            }
                            breakIndex = k;
                        }
                        substring = remainingText.substring(0, breakIndex);
                        if(substring === '') substring = remainingText[0];
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
        const downloadLink = document.createElement('a');
        downloadLink.href = dataURL;
        downloadLink.download = 'eventos.png';
        downloadLink.click();
    } catch (e) {
        console.error("Error generando data URL:", e);
        alert("Error al generar la imagen. Puede deberse a restricciones de seguridad del navegador.");
    }
  }, [events]);

  // Get unique festivals for selection
  const getUniqueFestivals = useCallback(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 2);
    cutoffDate.setHours(0, 0, 0, 0);
    
    const currentEvents = events.filter(event => {
      const eventDate = new Date(event.day);
      return eventDate >= cutoffDate;
    });

    const uniqueFestivals = [...new Set(currentEvents.map(event => {
      return event.lugar ? `${event.lugar}, ${event.municipio}` : event.municipio;
    }))];

    return uniqueFestivals;
  }, [events]);

  // Export specific festival to image
  const exportFestivalToImage = useCallback(async (selectedFestival: string) => {
    if (!selectedFestival) return;

    let lugar: string, municipio: string;
    if (selectedFestival.includes(', ')) {
        [lugar, municipio] = selectedFestival.split(', ');
    } else {
        lugar = '';
        municipio = selectedFestival;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 2);
    cutoffDate.setHours(0, 0, 0, 0);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];

    const festivalEvents = events.filter(event =>
        event.lugar === lugar &&
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

    const baseUrls = [
        'https://admindebelingo.web.app/fotos/',
        'https://debelingo.webcindario.com/',
        'http://debelingoconangel.infy.uk/fotos/'
    ];

    const normalizedLugar = lugar.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n').replace(/\s+/g, '');
    const normalizedMunicipio = municipio.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n').replace(/\s+/g, '');

    const possibleImages = [
        `${baseUrls[0]}${normalizedLugar}.jpg`, `${baseUrls[1]}${normalizedLugar}.jpg`, `${baseUrls[2]}${normalizedLugar}.jpg`,
        `${baseUrls[0]}${normalizedLugar}.png`, `${baseUrls[1]}${normalizedLugar}.png`, `${baseUrls[2]}${normalizedLugar}.png`,
        `${baseUrls[0]}${normalizedLugar}.PNG`, `${baseUrls[1]}${normalizedLugar}.PNG`, `${baseUrls[2]}${normalizedLugar}.PNG`,
        `${baseUrls[0]}${normalizedLugar}.JPG`, `${baseUrls[1]}${normalizedLugar}.JPG`, `${baseUrls[2]}${normalizedLugar}.JPG`,
        `${baseUrls[0]}${normalizedLugar}.jpeg`, `${baseUrls[1]}${normalizedLugar}.jpeg`, `${baseUrls[2]}${normalizedLugar}.jpeg`,
        `${baseUrls[0]}${normalizedLugar}.JPEG`, `${baseUrls[1]}${normalizedLugar}.JPEG`, `${baseUrls[2]}${normalizedLugar}.JPEG`,
        `${baseUrls[0]}${normalizedMunicipio}.jpg`, `${baseUrls[0]}${normalizedMunicipio}.png`,
        `${baseUrls[0]}${normalizedLugar}_${normalizedMunicipio}.jpg`, `${baseUrls[0]}${normalizedMunicipio}_${normalizedLugar}.JPG`,
        `${baseUrls[0]}${normalizedMunicipio}_${normalizedLugar}.jpg`, `${baseUrls[0]}${normalizedLugar}_${normalizedMunicipio}.JPG`,
        `${baseUrls[0]}${normalizedLugar}_${normalizedMunicipio}.png`, `${baseUrls[0]}${normalizedMunicipio}_${normalizedLugar}.png`,
        `${baseUrls[1]}${normalizedMunicipio}.jpg`, `${baseUrls[1]}${normalizedMunicipio}.JPG`, `${baseUrls[1]}${normalizedMunicipio}.png`,
        `${baseUrls[1]}${normalizedLugar}_${normalizedMunicipio}.jpg`, `${baseUrls[1]}${normalizedMunicipio}_${normalizedLugar}.jpg`,
        `${baseUrls[1]}${normalizedLugar}_${normalizedMunicipio}.JPG`, `${baseUrls[1]}${normalizedMunicipio}_${normalizedLugar}.JPG`,
        `${baseUrls[1]}${normalizedLugar}_${normalizedMunicipio}.png`, `${baseUrls[1]}${normalizedMunicipio}_${normalizedLugar}.png`,
        `${baseUrls[2]}${normalizedMunicipio}.jpg`, `${baseUrls[2]}${normalizedMunicipio}.JPG`, `${baseUrls[2]}${normalizedMunicipio}.png`,
        `${baseUrls[2]}${normalizedLugar}_${normalizedMunicipio}.jpg`, `${baseUrls[2]}${normalizedMunicipio}_${normalizedLugar}.jpg`,
        `${baseUrls[2]}${normalizedLugar}_${normalizedMunicipio}.JPG`, `${baseUrls[2]}${normalizedMunicipio}_${normalizedLugar}.JPG`,
        `${baseUrls[2]}${normalizedLugar}_${normalizedMunicipio}.png`, `${baseUrls[2]}${normalizedMunicipio}_${normalizedLugar}.png`
    ];

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

        const festivalHeader = document.createElement('h2');
        festivalHeader.style.cssText = `
            color: #330000;
            font-weight: bold;
            text-decoration: underline;
            text-decoration-color: #330000;
            margin-bottom: 10px;
            font-size: 3em;
            font-family: Impact, sans-serif;
            text-shadow: -2px -2px 0 yellow, 2px 2px 0 gold;
            border: 6px solid #000000;
            background-color: rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.7);
            padding: 2px 5px 5px 5px;
        `;
        festivalHeader.textContent = lugar ? `VERBENAS ${lugar.toUpperCase()}-${municipio.toUpperCase()}` : `VERBENAS ${municipio.toUpperCase()}`;
        contentDiv.appendChild(festivalHeader);

        festivalEvents.sort((a, b) => new Date(`${a.day}T${a.hora}`).getTime() - new Date(`${b.day}T${b.hora}`).getTime());

        const eventsByDay: { [key: string]: Event[] } = {};
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
        infoText.innerHTML = '<strong>Más info en: https://admindebelingo.web.app o https://debelingo.webcindario.com</strong>';

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

            festivalHeader.style.fontSize = `${3 * fontSizeMultiplier}em`;
            Array.from(contentDiv.querySelectorAll('h3')).forEach(dayHeader => {
                (dayHeader as HTMLElement).style.fontSize = `${(totalEvents >= COLUMN_THRESHOLD ? 1.8 : 2) * fontSizeMultiplier}em`;
            });
            Array.from(contentDiv.querySelectorAll('p')).forEach(paragraph => {
                (paragraph as HTMLElement).style.fontSize = `${(totalEvents >= COLUMN_THRESHOLD ? 1.3 : 1.5) * fontSizeMultiplier}em`;
            });

            contentDiv.style.minHeight = `${minRequiredHeight}px`;
            contentDiv.style.display = 'flex';
            contentDiv.style.flexDirection = 'column';
            contentDiv.style.justifyContent = 'center';

            html2canvas(tempContainer, {
                width: 1200,
                height: 1200,
                backgroundColor: null,
                useCORS: true
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `${lugar || municipio}_${municipio}_2025.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                document.body.removeChild(tempContainer);
            });
        }, 100);
    };

    const tryNextImage = (index: number) => {
        if (index >= possibleImages.length) {
            backgroundDiv.style.backgroundColor = 'white';
            createContent();
            return;
        }
        const img = new Image();
        img.src = possibleImages[index];
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            backgroundDiv.style.backgroundImage = `url('${possibleImages[index]}')`;
            createContent();
        };
        img.onerror = () => tryNextImage(index + 1);
    };

    tryNextImage(0);
}, [events]);

  const showFestivalSelection = useCallback(() => {
    setFestivalSelectionVisible(!festivalSelectionVisible);
  }, [festivalSelectionVisible]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
          <h2 className="text-2xl font-bold text-white">Cargando Verbenas de Tenerife...</h2>
          <p className="text-gray-300">Conectando con la base de datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Events List */}
        <section>
          <EventsList 
            events={events} 
            onExportWeek={exportByDateToImage}
            onExportFestival={showFestivalSelection}
          />
        </section>

        {/* Festival Selection Modal */}
        {festivalSelectionVisible && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Seleccionar Fiesta para Exportar</h3>
              
              {getUniqueFestivals().length > 0 ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecciona una fiesta:
                    </label>
                    <select
                      value={selectedFestival}
                      onChange={(e) => setSelectedFestival(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">-- Selecciona una fiesta --</option>
                      {getUniqueFestivals().map((festival, index) => (
                        <option key={index} value={festival}>
                          Verbenas de {festival}
                        </option>
                      ))}
                    </select>
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
        )}

        {/* Map */}
        <section>
          <MapComponent events={events} />
        </section>

        {/* Statistics */}
        <section>
          <Statistics events={events} />
        </section>

           {/* Analizador */}
        <section>
          <Analizador events={events} />
        </section>

        {/* Visit Counter */}
        <section>
          <VisitCounter />
        </section>

        {/* Social Media */}
        <section>
          <SocialMedia />
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-300">
            © 2025 De Belingo Con Ángel - Verbenas en Tenerife
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Desarrollado con 💙 para la comunidad de Tenerife
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, CloudSun, CloudMoon, CloudFog, CloudDrizzle, CloudRain, CloudLightning, Snowflake, Thermometer, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { geocodeAddress, municipioMapping } from '../utils/geocoding';
import { AemetAlert } from '../hooks/useAemetAlerts';

interface WeatherIconProps {
    date: string; // YYYY-MM-DD
    municipio: string;
    time?: string; // HH:mm or HH
    alert?: AemetAlert;
}

const WeatherIcon: React.FC<WeatherIconProps> = ({ date, municipio, time, alert }) => {
    const [weatherCode, setWeatherCode] = useState<number | null>(null);
    const [temp, setTemp] = useState<number | null>(null);
    const [isDay, setIsDay] = useState<number | null>(null);
    const [isHourly, setIsHourly] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        const checkAndFetchWeather = async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const eventDate = new Date(date);
            const diffTime = eventDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Solo mostrar para el día actual y los 5 días siguientes (pronóstico detallado)
            if (diffDays >= 0 && diffDays <= 5) {
                // Añadir un pequeño retraso aleatorio para evitar 429 si hay muchos eventos
                await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));

                setLoading(true);
                try {
                    const fullMunicipio = municipioMapping[municipio] || municipio;
                    const coords = await geocodeAddress(`${fullMunicipio}, Tenerife`);

                    if (coords) {
                        // Intentar parsear la hora
                        let hour: number | null = null;
                        if (time) {
                            const match = time.trim().match(/^(\d{1,2})/);
                            if (match) {
                                hour = parseInt(match[1]);
                            }
                        }

                        let weatherUrl: string;
                        if (hour !== null && hour >= 0 && hour <= 23) {
                            weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&hourly=weather_code,temperature_2m,is_day&start_date=${date}&end_date=${date}&timezone=Atlantic/Canary`;
                            setIsHourly(true);
                        } else {
                            weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=weather_code,temperature_2m_max&start_date=${date}&end_date=${date}&timezone=Atlantic/Canary`;
                            setIsHourly(false);
                        }

                        const response = await fetch(weatherUrl);
                        if (response.status === 429) {
                            console.warn("[Weather] Rate limit hit (429). Retrying later.");
                            return;
                        }
                        const data = await response.json();

                        if (hour !== null && data.hourly) {
                            setWeatherCode(data.hourly.weather_code[hour]);
                            setTemp(data.hourly.temperature_2m[hour]);
                            setIsDay(data.hourly.is_day[hour]);
                        } else if (data.daily) {
                            setWeatherCode(data.daily.weather_code[0]);
                            setTemp(data.daily.temperature_2m_max[0]);
                            setIsDay(1); // Por defecto día para previsión diaria
                        }
                    }
                } catch (error) {
                    console.error("Error fetching weather:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        checkAndFetchWeather();
    }, [date, municipio, time]);

    // IMPORTANTE: Si no hay ni código de tiempo ni alerta, no renderizar nada.
    // Pero NO retornar null si hay alerta aunque loading sea true.
    if (weatherCode === null && !loading && !alert) return null;

    const getIcon = (code: number) => {
        const isNight = isDay === 0;
        if (code === 0) return isNight ? <Moon className="w-5 h-5 text-blue-200" /> : <Sun className="w-5 h-5 text-yellow-400" />;
        if (code >= 1 && code <= 3) return isNight ? <CloudMoon className="w-5 h-5 text-gray-300" /> : <CloudSun className="w-5 h-5 text-gray-300" />;
        if (code === 45 || code === 48) return <CloudFog className="w-5 h-5 text-gray-400" />;
        if (code >= 51 && code <= 55) return <CloudDrizzle className="w-5 h-5 text-blue-300" />;
        if (code >= 61 && code <= 65) return <CloudRain className="w-5 h-5 text-blue-400" />;
        if (code >= 71 && code <= 77) return <Snowflake className="w-5 h-5 text-blue-100" />;
        if (code >= 80 && code <= 82) return <CloudRain className="w-5 h-5 text-blue-500" />;
        if (code >= 95) return <CloudLightning className="w-5 h-5 text-purple-400" />;
        return <Cloud className="w-5 h-5 text-gray-400" />;
    };

    const getDescription = (code: number) => {
        const isNight = isDay === 0;
        if (code === 0) return isNight ? "Despejado (Noche)" : "Despejado";
        if (code >= 1 && code <= 3) return isNight ? "Parcialmente nublado (Noche)" : "Parcialmente nublado";
        if (code === 45 || code === 48) return "Niebla";
        if (code >= 51 && code <= 55) return "Llovizna";
        if (code >= 61 && code <= 65) return "Lluvia";
        if (code >= 71 && code <= 77) return "Nieve";
        if (code >= 80 && code <= 82) return "Chubascos";
        if (code >= 95) return "Tormenta";
        return "Nublado";
    };

    const getAlertColor = (level: string) => {
        if (level === 'red') return 'text-red-500';
        if (level === 'orange') return 'text-orange-500';
        if (level === 'yellow') return 'text-yellow-400';
        return 'text-gray-400';
    };

    return (
        <div
            className="relative flex items-center gap-2 cursor-help group/weather"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className="flex items-center gap-1 min-w-[40px] justify-center">
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                ) : weatherCode !== null && (
                    <>
                        <div className="transition-transform duration-300 group-hover/weather:scale-110">
                            {getIcon(weatherCode)}
                        </div>
                        {temp !== null && <span className="text-xs font-bold text-gray-300 group-hover/weather:text-white transition-colors">{Math.round(temp)}°</span>}
                    </>
                )}
            </div>

            {alert && (
                <a
                    href={`https://www.aemet.es/es/eltiempo/prediccion/avisos?p=6596`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`transition-all duration-300 hover:scale-125 ${getAlertColor(alert.level || '')}`}
                    onClick={(e) => e.stopPropagation()}
                    title={`Ver alerta ${alert.level} en web de AEMET`}
                >
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                </a>
            )}

            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900/95 backdrop-blur-md text-white text-xs rounded-lg shadow-xl min-w-[200px] z-50 border border-white/10 animate-in fade-in zoom-in duration-200">
                    <div className="flex flex-col gap-2">
                        {loading ? (
                            <div className="flex items-center gap-2 text-gray-400 py-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Cargando previsión...</span>
                            </div>
                        ) : weatherCode !== null && (
                            <div className="flex flex-col items-center gap-1 pb-2 border-b border-white/10">
                                <span className="font-bold text-blue-300 uppercase text-[10px] tracking-wider">
                                    {isHourly && time ? `Previsión para las ${time}H` : 'Previsión Meteorológica (Máx)'}
                                </span>
                                <div className="flex items-center gap-2">
                                    {getIcon(weatherCode)}
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-white">{getDescription(weatherCode)}</span>
                                        <span className="text-gray-400 flex items-center gap-1">
                                            <Thermometer className="w-3 h-3 text-red-400" />
                                            {isHourly ? 'Temp: ' : 'Máx: '}{Math.round(temp ?? 0)}°C
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {alert && (
                            <div className="flex flex-col gap-1">
                                <span className={`font-bold uppercase text-[10px] tracking-wider flex items-center gap-1 ${getAlertColor(alert.level || '')}`}>
                                    <AlertTriangle className="w-3 h-3" />
                                    Alerta AEMET: {alert.level}
                                </span>
                                <p className="text-[11px] leading-tight text-gray-300 italic">{alert.phenomenon} en {alert.zone}</p>
                                <a
                                    href={`https://www.aemet.es/es/eltiempo/prediccion/avisos?p=6596`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 flex items-center gap-1 text-[10px] text-blue-400 font-bold group/link hover:text-blue-300 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Ver alerta en AEMET
                                </a>
                            </div>
                        )}
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-8 border-transparent border-t-gray-900/95"></div>
                </div>
            )}
        </div>
    );
};

export default WeatherIcon;

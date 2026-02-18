import React, { useState, useCallback } from 'react';
import EventsList from '../components/EventsList';
import { Event as AppEvent, RecentActivityItem } from '../types';
import { isEmbeddedBrowser } from '../utils/helpers';
import { useEventExport } from '../hooks/useEventExport';

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
    const { generatedImage, setGeneratedImage, exportByDateToImage, exportFestivalToImage, getUniqueFestivals } = useEventExport(events);



    const showFestivalSelection = useCallback(() => {
        setFestivalSelectionVisible(!festivalSelectionVisible);
    }, [festivalSelectionVisible]);

    const handleShare = async () => {
        if (!generatedImage) return;

        try {
            const blob = await (await fetch(generatedImage)).blob();
            const file = new File([blob], "eventos_debelingo.png", { type: "image/png" });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Verbenas DeBelingo',
                    text: '¡Mira estas verbenas!'
                });
            } else {
                alert("Tu navegador no soporta compartir imágenes directamente. Prueba el botón de 'Copiar Imagen' o mantén pulsada la imagen.");
            }
        } catch (error) {
            console.error("Error sharing:", error);
            if ((error as Error).name !== 'AbortError') {
                alert("No se pudo compartir la imagen.");
            }
        }
    };

    const handleCopy = async () => {
        if (!generatedImage) return;
        try {
            const blob = await (await fetch(generatedImage)).blob();
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob
                })
            ]);
            alert("¡Imagen copiada! Ahora puedes pegarla en WhatsApp, Instagram, etc.");
        } catch (err) {
            console.error("Error copying to clipboard:", err);
            alert("No se pudo copiar la imagen automáticamente.");
        }
    };

    const handleOpenInBrowser = () => {
        const currentUrl = window.location.href;
        window.open(currentUrl, '_blank');
    };

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
                                        <label htmlFor="festival-select" className="block text-sm font-semibold text-gray-600 mb-3 text-center">
                                            Selecciona una fiesta de la lista:
                                        </label>
                                        <Select
                                            value={selectedFestival}
                                            onValueChange={setSelectedFestival}
                                        >
                                            <SelectTrigger id="festival-select" className="w-full bg-gray-50 border-gray-200 h-12 text-gray-800 focus:ring-2 focus:ring-blue-500 rounded-xl">
                                                <SelectValue placeholder="Toca para ver las fiestas..." />
                                            </SelectTrigger>
                                            <SelectContent
                                                position="item-aligned"
                                                className="z-[120] min-w-[320px] md:min-w-[700px] border-zinc-200 shadow-2xl"
                                                viewportClassName="max-h-[60vh] md:max-h-[500px] overflow-y-auto"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1">
                                                    {getUniqueFestivals().map((festival) => (
                                                        <SelectItem
                                                            key={festival.label}
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
                    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[120] p-4">
                        <div className="bg-white rounded-2xl p-4 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                            <h3 className="text-xl font-bold mb-4 text-gray-800 text-center">
                                Imagen Generada
                            </h3>
                            <div className="text-center mb-4 text-sm text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                                {isEmbeddedBrowser() ?
                                    "Opciones: Copiar, Compartir, Abrir en navegador o mantener pulsada para guardar." :
                                    "Puedes guardar la imagen o compartirla."}
                            </div>

                            <div className="flex-1 overflow-auto mb-4 flex justify-center bg-gray-100 rounded p-2">
                                <img
                                    src={generatedImage}
                                    alt="Eventos Exportados"
                                    className="max-w-full h-auto object-contain pointer-events-auto"
                                    style={{ touchAction: 'manipulation' }}
                                />
                            </div>

                            <div className="flex flex-wrap gap-3 justify-center">
                                {isEmbeddedBrowser() && (
                                    <button
                                        onClick={handleOpenInBrowser}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                        Abrir en Navegador
                                    </button>
                                )}
                                <button
                                    onClick={handleCopy}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                    Copiar
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                                    Compartir
                                </button>
                                <button
                                    onClick={() => setGeneratedImage(null)}
                                    className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
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

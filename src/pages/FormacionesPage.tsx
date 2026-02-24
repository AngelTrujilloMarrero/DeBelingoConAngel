import React, { useMemo, useState, useEffect } from 'react';
import { Event } from '../types';
import { orchestraDetails } from '../data/orchestras';
import { Instagram, Facebook, Globe, Mail, Phone, Search, Music, Users, ExternalLink } from 'lucide-react';
import { onValue, orchestrasRef } from '../utils/firebase';
import { scrapeProfileImage } from '../utils/socialScraper';
import OrquestaAnalysis from '../components/OrquestaAnalysis';
import LoadingSpinner from '../components/LoadingSpinner';
import { getCachedHistoricalStats, getCachedOrchestraArchive } from '../utils/dataLoaders';

let orchestraArchive: any[] = [];
let historicalData: {
    years: Record<string, {
        orquestaCount: Record<string, number>;
        monthlyOrquestaCount: Record<string, Record<string, number>>;
        monthlyEventCount: Record<string, number>;
    }>;
    events: Event[];
} | null = null;

interface FormacionesPageProps {
    events: Event[];
}

const FormacionesPage: React.FC<FormacionesPageProps> = ({ events }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dbOrchestras, setDbOrchestras] = useState<Record<string, any>>({});
    const [scrapedImages, setScrapedImages] = useState<Record<string, string>>({});
    const [selectedOrquesta, setSelectedOrquesta] = useState<string | null>(null);
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        // Load data lazily
        const loadData = async () => {
            try {
                if (!orchestraArchive.length) {
                    const archive = await getCachedOrchestraArchive();
                    orchestraArchive = (archive as any).orchestras || [];
                }
                if (!historicalData) {
                    const stats = await getCachedHistoricalStats();
                    historicalData = stats as {
                        years: Record<string, {
                            orquestaCount: Record<string, number>;
                            monthlyOrquestaCount: Record<string, Record<string, number>>;
                            monthlyEventCount: Record<string, number>;
                        }>;
                        events: Event[];
                    };
                }
                setDataLoaded(true);
            } catch (error) {
                console.error('Error loading data:', error);
                setDataLoaded(true); // Still show UI even if data fails to load
            }
        };

        loadData();

        const unsubscribe = onValue(orchestrasRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setDbOrchestras(data);
            }
        });
        return () => unsubscribe();
    }, []);

    // Clear selected orchestra when search term changes
    useEffect(() => {
        if (searchTerm && selectedOrquesta) {
            setSelectedOrquesta(null);
        }
    }, [searchTerm]);

    // Extract unique orchestras and calculate stats
    const formaciones = useMemo(() => {
        if (!dataLoaded || !historicalData) {
            return [];
        }

        const currentYear = new Date().getFullYear();
        const prevYear = currentYear - 1;
        const stats: Record<string, { currentCount: number; prevCount: number; lastEvent: string }> = {};

        // 1. Calculate stats from events (lives) and historicalStats (static)
        const yearStats = historicalData.years[currentYear.toString()]?.orquestaCount || {};
        const prevYearStats = historicalData.years[prevYear.toString()]?.orquestaCount || {};

        // Merge historical stats into initial stats
        Object.entries(yearStats).forEach(([orq, count]) => {
            if (!stats[orq]) stats[orq] = { currentCount: 0, prevCount: 0, lastEvent: '' };
            stats[orq].currentCount = count as number;
        });
        Object.entries(prevYearStats).forEach(([orq, count]) => {
            if (!stats[orq]) stats[orq] = { currentCount: 0, prevCount: 0, lastEvent: '' };
            stats[orq].prevCount = count as number;
        });

        // Add lastEvent from historical events
        historicalData.events?.forEach(event => {
            const orquestas = event.orquesta.split(',').map(o => o.trim()).filter(o => o !== 'DJ' && o.length > 0);
            orquestas.forEach(orq => {
                if (!stats[orq]) {
                    stats[orq] = { currentCount: 0, prevCount: 0, lastEvent: event.day };
                }
                if (!stats[orq].lastEvent || new Date(event.day) > new Date(stats[orq].lastEvent)) {
                    stats[orq].lastEvent = event.day;
                }
            });
        });

        events.forEach(event => {
            if (event.cancelado) return;
            const eventYear = new Date(event.day).getFullYear();
            const orquestas = event.orquesta.split(',').map(o => o.trim()).filter(o => o !== 'DJ' && o.length > 0);

            orquestas.forEach(orq => {
                if (!stats[orq]) {
                    stats[orq] = { currentCount: 0, prevCount: 0, lastEvent: event.day };
                }

                // If year is in historical stats, we already got it, but let's be safe and only add if NOT in historical
                if (eventYear === currentYear && !historicalData.years[currentYear.toString()]) {
                    stats[orq].currentCount += 1;
                } else if (eventYear === prevYear && !historicalData.years[prevYear.toString()]) {
                    stats[orq].prevCount += 1;
                }

                if (!stats[orq].lastEvent || new Date(event.day) > new Date(stats[orq].lastEvent)) {
                    stats[orq].lastEvent = event.day;
                }
            });
        });

        // 2. Combine with Archived Orchestras (Fallback)
        // 3. Transform DB data from ID-based to Name-based (Priority)
        const consolidatedOrchestrasMap: Record<string, any> = {};

        // Start with archive
        orchestraArchive.forEach((orch: any) => {
            consolidatedOrchestrasMap[orch.name] = orch;
        });

        // Overlay with Firebase data (Priority)
        if (dbOrchestras) {
            Object.values(dbOrchestras).forEach((info: any) => {
                if (info && info.name) {
                    consolidatedOrchestrasMap[info.name] = info;
                }
            });
        }

        return Object.entries(stats)
            .map(([name, stat]) => {
                const dbEntry = consolidatedOrchestrasMap[name] || {};

                const consolidated = {
                    name,
                    ...stat,
                    ...orchestraDetails[name], // Hardcoded fallback (if any)
                    ...dbEntry,                // Combined Archive + Live
                    hasDbInfo: !!dbEntry.name,  // Flag to indicate if we have extra info
                };

                // Normalize fields specifically
                if (dbEntry.other) consolidated.Otros = dbEntry.other;

                return consolidated;
            })
            .sort((a, b) => b.currentCount - a.currentCount || b.prevCount - a.prevCount);
    }, [events, dbOrchestras]);

    const filteredFormaciones = formaciones.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDoubleClick = async (formacion: any) => {
        setSelectedOrquesta(formacion.name);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Trigger scraping if image is missing
        if (!formacion.image && !scrapedImages[formacion.name]) {
            const url = formacion.facebook || formacion.instagram;
            if (url) {
                try {
                    const img = await scrapeProfileImage(url);
                    if (img) {
                        setScrapedImages(prev => ({ ...prev, [formacion.name]: img }));
                    }
                } catch (e) {
                    console.error("Manual scrape failed:", e);
                }
            }
        }
    };

    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    // Map formaciones for OrquestaAnalysis ranking (using previous year as requested)
    const rankingData = useMemo(() => {
        return formaciones
            .map(f => ({ name: f.name, count: f.prevCount }))
            .sort((a, b) => b.count - a.count);
    }, [formaciones]);

    if (!dataLoaded) {
        return <LoadingSpinner size="lg" text="Cargando datos de formaciones..." />;
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-fadeIn">
            {/* Hero Section */}
            <div className="text-center space-y-4 py-8">
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                    Formaciones y Orquestas
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                    Descubre los perfiles, contacto y redes sociales de las orquestas que dan vida a las verbenas de Canarias.
                </p>
                <p className="text-purple-400/80 text-sm italic">
                    💡 Haz doble clic en el nombre de una orquesta para ver análisis detallado del año {prevYear} y cargar su imagen.
                </p>

                {/* Search Bar */}
                <div className="relative max-w-md mx-auto mt-8 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                    <div className="relative bg-gray-900 rounded-full flex items-center px-4 py-3 border border-white/10 shadow-xl">
                        <Search className="w-5 h-5 text-gray-400 mr-3" />
                        <input
                            type="text"
                            placeholder="Buscar orquesta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-white w-full placeholder-gray-500"
                        />
                    </div>
                </div>
            </div>

            {/* Analysis Component - Modal-like top position if selected */}
            {selectedOrquesta && (
                <div className="mb-12 animate-fadeInUp">
                    <OrquestaAnalysis
                        orquesta={selectedOrquesta}
                        events={events}
                        position={rankingData.findIndex(o => o.name === selectedOrquesta)}
                        totalOrquestas={rankingData}
                        selectedYear={prevYear}
                        onClose={() => setSelectedOrquesta(null)}
                    />
                </div>
            )}

            {/* Grid de Formaciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFormaciones.map((formacion, index) => {
                    const displayImage = formacion.image || scrapedImages[formacion.name];

                    return (
                        <div
                            key={formacion.name}
                            className={`group relative bg-gray-900/80 backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:-translate-y-2 ${selectedOrquesta === formacion.name ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-white/10'
                                }`}
                        >
                            {/* Header / Cover Placeholder */}
                            <div className={`h-32 relative flex items-center justify-center overflow-hidden transition-all duration-500`}>
                                {displayImage ? (
                                    <img
                                        src={displayImage}
                                        alt={formacion.name}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(index)}`} />
                                )}

                                {/* Overlay */}
                                <div className={`absolute inset-0 transition-colors duration-500 ${displayImage ? 'bg-black/40 group-hover:bg-black/30' : 'bg-black/20 group-hover:bg-black/40'}`} />

                                {/* Logo / Initials */}
                                <div className="relative z-10 w-20 h-20 rounded-full bg-gray-900 border-4 border-gray-800 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                                    {displayImage ? (
                                        <img src={displayImage} alt={formacion.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-white">
                                            {getInitials(formacion.name)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 text-center space-y-4">
                                <div
                                    onDoubleClick={() => handleDoubleClick(formacion)}
                                    className="cursor-pointer select-none"
                                >
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors drop-shadow-md">
                                        {formacion.name}
                                    </h3>
                                    <div className="flex flex-col gap-2 items-center">
                                        <div className="inline-flex items-center text-xs font-medium text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 w-fit">
                                            <Music className="w-3.5 h-3.5 mr-1.5" />
                                            {currentYear}: <span className="font-bold ml-1">{formacion.currentCount}</span>
                                        </div>
                                        <div className="inline-flex items-center text-xs font-medium text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20 w-fit">
                                            <Music className="w-3.5 h-3.5 mr-1.5" />
                                            {prevYear}: <span className="font-bold ml-1">{formacion.prevCount}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact & Socials Grid */}
                                <div className="flex flex-wrap justify-center gap-3 pt-2">
                                    {formacion.facebook && (
                                        <a
                                            href={formacion.facebook}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-[#1877F2]/10 text-[#1877F2] rounded-lg hover:bg-[#1877F2] hover:text-white transition-all duration-300 transform hover:scale-110"
                                            title="Facebook"
                                        >
                                            <Facebook className="w-5 h-5" />
                                        </a>
                                    )}

                                    {formacion.instagram && (
                                        <a
                                            href={formacion.instagram}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-[#E4405F]/10 text-[#E4405F] rounded-lg hover:bg-[#E4405F] hover:text-white transition-all duration-300 transform hover:scale-110"
                                            title="Instagram"
                                        >
                                            <Instagram className="w-5 h-5" />
                                        </a>
                                    )}

                                    {formacion.website && (
                                        <a
                                            href={formacion.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all duration-300 transform hover:scale-110"
                                            title="Sitio Web"
                                        >
                                            <Globe className="w-5 h-5" />
                                        </a>
                                    )}

                                    {formacion.email && (
                                        <a
                                            href={`mailto:${formacion.email}`}
                                            className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg hover:bg-yellow-500 hover:text-white transition-all duration-300 transform hover:scale-110"
                                            title="Email"
                                        >
                                            <Mail className="w-5 h-5" />
                                        </a>
                                    )}

                                    {formacion.phone && (
                                        <a
                                            href={`tel:${formacion.phone.replace(/\s/g, '')}`}
                                            className="p-2 bg-blue-400/10 text-blue-400 rounded-lg hover:bg-blue-400 hover:text-white transition-all duration-300 transform hover:scale-110"
                                            title="Teléfono"
                                        >
                                            <Phone className="w-5 h-5" />
                                        </a>
                                    )}

                                    {formacion.Otros && formacion.Otros !== formacion.website && (
                                        <a
                                            href={formacion.Otros}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500 hover:text-white transition-all duration-300 transform hover:scale-110"
                                            title="Otros / Web"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                    )}

                                    {/* If no contact info found */}
                                    {!formacion.facebook && !formacion.instagram && !formacion.website && !formacion.email && !formacion.phone && !formacion.Otros && (
                                        <span className="text-xs text-gray-600 italic py-2">Sin contacto disponible</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredFormaciones.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No se encontraron orquestas con ese nombre.</p>
                </div>
            )}
        </div>
    );
};

// Utils
function getInitials(name: string) {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

function getGradient(index: number) {
    const gradients = [
        'from-blue-600 to-purple-600',
        'from-purple-600 to-pink-600',
        'from-pink-600 to-red-600',
        'from-red-600 to-orange-600',
        'from-orange-600 to-yellow-600',
        'from-teal-600 to-emerald-600',
        'from-indigo-600 to-blue-600',
        'from-cyan-600 to-blue-600',
    ];
    return gradients[index % gradients.length];
}

export default FormacionesPage;

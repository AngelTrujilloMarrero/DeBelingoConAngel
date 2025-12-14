import React, { useMemo, useState, useEffect } from 'react';
import { Event } from '../types';
import { orchestraDetails } from '../data/orchestras';
import { Instagram, Facebook, Globe, Mail, Phone, Search, Music, Users, ExternalLink } from 'lucide-react';
import { onValue, orchestrasRef } from '../utils/firebase';
import { scrapeProfileImage } from '../utils/socialScraper';

interface FormacionesPageProps {
    events: Event[];
}

const FormacionesPage: React.FC<FormacionesPageProps> = ({ events }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dbOrchestras, setDbOrchestras] = useState<Record<string, any>>({});
    const [scrapedImages, setScrapedImages] = useState<Record<string, string>>({});
    const [scrapedOrchestras, setScrapedOrchestras] = useState<Set<string>>(new Set());

    useEffect(() => {
        const unsubscribe = onValue(orchestrasRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setDbOrchestras(data);
            }
        });
        return () => unsubscribe();
    }, []);

    // Extract unique orchestras and calculate stats
    const formaciones = useMemo(() => {
        const stats: Record<string, { count: number; lastEvent: string }> = {};

        // 1. Calculate stats from events
        events.forEach(event => {
            if (event.cancelado) return;
            const orquestas = event.orquesta.split(',').map(o => o.trim()).filter(o => o !== 'DJ' && o.length > 0);

            orquestas.forEach(orq => {
                if (!stats[orq]) {
                    stats[orq] = { count: 0, lastEvent: event.day };
                }
                stats[orq].count += 1;
                if (new Date(event.day) > new Date(stats[orq].lastEvent)) {
                    stats[orq].lastEvent = event.day;
                }
            });
        });

        // 2. Transform DB data from ID-based to Name-based
        const dbOrchestrasMap: Record<string, any> = {};
        if (dbOrchestras) {
            Object.values(dbOrchestras).forEach((info: any) => {
                if (info && info.name) {
                    dbOrchestrasMap[info.name] = info;
                }
            });
        }

        return Object.entries(stats)
            .map(([name, stat]) => {
                const dbInfo = dbOrchestrasMap[name] || {};

                // Construct the consolidated object
                // Priority: DB > File > Fallback
                // Note: DB field for other links is 'other' (lowercase), component expects 'Otros' or 'website'

                const consolidated = {
                    name,
                    ...stat,
                    ...orchestraDetails[name], // File (fallback)
                    ...dbInfo,                 // DB (priority)
                    hasDbInfo: !!dbInfo.name,  // Flag to indicate if we have DB info
                };

                // Normalize fields specifically
                if (dbInfo.other) consolidated.Otros = dbInfo.other;
                // If website is missing but we have 'other', use 'other' as website too for the Globe icon if desired, 
                // but we also have a specific block for 'Otros'. 
                // Let's keep 'Otros' strictly for the ExternalLink icon and 'website' for the Globe icon.
                // If the DB provides 'website', use it. If not, don't force 'other' into 'website' unless we want to.
                // Based on previous user request, 'other' was 'Otros'.

                return consolidated;
            })
            .sort((a, b) => b.count - a.count); // Sort by popularity (event count)
    }, [events, dbOrchestras]);

    // Scrape images effect
    useEffect(() => {
        const triggerScraping = async () => {
            const potentialTargets = formaciones.filter(f =>
                f.hasDbInfo &&
                !f.image &&
                !scrapedImages[f.name] &&
                !scrapedOrchestras.has(f.name) &&
                (f.facebook || f.instagram)
            );

            if (potentialTargets.length === 0) return;

            // Mark as attempted immediately to avoid duplicates
            setScrapedOrchestras(prev => {
                const newSet = new Set(prev);
                potentialTargets.forEach(t => newSet.add(t.name));
                return newSet;
            });

            // Process one by one or in small batches
            for (const target of potentialTargets) {
                const url = target.facebook || target.instagram;
                if (url) {
                    try {
                        const img = await scrapeProfileImage(url);
                        if (img) {
                            setScrapedImages(prev => ({ ...prev, [target.name]: img }));
                        }
                    } catch (e) {
                        console.error("Scrape error", e);
                    }
                }
            }
        };

        triggerScraping();
    }, [formaciones, scrapedImages, scrapedOrchestras]);

    const filteredFormaciones = formaciones.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Hero Section */}
            <div className="text-center space-y-4 py-8">
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                    Formaciones y Orquestas
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                    Descubre los perfiles, contacto y redes sociales de las orquestas que dan vida a las verbenas de Canarias.
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

            {/* Grid de Formaciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFormaciones.map((formacion, index) => {
                    // Determine the image to show: DB image > Scraped Image > Other Link (if DB info present)
                    const displayImage = formacion.image || scrapedImages[formacion.name] || (formacion.hasDbInfo ? formacion.Otros : null);
                    // Determine if we show custom background: Must have DB info AND a valid image/link
                    const hasBackground = formacion.hasDbInfo && !!displayImage;

                    return (
                        <div
                            key={formacion.name}
                            className="group relative bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:-translate-y-2"
                        >
                            {/* Header / Cover Placeholder */}
                            <div
                                className={`h-32 relative flex items-center justify-center overflow-hidden transition-all duration-500`}
                                style={{
                                    background: hasBackground
                                        ? `url(${displayImage}) center/cover no-repeat`
                                        : undefined
                                }}
                            >
                                {/* Gradient fallback if no background image */}
                                {!hasBackground && (
                                    <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(index)}`} />
                                )}

                                {/* Overlay */}
                                <div className={`absolute inset-0 transition-colors duration-500 ${hasBackground
                                    ? 'bg-black/60 group-hover:bg-black/50'
                                    : 'bg-black/20 group-hover:bg-black/40'
                                    }`} />

                                {/* Logo / Initials */}
                                <div className="relative z-10 w-20 h-20 rounded-full bg-gray-900 border-4 border-gray-800 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                    {displayImage ? (
                                        <img src={displayImage} alt={formacion.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-white">
                                            {getInitials(formacion.name)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 text-center space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors drop-shadow-md">
                                        {formacion.name}
                                    </h3>
                                    <span className="inline-flex items-center text-xs font-medium text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                        <Music className="w-3 h-3 mr-1.5 text-purple-400" />
                                        {formacion.count} actuaciones registradas
                                    </span>
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

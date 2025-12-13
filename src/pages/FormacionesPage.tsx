import React, { useMemo, useState } from 'react';
import { Event } from '../types';
import { orchestraDetails } from '../data/orchestras';
import { Instagram, Facebook, Globe, Mail, Phone, Search, Music, Users, ExternalLink } from 'lucide-react';

interface FormacionesPageProps {
    events: Event[];
}

const FormacionesPage: React.FC<FormacionesPageProps> = ({ events }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Extract unique orchestras and calculate stats
    const formaciones = useMemo(() => {
        const stats: Record<string, { count: number; lastEvent: string }> = {};

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

        return Object.entries(stats)
            .map(([name, stat]) => ({
                name,
                ...stat,
                ...orchestraDetails[name] // Merge with manual details
            }))
            .sort((a, b) => b.count - a.count); // Sort by popularity (event count)
    }, [events]);

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
                {filteredFormaciones.map((formacion, index) => (
                    <div
                        key={formacion.name}
                        className="group relative bg-gray-900/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-2"
                    >
                        {/* Header / Cover Placeholder */}
                        <div className={`h-32 bg-gradient-to-br ${getGradient(index)} relative flex items-center justify-center overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />

                            {/* Logo / Initials */}
                            <div className="relative z-10 w-20 h-20 rounded-full bg-gray-900 border-4 border-gray-800 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                {formacion.image ? (
                                    <img src={formacion.image} alt={formacion.name} className="w-full h-full rounded-full object-cover" />
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
                                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
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

                                {/* If no contact info found */}
                                {!formacion.facebook && !formacion.instagram && !formacion.website && !formacion.email && !formacion.phone && (
                                    <span className="text-xs text-gray-600 italic py-2">Sin contacto disponible</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
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

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Phone, Globe, Smartphone, Car, Search, MapPin, ExternalLink, Info } from 'lucide-react';

interface TaxiCompany {
    nombre: string;
    telefono: string;
    web?: string | null;
    centralita?: string;
    app?: string;
}

interface Alternative {
    nombre: string;
    disponible: boolean;
    web: string;
    app: string;
}

interface MunicipioData {
    empresas: TaxiCompany[];
    alternativas: Alternative[];
}

interface TaxiData {
    municipios: Record<string, MunicipioData>;
    centrales_provinciales: Record<string, string>;
    notas: {
        tarifas: string;
        disponibilidad_24h: string;
        apps_recomendadas: string[];
        telefono_emergencia: string;
    };
}

const TaxiInfo: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>(null);

    const { data: taxiData } = useQuery<TaxiData>({
        queryKey: ['taxiData'],
        queryFn: async () => {
            const res = await fetch('/data/taxis-tenerife.json');
            return res.json();
        },
        staleTime: Infinity,
    });

    if (!taxiData) return null;

    const filteredMunicipios = Object.keys(taxiData.municipios).filter(m =>
        m.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden mt-8 mb-12">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-6 text-white text-center">
                <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-3">
                    <Car className="w-8 h-8" />
                    Taxis en Tenerife
                </h2>
                <p className="mt-2 text-yellow-50 opacity-90">
                    Encuentra el contacto de taxi más cercano en cada municipio
                </p>
            </div>

            <div className="p-6 space-y-8">
                {/* Quick Search */}
                <div className="relative max-w-md mx-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Busca tu municipio..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Info Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-900/60 border-2 border-blue-500/50 rounded-xl p-4 flex items-start gap-4 shadow-lg shadow-blue-900/20">
                        <div className="bg-blue-500 p-2 rounded-lg shadow-inner">
                            <Info className="w-6 h-6 text-white flex-shrink-0" />
                        </div>
                        <div>
                            <h4 className="font-black text-blue-200 text-xs uppercase tracking-widest mb-1">Tarifas</h4>
                            <p className="text-white text-base font-bold leading-tight">Reguladas por el Gobierno de Canarias</p>
                        </div>
                    </div>
                    <div className="bg-green-900/60 border-2 border-green-500/50 rounded-xl p-4 flex items-start gap-4 shadow-lg shadow-green-900/20">
                        <div className="bg-green-500 p-2 rounded-lg shadow-inner">
                            <Smartphone className="w-6 h-6 text-white flex-shrink-0" />
                        </div>
                        <div>
                            <h4 className="font-black text-green-200 text-xs uppercase tracking-widest mb-1">App Recomendada</h4>
                            <p className="text-white text-base font-bold">MyTaxi</p>
                        </div>
                    </div>
                    <div className="bg-red-900/60 border-2 border-red-500/50 rounded-xl p-4 flex items-start gap-4 shadow-lg shadow-red-900/20">
                        <div className="bg-red-500 p-2 rounded-lg shadow-inner">
                            <Phone className="w-6 h-6 text-white flex-shrink-0" />
                        </div>
                        <div>
                            <h4 className="font-black text-red-200 text-xs uppercase tracking-widest mb-1">Emergencias</h4>
                            <p className="text-white font-black text-2xl tracking-tighter">112</p>
                        </div>
                    </div>
                </div>

                {/* Municipality Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMunicipios.map(m => (
                        <div
                            key={m}
                            className="bg-gray-900/80 border-2 border-gray-700/50 rounded-2xl p-6 hover:border-yellow-500/50 transition-all group shadow-xl"
                        >
                            <div className="flex items-center gap-3 mb-5 border-b-2 border-yellow-500/20 pb-4">
                                <div className="bg-yellow-500/10 p-2 rounded-lg">
                                    <MapPin className="w-6 h-6 text-yellow-500" />
                                </div>
                                <h3 className="font-black text-2xl text-white tracking-tight">{m}</h3>
                            </div>

                            <div className="space-y-6">
                                {taxiData.municipios[m].empresas.map((emp) => (
                                    <div key={emp.nombre} className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="text-yellow-400 font-black text-sm uppercase tracking-wider">{emp.nombre}</p>
                                        <div className="flex flex-wrap gap-3">
                                            <a
                                                href={`tel:${emp.telefono.replace(/\s+/g, '')}`}
                                                className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2.5 rounded-xl text-base font-black shadow-lg shadow-yellow-500/20 transition-all active:scale-95"
                                            >
                                                <Phone className="w-5 h-5" />
                                                {emp.telefono}
                                            </a>
                                            {emp.web && (
                                                <a
                                                    href={emp.web}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                                                >
                                                    <Globe className="w-4 h-4" />
                                                    WEB
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredMunicipios.length === 0 && (
                    <div className="text-center py-12">
                        <Car className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-20" />
                        <p className="text-gray-400 text-lg">No hemos encontrado taxis en "{searchTerm}"</p>
                    </div>
                )}

                {/* Provincial Centers */}
                <div className="mt-12 pt-8 border-t border-gray-700/50">
                    <h3 className="text-center text-gray-400 font-bold uppercase tracking-widest mb-6">Centrales Provinciales</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                        {Object.entries(taxiData.centrales_provinciales).map(([zona, tel]) => (
                            <a
                                key={zona}
                                href={`tel:${tel.replace(/\s+/g, '')}`}
                                className="bg-gray-800 border border-gray-700 hover:border-blue-500/50 p-4 rounded-xl text-center group transition-all"
                            >
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">{zona}</p>
                                <p className="text-blue-400 font-bold group-hover:text-blue-300 transition-colors">{tel}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxiInfo;

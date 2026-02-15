import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Music, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Event {
    day: string;
    stage: string;
    time: string;
    artist: string;
}

const scheduleData: Event[] = [
    // Viernes 13
    { day: 'Viernes 13', stage: 'Calles del Centro', time: '19:30', artist: 'Cabalgata Anunciadora' },
    { day: 'Viernes 13', stage: 'Plaza de la Candelaria', time: '00:00', artist: 'Los 4' },
    { day: 'Viernes 13', stage: 'Plaza de la Candelaria', time: '01:30', artist: 'La Sabrosa' },
    { day: 'Viernes 13', stage: 'Plaza de la Candelaria', time: '03:30', artist: 'Tropin' },
    { day: 'Viernes 13', stage: 'Av. Francisco La Roche', time: '23:00 - 02:30', artist: 'Carnaval Reggae Festival' },
    { day: 'Viernes 13', stage: 'Av. Francisco La Roche', time: '02:30 - 05:00', artist: 'DJ Ubay y Friends' },
    { day: 'Viernes 13', stage: 'Plaza del Príncipe', time: '00:00', artist: 'Morocho Latin Brothers' },
    { day: 'Viernes 13', stage: 'Plaza del Príncipe', time: '02:15', artist: 'Orquesta Gomeray' },
    { day: 'Viernes 13', stage: 'Plaza del Príncipe', time: '04:15', artist: 'DJ Victor' },

    // Sábado 14
    { day: 'Sábado 14', stage: 'Plaza de La Candelaria', time: '17:30 - 22:00', artist: 'Mamelones y Murgas Finalistas' },
    { day: 'Sábado 14', stage: 'Plaza de La Candelaria', time: '23:30', artist: 'Wamampy' },
    { day: 'Sábado 14', stage: 'Plaza de La Candelaria', time: '01:30', artist: 'Orquesta Acapulco' },
    { day: 'Sábado 14', stage: 'Plaza de La Candelaria', time: '03:45', artist: 'Orquesta Revelación' },
    { day: 'Sábado 14', stage: 'Plaza del Príncipe', time: '17:00', artist: 'Pasacalle de Rondallas' },
    { day: 'Sábado 14', stage: 'Plaza del Príncipe', time: '17:30 - 21:30', artist: 'Rondallas' },
    { day: 'Sábado 14', stage: 'Plaza del Príncipe', time: '23:30', artist: 'La Maracaibo' },
    { day: 'Sábado 14', stage: 'Plaza del Príncipe', time: '01:45', artist: 'Iván Cacú y su orquesta' },
    { day: 'Sábado 14', stage: 'Plaza del Príncipe', time: '04:00', artist: 'Latin Sound' },
    { day: 'Sábado 14', stage: 'Av. Francisco La Roche', time: '21:00 - 00:00', artist: 'Concurso Ritmo y Armonía' },
    { day: 'Sábado 14', stage: 'Av. Francisco La Roche', time: '00:00 - 06:00', artist: 'Ray Castellano' },
    { day: 'Sábado 14', stage: 'Calle La Noria', time: '17:30 - 22:15', artist: 'Murgas Infantiles' },
    { day: 'Sábado 14', stage: 'Calle La Noria', time: 'Cierre', artist: 'Banda Unión y Amistad' },

    // Domingo 15 (Carnaval de Día)
    { day: 'Domingo 15', stage: 'Plaza de la Candelaria', time: '12:00 - 13:00', artist: 'Neo Pinto' },
    { day: 'Domingo 15', stage: 'Plaza de la Candelaria', time: '13:00 - 15:30', artist: 'Morocho Infantil' },
    { day: 'Domingo 15', stage: 'Plaza de la Candelaria', time: '15:30 - 17:30', artist: 'Dorada Band' },
    { day: 'Domingo 15', stage: 'Plaza de la Candelaria', time: '17:30', artist: 'Sabrosa' },
    { day: 'Domingo 15', stage: 'Plaza de la Candelaria', time: '19:30', artist: 'Orquesta Columbia' },
    { day: 'Domingo 15', stage: 'Plaza de la Candelaria', time: '20:30', artist: 'La Orquesta Guaracha' },
    { day: 'Domingo 15', stage: 'Plaza del Príncipe', time: '11:00', artist: 'NiFú NiFá' },
    { day: 'Domingo 15', stage: 'Plaza del Príncipe', time: '12:00', artist: 'Los Fregolinos' },
    { day: 'Domingo 15', stage: 'Plaza del Príncipe', time: '13:30', artist: 'David Pérez' },
    { day: 'Domingo 15', stage: 'Plaza del Príncipe', time: '15:00', artist: 'Macacos Soundmachine' },
    { day: 'Domingo 15', stage: 'Plaza del Príncipe', time: '16:30 - 18:30', artist: 'Moise González y Son Iyá' },
    { day: 'Domingo 15', stage: 'Plaza del Príncipe', time: '18:30', artist: 'Orquesta Tejina' },
    { day: 'Domingo 15', stage: 'Plaza del Príncipe', time: '20:00', artist: 'Orquesta Malibú Band' },
    { day: 'Domingo 15', stage: 'Av. Francisco La Roche', time: '14:00 - 20:00', artist: 'Artistas Cadena SER' },
    { day: 'Domingo 15', stage: 'Av. Francisco La Roche', time: '20:00 - 23:00', artist: 'JACO/ JRAMOS & Friends' },

    // Lunes 16
    { day: 'Lunes 16', stage: 'Calle de la Noria', time: '18:00', artist: 'Murgas Infantiles' },
    { day: 'Lunes 16', stage: 'Plaza de la Candelaria', time: '18:00', artist: 'Murgas Adultas' },
    { day: 'Lunes 16', stage: 'Plaza de la Candelaria', time: '21:00', artist: 'Dragnaval (2ª edición)' },
    { day: 'Lunes 16', stage: 'Plaza de la Candelaria', time: '01:00h', artist: 'Manny Cruz' },
    { day: 'Lunes 16', stage: 'Plaza de la Candelaria', time: 'Hasta 04:00', artist: 'Chichi Peralta' },
    { day: 'Lunes 16', stage: 'Plaza de la Candelaria', time: 'Hasta 06:00', artist: 'Orquesta Dorada Band' },
    { day: 'Lunes 16', stage: 'Plaza del Príncipe', time: '18:00 - 22:00', artist: 'Murgas Adultas' },
    { day: 'Lunes 16', stage: 'Plaza del Príncipe', time: '23:30', artist: 'DJ Fabrizio Salgado' },
    { day: 'Lunes 16', stage: 'Plaza del Príncipe', time: '00:00', artist: 'Orquesta Dinacord' },
    { day: 'Lunes 16', stage: 'Plaza del Príncipe', time: '02:00', artist: 'Iván Cacú y su orquesta' },
    { day: 'Lunes 16', stage: 'Plaza del Príncipe', time: '04:00', artist: 'Orquesta Malibú Band' },
    { day: 'Lunes 16', stage: 'Av. Francisco La Roche', time: '18:00', artist: 'Grupos Coreográficos' },
    { day: 'Lunes 16', stage: 'Av. Francisco La Roche', time: '00:15h', artist: 'Mandy Hdez (La Mueve)' },
    { day: 'Lunes 16', stage: 'Av. Francisco La Roche', time: '00:45h', artist: 'Yet Garbey (La Mueve)' },
    { day: 'Lunes 16', stage: 'Av. Francisco La Roche', time: '01:50h', artist: 'K-Narias (La Mueve)' },
    { day: 'Lunes 16', stage: 'Av. Francisco La Roche', time: '02:40h', artist: 'Osmani García (La Mueve)' },
    { day: 'Lunes 16', stage: 'Av. Francisco La Roche', time: '03:30h', artist: 'Aissa (La Mueve)' },
    { day: 'Lunes 16', stage: 'Av. Francisco La Roche', time: '04:15h', artist: 'DJ Conjurer (La Mueve)' },
    { day: 'Lunes 16', stage: 'Av. Francisco La Roche', time: '05:00h', artist: 'Evando Moreira (La Mueve)' },

    // Martes 17
    { day: 'Martes 17', stage: 'Plaza del Príncipe', time: '11:00', artist: 'NiFú NiFá' },
    { day: 'Martes 17', stage: 'Plaza del Príncipe', time: '12:00', artist: 'Los Fregolinos' },
    { day: 'Martes 17', stage: 'Calles del Centro', time: 'Tarde', artist: 'Coso del Carnaval' },

    // Miércoles 18
    { day: 'Miércoles 18', stage: 'Plaza del Príncipe', time: '23:00 - 01:00', artist: 'Maquinaria Band' },
    { day: 'Miércoles 18', stage: 'Plaza del Príncipe', time: '01:00 - 03:00', artist: 'Orquesta Saoco' },
    { day: 'Miércoles 18', stage: 'Carroza de la Sardina', time: 'Noche', artist: 'Morocho, Pepe Benavente, Jhonny Maquinaria' },

    // Viernes 20
    { day: 'Viernes 20', stage: 'Plaza de La Candelaria', time: '18:00 - 22:00', artist: 'Agrupaciones Musicales' },
    { day: 'Viernes 20', stage: 'Plaza de La Candelaria', time: '00:00', artist: 'Orquesta Acapulco' },
    { day: 'Viernes 20', stage: 'Plaza de La Candelaria', time: 'A cont. - 04:15', artist: 'The Boys Machine' },
    { day: 'Viernes 20', stage: 'Plaza de La Candelaria', time: '04:15', artist: 'DJ Drez' },
    { day: 'Viernes 20', stage: 'Plaza del Príncipe', time: '00:00', artist: 'Clave de Son' },
    { day: 'Viernes 20', stage: 'Plaza del Príncipe', time: '02:15', artist: 'Orquesta Corinto' },
    { day: 'Viernes 20', stage: 'Plaza del Príncipe', time: '04:15', artist: 'DJ' },
    { day: 'Viernes 20', stage: 'Av. Francisco La Roche', time: '23:00 - 05:00', artist: 'Noche de Farra' },

    // Sábado 21
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '12:00', artist: 'Comparsas' },
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '13:00 - 13:30', artist: 'Nueva Línea + Comparsas' },
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '13:30 - 14:00', artist: 'Pepe Benavente' },
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '14:00 - 14:30', artist: 'El Morocho' },
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '14:30 - 16:00', artist: 'Tony Tun Tun' },
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '16:00 - 18:00', artist: 'Orquesta Maquinaria Band' },
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '18:00 - 19:00', artist: 'Nueva Línea' },
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '19:00 - 20:45', artist: 'Orquesta Saoco' },
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '20:45 - 22:00', artist: 'Orquesta Wamampy' },
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '22:00 - 23:45', artist: 'Orquesta Tropin' },
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '23:45 - 00:00', artist: 'DJ Cambios' },
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '00:00 - 01:45', artist: 'Orquesta Generación' },
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '01:45 - 03:30', artist: 'Sonora Olympia' },
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '03:30 - 05:30', artist: 'Dinacord' },
    { day: 'Sábado 21', stage: 'Plaza de La Candelaria', time: '05:30', artist: 'DJ Osorio' },
    { day: 'Sábado 21', stage: 'Plaza del Príncipe', time: '12:00 - 21:00', artist: 'Artistas Cadena COPE' },
    { day: 'Sábado 21', stage: 'Plaza del Príncipe', time: '21:00 - 23:15', artist: 'Varadero 103' },
    { day: 'Sábado 21', stage: 'Plaza del Príncipe', time: '23:30 - 01:30', artist: 'Orquesta Banda Loca' },
    { day: 'Sábado 21', stage: 'Plaza del Príncipe', time: '01:30 - 03:45', artist: 'Orquesta Tenerife' },
    { day: 'Sábado 21', stage: 'Plaza del Príncipe', time: '03:45 - 06:00', artist: 'Orquesta Maracaibo' },
    { day: 'Sábado 21', stage: 'Av. Francisco La Roche', time: '15:00 - 15:30', artist: 'DJ WES' },
    { day: 'Sábado 21', stage: 'Av. Francisco La Roche', time: '15:30 - 17:00', artist: 'LEONI TORRES' },
    { day: 'Sábado 21', stage: 'Av. Francisco La Roche', time: '17:00 - 17:30', artist: 'ANAÉ' },
    { day: 'Sábado 21', stage: 'Av. Francisco La Roche', time: '17:30 - 19:00', artist: 'EDDY HERRERA' },
    { day: 'Sábado 21', stage: 'Av. Francisco La Roche', time: '19:00 - 19:30', artist: 'PEPE BENAVENTE' },
    { day: 'Sábado 21', stage: 'Av. Francisco La Roche', time: '19:30 - 21:00', artist: 'SEBASTIÁN YATRA' },
    { day: 'Sábado 21', stage: 'Av. Francisco La Roche', time: '21:00 - 21:30', artist: 'TAY DE LEÓN' },
    { day: 'Sábado 21', stage: 'Av. Francisco La Roche', time: '21:30 - 23:00', artist: 'NICKY JAM' },
    { day: 'Sábado 21', stage: 'Av. Francisco La Roche', time: '23:00 - 06:00', artist: 'DJ JONAY' },

    // Domingo 22
    { day: 'Domingo 22', stage: 'Plaza de La Candelaria', time: '17:00', artist: 'Carnaval Senior' },
    { day: 'Domingo 22', stage: 'Plaza de La Candelaria', time: '20:00h', artist: 'Orquesta Guayaba' },
    { day: 'Domingo 22', stage: 'Plaza del Príncipe', time: '11:00', artist: 'NiFú NiFá' },
    { day: 'Domingo 22', stage: 'Plaza del Príncipe', time: '12:00', artist: 'La Zarzuela' },
];

const CarnavalPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDay, setSelectedDay] = useState<string>('Todos');

    const days = ['Todos', ...new Set(scheduleData.map(event => event.day))];

    const filteredEvents = scheduleData.filter(event => {
        const matchesSearch = event.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.stage.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDay = selectedDay === 'Todos' || event.day === selectedDay;
        return matchesSearch && matchesDay;
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Hero Section */}
            <div className="bg-[#001f3f] text-white py-12 px-4 rounded-b-[32px] md:rounded-b-[48px] shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/fotos/eltablero.jpg')] bg-cover bg-center opacity-20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#001f3f]/90 pointer-events-none" />

                <div className="container mx-auto relative z-10 text-center">
                    <Link to="/" className="inline-flex items-center text-blue-300 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a Eventos
                    </Link>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 font-orbitron">Carnaval Santa Cruz</h1>
                    <p className="text-xl text-blue-200 max-w-2xl mx-auto">
                        Programación oficial de bailes y actuaciones en la calle 2026
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 relative z-20">
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">

                        {/* Search */}
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar artista o escenario..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Day Filter - Enhanced Responsive Scroll */}
                        <div className="relative w-full md:w-auto -mx-6 md:mx-0 px-6 md:px-0">
                            {/* Fade indicators for mobile scroll */}
                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none md:hidden" />
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none md:hidden" />

                            <div className="flex gap-2 overflow-x-auto pb-4 md:pb-0 w-full no-scrollbar scroll-smooth snap-x">
                                {days.map(day => (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDay(day)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 snap-start active:scale-90 ${selectedDay === day
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile/Responsive Layout - Cards on Mobile, Table on Desktop */}
                <div className="space-y-4 md:hidden">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map((event, index) => (
                            <div key={index} className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 space-y-3 active:scale-[0.98] transition-transform">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-full">
                                        <Calendar className="w-4 h-4" />
                                        {event.day}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-700 font-mono text-xs font-bold bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                                        {event.time}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                    {event.artist}
                                </h3>
                                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                                    <MapPin className="w-4 h-4 text-red-400" />
                                    {event.stage}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-12 text-center rounded-2xl text-gray-500 shadow-md">
                            No se encontraron eventos.
                        </div>
                    )}
                </div>

                {/* Desktop Layout - Table */}
                <div className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-widest w-1/4">Día</th>
                                    <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-widest w-1/4">Escenario / Lugar</th>
                                    <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-widest w-1/6">Hora</th>
                                    <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-widest w-1/3">Actuación / Artista</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredEvents.length > 0 ? (
                                    filteredEvents.map((event, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-blue-50/50 transition-colors group"
                                        >
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                        <Calendar className="w-5 h-5" />
                                                    </div>
                                                    <span className="font-bold text-gray-900">{event.day}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2 text-gray-700 font-medium">
                                                    <MapPin className="w-4.5 h-4.5 text-gray-400 group-hover:text-red-500 transition-colors" />
                                                    {event.stage}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2 text-gray-700 font-mono text-sm font-bold">
                                                    <Clock className="w-4.5 h-4.5 text-blue-500" />
                                                    {event.time}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <Music className="w-5 h-5 text-pink-500 group-hover:scale-125 transition-transform" />
                                                    <span className="font-bold text-gray-800 text-lg">{event.artist}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-12 text-center text-gray-400 text-xs font-semibold tracking-wide uppercase">
                    <p>Programación oficial · Carnaval de Santa Cruz de Tenerife</p>
                </div>
            </div>
        </div>
    );
};

export default CarnavalPage;

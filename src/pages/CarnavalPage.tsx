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
    { day: 'Lunes 16', stage: 'Plaza de la Candelaria', time: 'A cont. - 02:30', artist: 'Manny Cruz' },
    { day: 'Lunes 16', stage: 'Plaza de la Candelaria', time: 'Hasta 04:00', artist: 'Chichi Peralta' },
    { day: 'Lunes 16', stage: 'Plaza de la Candelaria', time: 'Hasta 06:00', artist: 'Orquesta Dorada Band' },
    { day: 'Lunes 16', stage: 'Plaza del Príncipe', time: '18:00 - 22:00', artist: 'Murgas Adultas' },
    { day: 'Lunes 16', stage: 'Plaza del Príncipe', time: '23:30', artist: 'DJ Fabrizio Salgado' },
    { day: 'Lunes 16', stage: 'Plaza del Príncipe', time: '00:00', artist: 'Orquesta Dinacord' },
    { day: 'Lunes 16', stage: 'Plaza del Príncipe', time: '02:00', artist: 'Iván Cacú y su orquesta' },
    { day: 'Lunes 16', stage: 'Plaza del Príncipe', time: '04:00', artist: 'Orquesta Malibú Band' },
    { day: 'Lunes 16', stage: 'Av. Francisco La Roche', time: '18:00', artist: 'Grupos Coreográficos' },
    { day: 'Lunes 16', stage: 'Av. Francisco La Roche', time: '21:00', artist: 'Artistas La Mueve Radio' },

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
    { day: 'Sábado 21', stage: 'Plaza del Príncipe', time: '23:30 - 01:30', artist: 'Orquesta Tenerife' },
    { day: 'Sábado 21', stage: 'Plaza del Príncipe', time: '01:30 - 03:45', artist: 'Orquesta Maracaibo' },
    { day: 'Sábado 21', stage: 'Plaza del Príncipe', time: '03:45 - 06:00', artist: 'Orquesta Banda Loca' },
    { day: 'Sábado 21', stage: 'Av. Francisco La Roche', time: '15:00h', artist: 'Nicky Jam, Tay de León, Leoni Torres, Pepe Benavente, Sebastián Yatra, DJ WES, Anaé, Eddy Herrera' },
    { day: 'Sábado 21', stage: 'Av. Francisco La Roche', time: 'Cierre - 06:00', artist: 'DJ Jonay' },

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
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Day Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
                            {days.map(day => (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedDay === day
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Schedule Table */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 md:p-6 text-sm font-semibold text-gray-500 uppercase tracking-wider w-1/4">Día</th>
                                    <th className="p-4 md:p-6 text-sm font-semibold text-gray-500 uppercase tracking-wider w-1/4">Escenario / Lugar</th>
                                    <th className="p-4 md:p-6 text-sm font-semibold text-gray-500 uppercase tracking-wider w-1/6">Hora</th>
                                    <th className="p-4 md:p-6 text-sm font-semibold text-gray-500 uppercase tracking-wider w-1/3">Actuación / Artista</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredEvents.length > 0 ? (
                                    filteredEvents.map((event, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-blue-50/50 transition-colors group"
                                        >
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                                                        <Calendar className="w-5 h-5" />
                                                    </div>
                                                    <span className="font-medium text-gray-900">{event.day}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    {event.stage}
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-2 text-gray-600 font-mono text-sm">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    {event.time}
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-3">
                                                    <Music className="w-4 h-4 text-pink-500" />
                                                    <span className="font-semibold text-gray-800">{event.artist}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500">
                                            No se encontraron eventos que coincidan con tu búsqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>Información extraída de la programación oficial del Carnaval de Santa Cruz de Tenerife.</p>
                </div>
            </div>
        </div>
    );
};

export default CarnavalPage;

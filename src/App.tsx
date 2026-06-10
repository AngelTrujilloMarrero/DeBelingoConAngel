import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import VisitCounter from './components/VisitCounter';
import { useEvents } from './hooks/useEvents';
import { useAnalytics } from './hooks/useAnalytics';
import { Loader2 } from 'lucide-react';
import { EventosPage, MapaPage, EstadisticasPage, RedesPage, FormacionesPage, CarnavalPage, PrivacidadPage, TerminosPage } from './pages';
import MessageBoard from './components/MessageBoard';
import { useEffect, useState } from 'react';
import { TurnstileProvider } from './components/TurnstileProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

import { matchSorter } from 'match-sorter';
import { normalizeSearchText } from './lib/utils';

function AppContent() {
  const { events, recentActivity, loading } = useEvents();
  const { pathname } = useLocation();
  
  const [searchTerm, setSearchTerm] = useState('');

  useAnalytics();

  useEffect(() => {
    window.scrollTo(0, 0);
    setSearchTerm(''); // Limpiar búsqueda al cambiar de página
  }, [pathname]);

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

  // Improved filtering using match-sorter and normalization (like in Admin project)
  const filteredEvents = searchTerm 
    ? matchSorter(events, normalizeSearchText(searchTerm), {
        keys: [
          (item) => normalizeSearchText(item.municipio),
          (item) => normalizeSearchText(item.orquesta),
          (item) => normalizeSearchText(item.lugar || ''),
          (item) => normalizeSearchText(item.tipo)
        ],
        threshold: matchSorter.rankings.CONTAINS
      })
    : events;

  console.log('App rendering, pathname:', pathname);
  return (
    <TurnstileProvider>
      <div className="min-h-screen bg-[#111] md:bg-gradient-to-br md:from-gray-900 md:via-gray-800 md:to-gray-900">
        {/* Header - Siempre visible */}
        <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        {/* Main Content - Cambia según la ruta */}
        <div className="w-full pt-20 md:pt-28 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<EventosPage events={filteredEvents} recentActivity={recentActivity} searchTerm={searchTerm} />} />
            <Route path="/mapa" element={<MapaPage events={events} />} />
            <Route path="/estadisticas" element={<EstadisticasPage events={events} />} />
            <Route path="/formaciones" element={<FormacionesPage events={events} />} />
            <Route path="/redes" element={<RedesPage events={events} />} />
            <Route path="/privacidad" element={<PrivacidadPage />} />
            <Route path="/terminos" element={<TerminosPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Message Board - Only on main page and when not searching or on mobile */}
        {pathname === '/' && !searchTerm && <MessageBoard />}

        {/* Footer - Siempre visible */}
        <footer className="bg-gray-900 text-white py-12 relative overflow-hidden">
          {/* Background Layers - Consistent with Header */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[url('/fotos/eltablero.jpg')] bg-cover bg-center opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          </div>

          <div className="relative container mx-auto px-4 text-center z-10">
            <p className="text-gray-300 font-medium">
              © {new Date().getFullYear()} De Belingo Con Ángel - Verbenas en Tenerife
            </p>
            <p className="text-gray-400 text-sm mt-3 tracking-wide">
              Desarrollado con 💙 para la comunidad de Tenerife
            </p>
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
              <a href="/privacidad" className="hover:text-gray-300 transition-colors underline underline-offset-2">
                Política de Privacidad
              </a>
              <span>·</span>
              <a href="/terminos" className="hover:text-gray-300 transition-colors underline underline-offset-2">
                Términos de Uso
              </a>
            </div>
            <div className="mt-6">
              <VisitCounter />
            </div>
          </div>
        </footer>
      </div>
    </TurnstileProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;

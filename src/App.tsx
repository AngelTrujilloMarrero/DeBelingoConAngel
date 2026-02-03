import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import VisitCounter from './components/VisitCounter';
import { useEvents } from './hooks/useEvents';
import { Loader2 } from 'lucide-react';
import { EventosPage, MapaPage, EstadisticasPage, RedesPage, FormacionesPage, BlogPage } from './pages';
import MessageBoard from './components/MessageBoard';
import BlogPost from './components/BlogPost';
import { useEffect } from 'react';

function App() {
  const { events, recentActivity, loading } = useEvents();
  const { pathname } = useLocation();

  // Automatically scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
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

  console.log('App rendering, pathname:', pathname);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header - Siempre visible */}
      <Header />

      {/* Main Content - Cambia según la ruta */}
      <div className={`${pathname === '/' || pathname.startsWith('/blog') ? 'w-full p-0' : 'container mx-auto px-4 py-8'}`}>
        <Routes>
          <Route path="/" element={<EventosPage events={events} recentActivity={recentActivity} />} />
          <Route path="/mapa" element={<MapaPage events={events} />} />
          <Route path="/estadisticas" element={<EstadisticasPage events={events} />} />
          <Route path="/formaciones" element={<FormacionesPage events={events} />} />
          <Route path="/redes" element={<RedesPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </div>

      {/* Message Board - Only on main page */}
      {pathname === '/' && <MessageBoard />}

      {/* Footer - Siempre visible */}
      <footer className={`${pathname === '/' ? '' : 'footer-rounded'} bg-gray-900 text-white py-12 relative overflow-hidden`}>
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
          <div className="mt-8">
            <VisitCounter />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

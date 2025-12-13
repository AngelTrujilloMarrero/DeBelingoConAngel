import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import { useEvents } from './hooks/useEvents';
import { Loader2 } from 'lucide-react';
import { EventosPage, MapaPage, EstadisticasPage, TotalPage, RedesPage, FormacionesPage } from './pages';

function App() {
  const { events, recentActivity, loading } = useEvents();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header - Siempre visible */}
      <Header />

      {/* Main Content - Cambia según la ruta */}
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<EventosPage events={events} recentActivity={recentActivity} />} />
          <Route path="/mapa" element={<MapaPage events={events} />} />
          <Route path="/estadisticas" element={<EstadisticasPage events={events} />} />
          <Route path="/total" element={<TotalPage events={events} />} />
          <Route path="/formaciones" element={<FormacionesPage events={events} />} />
          <Route path="/redes" element={<RedesPage />} />
        </Routes>
      </div>

      {/* Footer - Siempre visible */}
      <footer className="bg-gray-900 text-white py-8 blurred-bg">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-300">
            © 2025 De Belingo Con Ángel - Verbenas en Tenerife
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Desarrollado con 💙 para la comunidad de Tenerife
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

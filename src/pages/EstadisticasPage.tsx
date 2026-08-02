import React, { Suspense } from 'react';
import { Event as AppEvent } from '../types';
import { Loader2 } from 'lucide-react';

const Statistics = React.lazy(() => import('../components/Statistics'));

interface EstadisticasPageProps {
    events: AppEvent[];
}

const EstadisticasPage: React.FC<EstadisticasPageProps> = ({ events }) => {
    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-center mb-4">
                Estadísticas de Verbenas en Tenerife
            </h1>
            <Suspense fallback={
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <span className="ml-3 text-gray-500 font-medium">Cargando gráficos...</span>
                </div>
            }>
                <Statistics events={events} />
            </Suspense>
        </div>
    );
};

export default EstadisticasPage;

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

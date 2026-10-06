import React from 'react';
import MapComponent from '../components/MapComponent';
import TaxiInfo from '../components/TaxiInfo';
import { Event as AppEvent } from '../types';

interface MapaPageProps {
    events: AppEvent[];
}

const MapaPage: React.FC<MapaPageProps> = ({ events }) => {
    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-center mb-4">
                Mapa de Verbenas en Tenerife
            </h1>
            <MapComponent events={events} />
            <TaxiInfo />
        </div>
    );
};

export default MapaPage;

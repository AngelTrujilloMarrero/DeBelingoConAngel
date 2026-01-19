import React from 'react';
import MapComponent from '../components/MapComponent';
import TaxiInfo from '../components/TaxiInfo';
import { Event as AppEvent } from '../types';

interface MapaPageProps {
    events: AppEvent[];
}

const MapaPage: React.FC<MapaPageProps> = ({ events }) => {
    return (
        <div className="space-y-6">
            <MapComponent events={events} />
            <TaxiInfo />
        </div>
    );
};

export default MapaPage;

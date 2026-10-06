import React from 'react';
import SocialMedia from '../components/SocialMedia';
import { Event } from '../types';

interface RedesPageProps {
    events: Event[];
}

const RedesPage: React.FC<RedesPageProps> = ({ events }) => {
    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <SocialMedia events={events} />
        </div>
    );
};

export default RedesPage;

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';

interface TurnstileContextType {
    token: string | null;
    resetToken: () => void;
}

const TurnstileContext = createContext<TurnstileContextType | undefined>(undefined);

export const useTurnstile = () => {
    const context = useContext(TurnstileContext);
    if (!context) {
        throw new Error('useTurnstile must be used within a TurnstileProvider');
    }
    return context;
};

interface TurnstileProviderProps {
    children: React.ReactNode;
}

export const TurnstileProvider: React.FC<TurnstileProviderProps> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const turnstileRef = React.useRef<TurnstileInstance>(null);

    const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // Test key by default

    const handleSuccess = useCallback((newToken: string) => {
        setToken(newToken);
        if (typeof window !== 'undefined') {
            (window as any)._turnstileToken = newToken;
        }
    }, []);

    const handleExpire = useCallback(() => {
        setToken(null);
        if (typeof window !== 'undefined') {
            (window as any)._turnstileToken = null;
        }
    }, []);

    const handleError = useCallback(() => {
        setToken(null);
        if (typeof window !== 'undefined') {
            (window as any)._turnstileToken = null;
        }
    }, []);

    const resetToken = useCallback(() => {
        setToken(null);
        turnstileRef.current?.reset();
    }, []);

    return (
        <TurnstileContext.Provider value={{ token, resetToken }}>
            {children}
            <div className="hidden">
                <Turnstile
                    ref={turnstileRef}
                    siteKey={SITE_KEY}
                    onSuccess={handleSuccess}
                    onExpire={handleExpire}
                    onError={handleError}
                    options={{
                        theme: 'light',
                        size: 'invisible',
                    }}
                />
            </div>
        </TurnstileContext.Provider>
    );
};

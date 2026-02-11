import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface TurnstileStatusProps {
  className?: string;
}

const TurnstileStatus: React.FC<TurnstileStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'checking' | 'success' | 'error' | 'warning'>('checking');
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    const checkTurnstileHealth = () => {
      // Enhanced checking for Turnstile issues
      const originalError = console.error;
      const originalWarn = console.warn;
      
      // Monitor console for specific errors
      const handleError = (...args: any[]) => {
        const message = args.join(' ').toLowerCase();
        
        if (message.includes('sandboxed') && message.includes('allow-scripts')) {
          setStatus('error');
          setDetails('🔒 Sandbox restriction - applying workaround...');
        } else if (message.includes('110200')) {
          setStatus('error');
          setDetails('🚫 Turnstile 110200 - configuration error');
        } else if (message.includes('private access token')) {
          setStatus('warning');
          setDetails('🔐 Turnstile challenge (normal)');
        } else if (message.includes('permission_denied')) {
          setStatus('error');
          setDetails('🚫 Firebase permission denied');
        } else {
          originalError.apply(console, args);
        }
      };

      const handleWarning = (...args: any[]) => {
        const message = args.join(' ').toLowerCase();
        if (message.includes('turnstile') || message.includes('site key')) {
          setStatus('warning');
          setDetails('⚠️ Turnstile configuration warning');
        } else {
          originalWarn.apply(console, args);
        }
      };

      console.error = handleError;
      console.warn = handleWarning;

      // Check Turnstile state after delay
      setTimeout(() => {
        const hasToken = (window as any)._turnstileToken !== undefined;
        const hasError = !!(window as any)._turnstileError;
        
        if (hasError) {
          setStatus('error');
          setDetails('❌ Turnstile has errors');
        } else if (hasToken && status !== 'error') {
          setStatus('success');
          setDetails('✅ Turnstile operational');
        } else if (!hasToken && !hasError) {
          setStatus('warning');
          setDetails('⏳ Turnstile initializing...');
        }
        
        // Restore original console methods
        console.error = originalError;
        console.warn = originalWarn;
      }, 4000);
    };

    checkTurnstileHealth();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  // NEVER show in production - always return null in prod
  if (import.meta.env.PROD || import.meta.env.MODE === 'production') {
    return null;
  }

  // Only show in explicit development
  if (import.meta.env.DEV) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 p-3 rounded-lg border max-w-xs ${getStatusColor()} ${className}`}>
        <div className="flex items-center gap-2 mb-1">
          {getStatusIcon()}
          <span className="font-medium text-sm">Turnstile Status</span>
        </div>
        {details && <p className="text-xs opacity-80">{details}</p>}
      </div>
    );
  }

  return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-3 rounded-lg border max-w-xs ${getStatusColor()} ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        {getStatusIcon()}
        <span className="font-medium text-sm">Turnstile Status</span>
      </div>
      {details && <p className="text-xs opacity-80">{details}</p>}
    </div>
  );
};

export default TurnstileStatus;
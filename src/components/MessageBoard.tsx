import React, { useState, useEffect } from 'react';
import { db, onValue, set, get } from '../utils/firebase';
import { ref, push, limitToLast, query, serverTimestamp } from 'firebase/database';
import { MessageSquare, Send, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    timestamp: number;
    author: string;
}

const MessageBoard: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [dailyLimitReached, setDailyLimitReached] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

    // Captcha state
    const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: '' });
    const [userCaptcha, setUserCaptcha] = useState('');

    const messagesRef = ref(db, 'guestbook/messages');

    useEffect(() => {
        generateCaptcha();

        // Check daily limit based on ACTUAL messages in DB for today
        const checkLimit = async () => {
            try {
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                const startTime = startOfToday.getTime();

                const snapshot = await get(messagesRef);
                const data = snapshot.val();

                if (data) {
                    const todayMessages = Object.values(data).filter((msg: any) =>
                        msg.timestamp >= startTime
                    ).length;
                    setDailyLimitReached(todayMessages >= 10);
                } else {
                    setDailyLimitReached(false);
                }
            } catch (e) {
                console.error("Error checking limits:", e);
            }
        };
        checkLimit();

        // Listen for messages and filter older than 2 months
        const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000;
        const q = query(messagesRef, limitToLast(100)); // Increased limit to ensure we see enough
        const unsubscribe = onValue(q, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const now = Date.now();
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                const startTime = startOfToday.getTime();

                const messageList = Object.entries(data)
                    .map(([id, val]: [string, any]) => ({
                        id,
                        ...val,
                    }))
                    .filter(msg => (now - msg.timestamp) < TWO_MONTHS_MS)
                    .sort((a, b) => a.timestamp - b.timestamp);

                setMessages(messageList);

                // Re-check limit whenever messages change (e.g. admin deletes)
                const todayMessagesCount = messageList.filter(msg => msg.timestamp >= startTime).length;
                setDailyLimitReached(todayMessagesCount >= 10);
            } else {
                setMessages([]);
                setDailyLimitReached(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const generateCaptcha = () => {
        const n1 = Math.floor(Math.random() * 10);
        const n2 = Math.floor(Math.random() * 5) + 1;
        setCaptcha({ num1: n1, num2: n2, answer: (n1 + n2).toString() });
        setUserCaptcha('');
    };

    const moderateMessage = async (text: string): Promise<boolean> => {
        try {
            const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(text)}`);
            const isProfane = await response.text();

            if (isProfane === 'true') return false;

            const spanishKeywords = ['puto', 'puta', 'mierda', 'cabron', 'gilipollas', 'joder', 'zorra'];
            const lowerText = text.toLowerCase();
            if (spanishKeywords.some(word => lowerText.includes(word))) return false;

            return true;
        } catch (error) {
            console.error('Error in moderation:', error);
            return true;
        }
    };

    const sendEmailNotification = async (message: string) => {
        try {
            // Usamos FormSubmit: 100% gratuito, sin API Keys y plug-and-play.
            // La primera vez recibirás un correo para confirmar la dirección.
            await fetch("https://formsubmit.co/ajax/atrujimar@gmail.com", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    _subject: "🔔 Nuevo mensaje en el Muro de Belingo",
                    Mensaje: message,
                    Fecha: new Date().toLocaleString('es-ES'),
                    _template: "table", // Formato visual limpio en el email
                    _captcha: "false"   // Ya tenemos nuestro propio captcha
                })
            });
            console.log('Intento de notificación enviado');
        } catch (error) {
            console.error('Error al enviar correo:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || sending) return;

        if (userCaptcha !== captcha.answer) {
            setStatus({ type: 'error', message: 'Captcha incorrecto' });
            generateCaptcha();
            return;
        }

        if (dailyLimitReached) {
            setStatus({ type: 'error', message: 'Límite de 10 mensajes hoy alcanzado.' });
            return;
        }

        setSending(true);
        setStatus({ type: null, message: '' });

        try {
            const isClean = await moderateMessage(newMessage);
            if (!isClean) {
                setStatus({ type: 'error', message: 'Contenido no permitido.' });
                setSending(false);
                generateCaptcha();
                return;
            }

            await push(messagesRef, {
                text: newMessage.trim(),
                author: 'Anónimo',
                timestamp: serverTimestamp(),
            });

            // Intentar enviar notificación
            sendEmailNotification(newMessage.trim());

            setNewMessage('');
            setUserCaptcha('');
            generateCaptcha();
            setStatus({ type: 'success', message: '¡Enviado! Tu mensaje ya es público.' });

            setTimeout(() => setStatus({ type: null, message: '' }), 3000);

        } catch (error) {
            console.error('Error:', error);
            setStatus({ type: 'error', message: 'Error de conexión con el muro.' });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="w-full mt-0 mb-0 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl overflow-hidden">
                {/* Header - Centered */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 md:p-10 border-b border-white/10">
                    <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center gap-6">
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 transform hover:rotate-12 transition-transform duration-500">
                                <MessageSquare className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-white drop-shadow-2xl uppercase italic">
                                    Muro de Mensajes
                                </h3>
                                <div className="mt-2 flex items-center justify-center gap-2">
                                    <div className="h-px w-8 bg-blue-300/50"></div>
                                    <p className="text-blue-100/90 font-bold uppercase tracking-[0.2em] text-xs">Comunidad Verbenera</p>
                                    <div className="h-px w-8 bg-blue-300/50"></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-lg">
                            <span className={`h-2.5 w-2.5 rounded-full ${dailyLimitReached ? 'bg-red-500 animate-pulse' : 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]'}`}></span>
                            <span className={`text-xs font-black tracking-widest uppercase ${dailyLimitReached ? 'text-red-300' : 'text-green-300'}`}>
                                {dailyLimitReached ? 'Límite alcanzado' : 'Muro Abierto'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto p-6 md:p-10">
                    <div className="grid lg:grid-cols-5 gap-0 lg:gap-10">
                        {/* Messages List */}
                        <div className="lg:col-span-3 space-y-4">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <span className="w-8 h-px bg-blue-400/30"></span>
                                Mensajes Recientes
                            </h4>
                            <div className="max-h-[500px] min-h-[200px] overflow-y-auto pr-4 custom-scrollbar space-y-4">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-48 space-y-4">
                                        <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                                        <p className="text-blue-300 animate-pulse">Sincronizando muro...</p>
                                    </div>
                                ) : messages.length > 0 ? (
                                    messages.slice().reverse().map((msg) => (
                                        <div key={msg.id} className="group/msg animate-in fade-in slide-in-from-left-4 duration-500">
                                            <div className="flex items-center gap-3 mb-1 ml-1">
                                                <span className="text-[10px] text-gray-500 font-mono">
                                                    {new Date(msg.timestamp).toLocaleDateString()} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm rounded-2xl rounded-tl-none p-5 border border-gray-600/30 group-hover/msg:border-blue-500/40 transition-all duration-300 shadow-lg hover:shadow-blue-900/10">
                                                <p className="text-gray-200 leading-relaxed font-medium">{msg.text}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-gray-800/30 border border-dashed border-gray-700 rounded-3xl p-12 text-center">
                                        <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
                                        <p className="text-gray-500 font-bold text-lg">El muro está vacío</p>
                                        <p className="text-gray-600 text-sm">¡Sé el primero en dejar un saludo!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Input Form */}
                        <div className="lg:col-span-2 lg:pl-6">
                            <div className="sticky top-24">
                                <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800/40 p-6 lg:p-8 rounded-3xl border border-gray-700/50 backdrop-blur-sm shadow-xl">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-blue-300 uppercase tracking-widest ml-1">Tu Mensaje</label>
                                            <span className="text-[10px] font-mono text-gray-500 bg-black/30 px-2 py-0.5 rounded-full">{newMessage.length}/150</span>
                                        </div>
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value.substring(0, 150))}
                                            disabled={dailyLimitReached || sending}
                                            placeholder={dailyLimitReached ? "Límite alcanzado, borra mensajes para publicar..." : "Cuéntanos algo..."}
                                            className="w-full bg-gray-900/60 border border-gray-600/50 rounded-2xl p-5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none resize-none min-h-[160px] text-white placeholder:text-gray-600 shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-5 rounded-2xl border border-blue-500/20">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em]">Escudo Anti-Spam</span>
                                                <ShieldAlert className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 bg-black/40 rounded-xl py-3 text-center font-black text-xl text-blue-100 border border-blue-500/20 select-none shadow-inner tracking-widest">
                                                    {captcha.num1} + {captcha.num2}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={userCaptcha}
                                                    onChange={(e) => setUserCaptcha(e.target.value)}
                                                    placeholder="?"
                                                    disabled={dailyLimitReached || sending}
                                                    className="w-24 bg-gray-900/80 border border-gray-600/50 rounded-xl py-3 text-center text-lg font-bold focus:ring-4 focus:ring-blue-500/20 outline-none text-white shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        {status.message && (
                                            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in zoom-in-95 duration-200 shadow-lg ${status.type === 'success'
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                                }`}>
                                                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                                                {status.message}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={dailyLimitReached || sending || !newMessage.trim() || !userCaptcha}
                                            className="w-full py-4 px-8 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all duration-300 transform active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden relative"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-transform duration-300 group-hover:scale-105"></div>
                                            <div className="relative flex items-center justify-center gap-3 text-white">
                                                {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                                <span>{sending ? 'Validando...' : 'Enviar Mensaje'}</span>
                                            </div>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="py-6 bg-black/50 border-t border-gray-800 text-center">
                    <p className="text-[12px] text-gray-400 font-black uppercase tracking-[0.5em] opacity-80">
                        Muro Comunitario
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MessageBoard;

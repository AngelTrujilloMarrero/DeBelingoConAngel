import React from 'react';
import { MessageCircle, Instagram, Heart, BookOpen, Scroll, Music2 } from 'lucide-react';
import { socialFollowersRef, onValue, set, get } from '../utils/firebase';

interface SocialLink {
  name: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hoverColor: string;
}

interface FollowersData {
  Instagram: string;
  WhatsApp: string;
  TikTok: string;
  lastUpdated?: string;
}

// Valores por defecto (fallback) - actualizados el 21/02/2026
const DEFAULT_FOLLOWERS: FollowersData = {
  Instagram: '8.895',
  WhatsApp: '2.100',
  TikTok: '0',
  lastUpdated: '2026-02-21'
};

const SocialMedia: React.FC = () => {
  const [followers, setFollowers] = React.useState<FollowersData>(DEFAULT_FOLLOWERS);
  const [loading, setLoading] = React.useState(true);
  const [dataSource, setDataSource] = React.useState<'firebase' | 'fallback'>('fallback');

  // Función para inicializar los datos en Firebase si no existen
  const initializeFirebaseData = async () => {
    try {
      const snapshot = await get(socialFollowersRef);
      if (!snapshot.exists()) {
        // Si no hay datos en Firebase, guardar los valores por defecto
        await set(socialFollowersRef, DEFAULT_FOLLOWERS);
        console.log('Datos de seguidores inicializados en Firebase');
      }
    } catch (error) {
      console.error('Error inicializando datos en Firebase:', error);
    }
  };

  // Escuchar cambios en Firebase en tiempo real
  React.useEffect(() => {
    setLoading(true);

    // Primero intentar inicializar los datos si no existen
    initializeFirebaseData();

    // Suscribirse a cambios en tiempo real
    const unsubscribe = onValue(
      socialFollowersRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val() as FollowersData;
          setFollowers({
            Instagram: data.Instagram || DEFAULT_FOLLOWERS.Instagram,
            WhatsApp: data.WhatsApp || DEFAULT_FOLLOWERS.WhatsApp,
            TikTok: data.TikTok || DEFAULT_FOLLOWERS.TikTok,
            lastUpdated: data.lastUpdated || DEFAULT_FOLLOWERS.lastUpdated
          });
          setDataSource('firebase');
        } else {
          // Si no hay datos, usar los valores por defecto
          setFollowers(DEFAULT_FOLLOWERS);
          setDataSource('fallback');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error obteniendo datos de Firebase:', error);
        // En caso de error, usar valores por defecto
        setFollowers(DEFAULT_FOLLOWERS);
        setDataSource('fallback');
        setLoading(false);
      }
    );

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => unsubscribe();
  }, []);

  const socialLinks: SocialLink[] = [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/debelingoconangel/',
      icon: Instagram,
      color: 'from-pink-500 to-purple-600',
      hoverColor: 'hover:from-pink-600 hover:to-purple-700'
    },
    {
      name: 'WhatsApp',
      url: 'https://whatsapp.com/channel/0029Va8nc2A77qVZokI0aC2K',
      icon: MessageCircle,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700'
    },
    {
      name: 'TikTok',
      url: 'https://www.tiktok.com/@debelingoconangel',
      icon: Music2,
      color: 'from-gray-900 to-black',
      hoverColor: 'hover:from-black hover:to-gray-900'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Sección de Redes Sociales */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center flex items-center justify-center gap-3">
            <Heart className="w-8 h-8 animate-pulse text-pink-200" />
            Síguenos en Nuestras Redes
            <Heart className="w-8 h-8 animate-pulse text-pink-200" />
          </h2>
          <p className="text-pink-100 text-center mt-2">
            Mantente conectado para no perderte ninguna verbena
          </p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {socialLinks.map((social) => {
              const IconComponent = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative bg-gradient-to-br ${social.color} ${social.hoverColor} text-white p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 transform`}
                >
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent"></div>
                  </div>

                  <div className="relative flex flex-col items-center text-center space-y-4">
                    <div className="bg-white/20 p-4 rounded-full group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                      <IconComponent className="w-8 h-8" />
                    </div>

                    <div>
                      <h3 className="font-bold text-lg">{social.name}</h3>
                      <div className="mt-2 mb-1">
                        <span className="text-2xl font-bold tracking-tight">
                          {loading ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            followers[social.name as keyof FollowersData] || 'N/A'
                          )}
                        </span>
                      </div>
                      <p className="text-xs font-medium opacity-90 uppercase tracking-widest text-white/80">
                        {social.name === 'Instagram' ? 'Seguidores' : social.name === 'WhatsApp' ? 'Suscriptores' : 'Seguidores'}
                      </p>
                    </div>

                    {/* Hover effect indicator */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></div>
                  </div>

                  {/* Shine effect */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-700"></div>
                </a>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-4 border border-purple-500/20">
              <p className="text-purple-200 text-sm">
                📱 Recibe notificaciones instantáneas de nuevas verbenas y eventos especiales
              </p>
              <p className="text-purple-300 text-xs mt-2">
                ¡Únete a nuestra comunidad de amantes de las verbenas de Tenerife!
              </p>
              {/* Indicador de última actualización */}
              <p className="text-purple-400/70 text-xs mt-3 flex items-center justify-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dataSource === 'firebase' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                {dataSource === 'firebase' ? '📊 Datos en tiempo real' : '📌 Datos de respaldo'}
                {followers.lastUpdated && ` • Última actualización: ${followers.lastUpdated}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Biografía - Colores acordes a la página */}
      <div className="biography-section relative overflow-hidden rounded-2xl shadow-2xl">
        {/* Fondo estilo papiro con colores de la página (grises oscuros, púrpuras) */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), transparent),
              radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.15), transparent),
              linear-gradient(135deg, 
                #1f2937 0%, #374151 15%, #4b5563 30%, 
                #6b7280 45%, #4b5563 60%, #374151 75%, 
                #1f2937 90%, #111827 100%
              )
            `,
            boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.5)'
          }}
        />

        {/* Textura de papel */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="paper-texture-dark">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
              <feDiffuseLighting in="noise" lightingColor="#6b7280" surfaceScale="2">
                <feDistantLight azimuth="45" elevation="60" />
              </feDiffuseLighting>
            </filter>
          </defs>
          <rect width="100%" height="100%" filter="url(#paper-texture-dark)" />
        </svg>

        {/* Borde decorativo estilo papiro con colores acordes */}
        <div className="absolute inset-0 pointer-events-none" style={{
          border: '12px solid transparent',
          borderImage: 'linear-gradient(135deg, #6366f1, #8b5cf6, #6366f1, #8b5cf6) 1',
          boxShadow: 'inset 0 0 30px rgba(99, 102, 241, 0.3), 0 10px 40px rgba(0,0,0,0.5)'
        }} />

        {/* Marco decorativo interno */}
        <div className="relative m-3 md:m-6 p-4 md:p-8" style={{
          border: '3px double #8b5cf6',
          borderRadius: '8px',
          boxShadow: 'inset 0 0 20px rgba(139, 92, 246, 0.2)'
        }}>
          {/* Esquinas decorativas */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-lg -translate-x-1 -translate-y-1" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-lg translate-x-1 -translate-y-1" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-lg -translate-x-1 translate-y-1" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-lg translate-x-1 translate-y-1" />

          {/* Título */}
          <div className="text-center mb-6 md:mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Scroll className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
              <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-purple-300" />
              <Scroll className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
            </div>
            <h2
              className="text-2xl md:text-4xl font-bold text-purple-200 tracking-wide"
              style={{
                fontFamily: '"Cinzel", "Times New Roman", serif',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)'
              }}
            >
              BIOGRAFÍA DE DE BELINGO CON ÁNGEL
            </h2>
            <div className="mt-2 flex justify-center">
              <div className="w-32 md:w-48 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
            </div>
          </div>

          {/* Contenido de la biografía */}
          <div
            className="text-gray-200 leading-relaxed space-y-4 md:space-y-6"
            style={{
              fontFamily: '"Crimson Text", "Palatino Linotype", "Book Antiqua", Palatino, serif',
              fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
              lineHeight: '1.8',
              textAlign: 'justify',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
            }}
          >
            <p className="first-letter:text-4xl md:first-letter:text-5xl first-letter:font-bold first-letter:text-purple-400 first-letter:float-left first-letter:mr-2 first-letter:mt-1">
              En marzo de 2006 comenzó mi aventura en el mundo de las orquestas, de una forma muy rudimentaria pero muy efectiva (vía web, con contactos de Messenger, teléfono, email y mensajes directos a foros). En aquel entonces no había nada en internet y era muy fácil despegar.
            </p>

            <p>
              Años más tarde, de mis incursiones en la radio por internet, <strong className="text-purple-300">RADIO TROPIN FM</strong> y <strong className="text-purple-300">FM RUMBEROS</strong>, decidí dar el salto a las redes sociales en abril de 2014. En 2014 pasaba un poco parecido a lo que había en 2006 por internet: casi nadie informaba por redes sociales.
            </p>

            <p>
              En aquel entonces llevaba el nombre <strong className="text-purple-300">VERBENAS Y ORQUESTAS CANARIAS BAILOTEO</strong>, nombre que tenía y tiene un gran impacto en redes sociales y las búsquedas. Eso ha ido cambiando afortunadamente y casi todas las comisiones de fiestas, orquestas y ayuntamientos informan puntualmente de sus verbenas y fiestas en general.
            </p>

            <p className="italic text-purple-300 text-lg">
              Pero la pregunta es clara: ¿Qué haces aquí, Ángel?
            </p>

            <p>
              Tanto en 2014 como a día de hoy no hay nadie que haga una recopilación de <strong className="text-purple-300">VERBENAS</strong> en Tenerife. Hay mucha publicación pero poca recopilación.
            </p>

            <p>
              En enero de 2024 decidí cambiar el nombre de la página a <strong className="text-purple-300">DE BELINGO CON ÁNGEL</strong>, ya que considero que no necesito más publicidad utilizando un nombre que no es adecuado para lo que informo, que es solo la isla de Tenerife.
            </p>

            <p>
              En diciembre de 2024 nace esta web, para tratar de mitigar los problemas de las redes sociales de la actualización de los bailes en tiempo y forma.
            </p>

            <p className="bg-purple-900/30 border-l-4 border-purple-500 p-4 italic">
              <strong className="text-purple-300">Nota importante:</strong> A partir del 23 de enero de 2026, se cierran las cuentas de Facebook y Telegram por diferencias con estas plataformas que no le llegan seguidores. Seguimos activos en Instagram y WhatsApp para seguir compartiendo las mejores verbenas de Tenerife.
            </p>

            <p className="text-center font-semibold text-lg md:text-xl mt-6 md:mt-8 text-purple-200">
              Espero que sea de su agrado tanto esta web como las redes sociales.
            </p>

            <div className="text-center mt-6 md:mt-8 space-y-2">
              <p className="text-xl md:text-2xl font-bold text-purple-200" style={{
                fontFamily: '"Cinzel", "Times New Roman", serif'
              }}>
                ¡Nos vemos en las verbenas de Tenerife!
              </p>
              <p className="text-2xl md:text-3xl font-bold animate-pulse text-purple-300" style={{
                fontFamily: '"Cinzel", "Times New Roman", serif',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.5)'
              }}>
                🎺 ¡Sácala a bailar, gandul! 💃
              </p>
            </div>

            {/* Firma */}
            <div className="text-right mt-6 md:mt-8 pt-4 border-t-2 border-purple-500/30">
              <p className="italic text-purple-300" style={{ fontFamily: '"Dancing Script", cursive, serif', fontSize: '1.5rem' }}>
                — Ángel Trujillo Marrero
              </p>
              <p className="text-sm text-purple-400 mt-1">
                Fundador de De Belingo Con Ángel
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos adicionales */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Dancing+Script:wght@400;500;600;700&display=swap');
        
        .biography-section {
          position: relative;
        }
        
        .biography-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.1;
          mix-blend-mode: overlay;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SocialMedia;

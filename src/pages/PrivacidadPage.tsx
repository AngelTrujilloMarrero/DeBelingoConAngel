import React from 'react';
import { ShieldCheck } from 'lucide-react';

const PrivacidadPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/30 mb-6">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Política de Privacidad</h1>
          <p className="text-gray-400 text-sm">Última actualización: Mayo 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-gray-300 leading-relaxed">

          <section className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">1. Información general</h2>
            <p>
              <strong className="text-white">De Belingo Con Ángel</strong> (en adelante, "la web") es un servicio informativo sin ánimo de lucro que ofrece una agenda de verbenas, conciertos y eventos populares en Tenerife. Esta política describe cómo tratamos la información de los usuarios que visitan o interactúan con la web.
            </p>
          </section>

          <section className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">2. Datos que recopilamos</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong className="text-white">Datos de navegación anónimos:</strong> páginas visitadas, tiempo de sesión y dispositivo (sin identificar al usuario).</li>
              <li><strong className="text-white">Mensajes del tablón:</strong> si utilizas el tablón de mensajes, el contenido publicado se almacena temporalmente.</li>
              <li><strong className="text-white">Conteo de visitas:</strong> se registra un contador anónimo de visitas totales para estadísticas internas.</li>
            </ul>
            <p className="mt-3">No recopilamos nombres, correos electrónicos ni datos personales identificables sin consentimiento explícito.</p>
          </section>

          <section className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">3. Uso de los datos</h2>
            <p>Los datos recopilados se utilizan exclusivamente para:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Mejorar el funcionamiento y la experiencia de la web.</li>
              <li>Generar estadísticas anónimas de uso.</li>
              <li>Mostrar contenido relevante de la agenda de eventos.</li>
            </ul>
          </section>

          <section className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">4. Cookies</h2>
            <p>
              La web utiliza cookies técnicas mínimas necesarias para el funcionamiento del sistema de verificación (Cloudflare Turnstile) y para el contador de visitas. No se utilizan cookies publicitarias ni de seguimiento de terceros.
            </p>
          </section>

          <section className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">5. Tus derechos</h2>
            <p>
              De acuerdo con el RGPD, tienes derecho a acceder, rectificar o eliminar cualquier dato personal que pueda estar asociado a tu actividad en esta web. Para ejercer estos derechos, contacta con nosotros a través del correo  atrujimar@gmail.com.
            </p>
          </section>

          <section className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">6. Cambios en esta política</h2>
            <p>
              Nos reservamos el derecho de actualizar esta política en cualquier momento. Los cambios serán publicados en esta misma página con la fecha de actualización correspondiente.
            </p>
          </section>

          <div className="text-center text-gray-500 text-sm pt-4">
            <p>© {new Date().getFullYear()} De Belingo Con Ángel — Tenerife</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacidadPage;

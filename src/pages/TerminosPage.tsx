import React from 'react';
import { FileText } from 'lucide-react';

const TerminosPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Términos de Uso</h1>
          <p className="text-gray-400 text-sm">Última actualización: Mayo 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-gray-300 leading-relaxed">

          <section className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">1. Aceptación de los términos</h2>
            <p>
              Al acceder y utilizar <strong className="text-white">De Belingo Con Ángel</strong> (en adelante, "la web"), aceptas estos Términos de Uso. Si no estás de acuerdo, te rogamos que no utilices el servicio.
            </p>
          </section>

          <section className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">2. Descripción del servicio</h2>
            <p>
              De Belingo Con Ángel es una plataforma informativa sin ánimo de lucro que ofrece una agenda actualizada de verbenas, conciertos y eventos de música popular en Tenerife. El contenido es orientativo y puede estar sujeto a cambios por parte de los organizadores de los eventos.
            </p>
          </section>

          <section className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">3. Uso permitido</h2>
            <p>El usuario se compromete a utilizar la web de forma lícita y respetuosa. Queda prohibido:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Usar la web para fines comerciales sin autorización expresa.</li>
              <li>Publicar contenido ofensivo, spam o información falsa en el tablón de mensajes.</li>
              <li>Intentar acceder a partes restringidas del sistema.</li>
              <li>Reproducir, distribuir o modificar el contenido de la web sin permiso.</li>
            </ul>
          </section>

          <section className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">4. Exactitud de la información</h2>
            <p>
              Hacemos todo lo posible por mantener la agenda de eventos actualizada, pero no garantizamos la exactitud, completitud o vigencia de la información publicada. Recomendamos verificar los datos directamente con los organizadores de cada evento antes de asistir.
            </p>
          </section>

          <section className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">5. Propiedad intelectual</h2>
            <p>
              El contenido, diseño y código de esta web son propiedad de De Belingo Con Ángel, salvo que se indique lo contrario. Los logos, imágenes de orquestas y artistas pertenecen a sus respectivos propietarios y se utilizan con fines informativos.
            </p>
          </section>

          <section className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">6. Limitación de responsabilidad</h2>
            <p>
              De Belingo Con Ángel no se responsabiliza de los daños directos o indirectos que pudieran derivarse del uso de la web, de la cancelación de eventos publicados o de la información proporcionada por terceros.
            </p>
          </section>

          <section className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">7. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado de la web tras los cambios implica la aceptación de los nuevos términos.
            </p>
          </section>

          <section className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-3">8. Legislación aplicable</h2>
            <p>
              Estos términos se rigen por la legislación española. Cualquier disputa será sometida a los tribunales competentes de la provincia de Santa Cruz de Tenerife, España.
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

export default TerminosPage;

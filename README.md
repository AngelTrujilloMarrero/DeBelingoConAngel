# Verbenas en Tenerife

Aplicación web para descubrir y seguir las verbenas y eventos musicales en Tenerife. Desarrollada con React, TypeScript y tecnologías modernas para ofrecer una experiencia completa y accesible.

## 🎭 ¿Qué es Verbenas en Tenerife?

Una plataforma digital que centraliza información sobre verbenas, conciertos y eventos culturales en la isla de Tenerife. La aplicación permite:

- 🗓️ Descubrir eventos próximos con filtrado por fechas y ubicaciones
- 🗺️ Visualizar eventos en mapa interactivo con transporte público TITSA
- 🎵 Explorar formaciones y orquestas de Tenerife con información detallada
- 📊 Análisis estadístico de orquestas y eventos con rankings
- 📱 Seguir redes sociales con métricas en tiempo real
- 📝 Leer artículos y noticias en el blog integrado
- 💬 Comentarios y participación comunitaria
- 🌤️ Información meteorológica con alertas AEMET

## 🎯 Público Objetivo

- **Residentes locales**: Descubrir eventos cercanos y planificar actividades
- **Turistas**: Explorar la cultura musical tinerfeña durante su visita
- **Organizadores**: Promocionar y dar visibilidad a sus eventos
- **Amantes de la música**: Seguir a sus orquestas favoritas

## 🚀 Características Principales

### 📋 Listado de Eventos
- Vista completa de verbenas y conciertos
- Filtrado por fechas, ubicaciones y orquestas
- Información detallada de cada evento
- Actualizaciones en tiempo real
- Información meteorológica con alertas AEMET

### 🗺️ Mapa Interactivo
- Geolocalización de eventos en tiempo real
- Filtros por zonas y municipios de Tenerife
- Navegación intuitiva con Leaflet
- Clusters para mejor visualización
- **Integración con transporte público TITSA**
- Información de rutas y paradas cercanas
- Opciones de taxi y ubicación del usuario

### 📊 Estadísticas y Análisis
- Datos comparativos entre orquestas
- Gráficos interactivos de tendencias
- Análisis de popularidad y asistencia
- Métricas detalladas de rendimiento
- Rankings históricos y actuales
- Estadísticas por temporada

### 🎵 Formaciones (Orquestas)
- Listado completo de orquestas de Tenerife
- Información de contacto y redes sociales
- Análisis detallado de actividad
- Imágenes dinámicas de redes sociales
- Búsqueda y filtrado avanzado
- Estadísticas de eventos por formación

### 📱 Redes Sociales
- Enlaces a redes sociales oficiales
- Contador de seguidores en tiempo real
- Integración con Instagram y WhatsApp 
- Actualizaciones automáticas de métricas
- Contenido dinámico de la comunidad

### 📝 Blog Integrado
- Artículos sobre verbenas y eventos
- Noticias y actualizaciones culturales
- Alojado en Hashnode
- Integración fluida con la plataforma
- Visualización optimizada de contenido

### 💬 Comunidad
- Tablero de mensajes y comentarios
- Sistema de respuestas anidadas
- Interacción entre usuarios
- Feedback directo para organizadores
- Moderación y gestión de contenido

### 📱 Responsive Design
- Experiencia optimizada para móviles
- Diseño adaptativo para tablets y desktop
- Navegación intuitiva en todos los dispositivos
- Interfaz moderna con gradientes y animaciones

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** - Framework principal con componentes modernos
- **TypeScript** - Tipado estático para mayor robustez
- **Vite** - Herramienta de desarrollo ultrarrápida
- **Tailwind CSS** - Framework de CSS utility-first
- **React Router Dom** - Gestión de rutas client-side

### UI Components
- **Radix UI** - Componentes accesibles y personalizables
- **Lucide React** - Iconos modernos y consistentes
- **Sonner** - Sistema de notificaciones toast

### Visualización y Datos
- **Chart.js & React Chart.js 2** - Gráficos interactivos
- **Recharts** - Visualizaciones de datos complejas
- **Leaflet & React Leaflet** - Mapas interactivos

### Backend y Servicios
- **Firebase** - Base de datos y autenticación
- **AEMET API** - Datos meteorológicos en tiempo real

### Desarrollo
- **ESLint** - Linting y calidad de código
- **PostCSS** - Procesamiento de CSS
- **pnpm** - Gestión de paquetes eficiente



## 📦 Instalación

### Prerrequisitos
- Node.js (versión 18 o superior)
- pnpm (recomendado) o npm

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd WebDebelingo
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   Editar `.env.local` con tus configuraciones de Firebase y otras API keys.

4. **Ejecutar en desarrollo**
   ```bash
   pnpm dev
   ```

5. **Acceder a la aplicación**
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## 🚀 Deployment en Vercel

El proyecto está configurado para desplegarse automáticamente en Vercel. Para configurar tu propio deployment:

### Configuración Rápida

1. **Importa el proyecto en Vercel**
   - Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click en "Add New Project"
   - Importa este repositorio

2. **Configura las variables de entorno**
   - Ve a Settings → Environment Variables
   - Agrega las 10 variables necesarias (ver `VERCEL_QUICK_GUIDE.md`)
   - Marca todas como "Sensitive"

3. **Deploy automático**
   - Cada `git push` desplegará automáticamente
   - Vercel detecta cambios y actualiza tu aplicación

### 📚 Documentación de Deployment

- **[VERCEL_QUICK_GUIDE.md](./VERCEL_QUICK_GUIDE.md)** - Guía rápida de 5 minutos
- **[VERCEL_SETUP.md](./VERCEL_SETUP.md)** - Guía completa paso a paso
- **[VERCEL_CHECKLIST.md](./VERCEL_CHECKLIST.md)** - Checklist de verificación

### Variables de Entorno Requeridas

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_IMGBB_API_KEY
VITE_IMGUR_CLIENT_IDS
```

Ver `.env.example` para descripciones detalladas de cada variable.


## 🏗️ Arquitectura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes UI base (Radix UI)
│   ├── EventsList.tsx  # Listado de eventos
│   ├── MapComponent.tsx # Mapa interactivo
│   ├── Navigation.tsx  # Barra de navegación
│   ├── Header.tsx      # Cabecera
│   ├── VisitCounter.tsx # Contador de visitas
│   └── ...
├── pages/              # Páginas principales
│   ├── EventosPage.tsx # Página principal de eventos
│   ├── MapaPage.tsx    # Página del mapa con TITSA
│   ├── EstadisticasPage.tsx # Estadísticas y análisis
│   ├── FormacionesPage.tsx # Información de orquestas
│   ├── RedesPage.tsx   # Redes sociales
│   ├── BlogPage.tsx    # Blog integrado
│   └── ...
├── hooks/              # Hooks personalizados
│   ├── useEvents.ts    # Gestión de eventos
│   ├── useAemetAlerts.ts # Alertas meteorológicas
│   ├── useHashnode.ts  # Integración con blog
│   └── ...
├── utils/              # Utilidades
│   ├── firebase.ts     # Configuración Firebase
│   ├── geocoding.ts    # Utilidades de geolocalización
│   ├── socialScraper.ts # Scraping de redes sociales
│   └── ...
├── types/              # Definiciones TypeScript
└── lib/                # Librerías compartidas
```

## 🤝 Contribuir al Proyecto

¡Las contribuciones son bienvenidas! Por favor consulta el archivo [CONTRIBUTING.md](./CONTRIBUTING.md) para más detalles sobre cómo colaborar.

### Áreas de Contribución

1. **🐛 Reporte de bugs**: Abre issues detallando problemas encontrados
2. **✨ Nuevas funcionalidades**: Propone mejoras y nuevas características
3. **📝 Documentación**: Mejora la documentación existente
4. **🎨 UI/UX**: Sugerencias de diseño y experiencia de usuario
5. **🧪 Testing**: Añade pruebas unitarias y de integración

## 🎨 Decisiones de Diseño

### Component-First Architecture
- Componentes modulares y reutilizables
- Separación clara entre lógica y presentación
- Uso de composición sobre herencia

### State Management
- Estado local con React Hooks
- Estado global compartido a través de Context
- Datos asíncronos con custom hooks

### Performance
- Code splitting con React.lazy
- Optimización de renders con useMemo y useCallback
- Bundle analysis con Vite

### Accessibility
- Componentes Radix UI con semántica correcta
- Navegación por teclado
- Contenido accesible para screen readers

## 📈 Hoja de Ruta

Consulta [ROADMAP.md](./ROADMAP.md) para ver las funcionalidades planeadas y el estado actual del desarrollo.

### Próximas Versiones

- **v1.1**: Sistema de notificaciones push
- **v1.2**: Modo offline con PWA
- **v1.3**: Integración con redes sociales
- **v2.0**: Aplicación móvil nativa



## 📝 Historial de Cambios

Todos los cambios importantes están documentados en [CHANGELOG.md](./CHANGELOG.md).

## 📄 Licencia

Este proyecto está licenciado bajo la [MIT License](./LICENSE).

## 🙏 Agradecimientos

- A la comunidad de Tenerife por inspirar este proyecto
- A los desarrolladores de las librerías open source utilizadas
- A los organizadores de verbenas que comparten sus eventos

## 📞 Contacto

- **Proyecto**: De Belingo Con Ángel - Verbenas en Tenerife
- **Web**: [https://debelingoconangel.web.app]
- **Blog**: [https://de-belingo-con-angel.hashnode.dev](https://de-belingo-con-angel.hashnode.dev)
- **Issues**: [GitHub Issues]

---

Desarrollado con 💙 para la comunidad de Tenerife

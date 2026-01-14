# Contribuyendo a Verbenas en Tenerife

¡Gracias por tu interés en contribuir a Verbenas en Tenerife! Este documento te guiará sobre cómo puedes colaborar con el proyecto de manera efectiva.

## 📋 Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [Empezando](#empezando)
3. [Proceso de Contribución](#proceso-de-contribución)
4. [Estándares de Código](#estándares-de-código)
5. [Convenciones de Commits](#convenciones-de-commits)
6. [Guía de Estilo](#guía-de-estilo)
7. [Testing](#testing)
8. [Pull Requests](#pull-requests)
9. [Reporte de Issues](#reporte-de-issues)
10. [Tipos de Contribuciones](#tipos-de-contribuciones)

---

## 🤝 Código de Conducta

Nos comprometemos a proporcionar un ambiente amigable, seguro y acogedor para todos, sin importar:

- Nivel de experiencia
- Género, identidad y expresión de género
- Orientación sexual
- Discapacidad
- Apariencia personal
- Tamaño corporal
- Etnia
- Religión
- Nacionalidad
- Cualquier otra característica

### Comportamiento Esperado
- Ser respetuoso y considerar diferentes puntos de vista
- Usar lenguaje apropiado y profesional
- Aceptar crítica constructiva
- Enfocarse en lo que sea mejor para la comunidad
- Mostrar empatía hacia otros miembros de la comunidad

### Comportamiento Inaceptable
- Uso de lenguaje sexualizado o acoso
- Comentarios ofensivos, insultos o ataques personales
- Publicación de información privada sin permiso
- Cualquier otra conducta no profesional

---

## 🚀 Empezando

### Prerrequisitos

1. **Node.js**: Versión 18 o superior
2. **pnpm**: Gestor de paquetes (recomendado)
3. **Git**: Control de versiones
4. **Editor de código**: VS Code recomendado con extensiones:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Configuración del Entorno

1. **Fork del repositorio**
   ```bash
   # Fork en GitHub y clona tu fork
   git clone https://github.com/tu-usuario/WebDebelingo.git
   cd WebDebelingo
   ```

2. **Añadir upstream**
   ```bash
   git remote add upstream https://github.com/usuario-original/WebDebelingo.git
   ```

3. **Instalar dependencias**
   ```bash
   pnpm install
   ```

4. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   # Configura tus variables de entorno
   ```

5. **Ejecutar en desarrollo**
   ```bash
   pnpm dev
   ```

---

## 🔄 Proceso de Contribución

### 1. Elegir un Issue

- Revisa los [issues abiertos](https://github.com/usuario-original/WebDebelingo/issues)
- Comenta en el issue que quieres trabajar
- Espera asignación o confirma que nadie más está trabajando en él

### 2. Crear una Rama

```bash
# Actualiza tu branch main
git checkout main
git pull upstream main

# Crea una nueva rama para tu contribución
git checkout -b feature/tu-nueva-funcionalidad
# o
git checkout -b fix/arreglo-del-bug
```

### 3. Desarrollar

- Sigue las [guías de estilo](#guía-de-estilo)
- Escribe [tests](#testing) si aplica
- Haz commits descriptivos siguiendo las [convenciones](#convenciones-de-commits)

### 4. Testear

```bash
# Ejecutar tests
pnpm test

# Ejecutar linting
pnpm lint

# Build para producción
pnpm build
```

### 5. Pull Request

- Envía tus cambios a tu fork
- Crea un Pull Request contra `main`
- Completa el template de PR
- Espera revisión del equipo

---

## 📝 Estándares de Código

### TypeScript

- Usar TypeScript para todo código nuevo
- Evitar `any` siempre que sea posible
- Definir tipos explícitos para props y funciones
- Usar interfaces para definición de objetos

```tsx
// ✅ Bueno
interface EventCardProps {
  event: Event;
  onFavorite: (id: string) => void;
  className?: string;
}

const EventCard: React.FC<EventCardProps> = ({ event, onFavorite, className }) => {
  // implementación
};

// ❌ Malo
const EventCard = ({ event, onFavorite, className }: any) => {
  // implementación
};
```

### React

- Componentes funcionales con hooks
- Props destructuring en la firma
- Early returns para condiciones complejas
- Evitar副作用 en render

```tsx
// ✅ Bueno
const EventList: React.FC<EventListProps> = ({ events, loading }) => {
  if (loading) return <EventListSkeleton />;
  if (!events.length) return <EmptyState />;

  return (
    <div className="event-list">
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};

// ❌ Malo
const EventList = ({ events, loading }: EventListProps) => {
  console.log('rendering'); // 🚫副作用
  let content;
  
  if (loading) {
    content = <EventListSkeleton />;
  } else if (!events.length) {
    content = <EmptyState />;
  } else {
    content = (
      <div className="event-list">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    );
  }
  
  return content;
};
```

### CSS y Tailwind

- Usar Tailwind CSS preferentemente
- Evitar CSS inline excepto para estilos dinámicos
- Componentes UI del proyecto (`src/components/ui/`)
- Diseño responsive siempre

```tsx
// ✅ Bueno
<div className="flex flex-col md:flex-row gap-4 p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
</div>

// ❌ Malo
<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>{title}</h2>
</div>
```

---

## 📦 Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/) para estandarizar mensajes de commit.

### Formato

```
<tipo>[ámbito opcional]: <descripción>

[opcionalmente cuerpo]

[opcionalmente pie]
```

### Tipos Principales

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style**: Cambios de formato, sin lógica
- `refactor**: Refactoring de código
- `test`: Adición o modificación de tests
- `chore**: Cambios de build, herramientas, etc.

### Ejemplos

```bash
feat(events): add filtering by date range
fix(map): resolve marker clustering issue
docs(readme): update installation instructions
refactor(components): extract common Button component
test(events): add unit tests for EventCard
```

---

## 🎨 Guía de Estilo

### Nomenclatura

- **Componentes**: PascalCase
- **Funciones/Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Archivos**: kebab-case para componentes comunes

```tsx
// Componentes
EventCard.tsx
EventList.tsx
UserProfile.tsx

// Funciones
const fetchEvents = async () => {}
const handleUserInput = (value: string) => {}

// Constantes
const API_BASE_URL = 'https://api.example.com';
const MAX_EVENTS_PER_PAGE = 20;
```

### Estructura de Archivos

```tsx
// Component structure order
import React from 'react';
import { ComponentProps } from './types';

// 1. Type definitions
interface ComponentProps extends ComponentProps {
  // props específicos
}

// 2. Helper functions
const formatEventDate = (date: Date) => {};

// 3. Component
const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  return <div>{content}</div>;
};

export default Component;
```

### Comentarios

- Comentar solo lógica compleja
- Usar JSDoc para funciones exportadas
- Mantener comentarios actualizados

```tsx
/**
 * Formatea una fecha para mostrarla en el formato local español
 * @param date - Fecha a formatear
 * @returns string con la fecha formateada
 */
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};
```

---

## 🧪 Testing

### Pruebas Unitarias

```bash
# Ejecutar tests
pnpm test

# Ejecutar tests en modo watch
pnpm test:watch

# Cobertura de código
pnpm test:coverage
```

### Convenciones

- Un test por función/método importante
- Tests descriptivos con formato `should [result] when [condition]`
- Mock de dependencias externas

```tsx
describe('EventCard', () => {
  it('should render event title correctly', () => {
    const mockEvent = { id: '1', title: 'Test Event' };
    render(<EventCard event={mockEvent} />);
    
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });

  it('should call onFavorite when favorite button is clicked', () => {
    const mockOnFavorite = jest.fn();
    const mockEvent = { id: '1', title: 'Test Event' };
    
    render(<EventCard event={mockEvent} onFavorite={mockOnFavorite} />);
    fireEvent.click(screen.getByRole('button', { name: /favorite/i }));
    
    expect(mockOnFavorite).toHaveBeenCalledWith('1');
  });
});
```

---

## 🔀 Pull Requests

### Requisitos para PR

1. **Tests pasando**: Todos los tests deben pasar
2. **Limpieza de código**: Sin warnings de ESLint
3. **Build exitoso**: `pnpm build` debe completarse
4. **Documentación**: Actualizada si aplica
5. **Commits limpios**: Histórico de commits organizado

### Template de PR

```markdown
## 📝 Descripción
Breve descripción de los cambios realizados.

## 🔄 Tipo de Cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación
- [ ] Refactor

## 🧪 Testing
- [ ] Tests unitarios agregados/actualizados
- [ ] Tests manuales realizados
- [ ] Casos de prueba documentados

## ✅ Checklist
- [ ] Mi código sigue las guías de estilo
- [ ] He realizado auto-revisión de mi código
- [ ] He añadido comentarios en áreas complejas
- [ ] Mi código genera cambios nuevos/esperados
- [ ] He actualizado la documentación
```

### Proceso de Revisión

1. **Automático**: CI/CD ejecuta tests y linting
2. **Humano**: Al menos un mantenedor debe aprobar
3. **Feedback**: Responder a comentarios y actualizar
4. **Merge**: Una vez aprobado, se integra a main

---

## 🐛 Reporte de Issues

### Bug Reports

Usa el template de bug report:

```markdown
## 🐛 Descripción del Bug
Descripción clara y concisa del problema.

## 🔄 Pasos para Reproducir
1. Ir a '...'
2. Click en '....'
3. Scroll a '....'
4. Ver error

## 🎯 Comportamiento Esperado
Describe lo que esperabas que ocurriera.

## 📸 Capturas de Pantalla
Añade capturas si aplica.

## 🖥️ Contexto del Entorno
- OS: [e.g. iOS]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]

## 📝 Notas Adicionales
Cualquier contexto adicional sobre el problema.
```

### Feature Requests

```markdown
## ✨ Descripción de la Funcionalidad
Descripción clara y concisa de la funcionalidad propuesta.

## 🎯 Problema que Resuelve
¿Qué problema actual soluciona esta funcionalidad?

## 💡 Solución Propuesta
Describe cómo imaginas la implementación.

## 🔄 Alternativas Consideradas
Otras soluciones que has considerado.

## 📊 Métricas de Éxito
¿Cómo mediremos que esta funcionalidad es exitosa?
```

---

## 🌟 Tipos de Contribuciones

### 💻 Desarrollo

**Frontend**
- React components y pages
- UI/UX improvements
- Performance optimization
- Responsive design

**Backend**
- API development
- Database optimizations
- Integrations with third-party services
- Security improvements

### 🎨 Diseño

- UI/UX mockups
- User flow diagrams
- Accessibility improvements
- Mobile app designs

### 📝 Documentación

- README improvements
- API documentation
- User guides
- Tutorial creation

### 🌍 Internacionalización

- Translation support
- Localization of dates/times
- Cultural adaptations
- Multi-language content

### 📈 Analytics y Datos

- Data analysis
- Performance metrics
- User behavior insights
- Statistical reports

---

## 🏆 Reconocimiento

### Niveles de Contribución

- **🌱 Contributor**: Primera contribución aceptada
- **🌿 Regular**: 3-5 contribuciones significativas
- **🌳 Core**: 10+ contribuciones, maintains module
- **🌲 Maintainer**: Acceso completo al proyecto

### Beneficios

- **🏅 Badges**: Reconocimiento en GitHub
- **📢 Menciones**: Featured en releases
- **👥 Community**: Acceso a canal de desarrolladores
- **🎁 Swag**: Merchandising exclusivo para contribuidores

---

## 📞 Contacto

- **Issues**: Para bugs y funcionalidades
- **Discussions**: Para preguntas generales
- **Discord**: Para chat en tiempo real
- **Email**: atrujimar@gmail.com

---

## 📚 Recursos Adicionales

- [Documentación de React](https://react.dev/)
- [Guía de TypeScript](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Guía de Git](https://git-scm.com/doc)

---

¡Gracias por contribuir a Verbenas en Tenerife! 🎉

*Estas guías están en evolución. Siéntete libre de sugerir mejoras.*

# Actualizador de Dependencias

Aplicación de escritorio con interfaz gráfica para actualizar las dependencias del proyecto y opencode.

## 🚀 Uso

### Opción 1: Usando el script (Recomendado)
```bash
./run-updater.sh
```

### Opción 2: Manualmente
```bash
cd updater-app
npx electron main.js
```

## 📋 Funcionalidades

La aplicación incluye tres botones principales:

1. **📦 Actualizar Dependencias (pnpm update)**
   - Actualiza todas las dependencias del proyecto usando pnpm

2. **🔄 Actualizar PNPM (pnpm self-update)**
   - Actualiza la versión de pnpm instalada en el sistema

3. **⬆️ Actualizar Opencode (opencode upgrade)**
   - Actualiza opencode a la última versión

## 🎯 Características

- ✅ Interfaz gráfica intuitiva
- ✅ Logs en tiempo real de cada comando
- ✅ Indicadores visuales de estado (carga, éxito, error)
- ✅ Botones deshabilitados durante ejecución
- ✅ Auto-scroll en área de logs
- ✅ Manejo de errores detallado

## 📂 Estructura de archivos

```
updater-app/
├── main.js          # Proceso principal de Electron
├── preload.js       # Script de preload
├── index.html       # Interfaz de usuario
├── package.json     # Configuración de la app
```

## 🔧 Requisitos

- Node.js instalado
- pnpm instalado
- opencode instalado
- Electron (se instala automáticamente)

## 🛠️ Instalación de dependencias

Si Electron no está instalado, el script lo instalará automáticamente:
```bash
npm install electron --save-dev
```
#!/bin/bash

echo "🚀 Iniciando Actualizador de Dependencias..."

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encuentra el archivo package.json"
    echo "ℹ️  Por favor, ejecuta este script desde el directorio del proyecto"
    exit 1
fi

# Verificar si Electron está instalado
if [ ! -d "node_modules/electron" ]; then
    echo "📦 Instalando Electron..."
    npm install electron --save-dev
fi

# Iniciar la aplicación
echo "🔄 Iniciando la aplicación de actualización..."
cd updater-app
npx electron main.js

echo "✅ Aplicación finalizada"
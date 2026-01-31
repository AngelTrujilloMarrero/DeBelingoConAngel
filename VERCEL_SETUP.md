# Configuración de Variables de Entorno en Vercel

## Variables que necesitas configurar en Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega las siguientes variables:

### Variables de Firebase
1. `VITE_FIREBASE_API_KEY` - Tu API Key de Firebase
2. `VITE_FIREBASE_AUTH_DOMAIN` - Tu dominio de autenticación de Firebase
3. `VITE_FIREBASE_DATABASE_URL` - URL de tu base de datos Firebase
4. `VITE_FIREBASE_PROJECT_ID` - ID de tu proyecto Firebase
5. `VITE_FIREBASE_STORAGE_BUCKET` - Storage bucket de Firebase
6. `VITE_FIREBASE_MESSAGING_SENDER_ID` - Sender ID de Firebase
7. `VITE_FIREBASE_APP_ID` - App ID de Firebase
8. `VITE_FIREBASE_MEASUREMENT_ID` - Measurement ID de Firebase

### Variables de Servicios de Imágenes
9. `VITE_IMGBB_API_KEY` - Tu API Key de ImgBB (obtén desde https://api.imgbb.com/)
10. `VITE_IMGUR_CLIENT_IDS` - Client IDs de Imgur, separados por coma (ej: "id1,id2,id3")

## Pasos para configurar en Vercel:

1. **Entra a tu proyecto en Vercel**
2. **Ve a Settings → Environment Variables**
3. **Haz clic en "Add New" para cada variable**
4. **Ingresa el nombre exacto de la variable** (respeta mayúsculas/minúsculas)
5. **Pega el valor real de la variable**
6. **Selecciona los entornos:** Production, Preview, Development
7. **Marca "Sensitive" para mayor seguridad**
8. **Haz clic en "Save"**

## Valores actuales de tu archivo .env local:

Para tu referencia, estos son los valores que tienes actualmente:

### Firebase:
- `VITE_FIREBASE_API_KEY`: AIzaSyCg1OiMDsmfoAGpSVYRnvWdl4tSPnLVoUo
- `VITE_FIREBASE_AUTH_DOMAIN`: debelingoconangel.firebaseapp.com
- `VITE_FIREBASE_DATABASE_URL`: https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app
- `VITE_FIREBASE_PROJECT_ID`: debelingoconangel
- `VITE_FIREBASE_STORAGE_BUCKET`: debelingoconangel.appspot.com
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: 690632293636
- `VITE_FIREBASE_APP_ID`: 1:690632293636:web:5ccf13559fccf3d53a2451
- `VITE_FIREBASE_MEASUREMENT_ID`: G-T8BV0MLJQJ

### Imágenes:
- `VITE_IMGBB_API_KEY`: be78b6d894fff24d363cd2abd6cddac0
- `VITE_IMGUR_CLIENT_IDS`: 7a19e6c8c7056d7,f0ea1437e4b31e8,43652b743b5a7a0,15e30ce94329ec4,2879199e5e55f13,546c25a59c58ad7,fc393963e63920c,ccfd9203a017260,902a281867c2957,86134371e54a93f

## Después de configurar:

1. **Haz push de los cambios a GitHub** para activar un nuevo deployment
2. **Vercel automáticamente usará las variables de entorno** durante el build
3. **Verifica que la aplicación funciona correctamente** en producción

## Importante:
- **Nunca incluyas valores reales en commits**
- **Usa solo el .env.example en tu repositorio**
- **Las variables marcadas como "Sensitive" no son visibles después de guardarlas**
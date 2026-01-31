# Vercel Serverless Functions - API Routes

Este directorio contiene las funciones serverless de Vercel que protegen las claves de API.

## 📁 Estructura

```
api/
├── upload-imgur.js    - Subida de imágenes a Imgur
└── upload-imgbb.js    - Subida de imágenes a ImgBB
```

## 🔐 Cómo Funcionan

Estas funciones actúan como un **backend seguro** que:

1. ✅ Reciben peticiones del frontend
2. ✅ Usan las API keys almacenadas en Vercel
3. ✅ Hacen las peticiones a Imgur/ImgBB
4. ✅ Devuelven solo la URL de la imagen

**Las claves NUNCA se exponen al navegador.**

## 🚀 Endpoints

### POST /api/upload-imgur

Sube una imagen a Imgur usando múltiples Client IDs para evitar rate limits.

**Request:**
```json
{
  "image": "base64_encoded_image_data"
}
```

**Response (Success):**
```json
{
  "success": true,
  "url": "https://i.imgur.com/xxxxx.jpg",
  "deleteHash": "xxxxxxxxx",
  "data": {
    "width": 1920,
    "height": 1080,
    "size": 245678
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

### POST /api/upload-imgbb

Sube una imagen a ImgBB.

**Request:**
```json
{
  "image": "base64_encoded_image_data"
}
```

**Response (Success):**
```json
{
  "success": true,
  "url": "https://i.ibb.co/xxxxx/image.jpg",
  "deleteUrl": "https://ibb.co/xxxxx/delete_hash",
  "data": {
    "width": 1920,
    "height": 1080,
    "size": 245678
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

## ⚙️ Variables de Entorno Requeridas

Estas funciones requieren las siguientes variables configuradas en Vercel:

- `IMGBB_API_KEY` - API key de ImgBB
- `IMGUR_CLIENT_IDS` - Client IDs de Imgur separados por coma

**Configúralas en:** Vercel Dashboard → Settings → Environment Variables

## 🧪 Testing Local

Para probar localmente con Vercel CLI:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Pull environment variables
vercel env pull .env.local

# Run development server
vercel dev
```

Esto iniciará un servidor local en `http://localhost:3000` que simula el entorno de Vercel.

## 📝 Uso desde el Frontend

El frontend usa `src/utils/secureImageUpload.ts` que internamente llama a estas APIs:

```typescript
import { uploadImage } from '../utils/imgur';

// Subir imagen con fallback automático
const { url, info } = await uploadImage(file, (progress) => {
  console.log(`${progress.percentage}% uploaded`);
});

console.log('Image URL:', url);
```

## 🔒 Seguridad

### ✅ Protecciones Implementadas:

1. **API Keys Ocultas**: Las claves solo existen en Vercel, nunca en el cliente
2. **Validación de Métodos**: Solo acepta POST requests
3. **Rate Limit Protection**: Múltiples Client IDs de Imgur
4. **NSFW Detection**: Rechaza contenido inapropiado (Imgur)
5. **File Validation**: Valida tipo y tamaño en el cliente antes de enviar

### ⚠️ Consideraciones:

- Las funciones no tienen autenticación por ahora
- Cualquiera con la URL puede usarlas
- Para producción, considera agregar:
  - Rate limiting (por IP)
  - Autenticación (Firebase Auth)
  - CORS restrictions
  - Request validation

## 📊 Monitoring

Ver logs de las funciones:

1. Ve a Vercel Dashboard
2. Deployments → [Tu deployment] → Functions
3. Click en la función → View Logs

## 🐛 Troubleshooting

### "Service not configured"
- Verifica que `IMGBB_API_KEY` o `IMGUR_CLIENT_IDS` estén en Vercel
- Asegúrate de que NO tienen el prefijo `VITE_`
- Redeploy después de agregar variables

### CORS Errors
- Las funciones de Vercel permiten CORS por defecto
- Si necesitas restricciones, agrega headers en las respuestas

### Rate Limiting
- Imgur: 12,500 uploads/día por Client ID
- ImgBB: Depende de tu plan
- Usa múltiples Client IDs para distribuir la carga

## 📚 Referencias

- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Imgur API](https://apidocs.imgur.com/)
- [ImgBB API](https://api.imgbb.com/)

---

Desarrollado con 💙 por DeBelingo Con Ángel

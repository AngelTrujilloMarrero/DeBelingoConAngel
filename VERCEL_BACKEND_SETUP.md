# 🚀 Configuración de Variables de Entorno en Vercel - ACTUALIZADO

## ✅ **NUEVA ARQUITECTURA: Vercel como Backend**

Con la nueva configuración:
- ✅ **Vercel**: Backend (API Routes) - protege las claves de API
- ✅ **Firebase**: Frontend (hosting) - como está ahora
- ✅ **Máxima seguridad**: Las claves NUNCA se exponen al cliente

---

## 🔐 PASO 1: Variables para el Backend (Vercel API Routes)

En Vercel → Settings → Environment Variables, agrega estas **2 variables**:

### Variables de Servicios de Imágenes (Backend)

| Variable | Valor | Uso |
|----------|-------|-----|
| `IMGBB_API_KEY` | `be78b6d894fff24d363cd2abd6cddac0` | **Backend** - Vercel API |
| `IMGUR_CLIENT_IDS` | `7a19e6c8c7056d7,f0ea1437e4b31e8,43652b743b5a7a0,15e30ce94329ec4,2879199e5e55f13,546c25a59c58ad7,fc393963e63920c,ccfd9203a017260,902a281867c2957,86134371e54a93f` | **Backend** - Vercel API |

**⚠️ IMPORTANTE:** 
- Estas variables NO tienen el prefijo `VITE_` porque son para el **backend**
- Solo son accesibles desde las funciones serverless de Vercel
- NUNCA se exponen al navegador

---

## 🔥 PASO 2: Variables para el Frontend (Firebase Config)

Estas variables SÍ tienen el prefijo `VITE_` y son para el cliente:

### Variables de Firebase (Frontend - 8 variables)

| Variable | Valor |
|----------|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyCg1OiMDsmfoAGpSVYRnvWdl4tSPnLVoUo` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `debelingoconangel.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | `https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app` |
| `VITE_FIREBASE_PROJECT_ID` | `debelingoconangel` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `debelingoconangel.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `690632293636` |
| `VITE_FIREBASE_APP_ID` | `1:690632293636:web:5ccf13559fccf3d53a2451` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-T8BV0MLJQJ` |

**✅ Estas claves de Firebase son seguras en el cliente** porque Firebase usa reglas de seguridad en el servidor.

---

## 📋 RESUMEN: Total de Variables

### Backend (sin prefijo VITE_) - 2 variables
- `IMGBB_API_KEY`
- `IMGUR_CLIENT_IDS`

### Frontend (con prefijo VITE_) - 8 variables
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

**Total: 10 variables** (igual que antes, pero organizadas diferente)

---

## ⚙️ PASO 3: Configurar en Vercel

Para cada variable:

1. Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**
2. Click en **"Add New"**
3. Ingresa el **nombre EXACTO** de la variable (respeta mayúsculas y sin espacios)
4. Pega el **valor** correspondiente
5. Selecciona los 3 entornos:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
6. **Marca "Sensitive"** para las variables del backend
7. Click **"Save"**

---

## 🔒 Seguridad Mejorada

### ✅ Antes (Variables en el cliente):
```
Cliente (Browser)
  ├─ VITE_IMGBB_API_KEY (❌ expuesta)
  ├─ VITE_IMGUR_CLIENT_IDS (❌ expuestas)
  └─ VITE_FIREBASE_* (✅ OK con reglas)
```

### ✅ Ahora (Variables en Vercel):
```
Cliente (Browser)
  ├─ fetch('/api/upload-imgur') → Vercel API
  ├─ fetch('/api/upload-imgbb') → Vercel API
  └─ VITE_FIREBASE_* (✅ OK con reglas)

Vercel Backend
  ├─ IMGBB_API_KEY (🔒 protegida)
  └─ IMGUR_CLIENT_IDS (🔒 protegidas)
```

---

## 🎯 ¿Cómo funciona?

1. **Usuario sube una imagen** en tu aplicación
2. **Frontend llama** a `/api/upload-imgur` o `/api/upload-imgbb`
3. **Vercel serverless function** maneja la petición
4. **La función usa** las claves del backend (no expuestas)
5. **Responde con la URL** de la imagen subida
6. **Cliente recibe** solo la URL final

**Las claves NUNCA llegan al navegador** 🎉

---

## 🚀 Deployment

Una vez configuradas las variables:

```bash
git add .
git commit -m "feat: secure image upload with Vercel API Routes"
git push
```

Vercel desplegará automáticamente con:
- ✅ API Routes en `/api/upload-imgur` y `/api/upload-imgbb`
- ✅ Variables de entorno protegidas
- ✅ Frontend en Vite con Firebase

---

## 🧪 Testing Local

Para probar localmente:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Pull environment variables
vercel env pull .env.local

# Run development
vercel dev
```

Esto iniciará un servidor local que simula el entorno de producción de Vercel.

---

## 📝 Archivos Creados

- `api/upload-imgur.js` - Serverless function para Imgur
- `api/upload-imgbb.js` - Serverless function para ImgBB
- `src/utils/secureImageUpload.ts` - Cliente que llama a las APIs
- `vercel.json` - Configuración actualizada

---

## ✅ Checklist de Configuración

- [ ] 2 variables de backend agregadas (IMGBB_API_KEY, IMGUR_CLIENT_IDS)
- [ ] 8 variables de frontend agregadas (VITE_FIREBASE_*)
- [ ] Todas marcadas como "Sensitive"
- [ ] Todas tienen los 3 entornos seleccionados
- [ ] Código pusheado a Git
- [ ] Vercel desplegó correctamente
- [ ] Probado subida de imágenes en producción

---

## 🆘 Troubleshooting

### Error: "Service not configured"
**Solución:** Verifica que `IMGBB_API_KEY` o `IMGUR_CLIENT_IDS` estén configuradas en Vercel (sin el prefijo VITE_)

### Error: "Firebase not defined"
**Solución:** Verifica que las variables `VITE_FIREBASE_*` estén configuradas con el prefijo

### Las imágenes no se suben
**Solución:** 
1. Revisa los logs: Vercel Dashboard → Deployments → View Function Logs
2. Verifica que las API Routes estén desplegadas correctamente
3. Prueba las URLs directamente: `https://tu-domain.vercel.app/api/upload-imgur`

---

Desarrollado con 💙 por DeBelingo Con Ángel

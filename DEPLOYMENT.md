# 🚀 Guía de Deployment - Firebase Hosting + Vercel Backend

## Arquitectura

Tu aplicación usa dos plataformas:

```
┌────────────────────────────────────────────────────┐
│  FIREBASE HOSTING                                  │
│  https://debelingoconangel.web.app                 │
│                                                     │
│  • Frontend (Vite + React)                         │
│  • Firebase Database                               │
│  • Firebase Auth                                   │
└──────────────┬─────────────────────────────────────┘
               │
               │ fetch('https://...vercel.app/api/upload-imgur')
               │
               ▼
┌────────────────────────────────────────────────────┐
│  VERCEL BACKEND                                    │
│  https://de-belingo-con-angel.vercel.app           │
│                                                     │
│  • POST /api/upload-imgur                          │
│  • POST /api/upload-imgbb                          │
│  • Variables de entorno (IMGBB_API_KEY, etc.)      │
└────────────────────────────────────────────────────┘
```

---

## 📋 Paso 1: Configurar Vercel (Backend)

### 1.1 Crear proyecto en Vercel

```bash
# Instalar Vercel CLI (opcional)
npm i -g vercel

# O hacerlo desde el dashboard web
```

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Importa tu repositorio `DeBelingo/WebDebelingo`
4. **IMPORTANTE:** Vercel solo debe desplegar las funciones de `/api`, no el frontend

### 1.2 Configurar variables de entorno

En Vercel Dashboard → Settings → Environment Variables:

| Variable | Valor | Entornos |
|----------|-------|----------|
| `IMGBB_API_KEY` | `tu_imgbb_api_key` | Production, Preview, Development |
| `IMGUR_CLIENT_IDS` | `client1,client2,client3,...` | Production, Preview, Development |

**✅ Para cada variable:**
- Marca como "Sensitive"
- Selecciona los 3 entornos
- Click "Save"

### 1.3 Verificar deployment

Una vez desplegado, prueba los endpoints:

```bash
# Probar endpoint de Imgur
curl -X POST https://de-belingo-con-angel.vercel.app/api/upload-imgur \
  -H "Content-Type: application/json" \
  -d '{"image":"test"}'

# Debería responder con error "Image data is required" o similar
```

**✅ URLs de tus API Routes:**
- `https://de-belingo-con-angel.vercel.app/api/upload-imgur`
- `https://de-belingo-con-angel.vercel.app/api/upload-imgbb`

---

## 📋 Paso 2: Configurar Frontend (Firebase Hosting)

### 2.1 Actualizar `.env` local

Crea/actualiza tu archivo `.env` local:

```bash
# Vercel Backend URL
VITE_VERCEL_API_URL=https://de-belingo-con-angel.vercel.app

# Firebase (las que ya tienes)
VITE_FIREBASE_API_KEY=AIzaSyCg1OiMDsmfoAGpSVYRnvWdl4tSPnLVoUo
VITE_FIREBASE_AUTH_DOMAIN=debelingoconangel.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=debelingoconangel
VITE_FIREBASE_STORAGE_BUCKET=debelingoconangel.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=690632293636
VITE_FIREBASE_APP_ID=1:690632293636:web:5ccf13559fccf3d53a2451
VITE_FIREBASE_MEASUREMENT_ID=G-T8BV0MLJQJ
```

### 2.2 Build y deploy

```bash
# Build del frontend (lee las variables del .env)
npm run build

# Deploy a Firebase Hosting
firebase deploy --only hosting
```

**✅ URL de tu aplicación:**
- `https://debelingoconangel.web.app`

---

## 🧪 Paso 3: Probar la Integración

### 3.1 Verificar CORS

1. Abre `https://debelingoconangel.web.app`
2. Abre DevTools → Network
3. Intenta subir una imagen
4. Verifica que la petición se haga a `https://de-belingo-con-angel.vercel.app/api/upload-imgur`
5. Verifica que no haya errores CORS

### 3.2 Verificar subida de imagen

1. Selecciona una imagen (JPG o PNG, <5MB)
2. Espera a que suba
3. Verifica que obtengas la URL de la imagen
4. Abre la URL para confirmar que se subió correctamente

---

## 🔄 Workflow de Desarrollo

### Desarrollo Local

#### Opción A: Usar Vercel Dev (Recomendado)

```bash
# Terminal 1: Vercel backend
vercel dev --listen 3000

# Terminal 2: Vite frontend
npm run dev
```

Tu app estará en `http://localhost:5173` y usará el backend local de Vercel en `http://localhost:3000`

#### Opción B: Usar backend de producción

```bash
# Solo correr el frontend
npm run dev
```

El frontend usará las APIs de Vercel en producción (`https://de-belingo-con-angel.vercel.app`)

### Deployment a Producción

**Backend (Vercel) - Automático:**
```bash
git add .
git commit -m "feat: update backend"
git push
```
Vercel despliega automáticamente en cada push

**Frontend (Firebase) - Manual:**
```bash
npm run build
firebase deploy --only hosting
```

---

## 📝 Variables de Entorno por Plataforma

### Backend (Vercel)
Solo 2 variables, **SIN** prefijo `VITE_`:
```
IMGBB_API_KEY
IMGUR_CLIENT_IDS
```

### Frontend (Firebase Build)
9 variables, **CON** prefijo `VITE_`:
```
VITE_VERCEL_API_URL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

---

## 🆘 Troubleshooting

### Error: CORS policy blocked

**Síntoma:** Error en la consola del navegador sobre CORS

**Solución:**
1. Verifica que las API Routes tengan los headers CORS configurados
2. Redeploy de Vercel: `vercel --prod`
3. Limpia cache del navegador

### Error: "Service not configured"

**Síntoma:** Las APIs responden con error 500

**Solución:**
1. Verifica que `IMGBB_API_KEY` y `IMGUR_CLIENT_IDS` estén en Vercel
2. Asegúrate que NO tienen el prefijo `VITE_`
3. Redeploy después de agregar variables

### Error: "Failed to fetch"

**Síntoma:** Network error al intentar subir imagen

**Solución:**
1. Verifica que `VITE_VERCEL_API_URL` esté en tu `.env`
2. Verifica que apunte a la URL correcta de Vercel
3. Rebuild y redeploy del frontend:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Las imágenes no se suben

**Síntoma:** Upload falla sin mensaje claro

**Solución:**
1. Revisa logs de Vercel: Dashboard → Functions → Logs
2. Verifica formato de imagen (solo JPG/PNG, <5MB)
3. Prueba ambos endpoints (Imgur y ImgBB)

---

## 📊 Monitoring

### Vercel Logs

```bash
# Desde CLI
vercel logs

# O desde Dashboard
Vercel Dashboard → Deployments → [Tu deployment] → Functions → View Logs
```

### Firebase Logs

```bash
# Firebase hosting logs
firebase hosting:channel:list

# Ver estado
firebase hosting:channel:open preview
```

---

## 🔐 Seguridad

### ✅ Implementado

- ✅ API keys protegidas en Vercel (backend)
- ✅ CORS configurado para solo permitir peticiones necesarias
- ✅ Validación de archivos (tipo, tamaño)
- ✅ NSFW detection en Imgur
- ✅ Múltiples Client IDs para rate limit protection

### ⚠️ Mejoras Futuras (Opcional)

- Rate limiting por IP
- Autenticación con Firebase Auth
- Restricciones CORS más estrictas (solo desde debelingoconangel.web.app)
- Logging y monitoring avanzado
- Webhooks de notificación

---

## ✅ Checklist de Deployment

### Primera vez

- [ ] Backend en Vercel desplegado
- [ ] Variables de entorno en Vercel configuradas (2)
- [ ] API Routes funcionando (probar con curl)
- [ ] `.env` local actualizado con VITE_VERCEL_API_URL
- [ ] Frontend build y deploy en Firebase
- [ ] Probar subida de imagen end-to-end
- [ ] Verificar logs de Vercel (sin errores)

### Cada actualización

**Backend:**
- [ ] Cambios commiteados
- [ ] Push a Git
- [ ] Vercel auto-despliega
- [ ] Verificar logs

**Frontend:**
- [ ] Cambios commiteados
- [ ] `npm run build`
- [ ] `firebase deploy --only hosting`
- [ ] Verificar app en producción

---

Desarrollado con 💙 por DeBelingo Con Ángel

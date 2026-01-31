# 🎯 RESUMEN RÁPIDO: Qué necesitas de Vercel

## 📌 En 3 Pasos Simples

### 1️⃣ Conectar tu Proyecto (5 minutos)
- Ir a [vercel.com/dashboard](https://vercel.com/dashboard)
- Click en "Add New Project"
- Importar repositorio `DeBelingo/WebDebelingo`
- **NO HACER DEPLOY TODAVÍA**

### 2️⃣ Agregar 10 Variables de Entorno (10 minutos)
En Settings → Environment Variables, agregar estas 10 variables:

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

**Los valores exactos** están en el archivo `VERCEL_SETUP.md` en la sección 2.3

**Para cada variable:**
- ✅ Marcar "Sensitive"
- ✅ Seleccionar los 3 entornos: Production, Preview, Development

### 3️⃣ Desplegar (2 minutos)
- Click en "Deploy"
- Esperar a que termine
- Probar la URL que te da Vercel

---

## 📚 Archivos de Ayuda que tienes:

1. **`VERCEL_SETUP.md`** → Guía completa paso a paso con todos los detalles
2. **`VERCEL_CHECKLIST.md`** → Lista de verificación para marcar mientras configuras
3. **`VERCEL_QUICK_GUIDE.md`** (este archivo) → Resumen ultra rápido

---

## 🔑 Valores de las Variables

### Firebase (copia y pega directamente)
```
VITE_FIREBASE_API_KEY = AIzaSyCg1OiMDsmfoAGpSVYRnvWdl4tSPnLVoUo
VITE_FIREBASE_AUTH_DOMAIN = debelingoconangel.firebaseapp.com
VITE_FIREBASE_DATABASE_URL = https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID = debelingoconangel
VITE_FIREBASE_STORAGE_BUCKET = debelingoconangel.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = 690632293636
VITE_FIREBASE_APP_ID = 1:690632293636:web:5ccf13559fccf3d53a2451
VITE_FIREBASE_MEASUREMENT_ID = G-T8BV0MLJQJ
```

### Servicios de Imágenes (copia y pega directamente)
```
VITE_IMGBB_API_KEY = be78b6d894fff24d363cd2abd6cddac0
VITE_IMGUR_CLIENT_IDS = 7a19e6c8c7056d7,f0ea1437e4b31e8,43652b743b5a7a0,15e30ce94329ec4,2879199e5e55f13,546c25a59c58ad7,fc393963e63920c,ccfd9203a017260,902a281867c2957,86134371e54a93f
```

---

## ⚡ Eso es todo

**Tiempo total:** ~15-20 minutos

**Después de configurar:**
- Cada `git push` desplegará automáticamente
- No necesitas hacer nada más
- Las variables están protegidas y ocultas

**Si algo falla:** Revisa `VERCEL_SETUP.md` sección "Troubleshooting"

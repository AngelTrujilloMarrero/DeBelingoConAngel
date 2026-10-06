# 🚀 Guía de Configuración de Vercel para DeBelingoConAngel

## 📋 Resumen
Esta guía te ayudará a configurar tu proyecto en Vercel usando **solo variables de entorno** para proteger tus claves de API de Firebase, ImgBB e Imgur.

---

## 🎯 PASO 1: Importar tu Proyecto a Vercel

### 1.1 Crear cuenta y conectar GitHub
1. Ve a [vercel.com](https://vercel.com) y accede con tu cuenta de GitHub
2. Haz clic en **"Add New Project"**
3. Busca tu repositorio: `DeBelingo/WebDebelingo` (o el nombre que tenga)
4. Haz clic en **"Import"**

### 1.2 Configurar el proyecto
- Framework Preset: **Vite** (debe detectarse automáticamente)
- Root Directory: `./` (raíz del proyecto)
- Build Command: `npm run build` (por defecto)
- Output Directory: `dist` (por defecto)
- Install Command: `npm install` (por defecto)

**⚠️ NO HAGAS DEPLOY TODAVÍA** - Primero debes configurar las variables de entorno

---

## 🔐 PASO 2: Configurar Variables de Entorno

### 2.1 Acceder a la configuración
1. En tu proyecto de Vercel, ve a **Settings** (parte superior)
2. En el menú lateral, selecciona **Environment Variables**

### 2.2 Agregar cada variable
Debes agregar **10 variables** en total. Para cada una:

1. Haz clic en **"Add New"**
2. En el campo **"Key"**, copia el nombre EXACTO de la variable
3. En el campo **"Value"**, pega el valor correspondiente
4. En **"Environment"**, selecciona las 3 opciones:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Marca la casilla "Sensitive"** (esto oculta el valor después de guardarlo)
6. Haz clic en **"Save"**

### 2.3 Lista de Variables a Configurar

#### 🔥 Variables de Firebase (8 variables)

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

#### 🖼️ Variables de Servicios de Imágenes (2 variables)

| Variable | Valor |
|----------|-------|
| `VITE_IMGBB_API_KEY` | `tu_imgbb_api_key` |
| `VITE_IMGUR_CLIENT_IDS` | `client1,client2,client3,...` |

---

## ✅ PASO 3: Verificar y Desplegar

### 3.1 Checklist de Verificación
Antes de desplegar, verifica que:

- [ ] Todas las 10 variables están configuradas
- [ ] Los nombres de las variables están escritos EXACTAMENTE como aparecen arriba
- [ ] Todas las variables tienen seleccionados los 3 entornos (Production, Preview, Development)
- [ ] Todas las variables están marcadas como "Sensitive"

### 3.2 Hacer el primer Deploy
1. Ve a la pestaña **"Deployments"** en tu proyecto de Vercel
2. Haz clic en **"Redeploy"** o simplemente haz un `git push` a tu repositorio
3. Vercel automáticamente detectará los cambios y desplegará

### 3.3 Verificar que funciona
1. Una vez completado el deploy, haz clic en **"Visit"** para abrir tu aplicación
2. Verifica que:
   - La página carga correctamente
   - Firebase funciona (autenticación, base de datos)
   - Las imágenes se pueden subir correctamente

---

## 🛠️ Troubleshooting (Solución de Problemas)

### ❌ Error: "Firebase API key not found"
**Solución:** Verifica que `VITE_FIREBASE_API_KEY` esté configurada exactamente con ese nombre (respeta mayúsculas)

### ❌ Error: "Failed to upload image"
**Solución:** Verifica que `VITE_IMGBB_API_KEY` y `VITE_IMGUR_CLIENT_IDS` estén configuradas

### ❌ Los cambios en variables no se reflejan
**Solución:** 
1. Ve a Settings → Environment Variables
2. Edita la variable y guárdala nuevamente
3. Ve a Deployments → Haz clic en los 3 puntos del último deploy → **"Redeploy"**

### 🔄 Para actualizar una variable
1. Ve a Settings → Environment Variables
2. Busca la variable que quieres actualizar
3. Haz clic en los 3 puntos (⋮) → **"Edit"**
4. Cambia el valor y guarda
5. Haz un **Redeploy** para que los cambios tomen efecto

---

## 🔒 Seguridad

### ✅ Buenas Prácticas Aplicadas
- ✅ Variables marcadas como "Sensitive" en Vercel
- ✅ Archivo `.env` incluido en `.gitignore`
- ✅ Solo `.env.example` está en el repositorio (sin valores reales)
- ✅ Las claves nunca se exponen en commits de Git

### ⚠️ Limitaciones de este Enfoque
**Nota:** Con esta configuración (variables de entorno en build time), las claves de API estarán incluidas en el bundle de JavaScript del cliente. Esto significa que usuarios técnicos podrían encontrarlas inspeccionando el código del navegador.

**Para aplicaciones que requieren máxima seguridad:**
- Considera implementar API Routes en Vercel (backend serverless)
- Mantén las claves de API solo en el servidor
- El frontend hace llamadas a tus propias APIs en lugar de usar las claves directamente

**Para este proyecto:** Esta configuración es suficiente para la mayoría de casos de uso, especialmente si:
- Tienes reglas de seguridad configuradas en Firebase
- Las claves de ImgBB/Imgur tienen límites de rate limiting
- No estás manejando información sensible

---

## 📝 Comandos Útiles

### Ver logs del deployment
```bash
# En tu terminal local, instala Vercel CLI (opcional)
npm i -g vercel
vercel login
vercel logs
```

### Probar localmente con las mismas configuraciones
```bash
# Descarga las variables de entorno desde Vercel
vercel env pull .env.local
```

---

## 🎉 ¡Listo!
Tu proyecto DeBelingo está ahora desplegado en Vercel con todas las variables de entorno configuradas de forma segura.

**URL de tu proyecto:** La encontrarás en el dashboard de Vercel

**¿Problemas?** Revisa la sección de Troubleshooting arriba o consulta los logs de deployment en Vercel.
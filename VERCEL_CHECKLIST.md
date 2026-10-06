# ✅ Checklist de Configuración de Vercel

## 📝 Antes de empezar
- [ ] Tienes una cuenta en Vercel vinculada a GitHub
- [ ] Tienes acceso al repositorio DeBelingo/WebDebelingo

---

## 🚀 PASO 1: Importar Proyecto
- [ ] Proyecto importado en Vercel
- [ ] Framework detectado como Vite
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`

---

## 🔐 PASO 2: Variables de Entorno (10 en total)

### Firebase (8 variables)
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_DATABASE_URL`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `VITE_FIREBASE_MEASUREMENT_ID`

### Servicios de Imágenes (2 variables)
- [ ] `VITE_IMGBB_API_KEY`
- [ ] `VITE_IMGUR_CLIENT_IDS`

### Para cada variable verifica que:
- [ ] Está marcada como "Sensitive"
- [ ] Tiene seleccionados los 3 entornos (Production, Preview, Development)
- [ ] El nombre está escrito EXACTAMENTE igual (respeta mayúsculas)

---

## 🎯 PASO 3: Despliegue
- [ ] Primer deploy ejecutado
- [ ] Deploy completado sin errores
- [ ] Página se carga correctamente
- [ ] Firebase funciona (base de datos, auth)
- [ ] Subida de imágenes funciona

---

## 📋 Post-Despliegue
- [ ] URL de producción guardada
- [ ] Dominio personalizado configurado (opcional)
- [ ] Analytics habilitado (opcional)

---

## 🔄 Para Futuros Updates

Cada vez que hagas cambios:
1. `git add .`
2. `git commit -m "descripción"`
3. `git push`
4. Vercel detectará y desplegará automáticamente

Para cambiar una variable de entorno:
1. Settings → Environment Variables → Editar
2. Guardar
3. Deployments → Redeploy

---

## 🆘 Si algo falla

1. Revisa los logs en: Deployments → [Tu deploy] → View Build Logs
2. Verifica que todas las variables estén configuradas
3. Revisa la sección Troubleshooting en VERCEL_SETUP.md
4. Haz un Redeploy desde cero si es necesario

---

## ✓ Configuración Completa
- [ ] Todo funciona correctamente
- [ ] URL compartida con el equipo
- [ ] Documentación actualizada

# ✅ CHECKLIST DE DESPLIEGUE A VERCEL

## Paso 1: Preparar el Repositorio Local

- [ ] Asegúrate de estar en la carpeta del proyecto: `cd control-tareas`
- [ ] Inicializa Git si no está ya hecho:
  ```bash
  git init
  ```
- [ ] Agrega todos los archivos:
  ```bash
  git add .
  ```
- [ ] Haz tu primer commit:
  ```bash
  git commit -m "Initial commit - Vercel ready"
  ```

## Paso 2: Crear Repositorio en GitHub

- [ ] Ve a [github.com](https://github.com) y crea un nuevo repositorio público o privado
- [ ] Copia la URL del repositorio (ej: `https://github.com/tuUsuario/control-tareas.git`)
- [ ] Agrega el repositorio remoto:
  ```bash
  git remote add origin <URL_DEL_REPOSITORIO>
  ```
- [ ] Push del código:
  ```bash
  git branch -M main
  git push -u origin main
  ```

## Paso 3: Configurar MongoDB Atlas

- [ ] Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [ ] Crea o accede a tu cluster
- [ ] En **Database Access**, crea un usuario con contraseña
- [ ] En **Network Access**, agrega `0.0.0.0/0` (permite todas las IPs)
- [ ] Copia la **connection string**: `mongodb+srv://usuario:contraseña@cluster.mongodb.net/tareas?retryWrites=true&w=majority`
- [ ] Reemplaza `usuario` y `contraseña` con tus credenciales

## Paso 4: Crear Proyecto en Vercel

- [ ] Ve a [vercel.com](https://vercel.com) y inicia sesión
- [ ] Haz clic en **"Add New..."** → **"Project"**
- [ ] Selecciona **"Import Git Repository"**
- [ ] Conecta tu cuenta GitHub si es necesario
- [ ] Busca y selecciona el repositorio `control-tareas`
- [ ] Haz clic en **"Import"**

## Paso 5: Configurar Variables de Entorno

En el formulario de importación o en Settings → Environment Variables:

- [ ] **Nombre**: `MONGO_URI`  
  **Valor**: `mongodb+srv://usuario:contraseña@cluster.mongodb.net/tareas?retryWrites=true&w=majority`

- [ ] **Nombre**: `JWT_SECRET`  
  **Valor**: Genera una cadena segura (puedes usar: `openssl rand -hex 32`)

- [ ] **Nombre**: `REFRESH_SECRET`  
  **Valor**: Genera otra cadena segura (puedes usar: `openssl rand -hex 32`)

- [ ] (Opcional) **Nombre**: `CORS_ORIGIN`  
  **Valor**: `https://tu-proyecto.vercel.app` (se asignará después del primer despliegue)

## Paso 6: Desplegar

- [ ] Si estás en el formulario de importación, haz clic en **"Deploy"**
- [ ] Espera a que finalice (normalmente 1-2 minutos)
- [ ] Verás un mensaje de "Deployment successful"
- [ ] Copia la URL del proyecto (ej: `https://control-tareas-xyz.vercel.app`)

## Paso 7: Verificar el Despliegue

- [ ] Abre tu navegador y ve a la URL del proyecto
- [ ] Intenta acceder a las rutas:
  - [ ] `https://tu-url.vercel.app` (debe mostrar el frontend)
  - [ ] `https://tu-url.vercel.app/api/auth/register` (prueba POST con datos)
  - [ ] Abre la consola del navegador para ver logs

## Paso 8: Actualizar CORS (si es necesario)

Si recibes errores CORS:

- [ ] En Vercel, ve a **Settings** → **Environment Variables**
- [ ] Agrega/actualiza:  
  **CORS_ORIGIN**: `https://tu-proyecto.vercel.app`
- [ ] Redeploya: Ve a **Deployments** y haz clic en **"Redeploy"** sobre el último deployment

## Paso 9: Configuraciones Adicionales (Opcional)

### Agregar un dominio personalizado
- [ ] En Vercel, ve a **Settings** → **Domains**
- [ ] Agrega tu dominio personalizado
- [ ] Sigue las instrucciones de DNS

### Configurar auto-deployments
- [ ] Ya está configurado - cada push a `main` en GitHub dispara un nuevo deployment

### Ver Logs en Tiempo Real
- [ ] En Vercel, ve a **Deployments** → selecciona el deployment → **View Function Logs**

## 🔧 Troubleshooting

### Error: "MONGO_URI not defined"
- Verifica que las variables de entorno estén agregadas en Vercel
- Redeploya después de agregar las variables

### Error: "Failed to connect to MongoDB"
- Verifica que MONGO_URI sea correcto (sin espacios)
- En MongoDB Atlas, asegúrate de que `0.0.0.0/0` está en Network Access
- Prueba la conexión localmente con: `mongosh "mongodb+srv://usuario:contraseña@cluster..."`

### Error: CORS
- Actualiza `CORS_ORIGIN` en variables de entorno
- En `server.js`, ajusta los orígenes permitidos si es necesario

### Error: Build fallido
- Ve a **Deployments** → selecciona el deployment fallido → **View Logs**
- Busca el error específico en los logs

## 📞 Recursos Útiles

- [Documentación de Vercel Node.js](https://vercel.com/docs/functions/serverless-functions/node)
- [Documentación de MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Soporte de Vercel](https://vercel.com/support)

---

**¡Una vez completados todos estos pasos, tu aplicación estará en vivo en Vercel! 🚀**

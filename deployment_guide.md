# 🚀 Guía de Despliegue de la Aplicación de Baby Shower

Esta guía detalla cómo desplegar la aplicación del Baby Shower de forma segura usando Docker en plataformas en la nube gratuitas o de bajo costo como **Render** o **Railway**.

---

## 🔒 Seguridad (Panel de Administración)

Hemos implementado un sistema de **Autenticación Básica** opcional en el panel de administración (`/admin.html`) y las APIs de administración.

Por defecto, si no configuras credenciales, el panel funcionará sin contraseñas (ideal para desarrollo local). Al desplegar en producción, configura las siguientes **Variables de Entorno**:

| Variable | Valor Recomendado | Descripción |
| :--- | :--- | :--- |
| `ADMIN_PASSWORD` | `TuContraseñaSegura123` | Si se define, habilita la protección del panel. |
| `ADMIN_USER` | `admin` | Nombre de usuario (por defecto: `admin`). |

---

## 💾 Persistencia de Datos (Muy Importante)

La aplicación utiliza una base de datos en un archivo JSON en `/usr/src/app/database/db.json` dentro del contenedor. 
> [!IMPORTANT]
> Si reinicias o redespliegas el contenedor sin configurar un volumen persistente, **todos los invitados confirmados se borrarán**.
> Asegúrate de mapear un **Volumen o Disco Persistente** en la ruta `/usr/src/app/database`.

---

## 🛠️ Opción 1: Ejecución Local con Docker Compose

Si quieres probar la aplicación en tu computadora simulando producción:

1. Levanta el contenedor:
   ```bash
   docker-compose up -d --build
   ```
2. Accede a:
   * Invitación: [http://localhost:3000](http://localhost:3000)
   * Panel Admin: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

Para proteger el panel de administración localmente, edita el archivo `docker-compose.yml`, descomenta las variables de entorno `ADMIN_USER` y `ADMIN_PASSWORD`, y reinicia el contenedor.

---

## 🌐 Opción 2: Despliegue en la Nube (Paso a Paso)

Para desplegar en Render o Railway, el primer paso es subir tu código a un repositorio de **GitHub**.

### Paso 2.1: Inicializar Git y subir a GitHub

Si aún no tienes este proyecto en Git/GitHub, ejecuta en tu terminal:

```bash
git init
git add .
git commit -m "feat: dockerizacion y autenticacion basica"
```

Crea un repositorio en [GitHub](https://github.com) (puede ser privado o público) y ejecuta:

```bash
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

---

### Paso 2.2: Despliegue en Render

[Render](https://render.com) ofrece un plan muy accesible y soporta contenedores Docker de forma nativa.

1. Ve a tu panel de Render y haz clic en **New +** > **Web Service**.
2. Conecta tu cuenta de GitHub y selecciona el repositorio de la aplicación.
3. Configura los parámetros del servicio:
   * **Runtime**: Selecciona `Docker`.
   * **Region**: Selecciona la más cercana (ej. `Oregon` o `Frankfurt`).
   * **Instance Type**: Selecciona la opción gratuita o básica (`Free` o `Starter`).
4. Ve a la sección **Advanced** y haz clic en **Add Environment Variable**:
   * `ADMIN_PASSWORD` = `TuPasswordSecreto`
   * `ADMIN_USER` = `admin`
5. Configura el disco persistente (para no perder invitados):
   * En el menú de configuración de tu servicio, ve a la pestaña **Disks** (Discos).
   * Haz clic en **Add Disk**.
   * **Name**: `babyshower-db`
   * **Mount Path**: `/usr/src/app/database`
   * **Size**: `1 GiB` (es más que suficiente para almacenar miles de invitados).
6. Haz clic en **Create Web Service**. ¡Render compilará la imagen de Docker y la publicará automáticamente!

---

### Paso 2.3: Despliegue en Railway

[Railway](https://railway.app) es otra excelente alternativa rápida y moderna.

1. Inicia sesión en Railway y haz clic en **New Project** > **Deploy from GitHub repo**.
2. Selecciona tu repositorio.
3. Haz clic en **Deploy Now**.
4. Una vez creado el servicio, ve a la pestaña **Variables** y agrega:
   * `ADMIN_PASSWORD` = `TuPasswordSecreto`
   * `ADMIN_USER` = `admin`
   * `PORT` = `3000`
5. Configura el almacenamiento persistente:
   * Ve a la pestaña **Settings** (Configuración) de tu servicio.
   * Busca la sección **Volumes** y haz clic en **Mount Volume**.
   * **Mount Path**: `/usr/src/app/database`
6. Guarda los cambios. Railway reiniciará la aplicación y estará lista.

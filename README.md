# 🐚 Baby Shower de Emilia — "Bajo las Olas"

Invitación digital premium con temática marina (niña), panel de administración
de invitados y una API sencilla en Node.js + Express con base de datos en
archivo JSON (sin necesidad de instalar ningún motor de base de datos).

## Estructura del proyecto

```
/babyshower
├── index.html              → Invitación (landing cinemática)
├── admin.html               → Panel de administración
├── manifest.json / sw.js    → PWA (instalable + caché offline)
├── css/
│   ├── style.css            → Estilos de la invitación
│   └── admin.css            → Estilos del panel admin
├── js/
│   ├── main.js               → Intro, cursor, mascota, scroll, RSVP, share, QR
│   ├── ocean-scene.js         → Fondo animado en Three.js
│   └── admin.js               → Dashboard, gráficas, tabla, exportaciones
├── assets/icons/             → Íconos de la PWA
├── api/
│   ├── server.js              → API REST (Express)
│   └── package.json
└── database/
    └── db.json                 → "Base de datos" en archivo JSON
```

## Cómo ejecutarlo

Requisitos: Node.js 18 o superior.

```bash
cd api
npm install
npm start
```

Esto levanta un único servidor que sirve tanto la invitación como el panel
admin y la API:

- Invitación: **http://localhost:3000**
- Panel admin: **http://localhost:3000/admin.html**
- API: **http://localhost:3000/api/guests**

No necesitas un puerto separado para el "frontend": Express sirve todos los
archivos estáticos (`index.html`, `admin.html`, `css/`, `js/`) directamente
desde la raíz del proyecto.

## API

| Método | Ruta                         | Descripción                          |
|--------|------------------------------|---------------------------------------|
| GET    | `/api/event`                 | Datos del evento                      |
| PUT    | `/api/event`                 | Editar datos del evento               |
| GET    | `/api/guests`                | Listar invitados (`?status=&q=`)      |
| GET    | `/api/guests/:id`            | Obtener un invitado                   |
| POST   | `/api/guests`                | Crear invitado (usa el formulario RSVP)|
| PUT    | `/api/guests/:id`            | Editar invitado completo              |
| PATCH  | `/api/guests/:id/confirm`    | Cambiar solo el estado                |
| DELETE | `/api/guests/:id`            | Eliminar invitado                     |
| GET    | `/api/stats`                 | Estadísticas para el dashboard        |

Los datos se guardan en `database/db.json`. Puedes editarlo a mano o borrar
los invitados de ejemplo antes de compartir la invitación real.

## Personalizar

- **Nombre de la bebé / fecha / lugar**: edita `index.html` (secciones Hero,
  Detalles, Countdown) y `database/db.json` → `event`.
- **Fotos de la galería**: coloca tus imágenes en `assets/images/` y
  reemplaza los bloques `.gallery-item` generados en `js/main.js`
  (función que crea `galleryIcons`) por etiquetas `<img>` reales.
- **Colores**: todo el sistema de diseño está centralizado como variables
  CSS en la parte superior de `css/style.css` (`:root`).
- **Mapa**: cambia la URL del `iframe` y el botón "Cómo llegar" en la
  sección `#details` de `index.html`.
- **Audio ambiental**: se genera con la Web Audio API (sin archivos de audio
  que descargar). Si prefieres un archivo real, reemplaza la función
  `buildAmbientGraph()` en `js/main.js` por un elemento `<audio>`.

## Notas sobre el alcance

- El "fondo oceánico vivo" usa Three.js con partículas en 3 capas de
  profundidad (burbujas + polvo marino) más rayos de luz en CSS; los
  caballitos de mar, estrellas y conchas del primer plano están hechos en
  SVG/CSS con animaciones flotantes, ya que no se generaron modelos 3D
  externos.
- La app funciona igual de bien sin servidor (abriendo `index.html`
  directamente): el formulario de RSVP guarda una copia de respaldo en
  `localStorage` si no detecta la API disponible.
- Es un proyecto pensado para una sola persona/familia administrando la
  lista de invitados; no incluye autenticación. Si vas a exponer
  `admin.html` públicamente, agrega un usuario/contraseña antes de
  desplegarlo (por ejemplo con `express-basic-auth`).

# HANDOFF: Sistema de Captación de Visa EE.UU.
## Para: Claude Code
## Proyecto: KairIA — Formulario DS-160 en Español

---

## CONTEXTO

Se necesita desplegar un sistema de captación de información para trámites de visa a EE.UU. El sistema consta de:

1. **Formulario web** (`index.html`) — Multi-paso, 9 secciones, cubre todos los campos del DS-160
2. **Google Apps Script** — Recibe los datos del formulario y los escribe en Google Sheets
3. **Despliegue** — Vercel + Cloudflare DNS (subdominio `visa.kairia.co`)

El `index.html` ya está construido y se encuentra en este mismo directorio.  
**Lo que falta:** el Apps Script, conectarlo al HTML, y hacer el deploy.

---

## ARCHIVOS EN ESTE DIRECTORIO

```
visa-intake/
├── index.html          ← Formulario ya terminado (NO modificar la lógica de campos)
├── HANDOFF.md          ← Este archivo
└── apps-script.js      ← CREAR este archivo (ver instrucciones abajo)
```

---

## TAREA 1 — Crear `apps-script.js`

Crea el archivo `apps-script.js` con el siguiente código **exacto** (es Google Apps Script, no Node.js):

```javascript
// ============================================================
// CONFIGURACIÓN — Editar antes de publicar
// ============================================================
const CONFIG = {
  EMAIL_NOTIFICACION: 'hola@kairia.co',   // Email donde llegan alertas
  NOMBRE_HOJA: 'Solicitudes',              // Nombre de la pestaña en el Sheet
};

// ============================================================
// PUNTO DE ENTRADA — Google Apps Script Web App
// ============================================================
function doPost(e) {
  try {
    const raw  = e.postData ? e.postData.contents : '{}';
    const data = JSON.parse(raw);

    const sheet = getOrCreateSheet(CONFIG.NOMBRE_HOJA);
    writeRow(sheet, data);
    sendNotification(data);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET para verificar que el script está vivo
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, mensaje: 'KairIA Visa Intake activo ✓' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// HELPERS
// ============================================================
function getOrCreateSheet(nombre) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(nombre);
  if (!sheet) sheet = ss.insertSheet(nombre);
  return sheet;
}

function writeRow(sheet, data) {
  // Si la hoja está vacía, crear fila de encabezados
  if (sheet.getLastRow() === 0) {
    const headers = ['⏱ Timestamp', ...Object.keys(data)];
    sheet.appendRow(headers);
    // Formatear encabezados
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1b5fa4');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Construir fila de valores en el mismo orden que los headers
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map((h, i) => {
    if (i === 0) return new Date(); // Timestamp
    return data[h] !== undefined ? data[h] : '';
  });

  sheet.appendRow(row);

  // Auto-ajustar columnas (solo las primeras veces, evitar lentitud)
  if (sheet.getLastRow() <= 5) {
    sheet.autoResizeColumns(1, Math.min(sheet.getLastColumn(), 30));
  }
}

function sendNotification(data) {
  const nombre    = `${data.nombres || ''} ${data.apellidos || ''}`.trim() || 'Sin nombre';
  const celular   = data.celular   || 'No proporcionado';
  const email     = data.email     || 'No proporcionado';
  const proposito = data.proposito || 'No especificado';
  const fecha     = data.timestamp || new Date().toLocaleString();

  const asunto  = `🛂 Nueva solicitud de visa — ${nombre}`;
  const cuerpo  = `
Nueva solicitud recibida en el formulario de captación de visa EE.UU.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATOS DEL SOLICITANTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre:     ${nombre}
Celular:    ${celular}
Email:      ${email}
Propósito:  ${proposito}
Enviado:    ${fecha}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Revisa la hoja de cálculo para ver todos los datos:
https://docs.google.com/spreadsheets

─────────────────────────────
KairIA · hola@kairia.co · +57 314 361 8100
  `.trim();

  GmailApp.sendEmail(CONFIG.EMAIL_NOTIFICACION, asunto, cuerpo);
}
```

---

## TAREA 2 — Conectar el Apps Script al formulario

En el `index.html`, busca esta línea (está cerca del final, en el bloque `<script>`):

```javascript
const APPS_SCRIPT_URL = 'PEGA_AQUI_TU_URL_DE_APPS_SCRIPT';
```

**No la cambies todavía.** El URL se obtiene después de publicar el script en Google (ver instrucciones manuales abajo). Deja un comentario claro para que el operador lo sepa:

```javascript
// ⚠️  REEMPLAZA ESTE VALOR con tu Web App URL de Google Apps Script
// Instrucciones: ver HANDOFF.md → Sección "Publicar el Apps Script"
const APPS_SCRIPT_URL = 'PEGA_AQUI_TU_URL_DE_APPS_SCRIPT';
```

---

## TAREA 3 — Preparar el proyecto para Vercel

Crea los siguientes archivos de configuración:

### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    { "src": "index.html", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### `.gitignore`
```
.vercel
node_modules
.DS_Store
```

### `README.md`
```markdown
# KairIA — Formulario de Captación Visa EE.UU.

Formulario multi-paso que cubre todas las secciones del DS-160, 
traducido al español. Los datos se envían a Google Sheets via Apps Script.

## Stack
- HTML + CSS + Vanilla JS (zero dependencies)
- Google Apps Script como backend
- Vercel para hosting
- Cloudflare DNS → subdominio visa.kairia.co

## Configuración requerida antes de deploy
1. Publicar `apps-script.js` en Google Apps Script (ver abajo)
2. Reemplazar `APPS_SCRIPT_URL` en `index.html`
3. `vercel deploy --prod`
4. Apuntar DNS en Cloudflare: CNAME `visa` → `cname.vercel-dns.com`

## Publicar el Apps Script
1. Ir a https://script.google.com
2. Crear nuevo proyecto → pegar contenido de `apps-script.js`
3. Guardar → Implementar → Nueva implementación
4. Tipo: Aplicación web
5. Ejecutar como: Yo (mi cuenta de Google)
6. Quién tiene acceso: Cualquier persona
7. Copiar la URL generada → pegarla en `index.html`

## Estructura de la hoja de cálculo
Los headers se crean automáticamente en la primera respuesta.
Cada fila = un solicitante. Primera columna = timestamp.
```

---

## TAREA 4 — Verificar integridad del HTML

Antes del deploy, verifica que `index.html`:

- [ ] Tiene los 9 steps (`id="step-1"` hasta `id="step-9"`)
- [ ] Tiene el `id="success-screen"`
- [ ] Tiene `id="loading-overlay"`
- [ ] La variable `APPS_SCRIPT_URL` existe en el script
- [ ] Los campos requeridos tienen `required` o están marcados con `*`
- [ ] El formulario es responsive (viewport meta tag presente)
- [ ] Las Google Fonts cargan correctamente (requiere internet)

---

## TAREA 5 — Deploy a Vercel

```bash
# Desde la carpeta visa-intake/
npx vercel login          # Si no está autenticado
npx vercel --prod         # Deploy de producción
```

Vercel va a preguntar:
- **Set up and deploy?** → Y
- **Which scope?** → La cuenta de Daniel / KairIA
- **Link to existing project?** → N (es nuevo)
- **Project name?** → `kairia-visa-intake`
- **Directory?** → `./` (directorio actual)
- **Override settings?** → N

Copia la URL de producción que genera Vercel (algo como `kairia-visa-intake.vercel.app`).

---

## TAREA 6 — DNS en Cloudflare

En el dashboard de Cloudflare, dominio `kairia.co`:

| Tipo  | Nombre | Destino                  | Proxy |
|-------|--------|--------------------------|-------|
| CNAME | visa   | cname.vercel-dns.com     | ☁️ DNS only (gris) |

Luego en Vercel → Project Settings → Domains → Agregar `visa.kairia.co`.

---

## INSTRUCCIONES MANUALES (para Daniel — no las puede hacer Claude Code)

Estas acciones requieren login en cuentas de Google y no se pueden automatizar:

### Publicar el Apps Script
1. Ir a https://script.google.com → **Nuevo proyecto**
2. Renombrar el proyecto: `KairIA Visa Intake`
3. Pegar el contenido de `apps-script.js` en el editor
4. **Implementar** → **Nueva implementación**
5. Configurar:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo (mi cuenta)**  
   - Quién tiene acceso: **Cualquier persona**
6. Autorizar los permisos (Google Sheets + Gmail)
7. Copiar la **URL de la aplicación web**
8. Reemplazar `PEGA_AQUI_TU_URL_DE_APPS_SCRIPT` en `index.html`
9. Volver a hacer deploy en Vercel

### Vincular a un Google Sheet
El Apps Script debe estar vinculado a un Sheet:
1. Abrir Google Sheets → Nuevo documento
2. Renombrar: `KairIA — Solicitudes Visa EE.UU.`
3. En el menú: **Extensiones → Apps Script**
4. Ahí pegar el código (en lugar de script.google.com)
5. Publicar desde ahí

---

## RESULTADO ESPERADO

Al terminar, el sistema debe funcionar así:

```
Cliente recibe link visa.kairia.co
        ↓
Llena el formulario en ~15 min (9 pasos)
        ↓
Hace clic en "Enviar formulario"
        ↓
POST → Google Apps Script URL
        ↓
Apps Script escribe fila en Google Sheets
    +   Envía email a hola@kairia.co
        ↓
Daniel abre el Sheet, ve los datos
        ↓
Daniel + Claude llenan el DS-160 real
        en ceac.state.gov usando esos datos
```

---

## CAMPOS QUE CUBRE EL FORMULARIO

El formulario captura **~85 campos** organizados en 9 secciones:

| Sección | Campos DS-160 cubiertos |
|---------|------------------------|
| 1. Datos personales | Nombre, fecha nacimiento, sexo, estado civil, nacionalidad, ciudad/país de nacimiento, cédula, doble ciudadanía |
| 2. Pasaporte | Tipo, número, país expedición, fechas, pérdida/robo |
| 3. El viaje | Tipo de visa, propósito detallado, fechas, hospedaje, quién paga |
| 4. Historial EE.UU. | Visitas anteriores, visas previas, negaciones, deportaciones, licencia |
| 5. Contacto en EE.UU. | Nombre, relación, teléfono, dirección, email |
| 6. Familia | Padre, madre, cónyuge, familiares en EE.UU. |
| 7. Trabajo y estudios | Ocupación, empleador, salario, educación, idiomas, países visitados |
| 8. Seguridad | 25 preguntas sí/no del DS-160 con campo de explicación |
| 9. Contacto y firma | Celular, email, autorización, firma |

---

## NOTAS TÉCNICAS

- El formulario usa `fetch` con `mode: 'no-cors'` para el POST al Apps Script.  
  Esto es intencional — Apps Script no devuelve CORS headers, por lo que no se puede leer la respuesta, pero el dato SÍ llega. Se asume éxito después del fetch.

- Si se quiere confirmar la recepción, la alternativa es usar **Formspree** como intermediario que sí tiene CORS. Pero para este caso el email de notificación es suficiente feedback.

- El formulario es completamente estático (zero backend propio). Todo el peso cae en Google Apps Script (gratis, sin límites prácticos para este volumen).

- **No hay base de datos propia** — los datos viven en Google Sheets. Si en el futuro se quiere migrar a Supabase, el único cambio es reemplazar el `fetch` en `submitForm()`.

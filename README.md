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

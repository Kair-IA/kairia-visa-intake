// ============================================================
// CONFIGURACIÓN — Editar antes de publicar
// ============================================================
const CONFIG = {
  NOMBRE_HOJA: 'Solicitudes',
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


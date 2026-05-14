const { google } = require('googleapis');

const SHEET_ID = '19O3JuluSoAPm7Fp8_Vfhop2UXyljVVztliz6JIAvnzI';
const TAB      = 'Solicitudes';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Read existing headers (row 1)
    let headers;
    try {
      const r = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB}!1:1` });
      headers = r.data.values?.[0];
    } catch (_) { headers = null; }

    if (!headers?.length) {
      headers = ['⏱ Timestamp', ...Object.keys(data)];
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] },
      });
    }

    const row = headers.map((h, i) => i === 0 ? new Date().toISOString() : (data[h] ?? ''));
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${TAB}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('submit error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

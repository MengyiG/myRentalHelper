// ============================================================
// Rental Helper — Google Apps Script 后端
// 使用方法：
//   1. 打开一个 Google Sheets 表格
//   2. 扩展程序 → Apps Script → 粘贴此文件内容 → 保存
//   3. 部署 → 新建部署 → 类型选「网络应用」
//      执行身份：我（你的账号）
//      访问权限：所有人
//   4. 复制部署 URL，粘贴到 Rental Helper 右上角表格图标处
// ============================================================

const LISTINGS_SHEET = 'Listings';
const SETTINGS_SHEET = 'Settings';

function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;
    if (action === 'getListings') result = getListings_();
    else if (action === 'getSettings') result = getSettings_();
    else result = { error: 'Unknown action: ' + action };
    return json_(result);
  } catch (err) {
    return json_({ error: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.parameter.data);
    const action = body.action;
    if (action === 'saveListings') saveListings_(body.headers, body.rows);
    else if (action === 'saveSettings') saveSettings_(body.settings);
    else throw new Error('Unknown action: ' + action);
    return json_({ ok: true });
  } catch (err) {
    return json_({ error: err.message });
  }
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_(name, create) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet && create) sheet = ss.insertSheet(name);
  return sheet;
}

function getListings_() {
  const sheet = getSheet_(LISTINGS_SHEET, false);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(String);
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function saveListings_(headers, rows) {
  const sheet = getSheet_(LISTINGS_SHEET, true);
  sheet.clearContents();
  const allData = rows.length === 0 ? [headers] : [headers, ...rows];
  sheet.getRange(1, 1, allData.length, headers.length).setValues(allData);
}

function getSettings_() {
  const sheet = getSheet_(SETTINGS_SHEET, false);
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const settings = {};
  data.forEach(([key, value]) => {
    if (!key) return;
    try { settings[String(key)] = JSON.parse(String(value)); }
    catch { settings[String(key)] = String(value); }
  });
  return settings;
}

function saveSettings_(settings) {
  const sheet = getSheet_(SETTINGS_SHEET, true);
  sheet.clearContents();
  const rows = Object.entries(settings)
    .filter(([k]) => k)
    .map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]);
  if (rows.length > 0) {
    sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  }
}

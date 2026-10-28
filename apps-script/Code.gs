/**
 * Admin API for the Academic Dossier.
 *
 * SETUP (one time):
 * 1. Open the "Portfolio Database" Google Sheet → Extensions → Apps Script.
 * 2. Replace everything in Code.gs with this file and click Save.
 * 3. Project Settings (gear icon) → Script Properties → Add property:
 *      ADMIN_PASSWORD = <your chosen password>
 * 4. Deploy → New deployment → type "Web app"
 *      Execute as: Me
 *      Who has access: Anyone
 *    Authorize when asked, then copy the Web app URL.
 * 5. Paste that URL into API_URL at the top of admin.js.
 *
 * After changing this code later, use Deploy → Manage deployments → Edit →
 * Version: "New version" so the same URL keeps working.
 */

const SHEET_NAME = 'Sheet1';
const BACKUP_SHEET_NAME = 'Backup';
const UPLOAD_FOLDER_NAME = 'Portfolio Uploads';
const HEADERS = ['Section', 'Title', 'Subtitle', 'Date', 'Details', 'Extra'];

function doGet() {
    return ContentService.createTextOutput('Dossier admin API is running.');
}

function doPost(e) {
    let out;
    try {
        const req = JSON.parse(e.postData.contents);
        checkPassword(req.password);
        switch (req.action) {
            case 'load': out = { ok: true, rows: loadRows() }; break;
            case 'save': out = { ok: true, saved: saveRows(req.rows) }; break;
            case 'upload': out = { ok: true, url: uploadImage(req) }; break;
            default: throw new Error('Unknown action.');
        }
    } catch (err) {
        out = { ok: false, error: err.message };
    }
    return ContentService.createTextOutput(JSON.stringify(out))
        .setMimeType(ContentService.MimeType.JSON);
}

function checkPassword(password) {
    const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
    if (!expected) throw new Error('ADMIN_PASSWORD is not set in Script Properties.');
    if (password !== expected) {
        Utilities.sleep(1000); // slow down password guessing
        throw new Error('Wrong password.');
    }
}

function getSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

function loadRows() {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    return sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues();
}

function saveRows(rows) {
    if (!Array.isArray(rows)) throw new Error('Invalid data.');
    const clean = rows.map(r => HEADERS.map((_, i) => String((r && r[i]) ?? '').trim()));

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
        const sheet = getSheet();
        backupSheet(sheet);
        sheet.clearContents();
        const data = [HEADERS].concat(clean);
        const range = sheet.getRange(1, 1, data.length, HEADERS.length);
        range.setNumberFormat('@'); // keep "Dec 2025", "2026" etc. as plain text
        range.setValues(data);
        return clean.length;
    } finally {
        lock.releaseLock();
    }
}

// Keeps a copy of the previous version in a "Backup" tab, in case a save goes wrong
function backupSheet(sheet) {
    const ss = sheet.getParent();
    const backup = ss.getSheetByName(BACKUP_SHEET_NAME) || ss.insertSheet(BACKUP_SHEET_NAME);
    backup.clearContents();
    const values = sheet.getDataRange().getDisplayValues();
    if (values.length && values[0].length) {
        const range = backup.getRange(1, 1, values.length, values[0].length);
        range.setNumberFormat('@');
        range.setValues(values);
    }
}

function uploadImage(req) {
    const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(req.dataUrl || '');
    if (!match) throw new Error('Only PNG, JPEG or WebP images can be uploaded.');
    const blob = Utilities.newBlob(Utilities.base64Decode(match[2]), match[1], req.name || 'photo.jpg');
    const file = getUploadFolder().createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return 'https://lh3.googleusercontent.com/d/' + file.getId();
}

function getUploadFolder() {
    const folders = DriveApp.getFoldersByName(UPLOAD_FOLDER_NAME);
    return folders.hasNext() ? folders.next() : DriveApp.createFolder(UPLOAD_FOLDER_NAME);
}

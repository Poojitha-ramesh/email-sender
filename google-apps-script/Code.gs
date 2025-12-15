const SPREADSHEET_ID = '1EAhmfQeybcQ-G2rz5UesDSnAUhQ89TA3gLXXbG4GI1o';
const SHEET_NAME = 'Email Responses';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('form');
}

// Called ONLY from the Web App (google.script.run)
function submitForm(data) {
  // Safety guard (prevents Run-button errors)
  if (!data || !data.name || !data.email) {
    return 'no-data';
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Name', 'Email']);
  }

  sheet.appendRow([new Date(), data.name, data.email]);
  return 'success';
}


function HARD_TEST_WRITE() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sheet.appendRow(['HARD TEST', new Date()]);
}

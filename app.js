var GAS_URL = "https://script.google.com/macros/s/AKfycby8HCiLJ_uch9y7vwrFVf6GhmeBF5K_T3OE8OPAhQ2utDp-mrR2Daad91WhVuPgtn8Z/exec";
function doGet(e) {
  // スプレッドシートからデータ取得
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const values = sheet.getDataRange().getValues();
  const data = values.slice(1).map(row => ({
    title: row[2] || "",
    summary: row[3] || "",
    content: row[4] || ""
  }));

  // JSONを返す際、CORS許可のヘッダーを付与する
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*"); 
}

// doPostも同様に許可を設定
function doPost(e) {
  const params = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow([new Date(), params.bigCatId, params.title, params.summary, params.content]);
  
  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}

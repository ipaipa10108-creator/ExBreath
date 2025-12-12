# ExBreath Project

ExBreath 是一個基於 React Vite 開發的現代化呼吸訓練應用程式，結合視覺動畫引導與 Google Sheets 雲端紀錄功能。
支援多國語言 (英/中/日) 與語音導引。

## ✨ 特色 (Features)

*   **多種呼吸模式**: 方塊呼吸、4-7-8、腹式呼吸、循環歎息、蜂鳴呼吸。
*   **自訂模式**: 可自由設定吸氣、閉氣、吐氣秒數。
*   **視覺引導**: 平滑的圓點軌跡與肺部水位動畫。
*   **語音導引**: 支援英、中、日三種語言語音提示 (依介面語言自動切換)。
*   **跨裝置紀錄**: 結合 Google Sheets，可跨裝置同步練習歷史。
*   **自動登入**: 記住 User ID 功能，方便快速開始。

## 🚀 部署到 GitHub Pages (Deployment)

本專案已設定 GitHub Actions，推送到 `main` 分支時會自動部署。

### 設定步驟

1.  **Fork 或 Push 本專案** 到您的 GitHub 儲存庫。
2.  **設定 Repository Secrets**:
    *   進入 GitHub Repo > `Settings` > `Secrets and variables` > `Actions`.
    *   點擊 `New repository secret`.
    *   **Name**: `VITE_GOOGLE_APP_SCRIPT_URL`
    *   **Value**: 您的 Google Apps Script Web App URL (詳細取得方式見下方)。
3.  **啟用 GitHub Pages**:
    *   進入 `Settings` > `Pages`.
    *   **Source**: 選取 `Deploy from a branch`.
    *   **Branch**: 等待第一次 Action 執行完畢後，這裡會出現 `gh-pages` 分支，選取它並 Save。
4.  完成後，您的網站將會在 `https://<username>.github.io/<repo-name>/` 上線。

## 🛠️ 本地開發 (Local Development)

### 1. 安裝與執行 (Installation)

請確保您的電腦已安裝 [Node.js](https://nodejs.org/) (建議 v18 以上)。

1.  開啟終端機 (Terminal)。
2.  進入專案目錄：
    ```bash
    cd <project-folder>
    ```
3.  安裝依賴套件：
    ```bash
    npm install
    ```
4.  啟動開發伺服器：
    ```bash
    npm run dev
    ```
5.  開啟瀏覽器訪問 `http://localhost:5173`。

### 2. Google Sheets 整合 (紀錄功能)

若您希望使用「紀錄」功能將練習數據上傳至 Google Sheets，請按照以下步驟操作：

#### 步驟 1: 建立 Google Sheet
1.  前往 [Google Sheets](https://sheets.google.com/) 建立一份新試算表。
2.  命名為 `ExBreath Data` (或任意名稱)。
3.  建立二個工作表 (Tabs)：
    *   **Tab 1 名稱**: `Records` (用於儲存詳細流水帳)
        *   第一列標題 (A1-E1): `ID`, `Level`, `Duration`, `Timestamp`, `ActualSeconds`
    *   **Tab 2 名稱**: `Stats` (可選，用於簡易統計)

#### 步驟 2: 設定 Google Apps Script (GAS)
1.  在試算表中，點選 `擴充功能 (Extensions)` > `Apps Script`。
2.  清除編輯器中的預設程式碼，貼上以下腳本：

```javascript
// 處理 GET 請求 (查詢歷史紀錄)
function doGet(e) {
  try {
    var id = e.parameter.id;
    if (!id) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Records");
    var data = sheet.getDataRange().getValues();
    
    // 假設第一列是標題，從第二列開始
    // A=ID, B=Level, C=Duration, D=Timestamp, E=ActualSeconds
    var userRecords = [];
    for (var i = 1; i < data.length; i++) {
        // 確保 ID 轉為字串比較，避免數字/字串不符
        if (String(data[i][0]) === String(id)) {
            userRecords.push({
                id: data[i][0],
                level: data[i][1],
                duration: data[i][2],
                timestamp: data[i][3],
                actualSeconds: data[i][4] // 新增欄位
            });
        }
    }
    
    return ContentService.createTextOutput(JSON.stringify(userRecords))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 處理 POST 請求 (寫入紀錄)
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Records");
    
    // 寫入資料: ID, 模式, 時間, 時間戳記, 實際秒數
    // 確保 actualSeconds 存在，若無則預設為 0
    var actualSec = data.actualSeconds || (data.duration === 'Infinite' ? 0 : data.duration * 60);

    sheet.appendRow([
      data.id,
      data.level,
      data.duration,
      data.timestamp || new Date().toISOString(),
      actualSec
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3.  點擊儲存 (磁碟片圖示)。
4.  點擊右上角的 `部署 (Deploy)` > `新增部署 (New deployment)`。
5.  點選設定齒輪 > `網頁應用程式 (Web App)`。
6.  設定如下：
    *   **說明**: `API`
    *   **執行身分**: `我 (Me)`
    *   **誰可以存取**: `任何人 (Anyone)` **(重要！否則無法寫入)**
7.  點擊 `部署 (Deploy)`，授權並複製 **網頁應用程式網址 (Web App URL)** (以 `https://script.google.com/macros/s/.../exec` 結尾)。

#### 步驟 3: 設定專案環境變數 (本地)
1.  在專案根目錄建立一個名為 `.env` 的檔案。
2.  貼上以下內容，將 URL 替換為您剛剛複製的網址：

```env
VITE_GOOGLE_APP_SCRIPT_URL=https://script.google.com/macros/s/您的ID/exec
```

3.  重啟開發伺服器 (`Ctrl+C` 停止後再次 `npm run dev`)。

## 📱 操作說明 (Usage)

1.  **登入**: 輸入您的 ID (例如名字) 以開始。
2.  **選擇語言**: 點擊右上角地球圖示切換 EN / 中 / JP。
3.  **選擇模式**: 在控制面板選擇呼吸法 (方塊、4-7-8、腹式、循環歎息等)。
4.  **設定時間**: 選擇練習長度 (1分~10分，或無限)。
5.  **開始**: 點擊 `開始練習`。
    *   跟隨畫面中央的圓點與肺部水位與語音指示進行呼吸。
6.  **紀錄**: 
    *   練習結束後資料會自動上傳 (若有設定 GAS)。
    *   點擊控制面板上的「紀錄」按鈕可查看本機與雲端整合的歷史數據。

## License
MIT

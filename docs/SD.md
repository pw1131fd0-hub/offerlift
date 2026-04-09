# OfferLift SD — 系統設計文件

## 1. 模組介面定義

### 1.1 核心模組結構

OfferLift 的業務邏輯以單一 `<script>` 區塊存在於 `index.html` 中。隨著功能增長，建議拆分成以下邏輯模組（current: 全部內聯，未來重構目標）。

```javascript
// === Data Layer ===
const SalaryData = { /* salaryData Array */ };
const NegotiationScripts = { /* negotiationScripts Array */ };

// === Service Layer ===
const OfferEvaluator = {
  calculateScore(inputs: OfferInput): EvaluationResult
};

const StorageService = {
  getUserCount(): number,
  incrementUserCount(): void,
  getContributions(): Contribution[],
  addContribution(data: ContributionInput): void,
  getHistory(): Evaluation[],
  addHistory(evaluation: Evaluation): void
};

// === UI Layer ===
const UIRenderer = {
  renderScripts(): void,
  renderSalaryGrid(): void,
  showEvaluationResult(result: EvaluationResult): void,
  showModal(): void,
  hideModal(): void
};
```

### 1.2 資料型別定義

```typescript
// 輸入型別
interface OfferInput {
  jobTitle: string;      // 職位名稱
  totalComp: number;     // 年度總薪（含獎金），單位：TWD
  baseSalary: number;    // 年薪底薪，單位：TWD
  bonus: number;         // 年終獎金（月數），0-12
  equity: number;        // 股份/選擇權稀釋後百分比，0-5
  city: 'taipei' | 'nhc' | 'taichung' | 'kaohsiung' | 'remote';
  experience: '0-2' | '2-5' | '5-10' | '10+';
}

// 輸出型別
interface EvaluationResult {
  score: number;         // 0-100 總分
  breakdown: BreakdownItem[];
  verdict: string;       // 談判建議文字
  label: 'excellent' | 'good' | 'fair' | 'poor';
}

interface BreakdownItem {
  label: string;
  value: string;         // e.g., "+15", "-10"
  good: boolean | null; // true=正面, false=負面, null=中性
}

// 薪資參考資料
interface SalaryReference {
  title: string;         // 職稱
  min: number;            // 年薪下限（TWD）
  max: number;            // 年薪上限（TWD）
  level: string;         // 年資區間
  city: string;          // 城市代碼
}

// 談判腳本
interface NegotiationScript {
  title: string;
  situation: string;     // 適用情境
  script: string;        // 完整對話範文
  tip: string;           // 談判要點提示
}

// 用戶貢獻
interface Contribution {
  title: string;
  salary: number;
  date: string;          // ISO date string
}

// 評估歷史
interface Evaluation {
  jobTitle: string;
  score: number;
  date: string;          // ISO date string
  totalComp: number;
}
```

---

## 2. localStorage DB Schema

### 2.1 Schema 總覽

| Key | 型別 | 範例值 | 說明 |
|-----|------|--------|------|
| `offerlift_users` | `string`（數字） | `"127"` | 全域計數：所有用戶的 Offer 評估總次數 |
| `offerlift_contribs` | `JSON string` | `[{"title":"Frontend","salary":1200000,"date":"2026-04-09T..."}]` | 用戶匿名貢獻的薪資資料陣列 |
| `offerlift_history` | `JSON string` | `[{"jobTitle":"SDE","score":75,"date":"2026-04-09T...","totalComp":1500000}]` | 最近 5 次評估記錄（目前 MVP 未使用，P1 階段啟用）|

### 2.2 Schema 細節

#### `offerlift_users`
```json
"127"
```
- 初始化值：字串 `"127"`（表示上線前的示範數據）
- 遞增時：`parseInt(localStorage.getItem('offerlift_users') || '127') + 1`
- 上限：無（字串型別可支援任意長度數字）

#### `offerlift_contribs`
```json
[
  {
    "title": "Senior Frontend Engineer",
    "salary": 1800000,
    "date": "2026-04-09T10:30:00.000Z"
  }
]
```
- 最大長度：無限制（localStorage 建議不超過 5MB）
- 查詢：線性搜尋（資料量少時可接受，未來可考慮加 index）

#### `offerlift_history`
```json
[
  {
    "jobTitle": "Backend Engineer",
    "score": 68,
    "totalComp": 1350000,
    "date": "2026-04-09T11:00:00.000Z"
  }
]
```
- 最大長度：5 筆（`push` 前檢查長度，超過則 `shift()` 移除最舊記錄）

---

## 3. API 規格（JavaScript 介面）

> 注意：OfferLift 為純前端應用，不存在 HTTP API。以下為 JavaScript 函式介面文件，說明各公開函式的輸入輸出合約。

### 3.1 全域函式

| 函式簽名 | 輸入 | 輸出 | 副作用 |
|----------|------|------|--------|
| `evaluateOffer()` | 無（讀取 DOM） | `void`（直接操作 DOM 渲染結果） | 更新 DOM + localStorage |
| `renderScripts()` | 無 | `void` | 更新 `#script-list` DOM |
| `renderSalaryGrid()` | 無 | `void` | 更新 `#salary-grid` DOM |
| `contributeData()` | 無 | `void` | 顯示 contribute modal |
| `closeModal()` | 無 | `void` | 隱藏 contribute modal |
| `submitContrib()` | 無（讀取 DOM） | `void` | 更新 localStorage + modal |
| `toggleScript(i)` | `i: number`（腳本索引） | `void` | toggle 腳本 expand/collapse |
| `copyScript(i)` | `i: number`（腳本索引） | `void` | 寫入 clipboard + alert |

### 3.2 評估邏輯 API（內部使用）

| 函式 | 簽名 | 說明 |
|------|------|------|
| `calculateScore` | `(total, base, city, exp, jobTitle, ref) => number` | 核心評分演算法，輸出 0-100 |
| `getVerdict` | `(score) => string` | 根據分數回傳談判建議文字 |
| `getScoreLabel` | `(score) => {text, className}` | 根據分數回傳顯示標籤與顏色 |

### 3.3 Storage Service API（封裝 localStorage 存取）

```javascript
const StorageService = {
  // 讀取
  getUserCount(): number,
  getContributions(): Contribution[],
  getHistory(): Evaluation[],

  // 寫入
  incrementUserCount(): void,
  addContribution(item: {title: string, salary: number}): void,
  addHistory(item: {jobTitle: string, score: number, totalComp: number}): void,

  // 工具
  clearAll(): void  // 僅供開發/測試使用，不暴露給用戶
};
```

---

## 4. 錯誤處理

### 4.1 輸入驗證

| 錯誤情境 | 處理方式 | 使用者回饋 |
|----------|----------|------------|
| `totalComp` 或 `baseSalary` 未填寫 | `alert()` 提示 | 「請至少填寫「年度總薪」和「年薪底薪」」|
| `totalComp` 或 `baseSalary` 為 0 或負數 | `alert()` 提示 | 同上 |
| 貢獻資料的 `title` 或 `salary` 空白 | `alert()` 提示 | 「請填寫職位和薪資」|

### 4.2 localStorage 錯誤

| 錯誤情境 | 處理方式 |
|----------|----------|
| localStorage 讀取失敗（隱私設定、 Safari 私有模式） | 降級為記憶體內變數，全域統計計數不回寫 |
| localStorage 寫入失敗（配額已滿） | `console.warn()` 警告，不阻斷操作流程 |

### 4.3 XSS 過濾

用戶輸入的 `jobTitle`、`contrib-title`、`contrib-company` 在存入 localStorage 前需做基本 HTML 跳脫：

```javascript
function sanitize(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

> 注意：此處仅为输出时的基本防护。localStorage 数据仅存储于用户本地浏览器，不存在服务端 XSS 风险。

### 4.4 Clipboard API 失敗

```javascript
function copyScript(i) {
  const script = negotiationScripts[i].script;
  navigator.clipboard.writeText(script).then(() => {
    alert('腳本已複製到剪貼簿！');
  }).catch(() => {
    // Fallback: 選取文字區塊（舊瀏覽器）
    const textarea = document.createElement('textarea');
    textarea.value = script;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('腳本已複製到剪貼簿！');
  });
}
```

---

## 5. 模組介面（未來重構目標）

當前程式碼為單一 `<script>` 區塊內聯所有邏輯。隨著功能增長，建議重構為以下模組結構（不影響當前 MVP 交付）：

```
assets/
├── js/
│   ├── core/
│   │   ├── evaluator.js      # 評估邏輯（pure function）
│   │   ├── storage.js        # localStorage 封裝
│   │   └── sanitizer.js      # XSS 過濾
│   ├── ui/
│   │   ├── renderer.js        # DOM 渲染函式
│   │   ├── modal.js           # Modal 控制
│   │   └── animations.js      # 過渡動畫
│   ├── data/
│   │   ├── salary-data.js     # 薪資參考靜態資料
│   │   └── scripts-data.js    # 談判腳本靜態資料
│   └── app.js                 # 初始化與事件綁定
├── styles/
│   └── custom.css             # Tailwind 無法覆蓋的自訂樣式
└── index.html
```

每個模組透過 `ES6 module` 匯出，允許單獨測試與未來 Tree-shaking 優化。

---

## 6. 外部依賴版本鎖定

| 依賴 | CDN URL | 版本策略 |
|------|---------|----------|
| Tailwind CSS | `https://cdn.tailwindcss.com` | 無版本指定（CDN 自動更新到最新穩定版）|
| Google Fonts (Inter) | `https://fonts.googleapis.com` | 指定了 font weight（400/500/600/700/800），字體本身由 Google 管理 |

> 建議：未來可改用 npm 安裝 Tailwind CLI 並建立 `tailwind.config.js`，在正式發布前先編譯 CSS 成品，移除對 CDN 的依賴，確保離線可用性。

---

*文件版本：v1.0*
*最後更新：2026-04-09*

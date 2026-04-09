# OfferLift SA — 系統架構文件

## 1. 系統概述

OfferLift 是一款純前端的單頁應用（SPA），所有業務邏輯、資料計算與資料持久化皆在用戶瀏覽器內完成，不涉及任何後端伺服器服務。系統核心功能包括：Offer 評估、談判腳本庫、薪資參考數據展示、以及用戶貢獻數據收集。

---

## 2. 架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                        使用者瀏覽器 (Browser)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   UI Layer   │  │ Business     │  │   Data Layer         │  │
│  │  (HTML/CSS)  │←→│ Logic Layer  │←→│  (localStorage)      │  │
│  │              │  │ (Vanilla JS) │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         ↑                 ↑                     ↑             │
│         └─────────────────┼─────────────────────┘             │
│                           │                                   │
│              ┌────────────┴────────────┐                     │
│              │      Tailwind CSS       │                     │
│              │     (CDN, Runtime)      │                     │
│              └─────────────────────────┘                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  外部依賴 (CDN)                           │  │
│  │  - Tailwind CSS (styling)                               │  │
│  │  - Google Fonts (Inter)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (Static Assets, No Backend)
                              ▼
                    ┌─────────────────┐
                    │  GitHub Pages   │
                    │  (CDN Hosting)   │
                    └─────────────────┘
```

---

## 3. 元件職責

### 3.1 UI Layer（元器件 — HTML）

| 元件名稱 | 職責 | 技術實作 |
|----------|------|----------|
| Navigation Bar | 全站導航、品牌識別 | `nav` + Tailwind `sticky` + `backdrop-blur` |
| Hero Section | 價值主張傳達、CTA 導流 | Gradient background + Tailwind utilities |
| Evaluator Section | Offer 輸入表單 + 結果展示 | Two-column grid layout |
| Scripts Section | 談判腳本列表（可展開） | `details/summary` 模式或 JS toggle |
| Market Section | 薪資參考卡片網格 | CSS Grid + Tailwind responsive |
| Contribute Modal | 匿名數據貢獻表單 | Fixed overlay + Tailwind dialog |
| Footer | 隱私聲明、版權資訊 | Dark background section |

### 3.2 Business Logic Layer（JavaScript 模組）

| 函式/模組 | 職責 | 公開 API |
|-----------|------|----------|
| `evaluateOffer()` | 計算 Offer 評估分數與 breakdown | 評估按鈕點擊觸發 |
| `renderScripts()` | 渲染談判腳本列表 | 頁面初始化時呼叫 |
| `renderSalaryGrid()` | 渲染薪資參考卡片 | 頁面初始化時呼叫 |
| `contributeData()` / `submitContrib()` | 開啟/提交用戶貢獻 | Modal 按鈕觸發 |
| `toggleScript(i)` | 腳本展開/收合 | 腳本標題點擊 |
| `copyScript(i)` | 複製腳本至剪貼簿 | 複製按鈕點擊 |

### 3.3 Data Layer（localStorage Schema）

| Key | 資料結構 | 用途 |
|-----|----------|------|
| `offerlift_users` | `string`（數字） | 全域統計：已評估 Offer 總數 |
| `offerlift_contribs` | `JSON string → Array<{title, salary, date}>` | 用戶匿名貢獻的薪資資料 |
| `offerlift_history` | `JSON string → Array<Evaluation>` | 最近 5 次評估記錄（保留作為未來 P1 功能） |

---

## 4. 資料流

### 4.1 Offer 評估流程

```
用戶輸入 → validateInput() → evaluateOffer()
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
            計算 score                  更新 localStorage
                    │                              │
                    │                     offerlift_users +1
                    │
                    ▼
            渲染結果 UI
            (環圈分數 + breakdown + verdict)
```

### 4.2 薪資數據貢獻流程

```
用戶點擊「貢獻」→ openModal()
     │
     ▼
用戶填寫表單 → submitContrib()
     │
     ├─→ 讀取 localStorage.offerlift_contribs（現有 Array）
     │
     ├─→ push 新資料 {title, salary, date: ISO}
     │
     ├─→ 寫回 localStorage
     │
     └─→ 關閉 Modal + 清空表單
```

### 4.3 頁面初始化流程

```
DOMContentLoaded
     │
     ├─→ 讀取 localStorage.offerlift_users → 渲染 stat-users
     │
     ├─→ renderScripts() → 渲染談判腳本列表
     │
     └─→ renderSalaryGrid() → 渲染薪資參考卡片
```

---

## 5. 部署方式

### 5.1 當前部署架構

```
GitHub Repository (main branch)
         │
         │  (自動觸發 or 手動 push)
         ▼
   GitHub Pages
   (https://pw1131fd0-hub.github.io/offerlift/)
         │
         │  (CDN 分發)
         ▼
   用戶瀏覽器
```

### 5.2 部署流程

- **觸發方式**：程式碼 push 至 `main` 分支後，GitHub Actions 自動部署至 GitHub Pages
- **發布內容**：`/` 根目錄下的所有靜態檔案（`index.html`、未來可能的 `manifest.json`、`sw.js` 等）
- **無需建構步驟**：純 HTML + CDN Tailwind，無需 webpack/vite 等 bundler
- **自訂網域**（未來可選）：可設定 `offerlift.example.com` 指向 GitHub Pages

### 5.3 環境差異

| 環境 | URL | 觸發條件 |
|------|-----|----------|
| 開發環境 | `file://` 或 `http://localhost:xxxx` | 本地直接開啟 HTML |
| 正式環境 | `https://pw1131fd0-hub.github.io/offerlift/` | `main` branch push |

---

## 6. 擴展性考量

### 6.1 未來後端整合可能性

目前雖然是純前端架構，但資料層已預留未來擴展：

- **API 介面卡模式**：若未來需新增後端，可將 `localStorage` 存取包裝為 `DataService` 介面，工廠模式切換 localStorage / REST API 實作
- **薪資數據同步**：貢獻數據可改為 POST 到後端 API（需対応 CORS 與身份驗證）

### 6.2 PWA 支援規劃

- `manifest.json`：定義 PWA 基本資訊與圖示
- `sw.js`（Service Worker）：快取靜態資源，支援離線瀏覽
- 上述檔案可在 P2 階段加入，不影響現有功能

---

*文件版本：v1.0*
*最後更新：2026-04-09*

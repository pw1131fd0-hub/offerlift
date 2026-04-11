# OfferLift React 重構規格書 (SPEC.md)

## 1. Overview

- **產品**：OfferLift — 求職者薪資談判智囊
- **重構動機**：單頁 HTML (5941行) 難以維護，升級至 React 元件化架構
- **時限**：2026-04-12 完成
- **原則**：後端 API 完全不動，只置換前端

---

## 2. 技術棧

| 層面 | 技術 |
|------|------|
| 建構工具 | Vite 6 |
| 前端框架 | React 18 |
| 路由 | React Router v6 |
| 狀態管理 | Zustand |
| 樣式 | Tailwind CSS (CDN via postcss) |
| HTTP客戶端 | Fetch API (axios 已存在後端) |
| 多語系 | react-i18next |
| 圖表 | Recharts |
| UI元件 | Headless UI + 自定義 |

---

## 3. 目錄結構

```
frontend/
  src/
    components/
      ui/              # Base components (Button, Card, Input, Select...)
      OfferForm/        # Offer 輸入表單
      ScoreCard/        # 評估結果分數卡
      ScriptList/       # 談判腳本列表
      SalaryTable/      # 薪資參考表格
      ForumPost/        # 論壇討論串
      NavBar/           # 導航列
      LanguageSelector/ # 語系切換
      DarkModeToggle/   # 深色模式
    pages/
      Home.jsx          # 首頁（價值主張）
      Evaluate.jsx      # 評估頁（表單 + 結果）
      Dashboard.jsx      # 我的 Offers 追蹤
      Market.jsx        # 薪資行情頁
      Forum.jsx         # 匿名論壇頁
      Scripts.jsx       # 談判腳本庫
    hooks/
      useOfferEvaluation.js
      useSalaryData.js
      useForum.js
      useOffers.js
      useDarkMode.js
    api/
      client.js         # API 客戶端封裝
      endpoints.js      # API 端點常量
    store/
      offerStore.js     # Zustand store
    i18n/
      locales/
        zh-TW.json
        en.json
        ja.json
      index.js
    App.jsx
    main.jsx
  index.html
  vite.config.js
  tailwind.config.js
  postcss.config.js
  package.json
```

---

## 4. 頁面規格

### 4.1 Home（`/`）
- Hero Section：品牌標語 + CTA "開始評估"
- Feature cards：評估、腳本、論壇、行情

### 4.2 Evaluate（`/evaluate`）
- 輸入表單（職稱、等級、薪資結構、城市）
- AJAX 提交到 `/api/evaluate`
- 結果以 ScoreCard 顯示（環圈動畫、分數、解讀）

### 4.3 Dashboard（`/dashboard`）
- 列出用戶的 Offers（存在 Zustand，localStorage 持久化）
- 每筆顯示：公司、職稱、分數、狀態
- 可編輯、刪除

### 4.4 Market（`/market`）
- 讀取 `/api/salary-data`
- 以表格呈現可篩選

### 4.5 Forum（`/forum`）
- 讀取 `/api/forum`
- 發表匿名討論

### 4.6 Scripts（`/scripts`）
- 讀取 `/api/scripts`
- 可展開/複製腳本

---

## 5. 組件層級

```
App
├── NavBar
│   ├── LanguageSelector
│   └── DarkModeToggle
├── Router
│   ├── Home
│   ├── Evaluate → OfferForm + ScoreCard
│   ├── Dashboard → OfferCard (list)
│   ├── Market → SalaryTable
│   ├── Forum → ForumPost + ForumForm
│   └── Scripts → ScriptList
```

---

## 6. API 映射

| 前端動作 | 後端端點 | 方法 |
|----------|----------|------|
| 評估 Offer | `/api/evaluate` | POST |
| 取得薪資行情 | `/api/salary-data` | GET |
| 取得腳本 | `/api/scripts` | GET |
| 論壇列表 | `/api/forum` | GET |
| 發表討論 | `/api/forum` | POST |
| 取得 Offers | `/api/offers` | GET |
| 新增 Offer | `/api/offers` | POST |
| 更新 Offer | `/api/offers/:id` | PUT |
| 刪除 Offer | `/api/offers/:id` | DELETE |
| 城市税計算 | `/api/calculator/tax` | GET |

---

## 7. 部署策略

1. `cd frontend && npm run build` → 產生 `dist/`
2. Nginx serving `dist/` 作為靜態檔案
3. API 請求 proxy 透過 Vite dev server 或 Nginx reverse proxy 回傳到 `http://localhost:3000`

---

## 8. 交付檢查清單

- [ ] Vite + React 專案建立
- [ ] Tailwind CSS 設定
- [ ] React Router 設定（6個頁面）
- [ ] Zustand store 設定
- [ ] NavBar + 路由
- [ ] Home 頁
- [ ] Evaluate 頁（表單 + API + ScoreCard）
- [ ] Dashboard 頁（localStorage 持久化）
- [ ] Market 頁
- [ ] Forum 頁
- [ ] Scripts 頁
- [ ] 多語系（zh-TW / en / ja）
- [ ] 深色模式
- [ ] 生產 build 驗證
- [ ] Nginx 部署

# 執行計劃 — OfferLift 全新開發

## 現有基礎

### 技術棧
| 項目 | 現況 | 備註 |
|------|------|------|
| 前端 | HTML + Tailwind CSS（CDN）+ Vanilla JS（內聯於 index.html，~6000行） | sw.js、manifest.json 已存在 |
| 後端 | **無** | docker-compose.yml 有 postgres+redis 設定但無任何 API 服務 |
| 資料儲存 | localStorage（前端單層） | 無 PostgreSQL/Redis 實際使用 |
| 部署 | GitHub Pages（純靜態） + Docker/nginx（靜態檔案） | Docker build 僅複製靜態檔案 |
| 測試 | Jest + jsdom（已設定） | assets/js/core/evaluator.test.js 存在 |
| 外部依賴 | Tailwind CDN、Google Fonts、jsPDF CDN、QRCode CDN | 無版本鎖定 |

### 現有功能（全是前端 mockup，無實際後端）
| 功能 | 程式位置 | 現況 |
|------|----------|------|
| Offer 評估器 | index.html inline script | 僅 localStorage，無真實薪資數據庫 |
| 談判腳本庫 | index.html inline script | 純靜態 JSON，無 CRUD API |
| 薪資參考數據 | index.html inline script | 12 個職稱，hardcoded，無 DB |
| 薪資論壇 | index.html inline script | localStorage，無後端 persistence |
| 面試進度追蹤 | index.html inline script | localStorage |
| Offer 截止提醒 | index.html inline script | Notification API（前端），無 server-side scheduling |
| 稅務計算機 | index.html inline script | 純 JS 公式計算 |
| 深色模式 | index.html inline script | CSS toggle |
| 多語言切換 | index.html inline script | i18n（ZH/EN/JA） |
| PWA Service Worker | sw.js | 已存在但綁定邏輯未確認 |
| PDF 匯出 | index.html inline script | jsPDF CDN |
| Docker 部署 | docker-compose.yml + Dockerfile | postgres+redis 已定義但後端未實作故無效 |

### docs/ 目錄現況
| 檔案 | 內容 | 評估 |
|------|------|------|
| PRD.md | 完整 7 項內容（產品願景/User Story/P0P1P2/非功能需求/技術選型/UIUX色彩/成功指標） | 每項 >= 50字，完整 |
| SA.md | 描述「純前端 SPA，localStorage only」架構 | **與任務需求不符（任務要求後端）** |
| SD.md | localStorage schema + JS 介面規格 | **與任務需求不符（任務要求 PostgreSQL）** |
| PROPOSALS.md | 13 個提案，全部標示「✅ 已實作」 | 全部為 mockup，前端存在但無後端 |
| DEV_LOG.md | 存在 | — |

---

## PRD 評估
- **狀態**：存在且完整
- **缺的項目**：無。所有 7 項均 >= 50字。

> ⚠️ **警告**：PRD 附錄「現有 MVP+P1+P2+P3 功能對照」將所有功能標示為「✅ 已實作」或「滿足」。但根據 code review，**所有功能均為前端 mockup，無實際後端 API**。PRD 應修正此說法，或視為「規格書」而非「現狀文件」。

---

## SA/SD 評估
- **SA.md 狀態**：文件存在且完整，但**架構假設與任務需求根本不符**
  - SA 描述「純前端 SPA，所有業務邏輯在瀏覽器內完成」
  - 任務要求：Node.js/Express 後端 + PostgreSQL + Redis + 10+ API endpoints
  - **結論**：SA 需要完全重寫
- **SD.md 狀態**：文件存在且完整，但**localStorage schema 需要替換為 PostgreSQL schema**
  - SD 定義 `offerlift_users`、`offerlift_contribs` 等 localStorage key
  - 任務要求 DB Schema：offers, interviews, forum_posts, salary_contributions, negotiation_scripts
  - **結論**：SD 需要完全重寫

---

## 建議執行階段

```
⚠️ PRD (85) → SA+SD (85) → dev (90) → test (95) → security (95) → done
         ↑                      ↑
         └──────────────────────┘
         需先重寫 SA+SD，否則 dev 無正確規格可依循
```

### Phase 1: 重寫 SA + SD（必要的前置作業）
**原因**：現有 SA/SD 描述的架構（純前端 localStorage）與任務要求（後端 API + PostgreSQL + Redis）完全相反。在錯誤的規格上开发是无效的。

**交付物**：
- 新 SA.md：Node.js/Express + PostgreSQL + Redis 架構
- 新 SD.md：PostgreSQL schema（offers, interviews, forum_posts, salary_contributions, negotiation_scripts）+ REST API 規格
- 更新 PRD.md：移除「✅ 已實作」不實標記，補充後端技術選型說明

### Phase 2: 建立後端（dev 切入點）
1. 初始化 Node.js/Express 專案
2. 建立 PostgreSQL schema + 遷移
3. 建立 Redis 連線（session/cache）
4. 實作 10 個 API endpoints
5. Docker compose 完整部署驗證

### Phase 3: 前端重構
1. 移除 index.html 內聯 JS 中的 mock 邏輯
2. 串接後端 API（fetch/axios）
3. 實現真實的 RSS data pipeline
4. 完整功能驗收

---

## 優先修復清單（dev 切入時）

根據 code review，以下為最容易發現的問題：

### 1. 安全問題（Critical）
- **無後端導致的身份驗證缺失**：所有功能無登入機制，用户数据無隔離
- **XSS 過濾不完整**：`sanitize()` 僅跳脫 `<'"&`，未處理 `onerror`、`onload` 等事件屬性
- **CORS 完全開放**：未來後端上線時需設定允許域名白名單

### 2. 架構問題（Critical）
- **前後端耦合**：index.html 內含所有業務邏輯，6000 行單一檔案無法協作維護
- **無真實資料持久化**：localStorage 資料無法跨設備/跨瀏覽器同步，5MB 上限
- **無 RSS 資料獲取**：薪資數據全為 hardcoded，無法即時更新

### 3. 效能問題
- **Tailwind CDN 無版本鎖定**：可能因為 CDN 更新導致樣式斷裂
- **無程式碼分割**：整個應用（含 jsPDF、QRCode 等）無拆分，首屏載入過重
- **Service Worker 未綁定**：sw.js 存在但與 index.html 的綁定關係未確認

### 4. 測試覆蓋問題
- **無 API 整合測試**：只有 evaluator.test.js（單元測試），無端到端測試
- **Jest 設定存在但幾乎未用**：coverage 資料夾顯示有覆蓋率報告

### 5. 部署問題
- **docker-compose 假的**：postgres + redis 啟動但無服務連接
- **Dockerfile 只複製靜態檔**：等於沒有使用 Docker 的價值

---

## Quality Gate 路徑

```
PRD (85分) → SA+SD (85分) → dev (90分) → test (95分) → security (95分) → done
     ↑              ↑             ↑
     │              │             └── Phase 2: 後端 API + DB + Docker 部署
     │              └── Phase 1: 重寫 SA + SD（必須先完成）
     └── Phase 0: PRD 現狀良好，無需修改
```

**各階段審查重點**：
- **PRD**：規格完整性確認（已通過，無需修改）
- **SA+SD**：架構是否正確描述「後端 API + PostgreSQL + Redis」（需完全重寫）
- **dev**：後端 API 功能正確性、Docker compose 可正常啟動、前端可串接
- **test**：所有 API endpoints 功能正確、資料正確寫入 DB
- **security**：身份驗證、CORS、輸入驗證、XSS 防護

---

## 確認事項

請老闆確認：

1. **現有基礎評估是否正確？**
   - 確認：後端確實完全不存在（只有 docker-compose 設定）
   - 確認：index.html 的 JS 功能是否算「有功能但無後端」而非「無 JS 功能」

2. **優先修復清單是否有遺漏？**
   - 是否還有其他緊急的安全/功能問題？

3. **執行階段順序是否同意？**
   - 是否同意「Phase 1 先重寫 SA+SD → Phase 2 建後端 → Phase 3 前端重構」的路徑？
   - 或者希望跳過 SA+SD 重寫直接進入 dev（規格風險較高）？

確認後回覆「可以，開始」，Worker 就會正式執行。

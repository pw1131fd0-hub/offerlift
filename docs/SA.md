# OfferLift SA — 系統架構文件

## 1. 系統概述

OfferLift 是一款全端單頁應用（SPA），前端為純靜態 HTML/CSS/JS，後端採用 Node.js + Express.js，資料庫為 PostgreSQL，快取層為 Redis。系統核心功能包括：Offer 評估、談判腳本庫、薪資參考數據展示、用戶匿名貢獻、以及薪資論壇討論。

---

## 2. 架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                        用戶瀏覽器 (Browser)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │   UI Layer   │  │ Business    │  │   API Client        │    │
│  │  (HTML/CSS)  │←→│ Logic Layer │←→│  (Fetch/Axios)      │    │
│  │              │  │ (Vanilla JS)│  │                      │    │
│  └──────────────┘  └──────────────┘  └──────────────────────┘    │
│         ↑                 ↑                     ↑               │
│         └─────────────────┼─────────────────────┘               │
│                           │                                     │
│              ┌────────────┴────────────┐                       │
│              │      Tailwind CSS        │                       │
│              │     (CDN, Runtime)       │                       │
│              └──────────────────────────┘                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  外部依賴 (CDN)                            │   │
│  │  - Tailwind CSS (styling)                               │   │
│  │  - Google Fonts (Inter)                                 │   │
│  │  - jsPDF (PDF export)                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway / Load Balancer                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Node.js + Express.js                    │   │
│  │  - Rate Limiting (Redis)                                │   │
│  │  - CORS Middleware                                      │   │
│  │  - API Key Validation                                   │   │
│  │  - Request Logging                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ PostgreSQL  │     │    Redis    │     │  RSS Fetcher│       │
│  │  (Primary   │     │   (Cache)   │     │  (Scheduler)│       │
│  │  Database)  │     │             │     │             │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (Static Assets)
                              ▼
                    ┌─────────────────┐
                    │  Static Hosting  │
                    │  (GitHub Pages)  │
                    │  or Cloud Run    │
                    └─────────────────┘
```

---

## 3. 元件職責

### 3.1 Frontend Layer（元器件 — HTML/CSS/JS）

| 元件名稱 | 職責 | 技術實作 |
|----------|------|----------|
| Navigation Bar | 全站導航、品牌識別 | `nav` + Tailwind `sticky` + `backdrop-blur` |
| Hero Section | 價值主張傳達、CTA 導流 | Gradient background + Tailwind utilities |
| Evaluator Section | Offer 輸入表單 + 結果展示 | Two-column grid layout + API call |
| Scripts Section | 談判腳本列表（可展開） | `details/summary` 模式或 JS toggle |
| Market Section | 薪資參考卡片網格 | CSS Grid + Tailwind responsive + API |
| Comparison Section | 多 Offer 並排比較、雷達圖 | Canvas rendering + Tailwind grid |
| Benefits Calculator | 完整薪酬福利計算 | Form inputs + API call |
| Salary Simulator | 薪資成長模擬、柱狀圖 | Canvas rendering |
| Email Generator | 談判郵件自動產生 | Form + Copy to clipboard |
| Language Selector | 繁體/English/日本語 | Fixed position, API preference |
| Forum Section | 匿名薪資論壇討論區 | Thread list + post form, API |
| Offer Tracker Panel | 多 Offer 追蹤管理 | Sidebar/modal, Notification API |
| Dark Mode Toggle | 深色/淺色模式切換 | Tailwind dark: prefix |

### 3.2 Backend Layer（Node.js + Express）

| 路由/中介軟體 | 職責 | API 端點 |
|--------------|------|----------|
| `evaluateRouter` | Offer 評估計算 | `POST /api/evaluate` |
| `salaryDataRouter` | 薪資參考數據 CRUD | `GET /api/salary-data`, `POST /api/contribute` |
| `offersRouter` | Offer 追蹤 CRUD | `GET/POST/PUT/DELETE /api/offers` |
| `interviewsRouter` | 面試進度 CRUD | `GET/POST/PUT/DELETE /api/interviews` |
| `forumRouter` | 論壇文章 CRUD | `GET/POST/DELETE /api/forum` |
| `calculatorRouter` | 稅務/福利計算 | `GET /api/calculator/tax`, `GET /api/calculator/benefits` |
| `rssRouter` | RSS 資料獲取 | `GET /api/rss/104`, `GET /api/rss/cakeresume` |
| `scriptsRouter` | 談判腳本讀取 | `GET /api/scripts` |
| `rateLimiter` | API 限流 | Redis-based token bucket |
| `authMiddleware` | API Key 驗證 | Header: `X-API-Key` |
| `corsMiddleware` | 跨域資源共用 | 允許指定 origin |
| `errorHandler` | 全域錯誤處理 | 統一錯誤格式 |

### 3.3 Data Layer（PostgreSQL + Redis）

| 服務 | 職責 | 資料範圍 |
|------|------|----------|
| PostgreSQL | 主資料庫，持久化所有業務資料 | users, salary_data, offers, interviews, forum_posts, evaluations |
| Redis | 快取層，加速熱門資料讀取 | salary_data (1h TTL), RSS feeds (1h TTL), rate limit counters |

---

## 4. 資料流

### 4.1 Offer 評估流程

```
用戶輸入 → validateInput() → fetch POST /api/evaluate
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
                 計算 score                    寫入 PostgreSQL
                 (Node.js)                    evaluations table
                         │                               │
                         │                      更新 anonymous_id
                         │
                         ▼
                 回傳 JSON
                 { score, breakdown, verdict }
                         │
                         ▼
                 渲染結果 UI
                 (環圈分數 + breakdown + verdict)
```

### 4.2 薪資數據貢獻流程

```
用戶點擊「貢獻」→ 開啟 modal
     │
     ▼
用戶填寫表單 → fetch POST /api/contribute
     │
     ├─→ Express 接收請求
     │
     ├─→ XSS 過濾輸入
     │
     ├─→ 寫入 PostgreSQL salary_contributions
     │
     ├─→ 回傳成功 JSON
     │
     └─→ 關閉 Modal + 清空表單
```

### 4.3 RSS 資料更新流程

```
Scheduler (node-cron)
     │
     ├─→ 每小時觸發
     │
     ├─→ fetch https://www.104.com.tw/...
     │
     ├─→ parse RSS/XML
     │
     ├─→ 更新 PostgreSQL salary_data
     │
     └─→ 快取至 Redis (TTL: 1h)
```

### 4.4 頁面初始化流程

```
DOMContentLoaded
     │
     ├─→ fetch GET /api/salary-data → 渲染薪資卡片
     │
     ├─→ fetch GET /api/scripts → 渲染談判腳本列表
     │
     ├─→ fetch GET /api/forum → 渲染論壇討論串
     │
     └─→ 初始化深色模式（從 localStorage 讀取偏好）
```

---

## 5. 部署方式

### 5.1 本地開發部署

```
docker-compose up
     │
     ├─→ PostgreSQL (port 5432)
     │
     ├─→ Redis (port 6379)
     │
     └─→ Node.js App (port 3000)

Frontend (index.html) → 透過 Vite/DevServer proxy 或直接 call API
```

### 5.2 生產環境部署

```
GitHub Repository (main branch)
         │
         │  (自動觸發 GitHub Actions)
         ▼
   Build & Push Docker Image
         │
         ▼
   Deploy to Cloud Run / VPS
   (Docker Container)
         │
         ├─→ Node.js App (Express)
         │
         ├─→ PostgreSQL (Managed, e.g., Cloud SQL)
         │
         └─→ Redis (Managed, e.g., Memorystore)
         │
         ▼
   Static Frontend
   (GitHub Pages 或 CDN)
```

### 5.3 環境差異

| 環境 | URL | 觸發條件 |
|------|-----|----------|
| 開發環境 | `http://localhost:3000` | `docker-compose up` |
| 前端開發 | `http://localhost:5173` (Vite) | `npm run dev` |
| 正式環境 | `https://api.offerlift.example.com` | main branch push |

---

## 6. 擴展性考量

### 6.1 未來微服務拆分

目前為簡化架構，所有 API 在單一 Express app 中。未來可拆分為：
- `offer-service`：Offer 評估與追蹤
- `forum-service`：論壇功能
- `salary-service`：薪資數據與貢獻
- `scheduler-service`：RSS 抓取

### 6.2 快取策略

| 資料類型 | 快取策略 | TTL |
|---------|---------|-----|
| 薪資參考數據 | Cache-Aside (Redis) | 1 小時 |
| RSS 資料 | Read-Through | 1 小時 |
| 熱門論壇文章 | Read-Through | 5 分鐘 |
| Rate Limit | Redis Counter | - |

### 6.3 多租戶架構

目前為匿名用戶模式（cookie/localStorage 生成 anonymous_id）。未來可支援：
- JWT 登入
- OAuth 第三方登入
- 多租戶隔離

---

## 7. 安全性設計

### 7.1 API 認證

- **API Key 模式**：前端攜帶 `X-API-Key` header
- **速率限制**：每人每分鐘 100 請求（Redis counter）
- **CORS**：僅允許白名單域名

### 7.2 輸入驗證

- 所有用戶輸入在後端做 XSS 過濾（DOMPurify）
- SQL 注入防護（Parameterized Queries / ORM）
- 請求格式驗證（Joi / Zod schema）

### 7.3 資料隔離

- 匿名 ID 僅用於資料關聯，不具備身份識別性
- 論壇文章完全不儲存個人識別資訊

---

*文件版本：v2.0*
*最後更新：2026-04-11*
*作者：OfferLift Dev Team*
*備註：此版本為 Full-Stack 架構，基於 Node.js + Express + PostgreSQL + Redis*

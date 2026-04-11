# OfferLift SA — 系統架構文件（React 版本）

## 1. 系統概述

OfferLift 是一款全端多頁應用，前端為 React 18 + Vite，後端為 Node.js + Express，資料庫為 PostgreSQL，快取層為 Redis。系統核心功能包括：Offer 評估、談判腳本庫、薪資參考數據展示、用戶匿名貢獻、以及薪資論壇討論。

---

## 2. 架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                        用戶瀏覽器 (Browser)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   React 18 SPA                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐    │    │
│  │  │ React Router │  │   Zustand    │  │  Tailwind  │    │    │
│  │  │  (6 pages)   │  │  (store +    │  │   CSS CDN  │    │    │
│  │  │              │  │  persisted)  │  │            │    │    │
│  │  └──────────────┘  └──────────────┘  └────────────┘    │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (REST API via Nginx)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Nginx (offerlift-frontend:80)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Static: React build (dist/)                             │   │
│  │  Proxy: /api/* → offerlift-api:3000                      │   │
│  │  SPA fallback: / → index.html                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  offerlift-api (Container, Port 3000)           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Node.js + Express.js                        │   │
│  │  - Rate Limiting (Redis)                                 │   │
│  │  - CORS Middleware                                       │   │
│  │  - API Key Validation                                    │   │
│  │  - Request Logging                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ offerlift-  │     │ offerlift- │     │  RSS        │       │
│  │ postgres    │     │ redis      │     │  Fetcher    │       │
│  │ (5432)      │     │ (6379)     │     │  (Scheduler)│       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Docker 容器矩陣

| 容器名稱 | 映像檔 | 埠 | 職責 | 重啟策略 |
|----------|--------|-----|------|----------|
| offerlift-postgres | postgres:16-alpine | 5434:5432 | Primary DB | unless-stopped |
| offerlift-redis | redis:7-alpine | 6380:6379 | Cache + Rate Limit | unless-stopped |
| offerlift-api | app_api (build) | 3000:3000 | Node.js API | unless-stopped |
| offerlift-frontend | offerlift-frontend (build) | 8080:80 | Nginx + React build | unless-stopped |

---

## 4. 元件職責

### 4.1 Frontend Layer（React 18 + Vite）

| 元件名稱 | 職責 | 技術實作 |
|----------|------|----------|
| NavBar | 全站導航、品牌識別 | React Router Link + Tailwind |
| Home | 價值主張傳達、CTA 導流 | gradient bg + Feature cards |
| OfferForm | Offer 輸入表單 + API call | React state + fetch |
| ScoreCard | 評估結果環圈動畫 | Recharts + CSS animation |
| ScriptList | 談判腳本列表（可展開） | Accordion pattern |
| SalaryTable | 薪資參考表格 | Static data + filter |
| ForumPost | 論壇討論串 | List + Post form |
| LanguageSelector | 繁體/English/日本語 | react-i18next |
| DarkModeToggle | 深色/淺色模式切換 | Zustand + Tailwind dark: |

### 4.2 Backend Layer（Node.js + Express）

| 路由/中介軟體 | 職責 | API 端點 |
|--------------|------|----------|
| evaluateRouter | Offer 評估計算 | `POST /api/evaluate` |
| salaryDataRouter | 薪資參考數據 CRUD | `GET /api/salary-data`, `POST /api/contribute` |
| offersRouter | Offer 追蹤 CRUD | `GET/POST/PUT/DELETE /api/offers` |
| interviewsRouter | 面試進度 CRUD | `GET/POST/PUT/DELETE /api/interviews` |
| forumRouter | 論壇文章 CRUD | `GET/POST/DELETE /api/forum` |
| calculatorRouter | 稅務/福利計算 | `GET /api/calculator/tax`, `GET /api/calculator/benefits` |
| rssRouter | RSS 資料獲取 | `GET /api/rss/104`, `GET /api/rss/cakeresume` |
| scriptsRouter | 談判腳本讀取 | `GET /api/scripts` |

---

## 5. 部署流程

```bash
# 開發模式
cd frontend && npm install && npm run dev

# 生產模式
cd frontend && npm run build

# Docker 部署（整組）
cd /home/crawd_user/project/offerlift
docker compose up -d --build
```

---

## 6. 健康檢查策略

- **PostgreSQL**：`pg_isready` every 10s
- **Redis**：`redis-cli ping` every 10s
- **Frontend**：`wget http://localhost:80/` every 30s
- **API**：`condition: service_healthy` (waits for postgres + redis)

---

## 7. 安全策略

- Nginx headers：`X-Content-Type-Options`, `X-XSS-Protection`, `X-Frame-Options`, `Referrer-Policy`
- API Key 驗證（`X-API-Key` header）
- Rate limiting via Redis
- CORS 限制允許的 origin
- CSP previously removed (blocking Tailwind CDN)

---

## 8. 多語系

- **框架**：react-i18next
- **支援語言**：繁體中文（zh-TW）、英語（en）、日語（ja）
- **切換方式**：Zustand store → localStorage persistence

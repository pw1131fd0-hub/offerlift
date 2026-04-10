# OfferLift SD — 系統設計文件

## 1. 模組介面定義

### 1.1 核心模組結構（Full-Stack）

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Browser)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Vanilla JavaScript                     │   │
│  │  ├── api/           # API client functions               │   │
│  │  ├── ui/            # DOM manipulation                    │   │
│  │  └── utils/         # sanitize, helpers                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Node.js)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Express.js Routes                       │   │
│  │  ├── routes/        # API route handlers                  │   │
│  │  ├── services/      # Business logic                       │   │
│  │  ├── models/        # Database models (ORM)                │   │
│  │  ├── middleware/    # Auth, rate limit, error handling     │   │
│  │  └── utils/         # XSS, validation                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
     ┌─────────────┐                 ┌─────────────┐
     │ PostgreSQL  │                 │    Redis    │
     │  (Primary)  │                 │   (Cache)   │
     └─────────────┘                 └─────────────┘
```

### 1.2 資料型別定義

```typescript
// === API Request/Response Types ===

// POST /api/evaluate
interface EvaluateRequest {
  jobTitle: string;
  totalComp: number;      // 年度總薪（含獎金），單位：TWD
  baseSalary: number;     // 年薪底薪，單位：TWD
  bonus: number;          // 年終獎金（月數），0-12
  equity: number;         // 股份/選擇權稀釋後百分比，0-5
  city: 'taipei' | 'nhc' | 'taichung' | 'kaohsiung' | 'remote';
  experience: '0-2' | '2-5' | '5-10' | '10+';
}

interface EvaluateResponse {
  score: number;          // 0-100 總分
  breakdown: BreakdownItem[];
  verdict: string;        // 談判建議文字
  label: 'excellent' | 'good' | 'fair' | 'poor';
}

interface BreakdownItem {
  label: string;
  value: string;          // e.g., "+15", "-10"
  good: boolean | null;
}

// GET /api/salary-data
interface SalaryDataResponse {
  data: SalaryReference[];
  sources: string[];
}

// POST /api/contribute
interface ContributeRequest {
  title: string;
  salary: number;
  city: string;
}

// GET /api/forum
interface ForumListResponse {
  posts: ForumPost[];
  total: number;
  page: number;
  pageSize: number;
}

// POST /api/forum
interface CreatePostRequest {
  title: string;
  company?: string;
  city: string;
  salaryRange: string;
  content: string;
}

// GET /api/offers
interface Offer {
  id: number;
  company: string;
  title: string;
  deadline: string;       // ISO date string
  status: 'candidate' | 'negotiating' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
}

// GET /api/interviews
interface Interview {
  id: number;
  company: string;
  title: string;
  stage: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Salary Reference Data
interface SalaryReference {
  id: number;
  title: string;
  min: number;
  max: number;
  level: string;
  city: string;
  source: string;
}

// Negotiation Script
interface NegotiationScript {
  id: number;
  title: string;
  situation: string;
  script: string;
  tip: string;
  category: string;
}

// Evaluation History
interface Evaluation {
  id: number;
  jobTitle: string;
  score: number;
  totalComp: number;
  breakdown: BreakdownItem[];
  createdAt: string;
}
```

---

## 2. PostgreSQL DB Schema

### 2.1 Schema 總覽

| Table | Primary Key | 说明 |
|-------|------------|------|
| users | id (UUID) | 匿名用戶識別 |
| salary_data | id | 薪資參考數據 |
| salary_contributions | id | 用戶薪資貢獻 |
| offers | id | Offer 追蹤 |
| interviews | id | 面試進度 |
| forum_posts | id | 論壇文章 |
| negotiation_scripts | id | 談判腳本 |
| evaluations | id | 評估歷史 |

### 2.2 Table Definitions

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_anonymous_id (anonymous_id)
);
```

#### salary_data
```sql
CREATE TABLE salary_data (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  min_salary INTEGER NOT NULL,
  max_salary INTEGER NOT NULL,
  level VARCHAR(20) NOT NULL,
  city VARCHAR(20) NOT NULL,
  source VARCHAR(50) DEFAULT 'manual',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_title_city (title, city)
);
```

#### salary_contributions
```sql
CREATE TABLE salary_contributions (
  id SERIAL PRIMARY KEY,
  anonymous_id VARCHAR(64) NOT NULL,
  title VARCHAR(100) NOT NULL,
  salary INTEGER NOT NULL,
  city VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_anonymous_id (anonymous_id)
);
```

#### offers
```sql
CREATE TABLE offers (
  id SERIAL PRIMARY KEY,
  anonymous_id VARCHAR(64) NOT NULL,
  company VARCHAR(100) NOT NULL,
  title VARCHAR(100) NOT NULL,
  deadline TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'candidate',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_anonymous_id (anonymous_id),
  INDEX idx_status (status)
);
```

#### interviews
```sql
CREATE TABLE interviews (
  id SERIAL PRIMARY KEY,
  anonymous_id VARCHAR(64) NOT NULL,
  company VARCHAR(100) NOT NULL,
  title VARCHAR(100) NOT NULL,
  stage VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_anonymous_id (anonymous_id),
  INDEX idx_stage (stage)
);
```

#### forum_posts
```sql
CREATE TABLE forum_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  company VARCHAR(100),
  city VARCHAR(20) NOT NULL,
  salary_range VARCHAR(50),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_city (city),
  INDEX idx_created_at (created_at DESC)
);
```

#### negotiation_scripts
```sql
CREATE TABLE negotiation_scripts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  situation TEXT NOT NULL,
  script TEXT NOT NULL,
  tip TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  INDEX idx_category (category)
);
```

#### evaluations
```sql
CREATE TABLE evaluations (
  id SERIAL PRIMARY KEY,
  anonymous_id VARCHAR(64) NOT NULL,
  job_title VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  total_comp INTEGER NOT NULL,
  breakdown JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_anonymous_id (anonymous_id),
  INDEX idx_created_at (created_at DESC)
);
```

---

## 3. API 規格

### 3.1 Offer 評估

#### POST /api/evaluate
```json
// Request
{
  "jobTitle": "Frontend Engineer",
  "totalComp": 1500000,
  "baseSalary": 1300000,
  "bonus": 2,
  "equity": 0.05,
  "city": "taipei",
  "experience": "2-5"
}

// Response 200
{
  "score": 75,
  "breakdown": [
    { "label": "市場薪資比", "value": "+10", "good": true },
    { "label": "城市加權", "value": "+5", "good": true },
    { "label": "年資匹配", "value": "0", "good": null }
  ],
  "verdict": "可以談判",
  "label": "good"
}
```

### 3.2 薪資數據

#### GET /api/salary-data
```json
// Response 200
{
  "data": [
    {
      "id": 1,
      "title": "Frontend Engineer",
      "min": 600000,
      "max": 1200000,
      "level": "2-5年",
      "city": "taipei",
      "source": "104"
    }
  ],
  "sources": ["104", "LinkedIn", "CakeResume"]
}
```

#### POST /api/contribute
```json
// Request
{
  "title": "Senior Frontend Engineer",
  "salary": 1800000,
  "city": "taipei"
}

// Response 201
{
  "success": true,
  "message": "感謝您的貢獻"
}
```

### 3.3 Offer 追蹤

#### GET /api/offers
```json
// Response 200
{
  "offers": [
    {
      "id": 1,
      "company": "Google",
      "title": "Senior Frontend Engineer",
      "deadline": "2026-04-20T23:59:59.000Z",
      "status": "negotiating",
      "createdAt": "2026-04-09T10:00:00.000Z"
    }
  ]
}
```

#### POST /api/offers
```json
// Request
{
  "company": "Google",
  "title": "Senior Frontend Engineer",
  "deadline": "2026-04-20T23:59:59.000Z",
  "status": "candidate"
}

// Response 201
{
  "id": 1,
  "company": "Google",
  "title": "Senior Frontend Engineer",
  "deadline": "2026-04-20T23:59:59.000Z",
  "status": "candidate",
  "createdAt": "2026-04-11T00:00:00.000Z"
}
```

#### PUT /api/offers/:id
```json
// Request
{
  "status": "accepted"
}

// Response 200
{
  "id": 1,
  "status": "accepted",
  "updatedAt": "2026-04-11T00:00:00.000Z"
}
```

#### DELETE /api/offers/:id
```json
// Response 204 (No Content)
```

### 3.4 面試進度

#### GET /api/interviews
```json
// Response 200
{
  "interviews": [
    {
      "id": 1,
      "company": "Amazon",
      "title": "Backend Engineer",
      "stage": "技術面試",
      "notes": "等通知",
      "createdAt": "2026-04-09T10:00:00.000Z",
      "updatedAt": "2026-04-10T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/interviews
```json
// Request
{
  "company": "Amazon",
  "title": "Backend Engineer",
  "stage": "技術面試",
  "notes": ""
}

// Response 201
{
  "id": 1,
  "company": "Amazon",
  "title": "Backend Engineer",
  "stage": "技術面試",
  "notes": "",
  "createdAt": "2026-04-11T00:00:00.000Z",
  "updatedAt": "2026-04-11T00:00:00.000Z"
}
```

#### PUT /api/interviews/:id
```json
// Request
{
  "stage": "主管面試",
  "notes": "下週二複試"
}

// Response 200
{
  "id": 1,
  "stage": "主管面試",
  "notes": "下週二複試",
  "updatedAt": "2026-04-11T00:00:00.000Z"
}
```

#### DELETE /api/interviews/:id
```json
// Response 204 (No Content)
```

### 3.5 論壇

#### GET /api/forum
```
GET /api/forum?page=1&pageSize=10&city=taipei&query=台積電
```
```json
// Response 200
{
  "posts": [
    {
      "id": 1,
      "title": "台積電工程師 offer 請教",
      "company": "台積電",
      "city": "nhc",
      "salaryRange": "180-200萬",
      "content": "最近收到 TSMC 的 offer...",
      "createdAt": "2026-04-09T10:30:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 10
}
```

#### POST /api/forum
```json
// Request
{
  "title": "offer 比較請益",
  "company": "聯發科",
  "city": "nhc",
  "salaryRange": "150-180萬",
  "content": "同時收到兩家 offer..."
}

// Response 201
{
  "id": 2,
  "title": "offer 比較請益",
  "company": "聯發科",
  "city": "nhc",
  "salaryRange": "150-180萬",
  "content": "同時收到兩家 offer...",
  "createdAt": "2026-04-11T00:00:00.000Z"
}
```

#### DELETE /api/forum/:id
```json
// Response 204 (No Content)
```

### 3.6 計算機

#### GET /api/calculator/tax
```
GET /api/calculator/tax?annualIncome=1500000&bonus=200000&deduction=standard
```
```json
// Response 200
{
  "grossIncome": 1700000,
  "taxableIncome": 1254000,
  "taxAmount": 62400,
  "effectiveRate": 4.16,
  "monthlyNet": 89450,
  "bonusBreakdown": {
    "oneTime": { "tax": 20000, "net": 180000 },
    "twoTimes": { "tax": 13300, "net": 186700 },
    "threeTimes": { "tax": 10000, "net": 190000 }
  },
  "recommended": "分三次發放",
  "savings": 10000
}
```

#### GET /api/calculator/benefits
```
GET /api/calculator/benefits?baseSalary=1300000&annualLeave=14&mealAllowance=24000&transportAllowance=24000
```
```json
// Response 200
{
  "baseSalary": 1300000,
  "totalBenefits": 86400,
  "breakdown": {
    "annualLeave": 42000,
    "mealAllowance": 24000,
    "transportAllowance": 20400
  },
  "totalComp": 1386400
}
```

### 3.7 RSS 資料

#### GET /api/rss/104
```json
// Response 200 (cached 1 hour)
{
  "items": [
    {
      "title": "前端工程師薪資趨勢",
      "link": "https://...",
      "pubDate": "2026-04-10T00:00:00.000Z"
    }
  ],
  "cachedAt": "2026-04-11T00:00:00.000Z"
}
```

#### GET /api/rss/cakeresume
```json
// Response 200 (cached 1 hour)
{
  "items": [
    {
      "title": "2026 科技業薪資報告",
      "link": "https://...",
      "pubDate": "2026-04-09T00:00:00.000Z"
    }
  ],
  "cachedAt": "2026-04-11T00:00:00.000Z"
}
```

### 3.8 談判腳本

#### GET /api/scripts
```json
// Response 200
{
  "scripts": [
    {
      "id": 1,
      "title": "開場：感謝 + 確認範圍",
      "situation": "面試最後一關，HR 打來通知 Offer",
      "script": "非常感謝您提供這個機會...",
      "tip": "不要第一時間拒絕或接受",
      "category": "開場"
    }
  ]
}
```

---

## 4. Redis 快取策略

### 4.1 Key Pattern

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `salary:all` | 1h | 所有薪資參考數據 |
| `salary:{title}:{city}` | 1h | 特定職稱城市薪資 |
| `rss:104` | 1h | 104 RSS 資料 |
| `rss:cakeresume` | 1h | CakeResume RSS 資料 |
| `scripts:all` | 24h | 所有談判腳本 |
| `ratelimit:{ip}` | 1min | API 限流計數 |

### 4.2 Cache-Aside Pattern

```javascript
// Example: salary data fetch
async function getSalaryData() {
  const cached = await redis.get('salary:all');
  if (cached) return JSON.parse(cached);

  const data = await db.query('SELECT * FROM salary_data');
  await redis.setex('salary:all', 3600, JSON.stringify(data));
  return data;
}
```

---

## 5. 錯誤處理

### 5.1 HTTP 錯誤碼

| 錯誤情境 | HTTP 狀態碼 | 錯誤訊息 |
|----------|------------|----------|
| 請求格式錯誤 | 400 | `{ "error": "Validation failed", "details": [...] }` |
| 未授權 | 401 | `{ "error": "Invalid API Key" }` |
| 請求頻率超限 | 429 | `{ "error": "Rate limit exceeded" }` |
| 資源不存在 | 404 | `{ "error": "Not found" }` |
| 伺服器錯誤 | 500 | `{ "error": "Internal server error" }` |

### 5.2 輸入驗證（Zod Schema）

```javascript
const EvaluateSchema = z.object({
  jobTitle: z.string().min(1),
  totalComp: z.number().positive(),
  baseSalary: z.number().positive(),
  bonus: z.number().min(0).max(12),
  equity: z.number().min(0).max(5),
  city: z.enum(['taipei', 'nhc', 'taichung', 'kaohsiung', 'remote']),
  experience: z.enum(['0-2', '2-5', '5-10', '10+'])
});

const ContributeSchema = z.object({
  title: z.string().min(1).max(100),
  salary: z.number().positive(),
  city: z.string().min(1)
});

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().max(100).optional(),
  city: z.string().min(1),
  salaryRange: z.string().max(50),
  content: z.string().min(1)
});
```

### 5.3 XSS 過濾

後端使用 DOMPurify 過濾所有用戶輸入：

```javascript
const DOMPurify = require('isomorphic-dompurify');

function sanitizeInput(str) {
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });
}
```

---

## 6. 模組結構

```
server/
├── src/
│   ├── index.js              # Express app entry point
│   ├── config/
│   │   ├── database.js      # PostgreSQL connection
│   │   ├── redis.js         # Redis connection
│   │   └── env.js           # Environment variables
│   ├── routes/
│   │   ├── index.js          # Route aggregator
│   │   ├── evaluate.js      # POST /api/evaluate
│   │   ├── salary-data.js   # GET /api/salary-data, POST /api/contribute
│   │   ├── offers.js        # CRUD /api/offers
│   │   ├── interviews.js    # CRUD /api/interviews
│   │   ├── forum.js         # CRUD /api/forum
│   │   ├── calculator.js    # GET /api/calculator/tax, /benefits
│   │   ├── rss.js          # GET /api/rss/104, /cakeresume
│   │   └── scripts.js       # GET /api/scripts
│   ├── services/
│   │   ├── evaluator.js      # Offer 評估商業邏輯
│   │   ├── salary.js        # 薪資數據服務
│   │   ├── forum.js         # 論壇服務
│   │   ├── rss.js           # RSS 抓取服務
│   │   └── cache.js         # Redis 快取服務
│   ├── middleware/
│   │   ├── auth.js          # API Key 驗證
│   │   ├── rateLimit.js     # 速率限制
│   │   ├── errorHandler.js  # 全域錯誤處理
│   │   └── validator.js     # Zod 驗證中介層
│   ├── models/
│   │   └── index.js         # Database models (raw SQL or ORM)
│   └── utils/
│       ├── sanitize.js      # XSS 過濾
│       └── anonymous.js     # Anonymous ID generation
├── migrations/              # Database migrations
├── seeds/                   # Seed data
├── tests/                   # Unit & integration tests
├── docker-compose.yml        # Docker local dev
├── Dockerfile               # Production Docker
└── package.json
```

---

## 7. 外部依賴

| 依賴 | 版本 | 用途 |
|------|------|------|
| express | ^4.18 | Web 框架 |
| pg | ^8.11 | PostgreSQL client |
| redis | ^4.6 | Redis client |
| zod | ^3.22 | 輸入驗證 |
| isomorphic-dompurify | ^2.12 | XSS 過濾 |
| node-cron | ^3.0 | 排程任務（RSS fetch） |
| axios | ^1.6 | HTTP client（RSS fetch） |
| xml2js | ^0.5 | RSS XML 解析 |
| uuid | ^9.0 | UUID 生成 |
| dotenv | ^16.3 | 環境變數 |
| cors | ^2.8 | CORS middleware |
| helmet | ^7.1 | Security headers |

---

*文件版本：v2.0*
*最後更新：2026-04-11*
*作者：OfferLift Dev Team*
*備註：此版本為 Full-Stack 架構，基於 Node.js + Express + PostgreSQL + Redis*

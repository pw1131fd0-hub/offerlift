# OfferLift SD — 建構文件（React + Docker 版本）

## 1. 建構環境

- **Node.js**：22.x
- **前端**：Vite 6 + React 18 + React Router v6 + Zustand
- **後端**：Node.js 18+ + Express
- **資料庫**：PostgreSQL 16
- **快取**：Redis 7
- **容器化**：Docker + Docker Compose
- **反向代理**：Nginx（前端容器內）

---

## 2. 建構腳本

### 2.1 前端建構（frontend/）

```bash
# 初始化
npm create vite@latest . -- --template react
npm install
npm install react-router-dom zustand recharts react-i18next i18next
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 開發
npm run dev          # port 5173

# 生產建構
npm run build        # → dist/
```

### 2.2 Docker 建構（整組）

```bash
# 從專案根目錄
cd /home/crawd_user/project/offerlift

# 完整建構 + 啟動
docker compose up -d --build

# 查看狀態
docker ps

# 停止
docker compose down
```

---

## 3. Docker 網路

- **網路名稱**：`offerlift_app_default`（driver: bridge）
- **Internal DNS**：
  - `offerlift-postgres:5432`
  - `offerlift-redis:6379`
  - `offerlift-api:3000`
  - `offerlift-frontend:80`

---

## 4. 環境變數（API Container）

| 變數 | 值 | 說明 |
|------|-----|------|
| `NODE_ENV` | `development` | 環境模式 |
| `PORT` | `3000` | API 監聽埠 |
| `DATABASE_URL` | `postgres://offerlift:offerlift_dev_password@offerlift-postgres:5432/offerlift` | Postgres 連線字串 |
| `REDIS_URL` | `redis://offerlift-redis:6379` | Redis 連線字串 |
| `API_KEY` | `dev_api_key_12345` | API 驗證金鑰 |
| `CORS_ORIGIN` | `http://localhost:5173,http://localhost:3000,http://localhost:8080` | 允許的 CORS 源 |

---

## 5. 端點規格（不變）

### 5.1 Evaluate
```
POST /api/evaluate
Headers: X-API-Key: dev_api_key_12345
Body: {
  jobTitle: string,
  totalComp: number,
  baseSalary: number,
  bonus: number (months),
  equity: number,
  city: string,
  experience: string
}
Response: { score: number, breakdown: object, script: string, recommendation: string }
```

### 5.2 Salary Data
```
GET /api/salary-data
Response: [{ title, min, max, source }]
```

### 5.3 Scripts
```
GET /api/scripts
Response: [{ id, category, situation, script, tips }]
```

### 5.4 Forum
```
GET /api/forum?page=1&pageSize=10
POST /api/forum
Headers: X-API-Key: dev_api_key_12345
Body: { title, content, company, city, salaryRange, stage }
```

### 5.5 Offers
```
GET /api/offers
POST /api/offers
PUT /api/offers/:id
DELETE /api/offers/:id
```

### 5.6 Calculator
```
GET /api/calculator/tax?annualIncome=1500000
GET /api/calculator/benefits?totalComp=1000000&city=taipei
```

---

## 6. 資料模型（不變）

| Table | 說明 |
|-------|------|
| `salary_data` | 薪資行情參考數據 |
| `evaluations` | 評估歷史記錄 |
| `offers` | 用戶追蹤的 Offers |
| `interviews` | 面試進度 |
| `forum_posts` | 論壇匿名討論 |
| `scripts` | 談判腳本模板 |

---

## 7. Nginx 設定（Frontend Container）

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;   # React build output
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API reverse proxy
    location /api/ {
        proxy_pass http://offerlift-api:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Cache-Control "no-store, no-cache" always;

    # No cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
```

---

## 8. 部署矩陣

| 服務 | 內部 URL | 對外 URL |
|------|----------|----------|
| Frontend | `http://offerlift-frontend:80` | `http://100.114.72.104:8080/` |
| API | `http://offerlift-api:3000` | `http://100.114.72.104:3000/` |
| Postgres | `offerlift-postgres:5432` | `127.0.0.1:5434` |
| Redis | `offerlift-redis:6379` | `127.0.0.1:6380` |

---

## 9. 建構產物

- **frontend/dist/**：Vite 生產建構輸出（Nginx serving）
- **Image names**：`offerlift-frontend:latest`（tag from docker-compose）
- **Volumes**：`postgres_data`, `redis_data`（persistent across restarts）

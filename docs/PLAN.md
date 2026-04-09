# 執行計劃 — OfferLift 求職者薪資談判智囊

## 現有基礎

- **技術棧**：純前端 HTML + Tailwind CSS (CDN) + Vanilla JS，無框架依賴
- **現有功能**：
  1. ✅ Offer 評估器（薪資結構 → 評估分數 + 談判建議）
  2. ✅ 談判腳本庫（5 種情境，可複製使用）
  3. ✅ 薪資參考數據（12 個科技職位）
  4. ✅ 數據貢獻功能（localStorage 儲存）
- **docs/ 目錄現況**：無 docs/ 目錄，無 PRD/SA/SD 文件（MEMO.md 僅為開發日誌，位於根目錄）

---

## PRD 評估

- **狀態**：不存在
- **缺的項目**：
  - 產品願景（< 50 字）
  - User Story（< 50 字）
  - P0/P1/P2 功能優先級（< 50 字）
  - 非功能需求（< 50 字）
  - 技術選型（< 50 字）
  - UI/UX 色彩規範（< 50 字）
  - 成功指標（< 50 字）

---

## SA/SD 評估

- **狀態**：不存在

---

## 建議執行階段

- **Phase 1：PRD 階段** — 因無 PRD 文件，需先補齊產品需求文件
- **Phase 2：SA+SD 階段** — PRD 完成後，補齊系統架構與設計文件
- **Phase 3：dev 階段** — 依優先修復清單實作迭代
- **Phase 4：test → security → done**

---

## 優先修復清單（dev 切入時）

從 code review 逆推以下問題：

1. **UX 問題**：薪資計算邏輯簡單，無 equity vesting 排程分析（假設 static 0%）
2. **功能缺失**：無 dark mode 切換，談判腳本無搜尋/分類功能
3. **效能問題**：salaryData 為靜態內嵌，無動態更新機制（落灰資料）
4. **安全性**：localStorage 無 CSRF/XSS 過濾，用戶貢獻數據無驗證
5. **資料準確性**：stat-users 初始值 hardcoded 127，數據來源聲明與實際不符（聲稱 2025-2026 但代碼註記來源）

---

## Quality Gate 路徑

```
PRD (85) → SA+SD (85) → dev (90) → test (95) → security (95) → done
```

---

## 部署規劃

> Worker 執行前由老闆填寫，完成後寫入 `docs/.deploy_info.json`

| 欄位 | 內容 |
|------|------|
| 部署方式 | （待填）python3 http.server / Docker / PM2 / Node service |
| Port | （待填） |
| 子網域 | （待填）e.g. offerlift.qoqsworld.com |
| 反向代理 | （待填）Caddy / Nginx / Cloudflare Tunnel |
| 健康檢查 | （待填）/health 或 title 關鍵字 |
| 備註 | （待填） |

---

## 確認事項

請老闆確認：

1. 現有基礎評估是否正確？
2. 優先修復清單是否有遺漏？
3. 執行階段順序是否同意？

確認後回覆「可以，開始」，Worker 就會正式執行。

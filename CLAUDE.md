# 3D 地圖網站專案

by 留白設計 Blank Design

這個 repo 由 3d-map-starter 範本建立，程式碼放 GitHub，網站部署在 Vercel，後台是 Payload CMS + Supabase。

## 開案
- 開案用 `/3d-map`（流程見 `.claude/skills/3d-map/SKILL.md`）。根目錄有 `.starter` 表示還沒開案，開案完成後刪掉。
- 客戶專屬的設定只放 `site.config.json`（欄位說明見 `site.config.schema.json`）與後台內容；引擎程式碼不寫死任何客戶名稱或座標。
- 不要編造地址、電話、營業時間、店家位置、出入口或緊急出口位置；缺的資料用【待提供】，交付時列出。示意位置要標示「示意」。

## Git 提交
- commit 作者：`Blank Design <151547077+liderx1@users.noreply.github.com>`。第一次提交前先設定 `git config user.name "Blank Design"` 與 `git config user.email "151547077+liderx1@users.noreply.github.com"`。
- commit 訊息與 PR 說明不加任何 AI 署名。
- 在 `dev` 分支工作；推上 `dev` 後由 GitHub Actions 檢查，通過才自動更新 `main`（Vercel 部署 `main`）。不要直接推 `main`。

## 品質（高階工程團隊標準，不可為了速度跳過）
- 推之前在有 GPU 的電腦跑 `npm run verify`：ESLint、型別、單元測試、桌機／手機／小手機／橫拿手機巡檢與截圖比對。
- 手機優先：大部分訪客用手機，每個改動都要在手機尺寸確認（巡檢會檢查 pin 不被擋、按鈕不被蓋住）。
- 新功能要有測試；純邏輯放 `src/map/core/` 並寫單元測試。

## Payload 與 Supabase
- 資料庫：`@payloadcms/db-postgres`，資料表放在獨立的 `payload` schema，不可放 `public`。
- 檔案：Supabase Storage（S3 相容），私有 bucket。
- 資料表變更用 `payload migrate`；改 `site.config.json` 的 `locales` 或 `drive.starts` 要重新產生 migration。
- 新增的環境變數同步寫進 `.env.example`。

## 需要人工的步驟（Claude 不可代辦，完成開發後列給使用者）
建立 Supabase 專案、取得連線字串與 Storage 金鑰、在 Vercel 建立專案並貼上環境變數、GitHub 的 workflow 權限（`gh auth refresh -s workflow`）、DNS 與網域、綁定信用卡。

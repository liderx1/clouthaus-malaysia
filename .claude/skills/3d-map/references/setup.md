# 本機環境、migration 與部署

## 本機（不用 Supabase）
```bash
npm ci
npm i --no-save embedded-postgres && node scripts/devdb.mjs   # 另一個終端機，Postgres 在 54329
```
`.env`：`PAYLOAD_SECRET=<隨機字串>`、`DATABASE_URI=postgres://payload:payload@localhost:54329/ekocheras`（資料庫名稱可改）。
```bash
npx cross-env PAYLOAD_MIGRATING=1 payload migrate
npx cross-env PAYLOAD_MIGRATING=1 payload run scripts/seed.ts
npm run dev    # http://localhost:3000，後台 /admin
```

## 重新產生初始 migration（換了 locales、floors code 或 drive.starts）
1. 刪掉 `src/migrations/` 裡的檔案（`index.ts` 也刪）。
2. 用一個全新的本機資料庫（刪 `.pgdata/` 重起 devdb）。
3. 產生時一定要帶 S3 變數，否則少了圖片儲存欄位，正式環境會把它刪掉：
   `S3_BUCKET=media S3_REGION=x S3_ENDPOINT=http://localhost:1 S3_ACCESS_KEY_ID=x S3_SECRET_ACCESS_KEY=x npm run migrate:create -- initial`
4. 打開產生的檔案確認：所有資料表都在 `"payload".` schema 下、`CREATE SCHEMA IF NOT EXISTS "payload";` 在最前面（沒有就手動加），沒有 `DROP`。
5. `payload migrate` 跑一次確認成功。

## 驗證
```bash
BASE_URL=http://localhost:3000 npm run verify
```
第一次沒有截圖基準：逐張看 `tests/e2e/shots/`（特別是手機），確認無誤再 `npm run test:visual -- --update`。之後每次改動都跑 `npm run verify`。

## 部署（人工步驟由使用者做）
1. Supabase：建專案（區域選離訪客近的，台灣用 `ap-northeast-1` 東京或 `ap-southeast-1` 新加坡）、關掉 Data API（或確認 `payload` schema 不對外）、Storage 建**私有** bucket `media`、取 S3 金鑰。
2. Vercel：匯入 repo，Framework 選 Next.js，`vercel.json` 的 `regions` 改成和 Supabase 同區（東京 `hnd1`、新加坡 `sin1`）。環境變數（Production，設為 Sensitive）：`PAYLOAD_SECRET`、`DATABASE_URI`（Transaction pooler，6543）、`DATABASE_URI_MIGRATE`（Session pooler，5432）、`S3_ENDPOINT`、`S3_REGION`、`S3_BUCKET`、`S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY`；`NEXT_PUBLIC_SERVER_URL`（正式網址，Production 與 Preview）。
3. GitHub：推含 workflow 的檔案需要 `gh auth refresh -h github.com -s workflow`（使用者自己執行並授權）。
4. 推 `dev`：GitHub Actions 跑檢查與輕量巡檢，通過後自動快轉 `main`，Vercel 部署 `main`；建置時自動 migrate 與 seed。
5. 上線後在正式網址跑 `npm run verify`（`test.liveUrl` 填正式網址），確認後台建立第一個編輯帳號。

## 經驗與陷阱
- 環境變數只設 Production 時，Preview 部署會失敗：`vercel.json` 已關掉 `dev` 分支的部署，不要打開（預覽會對正式資料庫跑 migration）。
- 第一次 seed 很慢時，多半是 Vercel 區域和 Supabase 不同區。
- GitHub Actions 沒有 GPU，3D 每秒約 1 格：CI 只跑 `--smoke`，完整巡檢在本機跑。
- 換 `public/images/` 的圖要換檔名（瀏覽器快取一天）。
- 店家 logo 換新檔時，建置的 seed 會把後台裡原本小尺寸（≤200 px）的同名 logo 換掉；業主自己上傳的不會動。

---
name: 3d-map
description: 為商場、園區、校園、飯店或辦公大樓建立 3D 地圖網站：OpenStreetMap 周邊街區、主建物高亮與招牌、店家／設施目錄與 pin、交通路線、出入口與緊急疏散、日夜切換、多語系（含繁體中文）、Payload 後台 + Supabase、手機優先、自動化測試與 CI 把關。使用者提到 3D 地圖網站、網站 3D 空間製作、商場 3D 導覽、建築 3D 互動地圖，或說「做一個像 EkoCheras 的網站」「用 3D 地圖那套」時都要使用，即使沒有提到這個技能的名字。
argument-hint: "[guide]"
---

# 3D 地圖網站

by 留白設計 Blank Design

把 EkoCheras Mall 專案打包成可重複使用的引擎。程式碼不寫死任何客戶：客戶專屬的東西只在 `site.config.json`、`seed/` 內容、`public/images/` 與 OpenStreetMap 資料（`public/map/osm.json`）。範本裡的資料是 EkoCheras 的完整範例，用來示範結構與通過測試，不是給新客戶直接用的。

## 查看開案流程

參數是 `guide` 時（`/3d-map guide`），只把 [references/intake.md](references/intake.md) 與本檔「流程」一節的內容整理給使用者看，不要建專案。

## 在 3d-map-starter repo 裡使用

如果 repo 根目錄有 `.starter`，就是由範本建立、還沒開案的客戶 repo：直接在根目錄改，不要新建資料夾、不要 `git init`，保留根目錄 `CLAUDE.md`。完成後刪掉 `.starter`。工作分支是 `dev`（沒有就從 `main` 建）。

不在範本 repo 裡時：先問使用者要不要用範本建立新 repo（`gh repo create <owner>/<name> --private --template blank-design-tw/3d-map-starter --clone`），得到同意才建。

雲端工作階段若沒有瀏覽器，先跑 `bash .claude/skills/3d-map/scripts/cloud-setup.sh`；雲端沒有 GPU，只能跑 `--smoke` 輕量巡檢，完整巡檢與截圖比對照實回報「要在有 GPU 的電腦跑」，不要假裝跑過。

## 流程

1. **收資料**：照 [references/intake.md](references/intake.md) 列出缺什麼。缺的資料照佔位規範處理，交付時列出。不要編造地址、營業時間、店家位置、出入口或緊急出口。
2. **設定 `site.config.json`**：照 [references/config.md](references/config.md) 填。`npm test` 會用 `site.config.schema.json` 檢查（必填、未知欄位、語言、座標、時區、logo 檔、樓層順序）。
3. **抓地圖**：`python3 scripts/fetch_osm.py` 依 `origin` 抓 OpenStreetMap，寫入 `public/map/osm.json`。確認主建物找得到（`main.osmName` 要和 OSM 名稱完全一樣；找不到就用原點上最大的建築）。主建物不在 OSM 時，先在 OSM 補上或請使用者提供平面輪廓，不要自己畫。
4. **換內容**：照 [references/content.md](references/content.md) 換掉 `seed/content/*.json`、`seed/places.json`、`public/images/logos/`、`public/images/logo.svg`、分享圖。拿掉 EkoCheras 專屬的東西：`site.config.json` 的 `extras`、`hideRoadLabels`、`test.sampleStore`；`src/map/sites/ekocheras.js` 只是範例，客戶需要 OSM 沒有的地標（空橋、連通道）才照它新增模組並登記在 `src/map/sites/index.js`。
5. **資料庫 migration**：`locales`、`floors` 的 code、`drive.starts` 和 EkoCheras 不同時，刪掉 `src/migrations/` 重新產生初始 migration（步驟與陷阱見 [references/setup.md](references/setup.md)）。
6. **本機驗證**：照 setup.md 起本機資料庫與 `npm run dev`，然後 `BASE_URL=http://localhost:3000 npm run verify`。第一次沒有截圖基準：先看過巡檢截圖（`tests/e2e/shots/`）確認畫面正確，再 `npm run test:visual -- --update` 核准。手機尺寸的截圖一定要逐張看。
7. **部署**：列出人工步驟（Supabase、Vercel、環境變數、GitHub workflow 權限、網域），使用者完成後推 `dev`，GitHub Actions 檢查通過才自動更新 `main`、Vercel 部署。
8. **交付**：照 [references/launch.md](references/launch.md) 的上線清單逐項確認，列出還缺的資料。

## 原則

- **手機優先**：大部分訪客用手機。每個改動都在 390×844、360×640、橫拿 844×390 確認；巡檢會檢查 pin 不被標籤擋、標籤不在按鈕底下。
- **高階工程標準**：架構分層（`src/map/core/` 純邏輯有單元測試、場景不 import 介面）、型別檢查、CI 把關、上線監控（後台 Site health）、效能預算（map.js 140 KB）。不為速度跳過檢查。
- **Payload 一律搭配 Supabase**：資料表在 `payload` schema，不放 `public`；檔案放私有 bucket。
- **不代辦人工步驟**：建 Supabase 專案、取金鑰、貼 Vercel 環境變數、GitHub 權限、DNS、信用卡，一律列給使用者。
- **授權**：地圖資料 OpenStreetMap（ODbL，要保留 About 裡的註明）；材質 Poly Haven / ambientCG（CC0）；樹 EZ-Tree（MIT）。不要用 Google Maps 的平面圖或街景照片建模（條款不允許）。

# 3d-map-starter

by 留白設計 Blank Design

網站 3D 空間製作的私有範本：把一棟建築（商場、園區、校園、飯店、辦公大樓）和周邊街區做成可以在手機上順暢操作的 3D 地圖網站，含 Payload 後台（Supabase）、多語系、店家／設施目錄、交通路線、出入口與緊急疏散、自動化測試與 CI。內含 `3d-map` skill。範本裡的資料是 EkoCheras Mall（吉隆坡）的完整範例。

1. 在 GitHub 按 **Use this template** 建立客戶的私有 repo。
2. 在雲端工作階段選擇該 repo，輸入 `/3d-map`，再貼上客戶資料（建築名稱與地址、樓層、店家清單、出入口、語言等，清單見 `/3d-map guide`）。
3. 完成後依 skill 列出的人工步驟：建立 Supabase 專案、到 Vercel 匯入 repo 並貼上環境變數、在 GitHub 開啟 Actions 的 workflow 權限、綁定網域。

雲端環境要跑瀏覽器檢查時，網路要能連 `dl.google.com`，setup script 填 `bash .claude/skills/3d-map/scripts/cloud-setup.sh`。

技術說明（架構、測試、發布流程）：[docs/engine.md](docs/engine.md)。

skill 的正本在這個 repo。修改後要同步到本機 `~/.claude/skills/3d-map`。

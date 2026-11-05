# 換內容（seed/）

第一次部署時 `scripts/seed.ts` 把這些檔案匯入後台（每個集合只在空的時候匯入）；之後內容一律在後台改。翻譯欄位的格式是 `{ "en": ..., "zh-TW": ..., ... }`，語言代碼要和 `site.config.json` 的 `locales` 一致，缺的語言會顯示英文。

| 檔案 | 內容 |
|---|---|
| `seed/content/stores.json` | `{ "items": [{ "name", "floor", "unit", "category", "logo", "featured", "pin": { "x", "y", "estimated" } }] }`。`floor` 是 `floors` 的 code；`category` 見 `src/collections/Stores.ts`；`logo` 放 `public/images/logos/<slug>.webp`（512 px，見下）；`pin` 是距原點的公尺（x 向東、y 向北），可在後台「在地圖上選位置」點選 |
| `seed/places.json` | `entrances`（`id`, `kind`, `name`, `x`, `y`, `z`）、`emergency`、`assembly`、`routes`（`mode: walk|drive`、走路的起點 `x y z` 或開車的 `start`、`to` 指向入口 id、`label`、`note`） |
| `seed/content/site.json` | 各語言的營業時間、地址、Email、交通說明、社群 |
| `facts.json`, `features.json`, `facilities.json`, `notices.json`, `topics.json` | 「為什麼來這裡」、精選、設施、公告、活動（格式照範例） |

## 店家 logo
- 來源用品牌或業主官網的原檔，不要用 Google 搜尋縮圖。
- 統一做成 512×512 WebP：裁掉白邊、置中、四周留 26 px 白邊。可用專案裡的 sharp：
  `sharp(src).flatten({background:'#fff'}).trim({background:'#fff',threshold:18}).resize(460,460,{fit:'contain',background:'#fff'}).extend({top:26,bottom:26,left:26,right:26,background:'#fff'}).webp({quality:84})`
- `public/images/` 的檔案瀏覽器會快取一天：換圖要換檔名，不要覆蓋同名檔案（後台上傳的圖不用，網址會自動帶版本）。

## 拿掉 EkoCheras 範例
`seed/` 全部換掉、`public/images/logos/` 清空換成客戶的、刪掉 `public/images/` 裡 EkoCheras 的插圖與分享圖、`site.config.json` 的 `extras` 與 `hideRoadLabels` 清掉；`src/map/sites/ekocheras.js` 和它在 `src/map/sites/index.js` 的登記一起刪除（除非要留作參考）。

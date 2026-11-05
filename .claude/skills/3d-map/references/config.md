# 填 site.config.json

欄位說明以 `site.config.schema.json` 為準；`npm test` 會檢查。下面是每個欄位怎麼找值。

| 欄位 | 怎麼填 |
|---|---|
| `name`, `logo` | 對外名稱；logo 放 `public/images/`，填 `/images/xxx.svg` |
| `timezone` | IANA 名稱，台灣 `Asia/Taipei` |
| `locales` | 語言按鈕的順序，第一個是預設。內建介面文字：`en`、`zh-TW`、`zh`、`ms`；其他語言要先在 `src/map/i18n.js` 加一組文字 |
| `origin` | 主建物中心的經緯度（Google 地圖右鍵複製）。`radius` 是要畫的周邊範圍，600–1200 公尺；越大越慢，手機上 900 左右剛好 |
| `main.osmName` | 跑完 `fetch_osm.py` 後在 `public/map/osm.json` 的 `buildings` 找主建物的 `name`；OSM 沒名字就留空，會用原點上最大的建築 |
| `main.label`, `main.height` | 地圖上橘色標籤文字；建築高度（公尺，含屋頂設備） |
| `main.facade`, `main.roof` | 外牆、屋頂顏色（看街景照片取色） |
| `main.signFacade` | 主招牌所在立面的兩個角點 `[[x,y],[x,y]]`（公尺，從 `osm.json` 主建物的 `p` 取相鄰兩點）。不填就用最長的立面 |
| `main.roofLabel` | 有屋頂花園才設 `true` |
| `floors` | 由下往上；`code` 存在每個店家上（之後改要 migration）；`z` 是該層 pin 的高度（約為樓板高度＋1.5 m）；`short` 是清單顯示的樓層名（B1、1F）；`admin` 是後台選單名稱 |
| `drive.road`, `drive.roadType` | 開車路線起點所在的主要道路名稱與類型（`osm.json` 的 `roads` 裡找 `name` 和 `t`，例 `trunk`、`primary`） |
| `drive.starts` | 後台「開車起點」的選項，值結尾要是 `-north` 或 `-south`（起點在主要道路的北端或南端） |
| `hideRoadLabels` | 不想顯示名稱的道路（例如私人連通道） |
| `extras` | OSM 沒有的地標模組（`src/map/sites/<名稱>.js`），沒有就不填 |
| `aboutFacts`, `text.<語言>.about` | 關於我們的四個數字與文案；`factLabels` 順序對應 `aboutFacts` |
| `text.<語言>` | `loading`、`why`、`storeText`（可用 `{name}` `{floor}` `{unit}`）、`agree`（可用 `{name}`）、`floors`（各語言的樓層名稱） |
| `seo` | 第一次建立時寫進後台的 SEO 預設；之後在後台改 |
| `test.sampleStore`, `test.liveUrl` | 巡檢用來搜尋與分享的店家；正式網址（巡檢預設檢查這裡） |

改完跑 `npm test`；改 `locales`、`floors` 的 code、`drive.starts` 要重新產生 migration（見 setup.md）。

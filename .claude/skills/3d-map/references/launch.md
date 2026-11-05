# 上線清單

- [ ] 後台「SEO & analytics」：取消「Hide from search engines」、填正式網址、GA4 ID、Search Console 驗證碼
- [ ] 分享圖（1200×630）與各語言標題、描述
- [ ] 聯絡表單接上業主的信箱或 CRM（目前只顯示感謝訊息，`src/map/content.js` 的 `openPop`）
- [ ] 出入口、緊急出口、集合點換成業主核准的平面圖與疏散圖；移除「示意」字樣
- [ ] 推估的店家位置（`estimated`）用官方平面圖校正
- [ ] 營業時間、地址、電話、社群連結與官方一致
- [ ] 圖片授權：店家 logo 來自業主或品牌；照片有授權或是業主提供
- [ ] OpenStreetMap 註明保留在「關於我們」
- [ ] 網域與 HTTPS；`NEXT_PUBLIC_SERVER_URL`、`test.liveUrl` 改成正式網址
- [ ] 正式網址跑 `npm run verify` 全部通過；手機實機（新舊各一支）滑過一遍
- [ ] 後台「Settings → Site health」沒有錯誤回報
- [ ] 交給業主：後台網址、編輯帳號建立方式、常用操作（換店家、活動、營業時間）

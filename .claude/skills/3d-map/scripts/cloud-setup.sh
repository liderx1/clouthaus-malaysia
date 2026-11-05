#!/bin/bash
# 在 Ubuntu 雲端環境安裝 Chrome，供瀏覽器巡檢（tests/e2e/sweep.mjs）使用。需要可連 dl.google.com 的網路。
# 雲端機器沒有 GPU，3D 用 CPU 繪製約每秒 1 格：只能跑輕量巡檢（--smoke）；完整巡檢與截圖比對要在有 GPU 的電腦跑。
set -e
command -v google-chrome >/dev/null && exit 0
SUDO=$([ "$(id -u)" = 0 ] || echo sudo)
curl -fsSL -o /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
$SUDO apt-get update -qq
$SUDO apt-get install -y -qq /tmp/chrome.deb

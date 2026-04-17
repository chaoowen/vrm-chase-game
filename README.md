# 🦈 鯊魚人逃脫大作戰 (Shark Escape)

這是一個基於 **Three.js** 與 **Web-VRM** 技術開發的網頁版 3D 逃脫小遊戲。玩家將扮演「鯊魚人」，在充滿「外星殭屍」的禁區中生存。

## 🎮 遊戲連結
[點此開始遊戲](https://你的使用者名稱.github.io/你的倉庫名稱/)

## 🕹️ 操作說明
* **W / A / S / D**：控制鯊魚人移動。
* **目標**：避開綠色的外星殭屍，一旦觸碰即遊戲結束。

## 🛠️ 技術棧
* **渲染引擎**: [Three.js](https://threejs.org/)
* **模型格式**: VRM (使用 `@pixiv/three-vrm`)
* **託管平台**: GitHub Pages

## 📂 資源說明
* `SharkPerson.vrm`: 玩家控制的主角模型。
* `CoolAlien.vrm`: 敵對 NPC 殭屍模型。

## 🚀 本地開發
由於瀏覽器 CORS 安全限制，請使用本地伺服器開啟 `index.html`：
1. 使用 VS Code 的 **Live Server** 擴充功能。
2. 或使用 Python: `python -m http.server 8000`。
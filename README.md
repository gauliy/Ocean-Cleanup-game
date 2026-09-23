# Ocean Cleanup Protect the Blue

Ocean Cleanup 是一个海洋环保主题的 HTML5 Canvas 浏览器游戏。玩家在 60 秒内驾驶清理船收集海洋垃圾，同时避开海洋动物和礁石。

## 运行方法

项目不需要安装依赖。推荐在项目根目录启动静态服务器：

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

也可以直接双击 `index.html` 运行。使用本地服务器更稳定。

## 操作

- 方向键或 WASD：移动
- P：暂停或继续
- Pause 按钮：暂停
- 声音按钮：开启或关闭音效

## 游戏规则

- 时间：60 秒
- 生命：3
- 收集垃圾获得 10 至 25 分
- 碰到动物或礁石扣 1 点生命和 10 分
- 连续收集 5 个垃圾奖励 20 分
- 时间归零或生命归零时结束
- 浏览器保存历史最高分

## 文件结构

```text
OceanCleanup/
├── index.html
├── PROJECT.md
├── DESIGN.md
├── TEST_REPORT.md
├── README.md
├── css/
│   ├── style.css
│   └── layout-fixes.css
├── js/
│   └── game.js
└── assets/images/
    └── ocean-background.png
```

## 技术栈

- HTML
- CSS
- 原生 JavaScript
- HTML5 Canvas
- Web Audio API
- localStorage

界面文字为英文，项目说明文档为中文。

# Ocean Cleanup Protect the Blue

## 项目概述

Ocean Cleanup 是一个海洋环保主题的电脑端浏览器游戏。玩家控制清理船，在 60 秒内收集海洋垃圾，同时避开海洋动物和礁石。游戏通过分数、生命、连击、成绩等级和环保知识，让玩家了解海洋垃圾造成的影响。

英文介绍：

> Ocean Cleanup is a browser game where players collect marine waste, avoid sea animals and learn how everyday rubbish affects ocean ecosystems.

目标用户包括中学生、大学生、环保课程参与者和 Hackathon 现场体验者。游戏应让新玩家在一分钟内理解规则，并适合 3 至 5 分钟的课堂展示。

## 核心流程

1. 玩家在首页阅读规则并点击 `Start Game`。
2. 使用方向键或 WASD 控制清理船。
3. 收集垃圾得分，避开动物和礁石。
4. 连续收集垃圾可获得连击奖励。
5. 60 秒结束或生命值归零时结束游戏。
6. 结束界面显示成绩、最高分和环保知识。

项目使用一个 `index.html`，由 JavaScript 切换四种状态：

- `ready`
- `playing`
- `paused`
- `gameover`

## 操作方式

- `ArrowLeft` 或 `A`：向左
- `ArrowRight` 或 `D`：向右
- `ArrowUp` 或 `W`：向上
- `ArrowDown` 或 `S`：向下
- `P`：暂停或继续
- 页面按钮：`Start Game`、`Pause`、`Resume`、`Play Again`、`Back to Home`

玩家不能移动到 Canvas 区域外。项目面向电脑端，不要求触屏控制。

## 游戏对象

### 垃圾

| ID | 英文名称 | 分数 |
| --- | --- | ---: |
| `plastic-bottle` | Plastic Bottle | 10 |
| `plastic-bag` | Plastic Bag | 15 |
| `metal-can` | Metal Can | 10 |
| `fishing-net` | Fishing Net | 25 |

### 海洋动物

| ID | 英文名称 | 伤害 | 扣分 |
| --- | --- | ---: | ---: |
| `sea-turtle` | Sea Turtle | 1 | 10 |
| `fish` | Fish | 1 | 10 |
| `dolphin` | Dolphin | 1 | 10 |

海洋动物不是敌人。碰撞后显示 `Be careful! Protect marine animals.`。

### 障碍物

| ID | 英文名称 | 伤害 | 扣分 |
| --- | --- | ---: | ---: |
| `rock` | Rock | 1 | 10 |

## 固定规则

- 游戏时间：60 秒
- 初始生命：3
- 初始分数：0
- 分数最低为 0
- 连续收集 5 个垃圾：额外增加 20 分
- 碰到动物或礁石：扣 1 点生命、扣 10 分、连击清零
- 受伤保护时间：1000 毫秒
- 同一个对象只能结算一次，结算后立即移除
- 最高分保存在 `localStorage`，键名为 `oceanCleanup.highScore`

## 难度变化

| 剩余时间 | 难度 |
| --- | --- |
| 60 至 41 秒 | 基础速度和生成频率 |
| 40 至 21 秒 | 对象移动速度提高 |
| 20 至 0 秒 | 对象生成更快，礁石出现频率提高 |

具体速度值由阶段 4 调试，但不得改变三档结构。

## 游戏结束与统计

`timeLeft` 变为 0 或 `lives` 变为 0 时只触发一次结束。结束后停止生成、移动、碰撞和计时，并显示：

- `score`
- `collectedWaste`
- `avoidedAnimals`
- `highestCombo`
- `highScore`
- 成绩等级和一条环保知识

## 成绩等级

| 分数 | 等级 | 英文评价 |
| --- | --- | --- |
| 0 至 99 | Beginner Cleaner | Every piece of waste removed helps the ocean. |
| 100 至 199 | Ocean Helper | Great work! You made the ocean cleaner. |
| 200 至 299 | Sea Protector | Excellent! Marine animals are safer because of you. |
| 300 及以上 | Ocean Guardian | Amazing! You are a true guardian of the ocean. |

## 环保知识

- Plastic waste can remain in the ocean for hundreds of years.
- Discarded fishing nets can trap turtles, fish and other marine animals.
- Using a reusable bottle helps reduce plastic waste.
- Never leave rubbish on beaches or near rivers.
- Much of the rubbish found in the ocean comes from land.

## 技术栈

- HTML、CSS、原生 JavaScript
- HTML5 Canvas，逻辑尺寸 960 × 540
- `requestAnimationFrame` 游戏循环
- `localStorage` 只保存最高分

不使用后端、数据库、前端框架、构建工具或外部 API。

## 必须完成

- 首页和英文规则
- 开始、暂停、继续、重新开始和返回首页
- 键盘四方向移动及边界限制
- 4 种垃圾、至少 2 种动物（最终目标 3 种）和礁石
- 对象随机生成、移动、碰撞和一次性结算
- 分数、生命、60 秒倒计时和连击奖励
- 三档难度变化
- 游戏结束统计、成绩等级和环保知识
- `localStorage` 最高分
- 所有玩家可见文字使用英文

## 可选功能

核心功能全部通过测试后，才可以添加音效、背景音乐、静音、粒子效果、浮标减速或更丰富的动画。

## 明确不做

登录、服务器、数据库、在线排行榜、多人游戏、3D、复杂剧情、开放地图、手机触控、外部 API、商店和付费系统。

## 验收标准

1. 页面打开后没有 JavaScript 错误。
2. 点击开始后从 60 秒计时。
3. 两套按键均可控制船且不会越界。
4. 垃圾、动物和礁石持续生成与移动。
5. 所有得分、伤害、扣分和连击符合固定规则。
6. 同一对象不重复结算，受伤保护时间生效。
7. 暂停后生成、移动、碰撞和计时全部停止。
8. 两种结束条件均只触发一次。
9. 重新开始可完整重置本局状态。
10. 最高分刷新页面后仍保留。
11. 结束界面显示规定统计和英文环保知识。
12. 新成员可以按照 README 运行项目。

## 七个开发阶段

| 阶段 | 角色 | 主要交付物 |
| --- | --- | --- |
| 1 | 产品策划 | 产品、数据、README 和交接文档 |
| 2 | UI UX 与视觉设计 | `DESIGN.md`、状态界面和素材规范 |
| 3 | 基础前端与游戏框架 | HTML、CSS、Canvas、状态、控制和基础循环 |
| 4 | 核心游戏逻辑 | 生成、碰撞、计分、生命、计时和难度 |
| 5 | 内容与完整集成 | 正式素材、完整数据、环保知识和最高分 |
| 6 | 测试与修复 | `TEST_REPORT.md`、稳定版本和已知问题 |
| 7 | 最终优化与展示 | 最终项目、证据、PPT 和演示稿 |

# F1 赛车竞速游戏 - Next.js Frontend

基于 Next.js 14 + React + TypeScript 构建的 Telegram Mini App 前端。

## 特性

- ✅ Next.js 14 (App Router)
- ✅ React 18
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ TON Connect 集成
- ✅ Telegram Mini App 支持
- ✅ 响应式设计
- ✅ 移动端优化

## 安装

```bash
cd frontend
npm install
```

## 开发

```bash
npm run dev
```

访问 http://localhost:3000

## 构建

```bash
npm run build
npm start
```

## Telegram Mini App 配置

### 1. 设置环境变量

复制 `.env.local.example` 为 `.env.local` 并填入合约地址：

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS_HERE
```

### 2. 配置 manifest.json

更新 `public/tonconnect-manifest.json`：

```json
{
  "url": "https://your-telegram-bot-domain.com",
  "name": "F1 赛车竞速游戏",
  "iconUrl": "https://your-telegram-bot-domain.com/icon.png"
}
```

### 3. Telegram Bot 设置

在 [@BotFather](https://t.me/BotFather) 中设置：

1. 创建 Bot 或使用现有 Bot
2. 使用 `/newapp` 创建 Mini App
3. 设置 Web App URL 为你的部署地址
4. 上传图标和描述

## 项目结构

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页
│   └── globals.css         # 全局样式
├── components/             # React 组件
│   ├── Header.tsx          # 头部（钱包连接）
│   ├── GameStatus.tsx     # 游戏状态
│   ├── RaceTrack.tsx       # 赛车展示
│   ├── ItemSection.tsx     # 道具购买
│   ├── MyData.tsx          # 我的数据
│   ├── FundDistribution.tsx # 资金分配
│   ├── Leaderboard.tsx     # 排行榜
│   └── TonConnectProvider.tsx # TON Connect 提供者
├── hooks/                  # 自定义 Hooks
│   ├── useGameState.ts     # 游戏状态管理
│   └── useTelegram.ts      # Telegram Web App SDK
├── public/                  # 静态资源
│   └── tonconnect-manifest.json
└── package.json
```

## Telegram Mini App 特性

### 自动适配

- 自动检测 Telegram 环境
- 使用 Telegram 主题颜色
- 支持 Telegram 的返回按钮
- 支持触觉反馈

### TON Connect 集成

- 在 Telegram 中自动使用 TON Connect
- 支持 Telegram Wallet
- 无缝的钱包连接体验

## 部署

### Vercel (推荐)

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 设置环境变量
4. 部署

### 其他平台

确保支持：
- Node.js 18+
- 静态文件服务
- HTTPS（TON Connect 要求）

## 注意事项

1. **HTTPS 必需**：TON Connect 和 Telegram Mini App 都需要 HTTPS
2. **域名配置**：确保 manifest.json 中的 URL 正确
3. **CORS**：确保允许 Telegram 的域名访问
4. **移动端优化**：已针对移动端进行优化

## 开发建议

- 使用 TypeScript 确保类型安全
- 使用 React Hooks 管理状态
- 组件化开发，便于维护
- 使用 Tailwind CSS 快速构建 UI


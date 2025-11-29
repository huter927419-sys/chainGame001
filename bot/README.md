# Telegram Bot for TON Racing Game

Telegram Bot 服务器，用于与 TON 赛车游戏合约交互，提供游戏状态查询、排行榜查看等功能。

## 功能特性

- ✅ 游戏状态查询 (`/status`)
- ✅ 排行榜查看 (`/rankings`)
- ✅ 玩家信息查询 (`/myinfo`)
- ✅ Mini App 快速入口
- ✅ 实时游戏数据展示
- ✅ 推荐链接生成

## 安装

```bash
cd bot
npm install
```

## 配置

1. 复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入以下信息：

```env
# Telegram Bot Token (从 @BotFather 获取)
BOT_TOKEN=your_bot_token_here

# TON 合约地址
CONTRACT_ADDRESS=your_contract_address_here

# TON 网络 (testnet 或 mainnet)
TON_NETWORK=testnet

# TON API Key (可选，用于 RPC 访问)
TON_API_KEY=your_ton_api_key_here

# Mini App URL
MINI_APP_URL=https://your-miniapp-url.com
```

## 获取 Bot Token

1. 在 Telegram 中搜索 [@BotFather](https://t.me/BotFather)
2. 发送 `/newbot` 命令
3. 按照提示设置 Bot 名称和用户名
4. 获取 Bot Token 并填入 `.env` 文件

## 运行

### 开发模式

```bash
npm run dev
```

### 生产模式

```bash
npm run build
npm start
```

## Bot 命令

- `/start` - 开始使用 Bot，显示欢迎信息和快速入口
- `/help` - 显示帮助信息
- `/status` - 查看当前游戏状态（玩家数、道具数、资金池等）
- `/rankings` - 查看排行榜（前三名）
- `/myinfo` - 查看我的游戏数据

## 项目结构

```
bot/
├── src/
│   ├── index.ts              # Bot 主入口
│   ├── contract/
│   │   └── ContractClient.ts # 合约交互客户端
│   ├── commands/
│   │   └── GameCommands.ts   # 游戏命令处理
│   └── utils/
│       └── format.ts         # 格式化工具函数
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 部署

### 使用 PM2

```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name racegame-bot
pm2 save
pm2 startup
```

### 使用 Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## 注意事项

1. **安全性**：
   - 不要将 `.env` 文件提交到 Git
   - 使用环境变量管理敏感信息
   - 定期更新依赖包

2. **性能**：
   - Bot 会频繁调用合约，注意 RPC 限制
   - 考虑使用缓存减少重复查询
   - 监控 Bot 响应时间

3. **错误处理**：
   - Bot 会自动捕获错误并回复用户
   - 检查日志文件排查问题
   - 设置监控和告警

## 开发

### 添加新命令

1. 在 `src/index.ts` 中添加命令处理：

```typescript
bot.command('newcommand', async (ctx: Context) => {
  // 处理命令逻辑
})
```

2. 如需调用合约，在 `ContractClient` 中添加方法

3. 更新 `README.md` 文档

## 许可证

MIT


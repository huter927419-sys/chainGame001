# 部署指南

## 前置要求

1. Node.js 16+ 
2. npm 或 yarn
3. TON钱包（Tonkeeper等）
4. TON测试网或主网访问

## 步骤1: 安装依赖

```bash
npm install
```

## 步骤2: 准备图片资源

将F1赛车图片放置到 `assets/` 目录：
- `car-red.png` - 红色F1赛车
- `car-neon.png` - 紫色/霓虹色F1赛车

如果没有图片，可以使用emoji或SVG作为占位符。

## 步骤3: 编译和部署合约

### 选项A: 使用Tact（推荐）

```bash
# 安装Tact编译器
npm install -g @tact-lang/compiler

# 编译合约
cd contracts
tact RaceGame.tact

# 使用TON开发工具部署
# 参考: https://docs.tact-lang.org/
```

### 选项B: 使用FunC

```bash
# 使用TON开发工具链编译FunC合约
# 参考: https://ton.org/docs/develop/smart-contracts/
```

## 步骤4: 更新合约地址

部署合约后，更新 `app.js` 中的合约地址：

```javascript
const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
```

## 步骤5: 配置TON Connect

更新 `tonconnect-manifest.json`：

```json
{
    "url": "https://your-domain.com",
    "name": "F1 赛车竞速游戏",
    "iconUrl": "https://your-domain.com/icon.png"
}
```

## 步骤6: 启动前端

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
```

构建文件在 `dist/` 目录，可以部署到任何静态托管服务。

## 步骤7: 部署前端

### 选项A: Vercel

```bash
npm install -g vercel
vercel
```

### 选项B: Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### 选项C: GitHub Pages

1. 将代码推送到GitHub
2. 在仓库设置中启用GitHub Pages
3. 选择 `dist` 目录作为源

## 测试清单

- [ ] 钱包连接功能正常
- [ ] 游戏状态显示正确
- [ ] 倒计时功能正常
- [ ] 道具购买功能正常
- [ ] 价格计算正确（椭圆算法）
- [ ] 排行榜显示正确
- [ ] 图片资源加载正常

## 常见问题

### 1. TON Connect连接失败

- 检查manifest.json配置是否正确
- 确保使用HTTPS（生产环境）
- 检查钱包是否支持TON Connect

### 2. 合约调用失败

- 检查合约地址是否正确
- 确保有足够的TON余额
- 检查消息格式是否正确

### 3. 图片不显示

- 检查图片路径是否正确
- 确保图片文件存在
- 检查浏览器控制台错误

## 安全建议

1. 在生产环境使用HTTPS
2. 验证合约代码
3. 设置合理的gas限制
4. 定期检查合约余额
5. 实现访问控制和权限管理


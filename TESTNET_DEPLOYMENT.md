# GameBet 测试网部署指南

本文档提供详细的步骤，帮助你将 GameBet 智能合约部署到 TON 测试网（Testnet）。

## 目录

1. [前置要求](#前置要求)
2. [环境准备](#环境准备)
3. [合约编译](#合约编译)
4. [测试网部署](#测试网部署)
5. [前端配置](#前端配置)
6. [测试验证](#测试验证)
7. [常见问题](#常见问题)

---

## 前置要求

### 系统要求
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### 必需工具
- TON CLI 或 Blueprint
- TON Connect SDK
- 测试网钱包（推荐 Tonkeeper 或 TON Wallet）

### 测试网 TON
你需要一些测试网 TON 来部署合约和支付 gas 费用：
- 方法1: 使用 [TON Testnet Faucet](https://t.me/testgiver_ton_bot)
- 方法2: 使用 [TON Community Faucet](https://faucet.ton.org/)

---

## 环境准备

### 1. 克隆并安装依赖

```bash
cd /Users/wanglei/gamebet

# 安装前端依赖
cd frontend
npm install --legacy-peer-deps

# 返回根目录
cd ..
```

### 2. 配置环境变量

在 `frontend` 目录创建 `.env.local` 文件：

```bash
cd frontend
cat > .env.local << EOF
# TON 测试网配置
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_RPC_ENDPOINT=https://testnet.toncenter.com/api/v2/jsonRPC

# 合约地址（部署后填写）
NEXT_PUBLIC_CONTRACT_ADDRESS=

# 可选：Analytics
NEXT_PUBLIC_ENABLE_ANALYTICS=false
EOF
```

---

## 合约编译

### 1. 安装 Tact 编译器

```bash
# 如果使用 Blueprint
npm install -g @ton/blueprint

# 或使用 Tact CLI
npm install -g @tact-lang/compiler
```

### 2. 编译合约

#### 使用 Blueprint（推荐）

```bash
cd contracts

# 初始化 Blueprint 项目（如果还没有）
npx blueprint create

# 编译合约
npx blueprint build
```

编译后的文件会生成在 `contracts/build/` 目录。

#### 使用 Tact CLI

```bash
cd contracts

# 编译合约
tact --config tact.config.json
```

### 3. 验证编译输出

确认以下文件已生成：
- `RaceGame.compiled.json` - 合约字节码
- `RaceGame.pkg` - 合约包
- `RaceGame.ts` - TypeScript 包装器

---

## 测试网部署

### 方法 1: 使用 Blueprint（推荐）

#### 步骤 1: 准备部署脚本

创建 `contracts/scripts/deployRaceGame.ts`:

```typescript
import { toNano } from '@ton/core';
import { RaceGame } from '../wrappers/RaceGame';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const raceGame = provider.open(
        await RaceGame.fromInit(provider.sender().address!)
    );

    await raceGame.send(
        provider.sender(),
        {
            value: toNano('0.05'), // 部署费用
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(raceGame.address);

    console.log('合约已成功部署到:', raceGame.address);
    console.log('合约地址 (User-Friendly):', raceGame.address.toString());
    console.log('合约地址 (Raw):', raceGame.address.toRawString());

    // 开始游戏
    console.log('\n开始游戏...');
    await raceGame.send(
        provider.sender(),
        {
            value: toNano('0.01'),
        },
        'start'
    );

    console.log('游戏已开始！');
}
```

#### 步骤 2: 执行部署

```bash
cd contracts

# 部署到测试网
npx blueprint run deployRaceGame --testnet
```

部署过程中会提示：
1. 选择钱包进行部署
2. 确认交易
3. 等待合约部署完成

#### 步骤 3: 保存合约地址

部署成功后，你会看到类似输出：

```
合约已成功部署到: EQD...abc
合约地址 (User-Friendly): EQD4FPq1RpL...
合约地址 (Raw): 0:f814fab...
游戏已开始！
```

**重要**: 复制合约地址并保存到 `frontend/.env.local`：

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=EQD4FPq1RpL... # 替换为你的合约地址
```

---

### 方法 2: 使用 TON CLI

#### 步骤 1: 安装 TON CLI

```bash
# macOS
brew install ton

# Linux
wget https://ton.org/ton-cli
chmod +x ton-cli
```

#### 步骤 2: 创建钱包

```bash
ton wallet create testnet_wallet

# 保存助记词和地址
ton wallet show testnet_wallet
```

#### 步骤 3: 获取测试币

向钱包地址发送测试 TON（使用上面提到的水龙头）。

#### 步骤 4: 部署合约

```bash
cd contracts

# 使用 TON CLI 部署
ton contract deploy \
  --wallet testnet_wallet \
  --network testnet \
  --file build/RaceGame.compiled.json \
  --init-data '{"owner": "你的钱包地址"}'
```

---

## 前端配置

### 1. 更新合约地址

编辑 `frontend/.env.local`，填入部署的合约地址：

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=EQD... # 你的合约地址
```

### 2. 更新合约集成代码

如果需要，更新 `frontend/hooks/useGameContract.ts` 中的合约 ABI 和地址。

### 3. 启动开发服务器

```bash
cd frontend
npm run dev
```

访问 `http://localhost:3000` 查看前端。

---

## 测试验证

### 1. 连接钱包

1. 打开前端页面
2. 点击 "连接钱包"
3. 选择 Tonkeeper 或其他支持的钱包
4. 确认连接

### 2. 基本功能测试

#### 测试 1: 购买道具

```bash
# 在浏览器控制台或通过 UI
1. 确保钱包有足够测试 TON（至少 1.1 TON）
2. 选择购买策略（0-3）
3. 点击 "购买道具"
4. 在钱包中确认交易
5. 等待交易确认
6. 查看道具是否添加到背包
```

#### 测试 2: 使用道具

```bash
1. 在背包中选择一个道具
2. 选择目标车辆（Car1 或 Car2）
3. 点击 "使用道具"
4. 确认交易
5. 查看车辆速度变化
```

#### 测试 3: 推荐系统

```bash
# 使用两个钱包测试
1. 钱包A注册名字并购买道具
2. 钱包B购买道具时填写钱包A地址作为推荐人
3. 钱包B注册名字
4. 钱包C购买道具时填写钱包B地址作为推荐人
5. 钱包C注册名字
6. 检查钱包B的推荐统计
```

#### 测试 4: 提现

```bash
1. 购买道具获得返现
2. 点击 "提现奖励"
3. 确认交易
4. 检查钱包余额增加
```

### 3. 使用区块链浏览器验证

访问 [TON 测试网浏览器](https://testnet.tonscan.org/)，输入你的合约地址查看：

- 合约状态
- 交易历史
- 余额
- 方法调用

---

## 合约交互示例

### 使用 JavaScript SDK

```javascript
import { TonClient, Address, toNano } from '@ton/ton';
import { RaceGame } from './contracts/RaceGame';

// 连接到测试网
const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
});

// 打开合约
const contractAddress = Address.parse('EQD...');
const contract = client.open(RaceGame.create(contractAddress));

// 获取游戏状态
const gameState = await contract.getGameState();
console.log('游戏状态:', gameState);

// 购买道具
await contract.send(
    sender,
    {
        value: toNano('1.1'),
    },
    {
        $$type: 'BuyItemMessage',
        referrer: null,
        strategy: 1n, // 平衡策略
    }
);
```

---

## 监控和调试

### 1. 查看合约日志

```bash
# 使用 Blueprint
npx blueprint run getContractLogs --testnet --address EQD...
```

### 2. 查看交易详情

访问: `https://testnet.tonscan.org/tx/{transaction_hash}`

### 3. 常见错误排查

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Insufficient balance` | 支付金额不足 | 增加发送的 TON 数量 |
| `Game not in progress` | 游戏未开始 | 调用 `start` 方法开始游戏 |
| `Maximum players reached` | 玩家数量已达上限 | 等待下一轮游戏 |
| `Invalid strategy` | 策略参数无效 | 使用 0-3 之间的策略值 |

---

## 常见问题

### Q1: 部署失败怎么办？

**A**: 检查以下几点：
1. 钱包是否有足够的测试 TON（至少 0.1 TON）
2. 合约代码是否编译成功
3. 网络连接是否正常
4. 钱包是否连接到测试网

### Q2: 如何重新部署合约？

**A**:
```bash
# 删除旧的编译产物
rm -rf contracts/build

# 重新编译和部署
npx blueprint build
npx blueprint run deployRaceGame --testnet
```

### Q3: 如何查看合约余额？

**A**:
```bash
# 使用 Blueprint
npx blueprint run getBalance --testnet --address EQD...

# 或访问区块链浏览器
# https://testnet.tonscan.org/address/EQD...
```

### Q4: 测试网 TON 不够怎么办？

**A**:
- 使用 Telegram Bot: [@testgiver_ton_bot](https://t.me/testgiver_ton_bot)
- 每24小时可以领取一次
- 如果机器人无响应，尝试 [TON Community Faucet](https://faucet.ton.org/)

### Q5: 如何更新已部署的合约？

**A**:
TON 智能合约部署后无法直接更新。你需要：
1. 部署新版本合约
2. 更新前端配置中的合约地址
3. 如果需要迁移数据，需要额外的迁移脚本

---

## 部署检查清单

部署前请确认：

- [ ] 合约代码已编译成功
- [ ] 已修复所有编译错误和警告
- [ ] 单元测试已通过（运行 `npm test`）
- [ ] 钱包已连接到测试网
- [ ] 钱包有足够的测试 TON（建议 1+ TON）
- [ ] 环境变量已正确配置
- [ ] 已备份钱包助记词
- [ ] 已准备好记录合约地址

部署后请验证：

- [ ] 合约地址可在区块链浏览器查看
- [ ] 合约余额正常
- [ ] `getGameState` 方法可正常调用
- [ ] 游戏状态已开始（state = 1）
- [ ] 前端可以连接到合约
- [ ] 可以成功购买道具
- [ ] 可以成功使用道具
- [ ] 可以成功提现

---

## 进阶配置

### 多签部署（生产环境推荐）

对于生产环境，建议使用多签钱包部署：

```bash
# 创建多签钱包
ton wallet create multisig --signers 3 --threshold 2

# 使用多签钱包部署
npx blueprint run deployRaceGame --testnet --wallet multisig
```

### CI/CD 自动化部署

创建 `.github/workflows/deploy-testnet.yml`:

```yaml
name: Deploy to Testnet

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd contracts
          npm install

      - name: Build contracts
        run: |
          cd contracts
          npx blueprint build

      - name: Deploy to testnet
        env:
          WALLET_MNEMONIC: ${{ secrets.TESTNET_WALLET_MNEMONIC }}
        run: |
          cd contracts
          npx blueprint run deployRaceGame --testnet
```

---

## 下一步

部署成功后，你可以：

1. **邀请测试用户**: 分享前端链接给朋友测试
2. **监控性能**: 观察 gas 消耗和交易速度
3. **收集反馈**: 记录用户遇到的问题
4. **准备主网部署**: 参考 `MAINNET_DEPLOYMENT.md`（待创建）

---

## 资源链接

- [TON 官方文档](https://docs.ton.org/)
- [Tact 语言文档](https://docs.tact-lang.org/)
- [TON Blueprint](https://github.com/ton-org/blueprint)
- [TON Testnet 浏览器](https://testnet.tonscan.org/)
- [TON Connect 文档](https://docs.ton.org/develop/dapps/ton-connect)

---

## 技术支持

如遇到问题：

1. 查看[常见问题](#常见问题)
2. 检查[GitHub Issues](https://github.com/ton-blockchain/ton/issues)
3. 加入 [TON 开发者 Telegram 群](https://t.me/tondev)
4. 查看项目 README.md 获取更多信息

---

**祝部署顺利！🚀**

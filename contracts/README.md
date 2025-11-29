# 智能合约说明

本项目包含两个版本的智能合约：

## 合约文件

1. **RaceGame.tact** - Tact语言版本（推荐）
   - 更现代、更易读的语法
   - 类型安全
   - 更好的开发体验

2. **RaceGame.fc** - FunC语言版本
   - 传统TON合约语言
   - 更底层，性能优化空间更大

## 合约功能

### 游戏状态管理
- `state`: 0=未开始, 1=进行中, 2=已结束
- `startTime`: 游戏开始时间
- `endTime`: 游戏结束时间（开始时间 + 300秒）
- `totalPlayers`: 总玩家数
- `totalItems`: 总道具数

### 主要操作

1. **开始游戏** (`start`)
   - 操作码: `0x7374617274` ("strt")
   - 只有合约所有者可以调用
   - 设置游戏状态为"进行中"，持续5分钟

2. **购买道具** (`buy_item`)
   - 操作码: `0x62796974` ("byit")
   - 玩家发送TON到合约
   - 价格使用椭圆算法计算
   - 随机生成道具效果（1X/2X/5X/10X，加速或减速）
   - 更新玩家数据

3. **结束游戏** (`end_game`)
   - 操作码: `0x656e6467` ("endg")
   - 只有合约所有者可以调用
   - 计算并保存前三名排名

### 椭圆算法

道具价格计算公式：
```
price = base_price * (1 + (item_count / max_items)^2)
```

其中：
- `base_price` = 1 TON (1e9 nanoTON)
- `max_items` = 1000
- `item_count` = 当前已购买的道具总数

### 排名算法

排名基于以下条件：
1. 只考虑正向效果（boost > 0）的玩家
2. 综合得分 = 投入金额 * (1 + boost/100)
3. 按得分降序排列
4. 取前三名

## 部署说明

### 使用Tact部署

1. 安装Tact编译器：
```bash
npm install -g @tact-lang/compiler
```

2. 编译合约：
```bash
tact RaceGame.tact
```

3. 部署到测试网或主网

### 使用FunC部署

1. 使用TON开发工具链编译
2. 部署到网络

## 合约交互

### 前端调用示例

```javascript
// 购买道具
const message = {
    address: CONTRACT_ADDRESS,
    amount: itemPrice.toString(),
    payload: buildBuyItemMessage() // base64编码的BOC
};

await tonConnectUI.sendTransaction({
    messages: [message],
    validUntil: Math.floor(Date.now() / 1000) + 300
});
```

## 注意事项

1. 合约需要设置所有者地址
2. 确保合约有足够的余额处理退款
3. 游戏结束后需要手动调用`end_game`来计算排名
4. 建议添加事件日志以便前端监听


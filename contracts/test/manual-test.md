# RaceGame 合约手动测试指南

## 测试环境准备

1. **安装 Tact 编译器**
```bash
npm install -g @tact-lang/compiler
```

2. **编译合约**
```bash
cd contracts
tact RaceGame.tact
```

3. **部署到测试网**
- 使用 TON 测试网
- 准备测试钱包和测试币

## 测试用例

### 1. 初始化测试

**测试步骤：**
1. 部署合约
2. 调用 `getGameState()` 检查初始状态
3. 调用 `getCar1()` 和 `getCar2()` 检查车辆初始状态

**预期结果：**
- 游戏状态：state = 0（未开始）
- 车辆1和车辆2速度都是100
- 所有池子余额为0

### 2. 开始游戏测试

**测试步骤：**
1. 使用所有者地址调用 `start`
2. 检查游戏状态
3. 检查车辆状态

**预期结果：**
- 游戏状态：state = 1（进行中）
- 车辆速度重置为100
- 预留池资金转入奖池（如果有）

**测试代码：**
```tact
// 发送消息
receive("start")
```

### 3. 购买道具测试

**测试步骤：**
1. 开始游戏
2. 购买道具给车辆1（carId = 1）
3. 检查车辆1速度变化
4. 检查玩家数据
5. 检查资金分配

**预期结果：**
- 车辆1速度改变（取决于随机效果）
- 玩家数据更新（itemCount + 1）
- 资金按比例分配到三个池子

**测试代码：**
```tact
// 购买道具给车辆1
receive("buy_item", BuyItemMessage { carId: 1 })
```

### 4. 双车速度测试

**测试步骤：**
1. 给车辆1购买多个道具
2. 给车辆2购买多个道具
3. 检查两个车的速度
4. 检查速度差距
5. 检查领先车辆

**预期结果：**
- 每个车的速度 = 基础速度 + 道具效果总和
- 速度差距 = |car1速度 - car2速度|
- 领先车辆正确识别

**测试代码：**
```tact
// 查询车辆数据
getCar1()
getCar2()
getSpeedGap()
getLeadingCar()
```

### 5. 价格计算测试

**测试步骤：**
1. 购买第一个道具，记录价格
2. 购买第二个道具，记录价格
3. 购买第10个道具，记录价格
4. 验证价格是否符合椭圆算法

**预期结果：**
- 第一个道具：1 TON
- 第二个道具：略高于1 TON
- 第10个道具：价格明显上升
- 价格公式：price = base_price * (1 + (item_count / max_items)^2)

### 6. 资金分配测试

**测试步骤：**
1. 购买道具
2. 检查奖池、社区池、预留池余额
3. 验证分配比例（60%/20%/20%）

**预期结果：**
- 奖池：60%
- 社区池：20%
- 预留池：20%

### 7. 游戏结束测试

**测试步骤：**
1. 开始游戏
2. 等待时间到期或手动结束
3. 调用 `end_game`
4. 检查排名
5. 检查奖金分配

**预期结果：**
- 游戏状态：state = 2（已结束）
- 排名正确计算
- 奖金分配给前三名

### 8. 提取奖金测试

**测试步骤：**
1. 玩家获得奖金
2. 调用 `withdraw_reward`
3. 检查玩家余额清零
4. 检查资金发送

**预期结果：**
- 奖金发送到玩家地址
- 玩家余额清零

## 测试脚本示例

### 使用 toncli 测试

```bash
# 部署合约
toncli deploy

# 调用开始游戏
toncli call start

# 调用购买道具
toncli call buy_item --carId 1

# 查询车辆数据
toncli get getCar1
toncli get getCar2
toncli get getSpeedGap
```

### 使用 JavaScript/TypeScript 测试

```typescript
import { Contract, Address, beginCell } from '@ton/core';

const contract = Contract.createFromAddress(Address.parse('YOUR_CONTRACT_ADDRESS'));

// 开始游戏
await contract.send(owner, { value: 0n }, 'start');

// 购买道具
const message = beginCell()
    .storeUint(0x62796974, 32) // "byit"
    .storeUint(1, 8) // carId
    .endCell();
await contract.send(player, { value: 1000000000n }, message);

// 查询数据
const car1 = await contract.get('getCar1');
const gap = await contract.get('getSpeedGap');
```

## 常见问题排查

1. **合约编译错误**
   - 检查 Tact 版本
   - 检查导入路径

2. **部署失败**
   - 检查钱包余额
   - 检查网络连接

3. **调用失败**
   - 检查游戏状态
   - 检查余额是否充足
   - 检查消息格式

4. **数据查询失败**
   - 检查合约地址
   - 检查 getter 方法名称

## 测试检查清单

- [ ] 合约编译成功
- [ ] 合约部署成功
- [ ] 初始化状态正确
- [ ] 开始游戏功能正常
- [ ] 购买道具功能正常
- [ ] 速度计算正确
- [ ] 资金分配正确
- [ ] 游戏结束功能正常
- [ ] 奖金分配正确
- [ ] 提取功能正常


# 推荐系统实现文档

## 功能概述

推荐系统允许玩家邀请好友参与游戏，并获得推荐奖励。主要功能包括：

1. **推荐链接生成**：玩家可以生成自己的推荐链接
2. **新玩家奖励**：通过推荐链接首次购买道具的新玩家获得免费随机道具
3. **推荐奖励**：推荐人获得被推荐人消费的10%作为奖励
4. **统一提现**：所有奖励（大奖奖励+推荐奖励）统一存储在`rewardBalance`中，玩家支付gas费提取

## 合约实现

### 数据结构

#### PlayerData 扩展
```tact
struct PlayerData {
    totalInvested: Int as coins;
    totalBoost: Int as int;
    itemCount: Int as int;
    rewardBalance: Int as coins;  // 总待提现金额（包括大奖奖励和推荐奖励）
    referrer: Address? as maybe<Address>;  // 推荐人地址
    referralRewards: Int as coins;  // 累计推荐奖励
    referralCount: Int as int;  // 推荐人数
}
```

#### BuyItemMessage 扩展
```tact
message BuyItemMessage {
    carId: Int as int;  // 1 = Car1, 2 = Car2
    referrer: Address? as maybe<Address>;  // 可选的推荐人地址（首次购买时使用）
}
```

### 状态变量

```tact
referralRewardPercent: Int as int;  // 推荐奖励百分比（默认10%）
```

### 核心逻辑

#### 1. 推荐关系设置
- 新玩家首次购买道具时，如果提供了有效的推荐人地址，则设置推荐关系
- 推荐人必须是已存在的玩家
- 推荐人不能是自己

#### 2. 新玩家免费道具
- 如果新玩家通过推荐链接首次购买，系统会赠送一个随机道具
- 免费道具的效果随机生成（1X/2X/5X/10X，加速/减速）
- 免费道具随机应用到Car1或Car2

#### 3. 推荐奖励计算
- 被推荐人每次购买道具时，推荐人获得消费金额的10%作为奖励
- 奖励直接加到推荐人的`rewardBalance`中
- 同时更新推荐人的`referralRewards`和`referralCount`统计

#### 4. 资金分配调整
- 推荐奖励从购买金额中扣除后再进行分配
- 例如：购买1 TON，推荐奖励0.1 TON，剩余0.9 TON按比例分配给奖池/社区池/预留池

### 函数列表

#### 设置函数
```tact
// 设置推荐奖励比例（只有所有者可以设置）
receive("set_referral_reward_percent", percent: Int as int)
```

#### 查询函数
```tact
// 获取推荐奖励比例
get fun getReferralRewardPercent(): Int as int

// 获取玩家的推荐人
get fun getReferrer(addr: Address): Address?

// 获取玩家的推荐奖励统计
get fun getReferralStats(addr: Address): (Int, Int)  // (累计推荐奖励, 推荐人数)
```

## 前端实现

### 组件

#### 1. ReferralLink 组件
- 显示推荐链接
- 复制链接功能
- 分享链接功能（如果浏览器支持）
- 显示推荐奖励说明

#### 2. MyData 组件更新
- 显示累计推荐奖励
- 显示推荐人数
- 显示推荐人地址（如果有）
- 显示总待提现金额（包括大奖奖励和推荐奖励）

#### 3. ItemSection 组件更新
- 支持从URL参数读取推荐人地址
- 购买道具时传递推荐人地址给合约

### URL参数处理

- 推荐链接格式：`https://your-app.com?ref=WALLET_ADDRESS`
- 从URL参数读取推荐人地址
- 将推荐人地址保存到localStorage，以便后续购买使用
- 首次购买时传递推荐人地址给合约

### 消息构建

```typescript
const buildBuyItemMessage = (carId: number, referrerAddr: string | null) => {
  const op = 0x62796974 // "byit"
  const cell = beginCell()
    .storeUint(op, 32)
    .storeUint(carId, 8)
    
  if (referrerAddr) {
    const referrerAddress = Address.parse(referrerAddr)
    cell.storeMaybeRef(beginCell().storeAddress(referrerAddress).endCell())
  } else {
    cell.storeMaybeRef(null)
  }
  
  return cell.endCell().toBoc().toString('base64')
}
```

## 使用流程

### 推荐人流程

1. 玩家连接钱包
2. 系统自动生成推荐链接（包含钱包地址）
3. 玩家复制或分享推荐链接给好友
4. 好友通过链接首次购买道具时，推荐人获得奖励

### 被推荐人流程

1. 通过推荐链接访问游戏
2. 系统从URL参数读取推荐人地址
3. 连接钱包并首次购买道具
4. 系统自动：
   - 设置推荐关系
   - 赠送免费随机道具
   - 计算推荐奖励并给推荐人

### 奖励提现流程

1. 玩家查看`rewardBalance`（包括大奖奖励和推荐奖励）
2. 点击"提取奖金"按钮
3. 连接钱包并支付gas费
4. 合约将`rewardBalance`发送给玩家
5. `rewardBalance`清零

## 配置说明

### 推荐奖励比例

- 默认：10%
- 可配置范围：0-50%
- 设置方法：合约所有者调用`set_referral_reward_percent`

### 推荐奖励来源

推荐奖励从被推荐人的购买金额中扣除，不影响其他资金池的分配。

例如：
- 购买金额：1 TON
- 推荐奖励：0.1 TON（10%）
- 剩余金额：0.9 TON
- 剩余金额按比例分配：奖池/社区池/预留池

## 安全考虑

1. **推荐人验证**：
   - 推荐人必须是已存在的玩家
   - 推荐人不能是自己
   - 推荐关系只在首次购买时设置，不可更改

2. **奖励计算**：
   - 推荐奖励从购买金额中扣除，确保合约资金平衡
   - 奖励直接加到`rewardBalance`，无需额外操作

3. **提现安全**：
   - 玩家需要支付gas费才能提取奖励
   - 提现后`rewardBalance`清零，防止重复提取

## 测试建议

1. **推荐关系测试**：
   - 测试新玩家通过推荐链接购买
   - 测试新玩家无推荐人购买
   - 测试老玩家购买（不应设置新的推荐关系）

2. **免费道具测试**：
   - 验证新玩家是否获得免费道具
   - 验证免费道具的效果是否正确应用

3. **推荐奖励测试**：
   - 验证推荐奖励是否正确计算
   - 验证推荐奖励是否加到推荐人的`rewardBalance`
   - 验证推荐统计是否正确更新

4. **提现测试**：
   - 验证大奖奖励和推荐奖励是否都能提取
   - 验证提现后余额是否正确清零

## 总结

推荐系统实现了完整的邀请奖励机制，包括：
- ✅ 推荐链接生成和分享
- ✅ 新玩家免费道具
- ✅ 推荐奖励计算和分配
- ✅ 统一奖励提现
- ✅ 推荐统计查询

所有奖励统一存储在`rewardBalance`中，玩家通过`withdraw_reward`函数支付gas费提取。


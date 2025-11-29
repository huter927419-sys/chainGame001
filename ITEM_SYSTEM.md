# 道具系统实现文档

## 功能概述

道具系统实现了完整的盲盒机制和道具背包管理，包括：

1. **购买道具（盲盒机制）**：购买时不知道是加速还是减速，随机生成1X/2X/5X/10X效果
2. **道具存储**：购买的道具存储到玩家的道具背包中，不立即使用
3. **推荐奖励**：推荐人获得盲盒道具（随机生成），而不是TON奖励
4. **使用道具**：玩家可以在前端选择道具和目标车辆，然后使用道具
5. **不限制使用**：道具可以多次使用，不会从背包中删除

## 合约实现

### 数据结构

#### Item 结构
```tact
struct Item {
    id: Int as int;              // 道具ID（唯一标识）
    multiplier: Int as int;      // 效果倍数（1/2/5/10）
    effectType: Int as int;      // 0=加速, 1=减速
    effectValue: Int as int;     // 实际效果值（正数=加速，负数=减速）
    createdAt: Int as int;       // 创建时间（用于排序）
}
```

#### PlayerData 扩展
```tact
struct PlayerData {
    // ... 其他字段 ...
    itemCounter: Int as int;  // 道具ID计数器（用于生成唯一ID）
}
```

#### 合约状态
```tact
// 道具背包系统：每个玩家的道具列表（itemId -> Item）
playersItems: Map<Address, Map<Int, Item>>;
```

### 核心逻辑

#### 1. 购买道具
```tact
receive("buy_item", msg: BuyItemMessage) {
    // 1. 生成随机道具效果（盲盒机制）
    let effect: Int = self.generateItemEffect(randomSeed);
    
    // 2. 将道具添加到玩家背包
    let itemId: Int = self.addItemToBag(sender, effect, now);
    
    // 3. 如果是新玩家且有推荐人，给推荐人添加盲盒道具
    if (hasName) {
        let referralEffect: Int = self.generateItemEffect(referralItemSeed);
        self.addItemToBag(r, referralEffect, now);
    }
}
```

#### 2. 使用道具
```tact
receive("use_item", msg: UseItemMessage) {
    // 1. 从背包获取道具
    let item: Item? = self.playersItems.get(sender).get(msg.itemId);
    
    // 2. 应用道具效果到目标车辆
    if (msg.carId == 1) {
        self.car1.totalBoost += item.effectValue;
    } else {
        self.car2.totalBoost += item.effectValue;
    }
    
    // 3. 更新玩家数据（totalBoost和itemCount）
    // 4. 道具不删除，可以多次使用
}
```

#### 3. 推荐奖励逻辑
- **被推荐人有名字**：推荐人获得盲盒道具（随机生成）
- **被推荐人无名字**：推荐奖励进入社区池（保持原有逻辑）

### 函数列表

#### 购买和使用
```tact
// 购买道具（盲盒机制）
receive("buy_item", msg: BuyItemMessage)

// 使用道具
receive("use_item", msg: UseItemMessage)
```

#### 查询函数
```tact
// 获取玩家的道具（通过itemId）
get fun getPlayerItem(addr: Address, itemId: Int): Item?

// 获取玩家道具数量（通过itemCounter）
get fun getPlayerItemCount(addr: Address): Int
```

## 前端实现

### 组件

#### 1. ItemBag 组件
- 显示道具背包中的所有道具
- 道具卡片显示效果类型和倍数
- 选择道具后显示使用界面
- 选择目标车辆（Car1或Car2）
- 使用道具按钮

#### 2. ItemSection 组件更新
- 移除车辆选择（购买时不需要选择车辆）
- 购买的道具直接存储到背包
- 显示购买成功消息和道具详情

### 消息构建

#### 购买道具
```typescript
const buildBuyItemMessage = (referrerAddr: string | null) => {
  const op = 0x62796974 // "byit"
  const cell = beginCell()
    .storeUint(op, 32)
    // 如果有推荐人，添加推荐人地址
    if (referrerAddr) {
      const referrerAddress = Address.parse(referrerAddr)
      cell.storeMaybeRef(beginCell().storeAddress(referrerAddress).endCell())
    } else {
      cell.storeMaybeRef(null)
    }
  return cell.endCell().toBoc().toString('base64')
}
```

#### 使用道具
```typescript
const buildUseItemMessage = (itemId: number, carId: number) => {
  const op = 0x75736569 // "usei" - use item
  const cell = beginCell()
    .storeUint(op, 32)
    .storeUint(itemId, 32)  // 道具ID
    .storeUint(carId, 8)    // 目标车辆ID
    .endCell()
  return cell.toBoc().toString('base64')
}
```

## 使用流程

### 购买道具流程

1. 玩家点击"购买道具"
2. 支付道具价格（椭圆算法计算）
3. 系统随机生成道具效果（盲盒机制）
4. 道具添加到玩家背包
5. 如果是新玩家且有推荐人，推荐人获得盲盒道具

### 使用道具流程

1. 玩家在道具背包中选择道具
2. 选择目标车辆（Car1或Car2）
3. 点击"使用道具"
4. 道具效果应用到目标车辆
5. 道具保留在背包中，可以再次使用

### 推荐奖励流程

1. **被推荐人有名字**：
   - 被推荐人购买道具
   - 推荐人获得盲盒道具（随机生成）
   - 道具添加到推荐人背包

2. **被推荐人无名字**：
   - 被推荐人购买道具
   - 推荐奖励进入社区池（保持原有逻辑）

## 技术细节

### 道具ID生成

- 使用`itemCounter`为每个玩家生成唯一的道具ID
- 每个玩家独立计数，从1开始递增

### 道具存储

- 使用嵌套Map存储：`Map<Address, Map<Int, Item>>`
- 外层Map：玩家地址 -> 道具背包
- 内层Map：道具ID -> 道具数据

### 道具使用

- 道具不删除，可以多次使用
- 每次使用都会更新车辆的`totalBoost`
- 每次使用都会更新玩家的`itemCount`

## 优势

1. **盲盒机制**：增加游戏趣味性和不确定性
2. **灵活使用**：玩家可以自由选择使用时机和目标车辆
3. **推荐激励**：推荐人获得道具奖励，增加推荐积极性
4. **不限制使用**：道具可以多次使用，提高道具价值

## 注意事项

1. **道具查询**：由于Tact的限制，需要逐个查询道具（通过itemId）
2. **前端实现**：前端需要通过`itemCounter`遍历获取所有道具
3. **道具排序**：可以通过`createdAt`字段进行排序

## 总结

道具系统实现了完整的盲盒机制和背包管理，包括：
- ✅ 购买道具（盲盒机制）
- ✅ 道具存储到背包
- ✅ 推荐人获得盲盒道具
- ✅ 使用道具（选择目标车辆）
- ✅ 道具可以多次使用

所有功能都已实现并集成到前端界面中。


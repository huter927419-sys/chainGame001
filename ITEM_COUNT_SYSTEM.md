# 道具使用次数系统文档

## 功能概述

道具系统现在支持使用次数机制：
1. **道具使用次数**：每个道具有使用次数（count），默认为1
2. **使用一次减一次**：每次使用道具，count减1
3. **为0时删除**：当count为0时，道具从背包中删除
4. **不能为负数**：不能使用count为0的道具
5. **推荐人道具**：固定为1X的随机盲盒道具（加速或减速）

## 合约实现

### 数据结构更新

#### Item 结构
```tact
struct Item {
    id: Int as int;              // 道具ID（唯一标识）
    multiplier: Int as int;      // 效果倍数（1/2/5/10）
    effectType: Int as int;      // 0=加速, 1=减速
    effectValue: Int as int;     // 实际效果值（正数=加速，负数=减速）
    createdAt: Int as int;       // 创建时间（用于排序）
    count: Int as int;           // 使用次数（使用一次减1，为0时删除）
}
```

### 核心逻辑

#### 1. 购买道具
```tact
// 创建道具时，count默认为1
let newItem: Item = Item {
    // ... 其他字段 ...
    count: 1  // 使用次数，默认为1
};
```

#### 2. 推荐人获得道具
```tact
// 生成推荐人道具效果（固定1X，随机加速或减速）
fun generateReferralItemEffect(randomSeed: Int): Int {
    let effectType: Int = randomSeed % 2;  // 0=加速, 1=减速
    
    // 固定为1X
    if (effectType == 1) {
        return -1;  // 减速1X
    } else {
        return 1;   // 加速1X
    }
}
```

#### 3. 使用道具
```tact
receive("use_item", msg: UseItemMessage) {
    // 1. 检查道具使用次数（count必须大于0）
    require(itemData.count > 0, "Item count is 0, cannot use");
    
    // 2. 应用道具效果到目标车辆
    // ...
    
    // 3. 使用一次，count减1
    let newCount: Int = itemData.count - 1;
    
    // 4. 如果count > 0，更新道具；如果count = 0，删除道具
    if (newCount > 0) {
        // 更新道具count
        bag.set(msg.itemId, updatedItem);
    } else {
        // 删除道具
        bag.delete(msg.itemId);
    }
}
```

## 前端实现

### ItemBag 组件更新

1. **显示使用次数**：
   - 道具卡片显示剩余使用次数
   - 只显示count > 0的道具

2. **使用限制**：
   - 不能选择count为0的道具
   - 使用前检查count > 0

3. **界面更新**：
   - 显示"剩余: X次"
   - count为0的道具不显示或显示为已用完

## 使用流程

### 购买道具
1. 玩家购买道具
2. 道具添加到背包，count = 1
3. 如果是新玩家且有推荐人，推荐人获得1X盲盒道具（count = 1）

### 使用道具
1. 玩家选择道具（count > 0）
2. 选择目标车辆
3. 使用道具
4. count减1
5. 如果count = 0，道具从背包删除
6. 如果count > 0，道具保留在背包中

## 推荐人道具规则

### 固定1X盲盒道具
- **倍数**：固定为1X（不是1X/2X/5X/10X随机）
- **效果**：随机加速或减速（50%概率）
- **使用次数**：count = 1（使用一次后删除）

### 获得条件
- 被推荐人必须有注册名字
- 被推荐人首次购买道具时触发
- 推荐人获得1X盲盒道具（加速或减速随机）

## 优势

1. **防止无限使用**：道具使用一次减一次，防止无限使用
2. **资源管理**：玩家需要合理使用道具
3. **推荐激励**：推荐人获得固定1X道具，简单明了
4. **公平性**：所有道具都有使用次数限制

## 注意事项

1. **count不能为负数**：使用前检查count > 0
2. **count = 0时删除**：自动清理背包，避免显示无用道具
3. **推荐人道具固定1X**：不是随机倍数，而是固定1X

## 总结

道具使用次数系统实现了：
- ✅ 道具使用一次减一次
- ✅ count为0时删除道具
- ✅ 不能使用count为0的道具
- ✅ 推荐人获得固定1X盲盒道具（加速或减速随机）

所有功能都已实现并集成到前端界面中。


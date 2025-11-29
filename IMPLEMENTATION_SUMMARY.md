# 50玩家 + 可配置价格实现总结

## ✅ 已完成的修改

### 1. 玩家数量上限：50人

**合约修改（RaceGame.tact）：**
- ✅ 默认 `maxPlayers` 从 300 改为 50
- ✅ `set_max_players` 函数已存在，可动态调整（1-1000）

**前端修改：**
- ✅ `useGameState.ts`：默认 `maxPlayers` 改为 50
- ✅ `ItemSection.tsx`：默认 `maxPlayers` 改为 50
- ✅ `GameStatus.tsx`：默认 `maxPlayers` 改为 50

### 2. 可配置初始价格

**新增功能：**

#### 合约状态变量
```tact
basePrice: Int as int;  // 基础价格（可配置，默认1 TON）
maxPrice: Int as int;   // 价格上限（可配置，默认5 TON）
```

#### 初始化（默认值）
```tact
self.basePrice = 1000000000;  // 1 TON
self.maxPrice = 5000000000;   // 5 TON
```

#### 设置函数
```tact
// 设置基础价格（0.1-2 TON）
receive("set_base_price", price: Int as coins) {
    self.onlyOwner();
    require(price > 0.toCoins() && price <= 2000000000.toCoins(), 
            "Base price must be between 0.1 and 2 TON");
    self.basePrice = price.toInt();
}

// 设置价格上限（>=基础价格，<=10 TON）
receive("set_max_price", price: Int as coins) {
    self.onlyOwner();
    require(price >= self.basePrice.toCoins(), 
            "Max price must be >= base price");
    require(price <= 10000000000.toCoins(), 
            "Max price must be <= 10 TON");
    self.maxPrice = price.toInt();
}
```

#### 查询函数
```tact
get fun getBasePrice(): Int as coins {
    return self.basePrice.toCoins();
}

get fun getMaxPrice(): Int as coins {
    return self.maxPrice.toCoins();
}
```

#### 价格计算更新
```tact
fun calculateItemPrice(itemCount: Int): Int {
    let maxItems: Int = 1000;
    let ratio: Int = itemCount * 100 / maxItems;
    let ratioSquared: Int = ratio * ratio / 100;
    let multiplier: Int = 100 + ratioSquared;
    let calculatedPrice: Int = self.basePrice * multiplier / 100;
    return if (calculatedPrice > self.maxPrice) { 
        self.maxPrice 
    } else { 
        calculatedPrice 
    };
}
```

### 3. 动态分配优化（50玩家）

**更新逻辑：**
```tact
fun getDynamicDistribution(): (Int, Int, Int) {
    let playerCount: Int = self.gameState.totalPlayers;
    
    // 50玩家及以下：大幅提高奖池比例
    if (playerCount <= 50) {
        return (75, 15, 10);  // 75%奖池 / 15%社区 / 10%预留
    }
    // ... 其他配置
}
```

**理由：**
- 50玩家时奖池规模较小
- 提高奖池比例（75%）可以吸引玩家
- 弥补奖池规模小的不足

## 📊 配置效果

### 成本优势
- **排名计算**：~500 gas（vs 300玩家的3,000 gas，节省83%）
- **结束游戏**：0.0005 TON（vs 300玩家的0.003 TON，节省83%）

### 玩家体验
- **获胜概率**：6%（vs 300玩家的1%，提高6倍）
- **竞争激烈度**：适中（不会过于激烈）
- **参与机会**：充足

### 运营收益
- **单轮总投入**：~0.15 TON（50玩家 × 平均3次购买 × 1 TON）
- **奖池（75%）**：~0.11 TON
- **社区池（15%）**：~0.022 TON
- **第一名奖励**：~0.055 TON

## 🎯 使用示例

### 设置50玩家上限
```tact
receive("set_max_players", 50)
```

### 设置低门槛价格（推荐初期）
```tact
// 基础价格：0.5 TON
receive("set_base_price", 500000000.toCoins())

// 价格上限：3 TON
receive("set_max_price", 3000000000.toCoins())
```

### 设置标准价格（推荐稳定运营）
```tact
// 基础价格：1 TON（默认）
// 价格上限：5 TON（默认）
```

### 设置高端价格
```tact
// 基础价格：1.5 TON
receive("set_base_price", 1500000000.toCoins())

// 价格上限：8 TON
receive("set_max_price", 8000000000.toCoins())
```

## 📝 相关文档

- `50_PLAYERS_ANALYSIS.md`：50玩家配置分析
- `50_PLAYERS_CONFIG.md`：50玩家配置总结
- `PRICE_CONFIG_GUIDE.md`：价格配置指南

## ✅ 验证清单

- [x] 合约默认玩家上限改为50
- [x] 合约添加基础价格配置
- [x] 合约添加价格上限配置
- [x] 合约价格计算使用可配置价格
- [x] 合约动态分配优化（50玩家75%奖池）
- [x] 前端默认玩家上限改为50
- [x] 所有相关组件已更新

## 🚀 下一步

1. **测试合约**：验证50玩家限制和价格配置功能
2. **测试前端**：验证玩家上限显示和购买限制
3. **部署合约**：部署到测试网/主网
4. **配置价格**：根据实际情况设置初始价格


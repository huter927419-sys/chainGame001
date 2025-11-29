# 游戏参数优化更改总结

## 更改日期
2025-11-29

## 更改概述
根据游戏经济模型分析，对游戏参数进行了优化，主要目标是增加奖池吸引力，同时保持游戏平衡性。

---

## 1. 合约更改 (RaceGame.tact)

### 1.1 基础价格调整
**文件**: `contracts/RaceGame.tact`

**更改位置**: Line 177-178

**修改前**:
```tact
self.basePrice = 10000000;    // 0.01 TON
self.maxPrice = 500000000;     // 0.5 TON
```

**修改后**:
```tact
self.basePrice = 20000000;    // 0.02 TON
self.maxPrice = 1000000000;    // 1 TON
```

**影响**:
- 基础道具价格从 0.01 TON 提高到 0.02 TON（提高 100%）
- 最高道具价格从 0.5 TON 提高到 1 TON（提高 100%）
- 预期奖池规模从 0.75-1.125 TON 增加到 1.5-2.25 TON（翻倍）

### 1.2 添加游戏时长配置
**文件**: `contracts/RaceGame.tact`

**新增字段** (Line 134-135):
```tact
// 游戏时长配置（支持多模式）
gameDuration: Int as int;  // 游戏时长（秒），默认300秒（5分钟）
```

**初始化** (Line 197-198):
```tact
// 设置默认游戏时长（5分钟 = 300秒）
self.gameDuration = 300;
```

**start() 函数修改** (Line 216):
```tact
// 修改前: let duration = 300;
// 修改后:
let duration = self.gameDuration;  // 使用配置的游戏时长
```

### 1.3 添加游戏时长设置接口
**文件**: `contracts/RaceGame.tact`

**新增方法** (Line 403-409):
```tact
// 设置游戏时长（只有所有者可以设置）
receive("set_game_duration", duration: Int as int) {
    self.onlyOwner();
    require(duration >= 60 && duration <= 1800, "Duration must be between 1 and 30 minutes");
    require(self.gameState.state == 0, "Can only change duration before game starts");
    self.gameDuration = duration;
}
```

**限制条件**:
- 只有合约所有者可以调用
- 时长必须在 60-1800 秒之间（1-30 分钟）
- 只能在游戏开始前修改

### 1.4 添加游戏时长查询接口
**文件**: `contracts/RaceGame.tact`

**新增 getter** (Line 1132-1135):
```tact
// 获取游戏时长配置
get fun getGameDuration(): Int as int {
    return self.gameDuration;
}
```

---

## 2. 前端更改

### 2.1 RaceGameClient 客户端更新
**文件**: `frontend/lib/contract/RaceGameClient.ts`

**新增方法** (Line 413-419):
```typescript
/**
 * 获取游戏时长配置（秒）
 */
async getGameDuration(): Promise<number> {
  const stack = await this.callGetMethod('getGameDuration');
  return stack.readNumber();
}
```

### 2.2 道具购买界面更新
**文件**: `frontend/components/ItemSection.tsx`

#### 价格计算更新 (Line 83-90):
```typescript
// 修改前:
const basePrice = 10000000 // 0.01 TON

// 修改后:
const basePrice = 20000000 // 0.02 TON
```

#### 用户界面说明更新 (Line 216-223):
```typescript
<div className="bg-black/30 p-4 rounded-xl mb-4 text-sm space-y-2">
  <p className="text-cyan-400 font-semibold">📌 基础价格：0.02 TON（最高可达 1 TON）</p>
  <p>道具效果：随机生成加速或减速（1X/2X/5X/10X）</p>
  <p>价格算法：椭圆曲线算法（购买越多，价格越高）</p>
  <p className="text-yellow-400">⚠️ 购买前无法知道是加速还是减速（盲盒机制）</p>
  <p className="text-blue-400">💡 购买的道具会存储到背包，可以在背包中选择使用</p>
  <p className="text-green-400">💰 购买后立即获得返现，返现已添加到可提取余额</p>
</div>
```

### 2.3 游戏状态 Hook 更新

#### useGameState.ts (Line 12, 65):
```typescript
// 修改前:
itemPrice: 1000000000,  // 初始值
const basePrice = 1000000000  // 计算值

// 修改后:
itemPrice: 20000000,  // 0.02 TON base price
const basePrice = 20000000  // 0.02 TON base price
```

#### useGameState.v2.ts (Line 79):
```typescript
// 修改前:
itemPrice: 1000000000,

// 修改后:
itemPrice: 20000000,  // 0.02 TON base price
```

---

## 3. 经济影响分析

### 3.1 奖池规模变化

**50 玩家、5 分钟游戏模式**:

| 指标 | 修改前 | 修改后 | 变化 |
|------|--------|--------|------|
| 平均每人投入 | 0.015-0.0225 TON | 0.03-0.045 TON | +100% |
| 总投入 | 0.75-1.125 TON | 1.5-2.25 TON | +100% |
| 奖池 (60%) | 0.45-0.675 TON | 0.9-1.35 TON | +100% |
| 第一名奖金 | 0.225-0.3375 TON | 0.45-0.675 TON | +100% |
| 第二名奖金 | 0.135-0.2025 TON | 0.27-0.405 TON | +100% |
| 第三名奖金 | 0.09-0.135 TON | 0.18-0.27 TON | +100% |

### 3.2 用户投入变化
- 单次购买成本提高，但奖励也成比例提高
- 返现机制保持不变（2%-10%）
- 推荐奖励机制保持不变

### 3.3 游戏平衡性
- 椭圆曲线定价算法保持不变
- 四种购买策略保持不变
- 资金池分配比例保持不变（60% 奖池 / 20% 社区 / 20% 储备）

---

## 4. 未来扩展支持

### 4.1 多模式游戏支持
通过 `gameDuration` 配置，现在可以支持不同时长的游戏模式：

- **快速模式**: 3 分钟 (180 秒)
- **标准模式**: 5 分钟 (300 秒，默认)
- **马拉松模式**: 10 分钟 (600 秒)

### 4.2 动态玩家上限
合约已支持动态调整玩家上限（`set_max_players`），可以根据不同模式设置：

- 快速模式: 30 人
- 标准模式: 50 人
- 马拉松模式: 100 人

---

## 5. 部署建议

### 5.1 测试网部署
1. 先在测试网部署新版本合约
2. 验证新的价格配置
3. 测试 `set_game_duration` 接口
4. 确认前端正确显示新价格

### 5.2 主网迁移
1. 部署新合约到主网
2. 使用 `set_game_duration` 设置所需时长
3. 使用 `set_max_players` 设置玩家上限
4. 更新前端环境变量指向新合约地址

---

## 6. 兼容性说明

### 6.1 合约接口兼容性
- 所有现有接口保持不变
- 新增接口为可选调用
- 不影响现有游戏流程

### 6.2 前端兼容性
- 价格显示自动适配新配置
- 不需要用户端更新
- 渐进式增强，旧版本仍可使用

---

## 7. 关键文件清单

### 合约文件
- `contracts/RaceGame.tact` - 主合约文件（已修改）

### 前端文件
- `frontend/lib/contract/RaceGameClient.ts` - RPC 客户端（已修改）
- `frontend/components/ItemSection.tsx` - 道具购买界面（已修改）
- `frontend/hooks/useGameState.ts` - 游戏状态 Hook（已修改）
- `frontend/hooks/useGameState.v2.ts` - 游戏状态 Hook v2（已修改）

### 文档文件
- `GAME_PARAMETERS_ANALYSIS.md` - 参数分析文档
- `GAME_OPTIMIZATION_CHANGES.md` - 本文档

---

## 8. 总结

本次优化主要解决了以下问题：
1. ✅ 奖池规模偏小，吸引力不足 → 奖池翻倍
2. ✅ 缺乏游戏模式灵活性 → 添加可配置时长
3. ✅ 前端价格显示不明确 → 添加醒目提示

保持不变的特性：
- ✓ 游戏核心机制
- ✓ 资金分配比例
- ✓ 返现和推荐系统
- ✓ 道具效果系统
- ✓ 车辆竞速机制

下一步建议：
- 在测试网充分测试新参数
- 收集用户反馈调整细节
- 考虑实现多模式选择界面

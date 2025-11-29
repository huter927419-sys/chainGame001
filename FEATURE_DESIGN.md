# 双车竞速机制设计文档

## 需求分析

✅ **完全可实现**

### 核心需求
1. 两个车实时速度计算（合约中计算）
2. 时间倒计时
3. 两个车之间的差距显示
4. 玩家购买道具时选择目标车辆
5. 道具效果随机（购买前未知，支付后显示）
6. 显示道具效果倍数（1X/2X/5X/10X）

## 技术实现方案

### 1. 合约设计

#### 车辆数据结构
```tact
struct CarData {
    baseSpeed: Int as int;      // 基础速度
    totalBoost: Int as int;     // 总加速效果（所有道具效果总和）
    currentSpeed: Int as int;    // 当前速度 = baseSpeed + totalBoost
    itemCount: Int as int;       // 该车使用的道具数量
}
```

#### 道具购买消息
```tact
message BuyItemMessage {
    carId: Int as int;  // 1 = Car1, 2 = Car2
}
```

#### 道具效果返回
```tact
message ItemEffect {
    carId: Int as int;          // 目标车辆
    multiplier: Int as int;      // 效果倍数（1/2/5/10，正数=加速，负数=减速）
    effectType: Int as int;      // 0=加速, 1=减速
}
```

### 2. 速度计算逻辑

```
Car1速度 = 基础速度(100) + Car1所有道具效果总和
Car2速度 = 基础速度(100) + Car2所有道具效果总和

差距 = |Car1速度 - Car2速度|
```

### 3. 前端显示

- 两个车的当前速度（实时更新）
- 两个车之间的差距
- 倒计时
- 玩家购买的道具效果（支付成功后显示）
- 道具效果倍数显示

## 实现步骤

1. ✅ 修改合约添加双车系统
2. ✅ 实现速度计算逻辑
3. ✅ 实现差距计算
4. ✅ 修改购买道具逻辑（选择目标车辆）
5. ✅ 前端显示双车状态
6. ✅ 前端显示道具购买结果


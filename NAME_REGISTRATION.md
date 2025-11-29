# 名字注册系统实现文档

## 功能概述

名字注册系统允许玩家注册个性化的游戏名字，支持多语言和表情符号。主要功能包括：

1. **名字注册**：玩家可以注册名字（需要支付gas费）
2. **多语言支持**：支持中文、日文、韩文、英文和表情符号
3. **推荐奖励关联**：只有注册了名字的被推荐人，推荐奖励才会给推荐人；否则进入社区池
4. **名字显示**：在邀请链接、排行榜等地方显示名字，未注册则显示玩家ID

## 合约实现

### 数据结构

#### PlayerData 扩展
```tact
struct PlayerData {
    // ... 其他字段 ...
    name: String? as maybe<String>;  // 玩家名字（支持中文日文韩文英文表情符号）
}
```

#### RankData 扩展
```tact
struct RankData {
    address: Address;
    invested: Int as coins;
    boost: Int as int;
    score: Int as int;
    name: String? as maybe<String>;  // 玩家名字（如果有注册）
}
```

### 核心逻辑

#### 1. 名字注册
```tact
receive("register_name", name: String) {
    // 验证名字长度（1-50个字符）
    require(name.length() > 0 && name.length() <= 50, "Name must be between 1 and 50 characters");
    
    // 更新玩家名字
    // 需要支付gas费，但不需要额外金额
}
```

#### 2. 推荐奖励逻辑调整
- **有名字的被推荐人**：推荐奖励给推荐人
- **无名字的被推荐人**：推荐奖励进入社区池

```tact
// 检查被推荐人是否注册了名字
let hasName: Bool = match newData.name {
    _: String => true,
    _ => false
};

if (hasName) {
    // 被推荐人有名字，推荐奖励给推荐人
    // 更新推荐人的rewardBalance
} else {
    // 被推荐人没有名字，推荐奖励进入社区池
    self.communityPool = self.communityPool + referralReward.toCoins();
}
```

#### 3. 排名显示逻辑
- 有名字：显示名字
- 无名字：显示玩家ID（地址前6位...后4位）

### 函数列表

#### 注册函数
```tact
// 注册名字（需要支付gas费）
receive("register_name", name: String)
```

#### 查询函数
```tact
// 获取玩家的名字
get fun getPlayerName(addr: Address): String?
```

## 前端实现

### 组件

#### 1. RegisterName 组件
- 显示当前名字（如果已注册）
- 名字输入框（支持多语言和表情符号）
- 名字长度限制（1-50字符）
- 注册按钮（需要支付gas费）
- 显示注册状态和结果

#### 2. ReferralLink 组件更新
- 显示推荐人名字（如果有注册）
- 提示：只有注册了名字的被推荐人，推荐奖励才会发放

#### 3. MyData 组件更新
- 显示玩家名字（如果有注册）

#### 4. Leaderboard 组件更新
- 有名字：显示名字（大字体，蓝色）
- 无名字：显示玩家ID（小字体，灰色，等宽字体）

### 消息构建

```typescript
const buildRegisterNameMessage = (playerName: string) => {
  const op = 0x72676e6d // "rgnm" - register name
  const cell = beginCell()
    .storeUint(op, 32)
    .storeRef(beginCell().storeStringTail(playerName).endCell())  // 使用storeStringTail存储UTF-8字符串
    .endCell()
  return cell.toBoc().toString('base64')
}
```

## 使用流程

### 名字注册流程

1. 玩家连接钱包
2. 在名字注册界面输入名字（1-50字符）
3. 点击"注册名字（支付gas费）"
4. 确认交易并支付gas费
5. 名字注册成功，显示在界面上

### 推荐奖励流程

1. **推荐人有名字，被推荐人有名字**：
   - 被推荐人购买道具
   - 推荐奖励给推荐人 ✅

2. **推荐人有名字，被推荐人无名字**：
   - 被推荐人购买道具
   - 推荐奖励进入社区池 ⚠️

3. **推荐人无名字，被推荐人有名字**：
   - 被推荐人购买道具
   - 推荐奖励进入社区池 ⚠️

### 显示逻辑

#### 邀请链接
- 显示推荐人名字（如果有）
- 提示：只有注册了名字的被推荐人，推荐奖励才会发放

#### 排行榜
- 有名字：显示名字（大字体，蓝色）
- 无名字：显示玩家ID（小字体，灰色）

## 技术细节

### 字符编码

- Tact的String类型支持UTF-8编码
- 可以存储中文、日文、韩文、英文和表情符号
- 使用`storeStringTail`存储字符串到Cell中

### 名字长度限制

- 最小长度：1个字符
- 最大长度：50个字符
- 验证在合约中完成

### Gas费用

- 注册名字需要支付gas费
- 不需要额外的TON金额（amount = 0）
- 交易费用由TON网络决定

## 安全考虑

1. **名字验证**：
   - 长度验证（1-50字符）
   - 在合约中完成验证，防止无效名字

2. **推荐奖励安全**：
   - 只有注册了名字的被推荐人，推荐奖励才给推荐人
   - 防止恶意刷推荐奖励

3. **显示安全**：
   - 名字在合约中存储，前端显示时不需要额外验证
   - 未注册名字时显示ID，保护隐私

## 测试建议

1. **名字注册测试**：
   - 测试各种语言的名字（中文、日文、韩文、英文）
   - 测试表情符号
   - 测试名字长度限制
   - 测试重复注册（应该可以更新）

2. **推荐奖励测试**：
   - 测试有名字的被推荐人购买（推荐奖励给推荐人）
   - 测试无名字的被推荐人购买（推荐奖励进入社区池）

3. **显示测试**：
   - 测试排行榜显示名字
   - 测试排行榜显示ID
   - 测试邀请链接显示推荐人名字

## 总结

名字注册系统实现了完整的个性化功能，包括：
- ✅ 名字注册（支持多语言和表情符号）
- ✅ 推荐奖励关联（只有注册名字才给推荐人）
- ✅ 名字显示（邀请、排名）
- ✅ ID显示（未注册时显示玩家ID）

所有功能都已实现并集成到前端界面中。


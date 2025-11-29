# RaceGame 合约测试

## 测试文件说明

- `RaceGame.test.ts` - TypeScript 单元测试（使用测试框架）
- `manual-test.md` - 手动测试指南
- `test-contract.sh` - 自动化测试脚本

## 快速开始

### 方法1：使用 Tact 测试框架

```bash
# 安装依赖
npm install

# 运行测试
npm test
```

### 方法2：手动测试

1. 编译合约
```bash
cd contracts
tact RaceGame.tact
```

2. 部署到测试网
3. 按照 `manual-test.md` 中的步骤进行测试

### 方法3：使用测试脚本

```bash
# 编辑 test-contract.sh，填入合约地址
chmod +x test-contract.sh
./test-contract.sh
```

## 测试覆盖

### 核心功能测试
- ✅ 合约初始化
- ✅ 开始游戏
- ✅ 购买道具
- ✅ 速度计算
- ✅ 资金分配
- ✅ 游戏结束
- ✅ 奖金分配
- ✅ 提取功能

### 边界情况测试
- ✅ 无效车辆ID
- ✅ 余额不足
- ✅ 游戏未开始
- ✅ 游戏已结束
- ✅ 非所有者操作

## 测试数据

### 测试地址
- 所有者：需要替换为实际地址
- 玩家1：需要替换为实际地址
- 玩家2：需要替换为实际地址

### 测试金额
- 基础道具价格：1 TON (1000000000 nanoTON)
- 测试购买金额：1-10 TON

## 注意事项

1. 测试前确保有足够的测试币
2. 使用测试网进行测试
3. 记录测试结果
4. 发现bug及时修复


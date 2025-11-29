# RaceGame 合约客户端使用指南

本文档介绍如何使用封装好的 RaceGame 合约客户端和 React Hooks。

## 目录

1. [快速开始](#快速开始)
2. [RaceGameClient API](#racegameclient-api)
3. [React Hooks](#react-hooks)
4. [使用示例](#使用示例)
5. [最佳实践](#最佳实践)
6. [故障排除](#故障排除)

---

## 快速开始

### 1. 环境配置

在 `.env.local` 中配置合约地址：

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=EQD... # 你的合约地址
NEXT_PUBLIC_NETWORK=testnet  # 或 mainnet
```

### 2. 基础使用

```typescript
import { useRaceGameContract } from '@/hooks/useRaceGameContract';

function MyComponent() {
  const { gameState, loading, error, refresh } = useRaceGameContract({
    autoRefresh: true,
    refreshInterval: 3000,
  });

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <p>游戏状态: {gameState?.state}</p>
      <p>玩家数: {gameState?.totalPlayers}</p>
      <button onClick={refresh}>刷新</button>
    </div>
  );
}
```

---

## RaceGameClient API

### 初始化

```typescript
import { raceGameClient } from '@/lib/contract/RaceGameClient';
```

`raceGameClient` 是一个单例实例，自动初始化。

### 查询方法

#### 游戏状态

```typescript
// 获取游戏状态
const gameState = await raceGameClient.getGameState();
// { state: 1, startTime: ..., endTime: ..., totalPlayers: 10, totalItems: 25 }

// 获取玩家数据
const playerData = await raceGameClient.getPlayerData('EQD...');
// { totalInvested: '1000000000', itemCount: 3, ... } 或 null（玩家不存在）
```

#### 资金池

```typescript
// 获取奖池
const prizePool = await raceGameClient.getPrizePool();
// '600000000' (以 nanotons 为单位)

// 获取社区池
const communityPool = await raceGameClient.getCommunityPool();

// 获取预留池
const reservePool = await raceGameClient.getReservePool();

// 获取总投资
const totalInvested = await raceGameClient.getTotalInvested();

// 获取分配配置
const config = await raceGameClient.getDistributionConfig();
// { prizePoolPercent: 60, communityPercent: 20, reservePercent: 20 }
```

#### 车辆状态

```typescript
// 获取车辆数据
const car1 = await raceGameClient.getCar1();
// { baseSpeed: 100, totalBoost: 50, currentSpeed: 150, itemCount: 5 }

const car2 = await raceGameClient.getCar2();

// 获取速度差距
const gap = await raceGameClient.getSpeedGap();
// 50

// 获取领先车辆
const leading = await raceGameClient.getLeadingCar();
// 0=平局, 1=Car1领先, 2=Car2领先
```

#### 道具

```typescript
// 获取玩家道具数量
const count = await raceGameClient.getPlayerItemCount('EQD...');
// 5

// 获取单个道具
const item = await raceGameClient.getPlayerItem('EQD...', 1);
// { id: 1, multiplier: 2, effectType: 0, effectValue: 10, ... } 或 null

// 获取所有道具
const items = await raceGameClient.getPlayerItems('EQD...');
// [{ id: 1, ... }, { id: 2, ... }, ...]
```

#### 价格计算

```typescript
// 计算当前道具价格
const price = await raceGameClient.calculateItemPrice();
// '1050000000'

// 计算指定数量的价格
const price100 = await raceGameClient.calculateItemPrice(100);

// 根据策略计算价格
const { finalPrice, cashbackAmount } = await raceGameClient.calculatePriceWithStrategy(
  '1000000000',
  0  // 保守策略
);
// { finalPrice: '1000000000', cashbackAmount: '100000000' }
```

### 工具方法

```typescript
// 格式化 TON
const ton = RaceGameClient.formatTon('1000000000');
// '1.0'

// 解析 TON
const nanotons = RaceGameClient.parseTon('1.5');
// 1500000000n

// 格式化地址
const short = RaceGameClient.formatAddress('EQD4FPq1RpL...abc123');
// 'EQD4FP...3123'

// 验证地址
const valid = RaceGameClient.isValidAddress('EQD...');
// true 或 false
```

---

## React Hooks

### useRaceGameContract

主 Hook，提供完整的合约数据和方法。

```typescript
import { useRaceGameContract } from '@/hooks/useRaceGameContract';

function MyComponent() {
  const {
    // 数据
    gameState,
    playerData,
    prizePool,
    communityPool,
    car1,
    car2,
    playerItems,

    // 状态
    loading,
    error,
    lastUpdated,

    // 方法
    refresh,
    refreshGameState,
    refreshPlayerData,
  } = useRaceGameContract({
    autoRefresh: true,
    refreshInterval: 3000,
    playerAddress: '0x...',
  });

  // ...
}
```

**选项**:
- `autoRefresh`: 是否自动刷新（默认 `true`）
- `refreshInterval`: 刷新间隔（毫秒，默认 `3000`）
- `playerAddress`: 玩家地址（可选）
- `loadOnMount`: 是否在挂载时加载（默认 `true`）

### useGameState

轻量级 Hook，仅查询游戏状态。

```typescript
import { useGameState } from '@/hooks/useRaceGameContract';

function GameStatus() {
  const { gameState, currentItemPrice, countdown, loading } = useGameState();

  return (
    <div>
      <p>状态: {gameState?.state}</p>
      <p>当前价格: {currentItemPrice}</p>
      <p>倒计时: {countdown}秒</p>
    </div>
  );
}
```

### usePlayerData

仅查询玩家数据的 Hook。

```typescript
import { usePlayerData } from '@/hooks/useRaceGameContract';

function MyProfile({ address }) {
  const { playerData, playerItems, loading, refresh } = usePlayerData(address);

  return (
    <div>
      <p>投资: {playerData?.totalInvested}</p>
      <p>道具数: {playerItems.length}</p>
      <button onClick={refresh}>刷新</button>
    </div>
  );
}
```

### useFundPools

仅查询资金池的 Hook。

```typescript
import { useFundPools } from '@/hooks/useRaceGameContract';

function PoolDisplay() {
  const { prizePool, communityPool, reservePool } = useFundPools();

  return (
    <div>
      <p>奖池: {prizePool}</p>
      <p>社区池: {communityPool}</p>
      <p>预留池: {reservePool}</p>
    </div>
  );
}
```

### useCarRace

仅查询车辆竞速状态的 Hook。

```typescript
import { useCarRace } from '@/hooks/useRaceGameContract';

function RaceDisplay() {
  const { car1, car2, speedGap, leadingCar } = useCarRace();

  return (
    <div>
      <p>Car1 速度: {car1?.currentSpeed}</p>
      <p>Car2 速度: {car2?.currentSpeed}</p>
      <p>速度差: {speedGap}</p>
      <p>领先: {leadingCar === 1 ? 'Car1' : leadingCar === 2 ? 'Car2' : '平局'}</p>
    </div>
  );
}
```

---

## 使用示例

### 示例 1: 显示游戏状态和倒计时

```typescript
import { useGameState } from '@/hooks/useRaceGameContract';
import { RaceGameClient } from '@/lib/contract/RaceGameClient';

function GameStatusCard() {
  const { gameState, currentItemPrice, countdown, loading, error } = useGameState({
    refreshInterval: 2000,
  });

  if (loading) return <Skeleton />;
  if (error) return <Error message={error.message} />;
  if (!gameState) return null;

  const statusText = {
    0: '未开始',
    1: '进行中',
    2: '已结束',
  }[gameState.state];

  return (
    <div className="card">
      <h3>游戏状态</h3>
      <p>状态: {statusText}</p>
      <p>玩家数: {gameState.totalPlayers}</p>
      <p>道具数: {gameState.totalItems}</p>

      {gameState.state === 1 && (
        <>
          <p>倒计时: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</p>
          <p>当前价格: {RaceGameClient.formatTon(currentItemPrice)} TON</p>
        </>
      )}
    </div>
  );
}
```

### 示例 2: 玩家数据面板

```typescript
import { usePlayerData } from '@/hooks/useRaceGameContract';
import { RaceGameClient } from '@/lib/contract/RaceGameClient';
import { useTonConnect } from '@/components/TonConnectProvider';

function PlayerDataPanel() {
  const { wallet } = useTonConnect();
  const { playerData, playerItems, loading, refresh } = usePlayerData(
    wallet?.address || null,
    { refreshInterval: 5000 }
  );

  if (!wallet) return <div>请先连接钱包</div>;
  if (loading) return <Spinner />;
  if (!playerData) return <div>还未参与游戏</div>;

  return (
    <div className="panel">
      <h3>我的数据</h3>

      <div className="stats">
        <Stat label="总投资" value={`${RaceGameClient.formatTon(playerData.totalInvested)} TON`} />
        <Stat label="加速值" value={playerData.totalBoost} />
        <Stat label="道具数" value={playerData.itemCount} />
        <Stat label="待提现" value={`${RaceGameClient.formatTon(playerData.rewardBalance)} TON`} />
      </div>

      {playerData.name && (
        <p className="name">名字: {playerData.name}</p>
      )}

      {playerData.referrer && (
        <div className="referral">
          <p>推荐人: {RaceGameClient.formatAddress(playerData.referrer)}</p>
          <p>推荐奖励: {RaceGameClient.formatTon(playerData.referralRewards)} TON</p>
          <p>推荐人数: {playerData.referralCount}</p>
        </div>
      )}

      <h4>道具背包 ({playerItems.length})</h4>
      <div className="items">
        {playerItems.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      <button onClick={refresh}>刷新</button>
    </div>
  );
}
```

### 示例 3: 资金池可视化

```typescript
import { useFundPools } from '@/hooks/useRaceGameContract';
import { RaceGameClient } from '@/lib/contract/RaceGameClient';

function FundPoolsChart() {
  const { prizePool, communityPool, reservePool, distributionConfig, loading } = useFundPools();

  if (loading) return <Skeleton />;

  const prizeValue = Number(RaceGameClient.formatTon(prizePool));
  const communityValue = Number(RaceGameClient.formatTon(communityPool));
  const reserveValue = Number(RaceGameClient.formatTon(reservePool));
  const total = prizeValue + communityValue + reserveValue;

  return (
    <div className="pools">
      <h3>资金池分布</h3>

      <ProgressBar
        sections={[
          { label: '奖池', value: prizeValue, percent: distributionConfig?.prizePoolPercent },
          { label: '社区', value: communityValue, percent: distributionConfig?.communityPercent },
          { label: '预留', value: reserveValue, percent: distributionConfig?.reservePercent },
        ]}
        total={total}
      />

      <div className="values">
        <PoolValue label="奖池" value={prizeValue} percent={distributionConfig?.prizePoolPercent} />
        <PoolValue label="社区池" value={communityValue} percent={distributionConfig?.communityPercent} />
        <PoolValue label="预留池" value={reserveValue} percent={distributionConfig?.reservePercent} />
      </div>

      <p className="total">总计: {total.toFixed(2)} TON</p>
    </div>
  );
}
```

### 示例 4: 实时竞速显示

```typescript
import { useCarRace } from '@/hooks/useRaceGameContract';

function RaceTrack() {
  const { car1, car2, speedGap, leadingCar, loading } = useCarRace({
    refreshInterval: 1000, // 每秒更新
  });

  if (loading || !car1 || !car2) return <Skeleton />;

  const car1Percent = car1.currentSpeed > 0
    ? (car1.currentSpeed / (car1.currentSpeed + car2.currentSpeed)) * 100
    : 50;

  const car2Percent = 100 - car1Percent;

  return (
    <div className="race-track">
      <h3>竞速状态</h3>

      <div className="track">
        <div className="car car1" style={{ left: `${car1Percent}%` }}>
          🏎️ Car1
          <div className="speed">{car1.currentSpeed}</div>
        </div>

        <div className="car car2" style={{ left: `${car2Percent}%` }}>
          🏎️ Car2
          <div className="speed">{car2.currentSpeed}</div>
        </div>
      </div>

      <div className="stats">
        <div className="car1-stats">
          <p>Car1</p>
          <p>基础速度: {car1.baseSpeed}</p>
          <p>加速: {car1.totalBoost}</p>
          <p>当前速度: {car1.currentSpeed}</p>
          <p>道具数: {car1.itemCount}</p>
        </div>

        <div className="gap">
          <p>速度差: {speedGap}</p>
          <p className="leading">
            {leadingCar === 1 && '🏆 Car1 领先'}
            {leadingCar === 2 && '🏆 Car2 领先'}
            {leadingCar === 0 && '⚖️ 势均力敌'}
          </p>
        </div>

        <div className="car2-stats">
          <p>Car2</p>
          <p>基础速度: {car2.baseSpeed}</p>
          <p>加速: {car2.totalBoost}</p>
          <p>当前速度: {car2.currentSpeed}</p>
          <p>道具数: {car2.itemCount}</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 最佳实践

### 1. 选择合适的 Hook

- 只需要游戏状态？用 `useGameState()`
- 只需要玩家数据？用 `usePlayerData()`
- 需要多个数据？用 `useRaceGameContract()`

### 2. 优化刷新频率

```typescript
// 静态数据，刷新慢一点
const { distributionConfig } = useFundPools({
  refreshInterval: 10000,  // 10秒
});

// 实时数据，刷新快一点
const { car1, car2 } = useCarRace({
  refreshInterval: 1000,  // 1秒
});

// 不需要自动刷新，手动控制
const { gameState, refresh } = useGameState({
  autoRefresh: false,
});
```

### 3. 错误处理

```typescript
const { gameState, error, refresh } = useGameState();

if (error) {
  return (
    <ErrorBoundary
      error={error}
      retry={refresh}
      fallback={<div>加载失败，<button onClick={refresh}>重试</button></div>}
    />
  );
}
```

### 4. 加载状态

```typescript
const { playerData, loading } = usePlayerData(address);

if (loading) {
  return <Skeleton variant="player-card" />;
}
```

### 5. 数据缓存

Hook 自动处理缓存，不需要手动管理：

```typescript
// ✅ 好
function Component() {
  const { gameState } = useGameState();
  // gameState 被自动缓存
}

// ❌ 不好
function Component() {
  const [cache, setCache] = useState({});
  // 不需要手动缓存
}
```

### 6. 条件查询

```typescript
// 仅在有地址时查询玩家数据
const { playerData } = usePlayerData(
  wallet?.address || null  // null 时不查询
);

// 仅在连接时自动刷新
const { gameState } = useGameState({
  autoRefresh: isConnected,
});
```

---

## 故障排除

### 问题 1: "合约地址未配置"

**原因**: 环境变量 `NEXT_PUBLIC_CONTRACT_ADDRESS` 未设置

**解决**:
```bash
# 在 .env.local 中添加
NEXT_PUBLIC_CONTRACT_ADDRESS=EQD...
```

### 问题 2: "初始化失败"

**原因**: 网络连接问题或合约地址无效

**解决**:
1. 检查网络连接
2. 验证合约地址格式
3. 确认合约已部署
4. 检查 `NEXT_PUBLIC_NETWORK` 设置

### 问题 3: 数据一直是 null

**原因**: 合约方法返回空或玩家数据不存在

**解决**:
```typescript
const { playerData, error } = usePlayerData(address);

if (error) {
  console.error('查询失败:', error);
}

if (!playerData) {
  return <div>玩家数据不存在</div>;
}
```

### 问题 4: 刷新间隔太频繁

**原因**: 多个组件使用相同的 Hook

**解决**: 在父组件使用一次，通过 props 传递：

```typescript
// ✅ 好
function Parent() {
  const contractData = useRaceGameContract();

  return (
    <>
      <Child1 gameState={contractData.gameState} />
      <Child2 playerData={contractData.playerData} />
    </>
  );
}

// ❌ 不好（会发送多次请求）
function Child1() {
  const { gameState } = useRaceGameContract();
  // ...
}

function Child2() {
  const { playerData } = useRaceGameContract();
  // ...
}
```

### 问题 5: TypeScript 类型错误

**原因**: 数据可能为 null

**解决**: 添加 null 检查

```typescript
const { gameState } = useGameState();

// ✅ 好
if (gameState) {
  console.log(gameState.totalPlayers);
}

// 或使用可选链
const players = gameState?.totalPlayers ?? 0;

// ❌ 不好
console.log(gameState.totalPlayers);  // 可能报错
```

---

## API 参考

完整的 API 类型定义请参考：
- [RaceGameClient.ts](./RaceGameClient.ts)
- [useRaceGameContract.ts](../../hooks/useRaceGameContract.ts)

---

**更多帮助**:
- 查看 [TESTNET_DEPLOYMENT.md](../../../TESTNET_DEPLOYMENT.md)
- 查看示例组件
- 提交 Issue

**祝开发顺利！🚀**

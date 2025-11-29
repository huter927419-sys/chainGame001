/**
 * useRaceGameContract Hook
 *
 * 封装所有合约交互逻辑，提供：
 * - 自动数据刷新
 * - 智能缓存
 * - 错误处理
 * - 加载状态管理
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { raceGameClient, GameState, PlayerData, CarData, DistributionConfig, Item } from '@/lib/contract/RaceGameClient';

interface UseRaceGameContractOptions {
  /**
   * 是否自动刷新数据
   * @default true
   */
  autoRefresh?: boolean;

  /**
   * 刷新间隔（毫秒）
   * @default 3000 (3秒)
   */
  refreshInterval?: number;

  /**
   * 玩家地址（用于查询玩家数据）
   */
  playerAddress?: string | null;

  /**
   * 是否在组件挂载时立即加载数据
   * @default true
   */
  loadOnMount?: boolean;
}

interface ContractData {
  // 游戏状态
  gameState: GameState | null;

  // 玩家数据
  playerData: PlayerData | null;

  // 资金池
  prizePool: string;
  communityPool: string;
  reservePool: string;
  totalInvested: string;

  // 分配配置
  distributionConfig: DistributionConfig | null;

  // 车辆数据
  car1: CarData | null;
  car2: CarData | null;
  speedGap: number;
  leadingCar: number;

  // 道具
  playerItems: Item[];

  // 配置
  baseItemPrice: string;
  maxItemPrice: string;
  maxPlayers: number;

  // 当前道具价格
  currentItemPrice: string;
}

interface ContractState extends ContractData {
  // 加载状态
  loading: boolean;
  error: Error | null;

  // 刷新方法
  refresh: () => Promise<void>;
  refreshGameState: () => Promise<void>;
  refreshPlayerData: () => Promise<void>;
  refreshFundPools: () => Promise<void>;
  refreshCarRace: () => Promise<void>;
  refreshPlayerItems: () => Promise<void>;

  // 最后更新时间
  lastUpdated: number | null;
}

const DEFAULT_OPTIONS: Required<UseRaceGameContractOptions> = {
  autoRefresh: true,
  refreshInterval: 3000,
  playerAddress: null,
  loadOnMount: true,
};

/**
 * 使用 RaceGame 合约的 Hook
 */
export function useRaceGameContract(options: UseRaceGameContractOptions = {}): ContractState {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 数据状态
  const [data, setData] = useState<ContractData>({
    gameState: null,
    playerData: null,
    prizePool: '0',
    communityPool: '0',
    reservePool: '0',
    totalInvested: '0',
    distributionConfig: null,
    car1: null,
    car2: null,
    speedGap: 0,
    leadingCar: 0,
    playerItems: [],
    baseItemPrice: '0',
    maxItemPrice: '0',
    maxPlayers: 50,
    currentItemPrice: '0',
  });

  // 加载状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // 使用 ref 来避免循环依赖
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshing = useRef(false);

  /**
   * 刷新游戏状态
   */
  const refreshGameState = useCallback(async () => {
    try {
      const gameState = await raceGameClient.getGameState();

      setData(prev => ({ ...prev, gameState }));

      // 同时更新当前道具价格
      const currentItemPrice = await raceGameClient.calculateItemPrice();
      setData(prev => ({ ...prev, currentItemPrice }));

      return gameState;
    } catch (err) {
      console.error('刷新游戏状态失败:', err);
      throw err;
    }
  }, []);

  /**
   * 刷新玩家数据
   */
  const refreshPlayerData = useCallback(async () => {
    if (!opts.playerAddress) {
      return null;
    }

    try {
      const playerData = await raceGameClient.getPlayerData(opts.playerAddress);
      setData(prev => ({ ...prev, playerData }));
      return playerData;
    } catch (err) {
      console.error('刷新玩家数据失败:', err);
      throw err;
    }
  }, [opts.playerAddress]);

  /**
   * 刷新资金池
   */
  const refreshFundPools = useCallback(async () => {
    try {
      const [prizePool, communityPool, reservePool, totalInvested, distributionConfig] = await Promise.all([
        raceGameClient.getPrizePool(),
        raceGameClient.getCommunityPool(),
        raceGameClient.getReservePool(),
        raceGameClient.getTotalInvested(),
        raceGameClient.getDistributionConfig(),
      ]);

      setData(prev => ({
        ...prev,
        prizePool,
        communityPool,
        reservePool,
        totalInvested,
        distributionConfig,
      }));
    } catch (err) {
      console.error('刷新资金池失败:', err);
      throw err;
    }
  }, []);

  /**
   * 刷新车辆竞速状态
   */
  const refreshCarRace = useCallback(async () => {
    try {
      const [car1, car2, speedGap, leadingCar] = await Promise.all([
        raceGameClient.getCar1(),
        raceGameClient.getCar2(),
        raceGameClient.getSpeedGap(),
        raceGameClient.getLeadingCar(),
      ]);

      setData(prev => ({
        ...prev,
        car1,
        car2,
        speedGap,
        leadingCar,
      }));
    } catch (err) {
      console.error('刷新车辆状态失败:', err);
      throw err;
    }
  }, []);

  /**
   * 刷新玩家道具
   */
  const refreshPlayerItems = useCallback(async () => {
    if (!opts.playerAddress) {
      return [];
    }

    try {
      const playerItems = await raceGameClient.getPlayerItems(opts.playerAddress);
      setData(prev => ({ ...prev, playerItems }));
      return playerItems;
    } catch (err) {
      console.error('刷新玩家道具失败:', err);
      throw err;
    }
  }, [opts.playerAddress]);

  /**
   * 刷新所有数据
   */
  const refresh = useCallback(async () => {
    // 防止并发刷新
    if (isRefreshing.current) {
      return;
    }

    isRefreshing.current = true;
    setLoading(true);
    setError(null);

    try {
      // 并行请求所有数据
      await Promise.all([
        refreshGameState(),
        refreshPlayerData(),
        refreshFundPools(),
        refreshCarRace(),
        refreshPlayerItems(),
      ]);

      setLastUpdated(Date.now());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('刷新数据失败');
      setError(error);
      console.error('刷新数据失败:', error);
    } finally {
      setLoading(false);
      isRefreshing.current = false;
    }
  }, [refreshGameState, refreshPlayerData, refreshFundPools, refreshCarRace, refreshPlayerItems]);

  /**
   * 加载配置数据（仅在初始化时加载一次）
   */
  const loadConfig = useCallback(async () => {
    try {
      const [baseItemPrice, maxItemPrice, maxPlayers] = await Promise.all([
        raceGameClient.getBaseItemPrice(),
        raceGameClient.getMaxItemPrice(),
        raceGameClient.getMaxPlayers(),
      ]);

      setData(prev => ({
        ...prev,
        baseItemPrice,
        maxItemPrice,
        maxPlayers,
      }));
    } catch (err) {
      console.error('加载配置失败:', err);
    }
  }, []);

  // 初始化：加载配置和首次数据
  useEffect(() => {
    if (opts.loadOnMount) {
      loadConfig();
      refresh();
    }
  }, []); // 仅在组件挂载时执行一次

  // 自动刷新
  useEffect(() => {
    if (!opts.autoRefresh) {
      return;
    }

    // 清除之前的定时器
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // 设置新的定时器
    refreshTimerRef.current = setInterval(() => {
      refresh();
    }, opts.refreshInterval);

    // 清理函数
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [opts.autoRefresh, opts.refreshInterval, refresh]);

  // 当玩家地址改变时，重新加载玩家数据
  useEffect(() => {
    if (opts.playerAddress) {
      refreshPlayerData();
      refreshPlayerItems();
    }
  }, [opts.playerAddress]);

  return {
    ...data,
    loading,
    error,
    lastUpdated,
    refresh,
    refreshGameState,
    refreshPlayerData,
    refreshFundPools,
    refreshCarRace,
    refreshPlayerItems,
  };
}

/**
 * 仅查询游戏状态的轻量级 Hook
 */
export function useGameState(options?: Omit<UseRaceGameContractOptions, 'playerAddress'>) {
  const { gameState, currentItemPrice, loading, error, refreshGameState, lastUpdated } = useRaceGameContract({
    ...options,
    playerAddress: null,
  });

  // 计算倒计时
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!gameState || gameState.state !== 1) {
      setCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, gameState.endTime - now);
      setCountdown(remaining);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  return {
    gameState,
    currentItemPrice,
    countdown,
    loading,
    error,
    refresh: refreshGameState,
    lastUpdated,
  };
}

/**
 * 仅查询玩家数据的 Hook
 */
export function usePlayerData(playerAddress: string | null, options?: UseRaceGameContractOptions) {
  const { playerData, playerItems, loading, error, refreshPlayerData, refreshPlayerItems, lastUpdated } = useRaceGameContract({
    ...options,
    playerAddress,
  });

  return {
    playerData,
    playerItems,
    loading,
    error,
    refresh: async () => {
      await refreshPlayerData();
      await refreshPlayerItems();
    },
    refreshPlayerData,
    refreshPlayerItems,
    lastUpdated,
  };
}

/**
 * 仅查询资金池的 Hook
 */
export function useFundPools(options?: Omit<UseRaceGameContractOptions, 'playerAddress'>) {
  const {
    prizePool,
    communityPool,
    reservePool,
    totalInvested,
    distributionConfig,
    loading,
    error,
    refreshFundPools,
    lastUpdated,
  } = useRaceGameContract({
    ...options,
    playerAddress: null,
  });

  return {
    prizePool,
    communityPool,
    reservePool,
    totalInvested,
    distributionConfig,
    loading,
    error,
    refresh: refreshFundPools,
    lastUpdated,
  };
}

/**
 * 仅查询车辆竞速状态的 Hook
 */
export function useCarRace(options?: Omit<UseRaceGameContractOptions, 'playerAddress'>) {
  const { car1, car2, speedGap, leadingCar, loading, error, refreshCarRace, lastUpdated } = useRaceGameContract({
    ...options,
    playerAddress: null,
  });

  return {
    car1,
    car2,
    speedGap,
    leadingCar,
    loading,
    error,
    refresh: refreshCarRace,
    lastUpdated,
  };
}

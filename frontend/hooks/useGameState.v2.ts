/**
 * useGameState Hook (v2 - 使用封装的合约客户端)
 *
 * 这是使用新的 RaceGameClient 的版本
 * 提供更简洁的 API 和更好的类型安全
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRaceGameContract, useGameState as useGameStateOnly } from './useRaceGameContract';
import { raceGameClient } from '@/lib/contract/RaceGameClient';

interface GameStateV2 {
  state: number;
  startTime: number;
  endTime: number;
  totalItems: number;
  countdown: number;
  itemPrice: number;
  currentPlayers: number;
  maxPlayers: number;
}

interface MyDataV2 {
  invested: number;
  boost: number;
  itemCount: number;
  rewardBalance: number;
  referrer: string | null;
  referralRewards: number;
  referralCount: number;
  name: string | null;
}

interface DistributionConfigV2 {
  prizePoolPercent: number;
  communityPercent: number;
  reservePercent: number;
}

/**
 * 使用新的合约客户端的 useGameState Hook
 */
export function useGameStateV2(playerAddress?: string | null) {
  // 使用封装好的合约 Hook
  const {
    gameState: contractGameState,
    playerData: contractPlayerData,
    prizePool: contractPrizePool,
    communityPool: contractCommunityPool,
    reservePool: contractReservePool,
    totalInvested: contractTotalInvested,
    distributionConfig: contractDistributionConfig,
    car1,
    car2,
    speedGap: contractSpeedGap,
    leadingCar: contractLeadingCar,
    loading,
    error,
    refresh,
    refreshGameState,
    refreshPlayerData,
    refreshFundPools,
    refreshCarRace,
  } = useRaceGameContract({
    autoRefresh: true,
    refreshInterval: 3000,
    playerAddress,
  });

  // 转换为旧版 API 格式（保持向后兼容）
  const [gameState, setGameState] = useState<GameStateV2>({
    state: 0,
    startTime: 0,
    endTime: 0,
    totalItems: 0,
    countdown: 0,
    itemPrice: 20000000,  // 0.02 TON base price
    currentPlayers: 0,
    maxPlayers: 50,
  });

  const [myData, setMyData] = useState<MyDataV2>({
    invested: 0,
    boost: 0,
    itemCount: 0,
    rewardBalance: 0,
    referrer: null,
    referralRewards: 0,
    referralCount: 0,
    name: null,
  });

  const [prizePool, setPrizePool] = useState(0);
  const [communityPool, setCommunityPool] = useState(0);
  const [reservePool, setReservePool] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);

  const [distributionConfig, setDistributionConfig] = useState<DistributionConfigV2>({
    prizePoolPercent: 60,
    communityPercent: 20,
    reservePercent: 20,
  });

  const [car1Speed, setCar1Speed] = useState(100);
  const [car2Speed, setCar2Speed] = useState(100);
  const [speedGap, setSpeedGap] = useState(0);
  const [leadingCar, setLeadingCar] = useState(0);

  // 倒计时状态（每秒更新）
  useEffect(() => {
    if (!contractGameState || contractGameState.state !== 1) {
      return;
    }

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, contractGameState.endTime - now);

      setGameState(prev => ({
        ...prev,
        countdown: remaining,
      }));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [contractGameState]);

  // 同步合约数据到本地状态
  useEffect(() => {
    if (contractGameState) {
      setGameState(prev => ({
        ...prev,
        state: contractGameState.state,
        startTime: contractGameState.startTime,
        endTime: contractGameState.endTime,
        totalItems: contractGameState.totalItems,
        currentPlayers: contractGameState.totalPlayers,
      }));
    }
  }, [contractGameState]);

  useEffect(() => {
    if (contractPlayerData) {
      setMyData({
        invested: Number(raceGameClient.formatTon(contractPlayerData.totalInvested)) * 1e9,
        boost: contractPlayerData.totalBoost,
        itemCount: contractPlayerData.itemCount,
        rewardBalance: Number(raceGameClient.formatTon(contractPlayerData.rewardBalance)) * 1e9,
        referrer: contractPlayerData.referrer,
        referralRewards: Number(raceGameClient.formatTon(contractPlayerData.referralRewards)) * 1e9,
        referralCount: contractPlayerData.referralCount,
        name: contractPlayerData.name,
      });
    }
  }, [contractPlayerData]);

  useEffect(() => {
    setPrizePool(Number(raceGameClient.formatTon(contractPrizePool)) * 1e9);
    setCommunityPool(Number(raceGameClient.formatTon(contractCommunityPool)) * 1e9);
    setReservePool(Number(raceGameClient.formatTon(contractReservePool)) * 1e9);
    setTotalInvested(Number(raceGameClient.formatTon(contractTotalInvested)) * 1e9);
  }, [contractPrizePool, contractCommunityPool, contractReservePool, contractTotalInvested]);

  useEffect(() => {
    if (contractDistributionConfig) {
      setDistributionConfig(contractDistributionConfig);
    }
  }, [contractDistributionConfig]);

  useEffect(() => {
    if (car1) {
      setCar1Speed(car1.currentSpeed);
    }
    if (car2) {
      setCar2Speed(car2.currentSpeed);
    }
    setSpeedGap(contractSpeedGap);
    setLeadingCar(contractLeadingCar);
  }, [car1, car2, contractSpeedGap, contractLeadingCar]);

  // 旧版 API（保持向后兼容）
  const updateGameState = useCallback(async () => {
    await refreshGameState();
  }, [refreshGameState]);

  const updateMyData = useCallback(async () => {
    await refreshPlayerData();
  }, [refreshPlayerData]);

  const updateFundDistribution = useCallback(async () => {
    await refreshFundPools();
  }, [refreshFundPools]);

  const updateCarRace = useCallback(async () => {
    await refreshCarRace();
  }, [refreshCarRace]);

  return {
    // 数据
    gameState,
    myData,
    prizePool,
    communityPool,
    reservePool,
    totalInvested,
    distributionConfig,
    distributionStatus: null,
    minGasReserve: 50000000,
    car1Speed,
    car2Speed,
    speedGap,
    leadingCar,

    // 状态
    loading,
    error,

    // 方法（旧版 API）
    updateGameState,
    updateMyData,
    updateFundDistribution,
    updateCarRace,

    // 方法（新版 API）
    refresh,
    refreshGameState,
    refreshPlayerData,
    refreshFundPools,
    refreshCarRace,

    // Setters（保持向后兼容）
    setGameState,
    setMyData,
    setPrizePool,
    setCommunityPool,
    setReservePool,
    setTotalInvested,
    setCar1Speed,
    setCar2Speed,
    setSpeedGap,
    setLeadingCar,
  };
}

'use client'

import { useState, useCallback } from 'react'
import { raceGameClient } from '@/lib/contract/RaceGameClient'
import { useTonConnect } from '@/components/TonConnectProvider'

export function useGameState() {
  const { wallet } = useTonConnect()
  const [gameState, setGameState] = useState({
    state: 0,
    startTime: 0,
    endTime: 0,
    totalItems: 0,
    countdown: 0,
    itemPrice: 20000000,  // 0.02 TON base price
    currentPlayers: 0,
    maxPlayers: 50,  // 默认50玩家上限
  })

  const [myData, setMyData] = useState({
    invested: 0,
    boost: 0,
    itemCount: 0,
    rewardBalance: 0,  // 总待提现金额（包括大奖奖励和推荐奖励）
    referrer: null as string | null,  // 推荐人地址
    referralRewards: 0,  // 累计推荐奖励
    referralCount: 0,  // 推荐人数
    name: null as string | null,  // 玩家名字
  })

  const [prizePool, setPrizePool] = useState(0)
  const [communityPool, setCommunityPool] = useState(0)
  const [reservePool, setReservePool] = useState(0)
  const [totalInvested, setTotalInvested] = useState(0)

  const [distributionConfig, setDistributionConfig] = useState({
    prizePoolPercent: 60,
    communityPercent: 20,
    reservePercent: 20,
  })

  // 分配状态说明
  const [distributionStatus, setDistributionStatus] = useState<string | null>(null)
  const [minGasReserve, setMinGasReserve] = useState(50000000)  // 默认0.05 TON

  // 双车竞速状态
  const [car1Speed, setCar1Speed] = useState(100)
  const [car2Speed, setCar2Speed] = useState(100)
  const [speedGap, setSpeedGap] = useState(0)
  const [leadingCar, setLeadingCar] = useState(0)  // 0=平局, 1=Car1, 2=Car2

  const updateGameState = useCallback(async () => {
    try {
      // 从合约获取游戏状态
      const state = await raceGameClient.getGameState()
      const currentItemPrice = await raceGameClient.calculateItemPrice()
      const maxPlayers = await raceGameClient.getMaxPlayers()

      // 计算倒计时
      const now = Math.floor(Date.now() / 1000)
      const countdown = state.state === 1 ? Math.max(0, state.endTime - now) : 0

      setGameState({
        state: state.state,
        startTime: state.startTime,
        endTime: state.endTime,
        totalItems: state.totalItems,
        countdown,
        itemPrice: Number(currentItemPrice),
        currentPlayers: state.totalPlayers,
        maxPlayers,
      })
    } catch (error) {
      console.error('更新游戏状态失败:', error)
    }
  }, [])

  const updateMyData = useCallback(async () => {
    if (!wallet) {
      // 未连接钱包时，重置为默认值
      setMyData({
        invested: 0,
        boost: 0,
        itemCount: 0,
        rewardBalance: 0,
        referrer: null,
        referralRewards: 0,
        referralCount: 0,
        name: null,
      })
      return
    }

    try {
      // 从合约获取玩家数据
      const playerData = await raceGameClient.getPlayerData(wallet)

      if (playerData) {
        setMyData({
          invested: Number(raceGameClient.formatTon(playerData.totalInvested)) * 1e9,
          boost: playerData.totalBoost,
          itemCount: playerData.itemCount,
          rewardBalance: Number(raceGameClient.formatTon(playerData.rewardBalance)) * 1e9,
          referrer: playerData.referrer,
          referralRewards: Number(raceGameClient.formatTon(playerData.referralRewards)) * 1e9,
          referralCount: playerData.referralCount,
          name: playerData.name,
        })
      }
    } catch (error) {
      console.error('更新我的数据失败:', error)
    }
  }, [wallet])

  const updateFundDistribution = useCallback(async () => {
    try {
      // TODO: 调用合约的get方法
      // const pool = await contract.getPrizePool()
      // const community = await contract.getCommunityPool()
      // const reserve = await contract.getReservePool()
      // const invested = await contract.getTotalInvested()
      // const config = await contract.getDistributionConfig()
      // const status = await contract.getDistributionStatus()
      // const minGas = await contract.getMinGasReserve()
      
      // setPrizePool(pool)
      // setCommunityPool(community)
      // setReservePool(reserve)
      // setTotalInvested(invested)
      // setDistributionConfig(config)
      // setDistributionStatus(status)
      // setMinGasReserve(minGas)
    } catch (error) {
      console.error('更新资金分配失败:', error)
    }
  }, [])

  const updateCarRace = useCallback(async () => {
    try {
      // TODO: 调用合约的getCar1、getCar2、getSpeedGap、getLeadingCar方法
      // const car1 = await contract.getCar1()
      // const car2 = await contract.getCar2()
      // const gap = await contract.getSpeedGap()
      // const leading = await contract.getLeadingCar()
      
      // setCar1Speed(car1.currentSpeed)
      // setCar2Speed(car2.currentSpeed)
      // setSpeedGap(gap)
      // setLeadingCar(leading)
      
      // 模拟数据（实际应该从合约获取）
      // 这里保持当前值，实际应该从合约读取
    } catch (error) {
      console.error('更新双车竞速状态失败:', error)
    }
  }, [])

  return {
    gameState,
    myData,
    prizePool,
    communityPool,
    reservePool,
    totalInvested,
    distributionConfig,
    distributionStatus,
    minGasReserve,
    car1Speed,
    car2Speed,
    speedGap,
    leadingCar,
    updateGameState,
    updateMyData,
    updateFundDistribution,
    updateCarRace,
    setGameState,
    setMyData,
    setPrizePool,
    setCommunityPool,
    setReservePool,
    setTotalInvested,
    setDistributionStatus,
    setMinGasReserve,
    setCar1Speed,
    setCar2Speed,
    setSpeedGap,
    setLeadingCar,
  }
}


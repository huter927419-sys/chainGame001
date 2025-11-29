'use client'

import { useEffect, useState } from 'react'
import Header from './Header'
import GameStatus from './GameStatus'
import CarRace from './CarRace'
import ItemSection from './ItemSection'
import MyData from './MyData'
import FundDistribution from './FundDistribution'
import Leaderboard from './Leaderboard'
import ReferralLink from './ReferralLink'
import RegisterName from './RegisterName'
import ItemBag from './ItemBag'
import { useTonConnect } from './TonConnectProvider'
import { useGameState } from '@/hooks/useGameState'

export default function GameContainer() {
  const { connected, wallet } = useTonConnect()
  const [referrer, setReferrer] = useState<string | null>(null)

  // 从URL参数读取推荐人地址
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref')
      if (ref) {
        setReferrer(ref)
        // 可选：将推荐人地址保存到localStorage，以便后续使用
        localStorage.setItem('referrer', ref)
      } else {
        // 如果没有URL参数，尝试从localStorage读取（用于后续购买）
        const storedRef = localStorage.getItem('referrer')
        if (storedRef) {
          setReferrer(storedRef)
        }
      }
    }
  }, [])
  const {
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
    setMyData,
  } = useGameState()
  
  const [items, setItems] = useState<any[]>([])

  const handleNameRegistered = () => {
    // 名字注册成功后，刷新玩家数据
    updateMyData()
  }

  const handleItemUsed = () => {
    // 道具使用成功后，刷新道具背包和玩家数据
    updateMyData()
    // TODO: 刷新道具背包
  }

  // 获取道具背包（TODO: 实际应该从合约获取）
  useEffect(() => {
    if (connected && wallet) {
      // TODO: 调用合约的getPlayerItemCount和getPlayerItem来获取道具列表
      // 这里使用模拟数据
      // const itemCount = await contract.getPlayerItemCount(wallet)
      // const items = []
      // for (let i = 1; i <= itemCount; i++) {
      //   const item = await contract.getPlayerItem(wallet, i)
      //   if (item) items.push(item)
      // }
      // setItems(items)
    }
  }, [connected, wallet, myData])

  useEffect(() => {
    // 初始化时更新一次
    updateGameState()
    updateMyData()
    updateFundDistribution()
    updateCarRace()

    // 每2秒更新一次（更频繁更新以显示实时速度）
    const interval = setInterval(() => {
      updateGameState()
      updateMyData()
      updateFundDistribution()
      updateCarRace()
    }, 2000)

    return () => clearInterval(interval)
  }, [updateGameState, updateMyData, updateFundDistribution, updateCarRace])

  return (
    <div className="max-w-7xl mx-auto">
      <Header />
      
      {/* 名字注册（仅当钱包已连接时显示） */}
      {connected && (
        <RegisterName 
          connected={connected}
          currentName={myData.name}
          onNameRegistered={handleNameRegistered}
        />
      )}
      
      {/* 推荐链接（仅当钱包已连接时显示） */}
      {connected && wallet && (
        <ReferralLink 
          walletAddress={wallet}
          playerName={myData.name}
        />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">
        {/* 游戏状态 */}
        <GameStatus 
          gameState={gameState.state}
          countdown={gameState.countdown}
          totalItems={gameState.totalItems}
          currentPlayers={gameState.currentPlayers}
          maxPlayers={gameState.maxPlayers}
        />

        {/* 双车竞速状态 */}
        <CarRace 
          car1Speed={car1Speed}
          car2Speed={car2Speed}
          speedGap={speedGap}
          leadingCar={leadingCar}
        />

        {/* 道具购买区 */}
        <ItemSection 
          gameState={gameState.state}
          itemPrice={gameState.itemPrice}
          totalItems={gameState.totalItems}
          connected={connected}
          currentPlayers={gameState.currentPlayers}
          maxPlayers={gameState.maxPlayers}
          referrer={referrer}
        />

        {/* 我的数据 */}
        <MyData 
          myData={myData}
          connected={connected}
        />
      </div>

      {/* 道具背包（仅当钱包已连接时显示） */}
      {connected && (
        <ItemBag 
          items={items}
          connected={connected}
          onItemUsed={handleItemUsed}
        />
      )}

      {/* 资金分配系统 */}
      <FundDistribution
        distributionConfig={distributionConfig}
        prizePool={prizePool}
        communityPool={communityPool}
        reservePool={reservePool}
        totalInvested={totalInvested}
        distributionStatus={distributionStatus}
        minGasReserve={minGasReserve}
      />

      {/* 排行榜 */}
      <Leaderboard ranks={[]} />
    </div>
  )
}


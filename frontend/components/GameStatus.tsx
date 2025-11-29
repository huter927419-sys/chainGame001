'use client'

import { useEffect, useState } from 'react'

interface GameStatusProps {
  gameState: number
  countdown: number
  totalItems: number
  currentPlayers?: number
  maxPlayers?: number
}

export default function GameStatus({ gameState, countdown, totalItems, currentPlayers = 0, maxPlayers = 50 }: GameStatusProps) {
  const [displayCountdown, setDisplayCountdown] = useState('00:00')

  useEffect(() => {
    if (countdown > 0) {
      const minutes = Math.floor(countdown / 60)
      const seconds = countdown % 60
      setDisplayCountdown(
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      )
    } else {
      setDisplayCountdown('00:00')
    }
  }, [countdown])

  const stateText = {
    0: '未开始',
    1: '进行中',
    2: '已结束'
  }

  return (
    <div className={`grid gap-5 mb-5 ${maxPlayers > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
      <div className="bg-white/5 p-5 rounded-2xl text-center backdrop-blur-lg border border-white/10">
        <h3 className="text-sm text-gray-400 uppercase mb-2">游戏状态</h3>
        <div className="text-2xl font-bold text-green-400">
          {stateText[gameState as keyof typeof stateText] || '未知'}
        </div>
      </div>
      
      <div className="bg-white/5 p-5 rounded-2xl text-center backdrop-blur-lg border border-white/10">
        <h3 className="text-sm text-gray-400 uppercase mb-2">剩余时间</h3>
        <div className="text-4xl font-bold text-yellow-400 font-mono">
          {displayCountdown}
        </div>
      </div>
      
      <div className="bg-white/5 p-5 rounded-2xl text-center backdrop-blur-lg border border-white/10">
        <h3 className="text-sm text-gray-400 uppercase mb-2">总道具数</h3>
        <div className="text-3xl font-bold text-blue-400">
          {totalItems}
        </div>
      </div>
      
      {maxPlayers > 0 && (
        <div className="bg-white/5 p-5 rounded-2xl text-center backdrop-blur-lg border border-white/10">
          <h3 className="text-sm text-gray-400 uppercase mb-2">玩家数</h3>
          <div className="text-2xl font-bold text-purple-400">
            {currentPlayers} / {maxPlayers}
          </div>
          {currentPlayers >= maxPlayers && (
            <div className="text-xs text-red-400 mt-1">已满员</div>
          )}
        </div>
      )}
    </div>
  )
}


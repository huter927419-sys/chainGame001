'use client'

import { useTonConnectUI } from '@tonconnect/ui-react'
import { useTelegram } from '@/hooks/useTelegram'

export default function Header() {
  const { connected, wallet, setConnectRequestParameters, disconnect } = useTonConnectUI()
  const { webApp, user } = useTelegram()

  const handleConnect = () => {
    setConnectRequestParameters({ state: 'ready' })
  }

  const handleDisconnect = async () => {
    await disconnect()
  }

  return (
    <header className="flex justify-between items-center mb-8 p-5 bg-white/5 rounded-2xl backdrop-blur-lg border border-white/10">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-red-300 bg-clip-text text-transparent">
        🏎️ F1 赛车竞速游戏
      </h1>
      
      <div className="flex items-center gap-4">
        {!connected ? (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleConnect}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-lg font-bold uppercase tracking-wide hover:shadow-lg hover:scale-105 transition-all"
            >
              <span className="mr-2">🔗</span>
              连接TON钱包
            </button>
            <p className="text-xs text-gray-400">请连接钱包以开始游戏</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-xl">
            <span className="text-xl">✅</span>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">已连接</span>
              <span className="text-sm font-mono text-green-400">
                {wallet?.account?.address?.slice(0, 6)}...{wallet?.account?.address?.slice(-4)}
              </span>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              断开连接
            </button>
          </div>
        )}
      </div>
    </header>
  )
}


'use client'

import { useState } from 'react'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { beginCell } from '@ton/core'

interface MyDataProps {
  myData: {
    invested: number
    boost: number
    itemCount: number
    rewardBalance: number  // 总待提现金额（包括大奖奖励和推荐奖励）
    referrer: string | null  // 推荐人地址
    referralRewards: number  // 累计推荐奖励
    referralCount: number  // 推荐人数
    name: string | null  // 玩家名字
  }
  connected: boolean
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS_HERE'

export default function MyData({ myData, connected }: MyDataProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ message: string; success: boolean } | null>(null)
  const { sendTransaction } = useTonConnectUI()

  const buildWithdrawMessage = () => {
    const op = 0x77647277 // "wdrw"
    try {
      const cell = beginCell()
        .storeUint(op, 32)
        .endCell()
      return cell.toBoc().toString('base64')
    } catch (error) {
      const buffer = new ArrayBuffer(4)
      const view = new DataView(buffer)
      view.setUint32(0, op, false)
      return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    }
  }

  const handleWithdraw = async () => {
    if (!connected) {
      setResult({ message: '请先连接钱包', success: false })
      return
    }

    if (myData.rewardBalance <= 0) {
      setResult({ message: '没有可提取的奖金', success: false })
      return
    }

    try {
      setLoading(true)

      const message = {
        address: CONTRACT_ADDRESS,
        amount: '0',
        payload: buildWithdrawMessage(),
      }

      await sendTransaction({
        messages: [message],
        validUntil: Math.floor(Date.now() / 1000) + 300,
      })

      setResult({ message: '提取成功！', success: true })
      
      setTimeout(() => {
        setResult(null)
      }, 3000)
    } catch (error: any) {
      setResult({ message: `提取失败: ${error.message}`, success: false })
      setTimeout(() => {
        setResult(null)
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-lg border border-white/10 mb-5">
      <h2 className="text-2xl font-bold mb-4">我的数据</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-black/30 p-4 rounded-xl text-center">
          <span className="text-xs text-gray-400 uppercase block mb-2">总投入</span>
          <span className="text-xl font-bold text-blue-400">
            {(myData.invested / 1000000000).toFixed(4)} TON
          </span>
        </div>
        
        <div className="bg-black/30 p-4 rounded-xl text-center">
          <span className="text-xs text-gray-400 uppercase block mb-2">总加速</span>
          <span className="text-xl font-bold text-blue-400">
            {myData.boost > 0 ? '+' : ''}{myData.boost}
          </span>
        </div>
        
        <div className="bg-black/30 p-4 rounded-xl text-center">
          <span className="text-xs text-gray-400 uppercase block mb-2">道具数</span>
          <span className="text-xl font-bold text-blue-400">
            {myData.itemCount}
          </span>
        </div>
        
        <div className="bg-black/30 p-4 rounded-xl text-center">
          <span className="text-xs text-gray-400 uppercase block mb-2">可提取奖金</span>
          <span className="text-xl font-bold text-green-400">
            {(myData.rewardBalance / 1000000000).toFixed(4)} TON
          </span>
        </div>
      </div>

      {/* 推荐奖励统计 */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded-xl mb-4 border border-purple-500/30">
        <h3 className="text-lg font-bold mb-3 text-purple-300">推荐奖励</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <span className="text-xs text-gray-400 uppercase block mb-1">累计推荐奖励</span>
            <span className="text-lg font-bold text-purple-300">
              {(myData.referralRewards / 1000000000).toFixed(4)} TON
            </span>
          </div>
          <div className="text-center">
            <span className="text-xs text-gray-400 uppercase block mb-1">推荐人数</span>
            <span className="text-lg font-bold text-purple-300">
              {myData.referralCount}
            </span>
          </div>
        </div>
        {myData.referrer && (
          <div className="mt-3 text-center">
            <span className="text-xs text-gray-400">我的推荐人: </span>
            <span className="text-xs text-purple-300 font-mono">
              {myData.referrer.slice(0, 6)}...{myData.referrer.slice(-4)}
            </span>
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={handleWithdraw}
          disabled={loading || myData.rewardBalance <= 0 || !connected}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? '提取中...' : '提取奖金'}
        </button>
      </div>

      {result && (
        <div className={`mt-4 p-4 rounded-xl text-center font-bold ${
          result.success 
            ? 'bg-green-500/20 text-green-400 border border-green-500' 
            : 'bg-red-500/20 text-red-400 border border-red-500'
        }`}>
          {result.message}
        </div>
      )}
    </div>
  )
}


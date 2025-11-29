'use client'

import { useState } from 'react'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { beginCell } from '@ton/core'

interface RegisterNameProps {
  connected: boolean
  currentName: string | null
  onNameRegistered: () => void
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS_HERE'

export default function RegisterName({ connected, currentName, onNameRegistered }: RegisterNameProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ message: string; success: boolean } | null>(null)
  const { sendTransaction } = useTonConnectUI()

  const buildRegisterNameMessage = (playerName: string) => {
    const op = 0x72676e6d // "rgnm" - register name
    try {
      const cell = beginCell()
        .storeUint(op, 32)
        .storeRef(beginCell().storeStringTail(playerName).endCell())  // 使用storeStringTail存储UTF-8字符串
        .endCell()
      return cell.toBoc().toString('base64')
    } catch (error) {
      console.error('构建消息失败:', error)
      throw error
    }
  }

  const handleRegister = async () => {
    if (!connected) {
      setResult({ message: '请先连接钱包', success: false })
      return
    }

    if (!name.trim()) {
      setResult({ message: '请输入名字', success: false })
      return
    }

    if (name.length > 50) {
      setResult({ message: '名字长度不能超过50个字符', success: false })
      return
    }

    try {
      setLoading(true)

      const message = {
        address: CONTRACT_ADDRESS,
        amount: '0',  // 注册名字需要支付gas费，但不需要额外金额
        payload: buildRegisterNameMessage(name.trim()),
      }

      await sendTransaction({
        messages: [message],
        validUntil: Math.floor(Date.now() / 1000) + 300,
      })

      setResult({ message: '名字注册成功！', success: true })
      setName('')
      
      setTimeout(() => {
        setResult(null)
        onNameRegistered()
      }, 2000)
    } catch (error: any) {
      setResult({ message: `注册失败: ${error.message}`, success: false })
      setTimeout(() => {
        setResult(null)
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  if (currentName) {
    return (
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-6 rounded-2xl backdrop-blur-lg border border-blue-500/30 mb-5">
        <h2 className="text-2xl font-bold mb-4 text-blue-300">我的名字</h2>
        <div className="text-center">
          <div className="bg-black/30 p-4 rounded-xl mb-4">
            <span className="text-2xl font-bold text-blue-300">{currentName}</span>
          </div>
          <p className="text-sm text-gray-400">名字已注册</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-6 rounded-2xl backdrop-blur-lg border border-blue-500/30 mb-5">
      <h2 className="text-2xl font-bold mb-4 text-blue-300">注册名字</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-300 mb-2">
          注册你的游戏名字（支持中文、日文、韩文、英文和表情符号）
        </p>
        <p className="text-xs text-gray-400 mb-4">
          • 名字长度：1-50个字符<br/>
          • 注册需要支付gas费<br/>
          • 注册名字后，推荐奖励才会发放给你
        </p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入你的名字..."
          maxLength={50}
          className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <div className="text-xs text-gray-400 mt-2 text-right">
          {name.length} / 50
        </div>
      </div>

      <button
        onClick={handleRegister}
        disabled={loading || !name.trim() || !connected}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-bold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? '注册中...' : '注册名字（支付gas费）'}
      </button>

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


'use client'

import { useState } from 'react'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { beginCell } from '@ton/core'

interface ItemSectionProps {
  gameState: number
  itemPrice: number
  totalItems: number
  connected: boolean
  currentPlayers?: number
  maxPlayers?: number
  referrer?: string | null  // 推荐人地址（从URL参数获取）
}

interface ItemEffect {
  itemId: number
  multiplier: number
  effectType: number  // 0=加速, 1=减速
  effectValue: number
  strategy?: number  // 使用的策略（0-3）
  cashbackAmount?: number  // 返现金额
  finalPrice?: number  // 实际支付价格
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS_HERE'

export default function ItemSection({ gameState, itemPrice, totalItems, connected, currentPlayers = 0, maxPlayers = 50, referrer = null }: ItemSectionProps) {
  const [loading, setLoading] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<number>(1)  // 默认平衡策略
  const [result, setResult] = useState<{ message: string; success: boolean; effect?: ItemEffect } | null>(null)
  const { sendTransaction } = useTonConnectUI()
  
  // 策略配置
  const strategies = [
    {
      id: 0,
      name: '保守策略',
      description: '高返现10%，价格不变',
      cashback: 10,
      priceDiscount: 0,
      icon: '🛡️',
      iconBg: 'bg-blue-500/30',
      iconBorder: 'border-blue-400',
      iconColor: 'text-blue-300'
    },
    {
      id: 1,
      name: '平衡策略',
      description: '标准返现5%，价格不变',
      cashback: 5,
      priceDiscount: 0,
      icon: '⚖️',
      iconBg: 'bg-purple-500/30',
      iconBorder: 'border-purple-400',
      iconColor: 'text-purple-300'
    },
    {
      id: 2,
      name: '激进策略',
      description: '低返现2%，价格降低5%',
      cashback: 2,
      priceDiscount: 5,
      icon: '⚡',
      iconBg: 'bg-yellow-500/30',
      iconBorder: 'border-yellow-400',
      iconColor: 'text-yellow-300'
    },
    {
      id: 3,
      name: '幸运策略',
      description: '返现3%，10%概率双倍效果',
      cashback: 3,
      priceDiscount: 0,
      icon: '🍀',
      iconBg: 'bg-green-500/30',
      iconBorder: 'border-green-400',
      iconColor: 'text-green-300'
    }
  ]

  const calculateItemPrice = () => {
    const basePrice = 20000000 // 0.02 TON (20,000,000 nanoTON)
    const maxItems = 1000
    const ratio = (totalItems * 100) / maxItems
    const ratioSquared = (ratio * ratio) / 100
    const multiplier = 100 + ratioSquared
    return Math.floor((basePrice * multiplier) / 100)
  }

  const buildBuyItemMessage = (referrerAddr: string | null, strategy: number) => {
    const op = 0x62796974 // "byit"
    try {
      const cell = beginCell()
        .storeUint(op, 32)
        
      // 先编码推荐人地址（BuyItemMessage的第一个字段）
      if (referrerAddr) {
        try {
          const { Address } = require('@ton/core')
          const referrerAddress = Address.parse(referrerAddr)
          cell.storeMaybeRef(beginCell().storeAddress(referrerAddress).endCell())
        } catch (e) {
          // 如果解析失败，不添加推荐人
          cell.storeMaybeRef(null)
        }
      } else {
        cell.storeMaybeRef(null)
      }
      
      // 然后编码策略（BuyItemMessage的第二个字段）
      cell.storeUint(strategy, 8)  // 策略ID（0-3）
      
      return cell.endCell().toBoc().toString('base64')
    } catch (error) {
      // 降级方案：使用简单编码（注意顺序：referrer在前，strategy在后）
      const buffer = new ArrayBuffer(5)
      const view = new DataView(buffer)
      view.setUint32(0, op, false)
      view.setUint8(4, strategy)
      return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    }
  }
  
  // 计算策略价格和返现
  const calculateStrategyPrice = (basePrice: number, strategyId: number) => {
    const strategy = strategies[strategyId]
    const finalPrice = strategy.priceDiscount > 0 
      ? Math.floor(basePrice * (100 - strategy.priceDiscount) / 100)
      : basePrice
    const cashback = Math.floor(finalPrice * strategy.cashback / 100)
    return { finalPrice, cashback }
  }

  const handleBuyItem = async () => {
    if (!connected) {
      setResult({ message: '请先连接钱包', success: false })
      return
    }

    if (gameState !== 1) {
      setResult({ message: '游戏未进行中', success: false })
      return
    }
    
    // 检查玩家数量上限
    if (maxPlayers > 0 && currentPlayers >= maxPlayers) {
      setResult({ message: `玩家数量已达上限（${maxPlayers}人），无法购买道具`, success: false })
      return
    }

    try {
      setLoading(true)
      const basePrice = calculateItemPrice()
      const { finalPrice, cashback } = calculateStrategyPrice(basePrice, selectedStrategy)

      const message = {
        address: CONTRACT_ADDRESS,
        amount: finalPrice.toString(),  // 使用策略调整后的价格
        payload: buildBuyItemMessage(referrer, selectedStrategy),
      }

      const result = await sendTransaction({
        messages: [message],
        validUntil: Math.floor(Date.now() / 1000) + 300,
      })

      // 模拟从交易结果中解析道具效果（实际应该从合约事件或查询获取）
      // 这里使用随机生成来演示
      const randomSeed = Date.now()
      const multiplierType = randomSeed % 4
      const multipliers = [1, 2, 5, 10][multiplierType]
      const effectType = randomSeed % 2
      const effectValue = effectType === 0 ? multipliers : -multipliers

      const effect: ItemEffect = {
        itemId: Math.floor(Math.random() * 1000000),  // 模拟itemId
        multiplier: multipliers,
        effectType: effectType,
        effectValue: effectValue,
        strategy: selectedStrategy,
        cashbackAmount: cashback,
        finalPrice: finalPrice
      }

      const effectText = effectType === 0 
        ? `加速 ${multipliers}X` 
        : `减速 ${multipliers}X`
      
      const strategyName = strategies[selectedStrategy].name
      
      setResult({ 
        message: `购买成功！获得${effectText}道具，已添加到背包。使用${strategyName}，获得返现${(cashback / 10000000).toFixed(6)} TON`, 
        success: true,
        effect: effect
      })
      
      setTimeout(() => {
        setResult(null)
      }, 5000)
    } catch (error: any) {
      setResult({ message: `购买失败: ${error.message}`, success: false })
      setTimeout(() => {
        setResult(null)
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-lg border border-white/10 mb-5">
      <h2 className="text-2xl font-bold mb-4">购买道具</h2>
      
      <div className="bg-black/30 p-4 rounded-xl mb-4 text-sm space-y-2">
        <p className="text-cyan-400 font-semibold">📌 基础价格：0.02 TON（最高可达 1 TON）</p>
        <p>道具效果：随机生成加速或减速（1X/2X/5X/10X）</p>
        <p>价格算法：椭圆曲线算法（购买越多，价格越高）</p>
        <p className="text-yellow-400">⚠️ 购买前无法知道是加速还是减速（盲盒机制）</p>
        <p className="text-blue-400">💡 购买的道具会存储到背包，可以在背包中选择使用</p>
        <p className="text-green-400">💰 购买后立即获得返现，返现已添加到可提取余额</p>
      </div>

      {/* 策略选择 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-3">选择购买策略：</label>
        <div className="grid grid-cols-2 gap-3">
          {strategies.map((strategy) => {
            const { finalPrice, cashback } = calculateStrategyPrice(calculateItemPrice(), strategy.id)
            return (
              <button
                key={strategy.id}
                onClick={() => setSelectedStrategy(strategy.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${
                  selectedStrategy === strategy.id
                    ? `${strategy.iconBorder} ${strategy.iconBg} scale-105 shadow-lg shadow-blue-500/50`
                    : 'border-gray-600 bg-black/30 hover:border-gray-500 hover:scale-102'
                }`}
              >
                {/* 选中状态的背景光效 */}
                {selectedStrategy === strategy.id && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${strategy.iconBg} opacity-50 blur-xl`}></div>
                )}
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    {/* 图标容器 - 更明显 */}
                    <div className={`w-12 h-12 rounded-xl ${strategy.iconBg} border-2 ${strategy.iconBorder} flex items-center justify-center text-3xl shadow-lg ${
                      selectedStrategy === strategy.id ? 'scale-110 ring-2 ring-white/50' : ''
                    } transition-all`}>
                      {strategy.icon}
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold text-lg ${selectedStrategy === strategy.id ? strategy.iconColor : 'text-white'}`}>
                        {strategy.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{strategy.description}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-green-400">💰</span>
                        <span className="text-green-400 font-semibold">返现: {strategy.cashback}%</span>
                      </div>
                      {strategy.priceDiscount > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-blue-400">💸</span>
                          <span className="text-blue-400 font-semibold">价格: -{strategy.priceDiscount}%</span>
                        </div>
                      )}
                    </div>
                    {selectedStrategy === strategy.id && (
                      <div className="text-green-400 font-bold animate-pulse">✓ 已选择</div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 价格和返现预览 */}
      <div className={`bg-gradient-to-r ${strategies[selectedStrategy].iconBg} p-4 rounded-xl mb-4 border-2 ${strategies[selectedStrategy].iconBorder} relative overflow-hidden`}>
        {/* 背景装饰图标 */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-20 blur-3xl">
          <div className={`text-8xl ${strategies[selectedStrategy].iconColor} opacity-50`}>
            {strategies[selectedStrategy].icon}
          </div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg ${strategies[selectedStrategy].iconBg} border-2 ${strategies[selectedStrategy].iconBorder} flex items-center justify-center text-2xl shadow-lg`}>
              {strategies[selectedStrategy].icon}
            </div>
            <div>
              <div className={`text-sm font-bold ${strategies[selectedStrategy].iconColor}`}>
                当前策略: {strategies[selectedStrategy].name}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">基础价格：</span>
            <span className="text-lg font-bold text-yellow-400">
              {(calculateItemPrice() / 10000000).toFixed(6)} TON
            </span>
          </div>
          {strategies[selectedStrategy].priceDiscount > 0 && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">价格折扣：</span>
              <span className="text-lg font-bold text-blue-400">
                -{strategies[selectedStrategy].priceDiscount}%
              </span>
            </div>
          )}
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">实际支付：</span>
            <span className="text-xl font-bold text-white">
              {(calculateStrategyPrice(calculateItemPrice(), selectedStrategy).finalPrice / 10000000).toFixed(6)} TON
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-600">
            <span className="text-sm text-gray-300 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <span>立即返现：</span>
            </span>
            <span className="text-xl font-bold text-green-400 flex items-center gap-2">
              <span className="text-2xl animate-bounce">✨</span>
              <span>+{(calculateStrategyPrice(calculateItemPrice(), selectedStrategy).cashback / 10000000).toFixed(6)} TON</span>
            </span>
          </div>
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-lg mb-4">
          <span>基础道具价格：</span>
          <span className="text-2xl font-bold text-yellow-400 mx-2">
            {(calculateItemPrice() / 10000000).toFixed(6)}
          </span>
          <span className="text-gray-400 text-sm">TON</span>
        </div>
        
        <button
          onClick={handleBuyItem}
          disabled={loading || gameState !== 1 || !connected || (maxPlayers > 0 && currentPlayers >= maxPlayers)}
          className="px-8 py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg font-bold text-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? '购买中...' : maxPlayers > 0 && currentPlayers >= maxPlayers ? '玩家已满' : '购买道具'}
        </button>
        
        {maxPlayers > 0 && (
          <div className="mt-2 text-sm text-gray-400">
            当前玩家: {currentPlayers} / {maxPlayers}
            {currentPlayers >= maxPlayers && (
              <span className="text-red-400 ml-2">⚠️ 已满员</span>
            )}
          </div>
        )}
      </div>

      {result && (
        <div className={`p-4 rounded-xl text-center ${
          result.success 
            ? 'bg-green-500/20 text-green-400 border border-green-500' 
            : 'bg-red-500/20 text-red-400 border border-red-500'
        }`}>
          <div className="font-bold mb-2">{result.message}</div>
          {result.effect && (
            <div className="mt-3 p-3 bg-black/30 rounded-lg space-y-3">
              <div className="text-sm text-gray-300 mb-2">道具详情：</div>
              <div className="flex items-center justify-center gap-4">
                <div className={`text-2xl font-bold ${
                  result.effect.effectType === 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.effect.effectType === 0 ? '⚡ 加速' : '🐌 减速'}
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  {result.effect.multiplier}X
                </div>
                <div className="text-sm text-gray-400">
                  道具ID: {result.effect.itemId}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                效果值: {result.effect.effectValue > 0 ? '+' : ''}{result.effect.effectValue}
              </div>
              
              {/* 显示策略和返现信息 */}
              {result.effect.cashbackAmount !== undefined && (
                <div className="pt-3 border-t border-gray-600 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">使用策略：</span>
                    <span className="text-sm font-bold flex items-center gap-2">
                      <span className={`w-6 h-6 rounded ${strategies[result.effect.strategy || 1].iconBg} border ${strategies[result.effect.strategy || 1].iconBorder} flex items-center justify-center text-sm`}>
                        {strategies[result.effect.strategy || 1].icon}
                      </span>
                      <span className={strategies[result.effect.strategy || 1].iconColor}>
                        {strategies[result.effect.strategy || 1].name}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">实际支付：</span>
                    <span className="text-sm font-bold text-white">
                      {(result.effect.finalPrice! / 10000000).toFixed(6)} TON
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">立即返现：</span>
                    <span className="text-sm font-bold text-green-400">
                      +{(result.effect.cashbackAmount / 10000000).toFixed(6)} TON
                    </span>
                  </div>
                  <div className="text-xs text-green-400 mt-2 text-center">
                    💰 返现已添加到可提取余额
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


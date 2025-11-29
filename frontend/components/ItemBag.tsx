'use client'

import { useState } from 'react'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { beginCell } from '@ton/core'

interface Item {
  id: number
  multiplier: number
  effectType: number  // 0=加速, 1=减速
  effectValue: number
  createdAt: number
  count: number  // 使用次数
}

interface ItemBagProps {
  items: Item[]
  connected: boolean
  onItemUsed: () => void
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS_HERE'

export default function ItemBag({ items, connected, onItemUsed }: ItemBagProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [selectedCar, setSelectedCar] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ message: string; success: boolean } | null>(null)
  const { sendTransaction } = useTonConnectUI()

  const buildUseItemMessage = (itemId: number, carId: number) => {
    const op = 0x75736569 // "usei" - use item
    try {
      const cell = beginCell()
        .storeUint(op, 32)
        .storeUint(itemId, 32)  // 道具ID
        .storeUint(carId, 8)    // 目标车辆ID
        .endCell()
      return cell.toBoc().toString('base64')
    } catch (error) {
      const buffer = new ArrayBuffer(9)
      const view = new DataView(buffer)
      view.setUint32(0, op, false)
      view.setUint32(4, itemId, false)
      view.setUint8(8, carId)
      return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    }
  }

  const handleUseItem = async () => {
    if (!connected) {
      setResult({ message: '请先连接钱包', success: false })
      return
    }

    if (!selectedItem) {
      setResult({ message: '请选择要使用的道具', success: false })
      return
    }

    if (selectedItem.count <= 0) {
      setResult({ message: '道具使用次数已用完', success: false })
      return
    }

    try {
      setLoading(true)

      const message = {
        address: CONTRACT_ADDRESS,
        amount: '0',  // 使用道具不需要支付
        payload: buildUseItemMessage(selectedItem.id, selectedCar),
      }

      await sendTransaction({
        messages: [message],
        validUntil: Math.floor(Date.now() / 1000) + 300,
      })

      const effectText = selectedItem.effectType === 0 
        ? `加速 ${selectedItem.multiplier}X` 
        : `减速 ${selectedItem.multiplier}X`

      setResult({ 
        message: `道具使用成功！${effectText}已应用到车辆${selectedCar}`, 
        success: true 
      })
      
      setSelectedItem(null)
      
      setTimeout(() => {
        setResult(null)
        onItemUsed()
      }, 2000)
    } catch (error: any) {
      setResult({ message: `使用失败: ${error.message}`, success: false })
      setTimeout(() => {
        setResult(null)
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  const getItemIcon = (effectType: number) => {
    return effectType === 0 ? '⚡' : '🐌'
  }

  const getItemColor = (effectType: number) => {
    return effectType === 0 
      ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' 
      : 'from-red-500/20 to-orange-500/20 border-red-500/30'
  }

  return (
    <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-lg border border-white/10 mb-5">
      <h2 className="text-2xl font-bold mb-4">道具背包</h2>
      
      {items.filter(item => item.count > 0).length === 0 ? (
        <div className="bg-black/30 p-8 rounded-xl text-center text-gray-400">
          <p className="text-lg mb-2">背包是空的</p>
          <p className="text-sm">购买道具或通过推荐获得道具后，会显示在这里</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {items.filter(item => item.count > 0).map((item) => (
              <div
                key={item.id}
                onClick={() => item.count > 0 && setSelectedItem(item)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  item.count > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                } ${
                  selectedItem?.id === item.id
                    ? `${getItemColor(item.effectType)} border-opacity-100 scale-105`
                    : 'bg-black/30 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">{getItemIcon(item.effectType)}</div>
                  <div className={`text-lg font-bold ${
                    item.effectType === 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {item.effectType === 0 ? '+' : '-'}{item.multiplier}X
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    ID: {item.id}
                  </div>
                  <div className={`text-xs font-bold mt-1 ${
                    item.count > 0 ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    剩余: {item.count}次
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedItem && selectedItem.count > 0 && (
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 rounded-xl border border-blue-500/30 mb-4">
              <h3 className="text-lg font-bold mb-4">使用道具</h3>
              
              <div className="mb-4">
                <div className={`inline-block p-3 rounded-lg ${
                  selectedItem.effectType === 0 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  <span className="text-2xl mr-2">{getItemIcon(selectedItem.effectType)}</span>
                  <span className="text-lg font-bold">
                    {selectedItem.effectType === 0 ? '加速' : '减速'} {selectedItem.multiplier}X
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  剩余使用次数: <span className="font-bold text-blue-400">{selectedItem.count}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">选择目标车辆</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedCar(1)}
                    className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                      selectedCar === 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-black/30 text-gray-400 hover:bg-black/50'
                    }`}
                  >
                    车辆 1
                  </button>
                  <button
                    onClick={() => setSelectedCar(2)}
                    className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                      selectedCar === 2
                        ? 'bg-blue-600 text-white'
                        : 'bg-black/30 text-gray-400 hover:bg-black/50'
                    }`}
                  >
                    车辆 2
                  </button>
                </div>
              </div>

              <button
                onClick={handleUseItem}
                disabled={loading || !connected}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? '使用中...' : `使用道具（应用到车辆${selectedCar}）`}
              </button>
            </div>
          )}

          {result && (
            <div className={`mt-4 p-4 rounded-xl text-center font-bold ${
              result.success 
                ? 'bg-green-500/20 text-green-400 border border-green-500' 
                : 'bg-red-500/20 text-red-400 border border-red-500'
            }`}>
              {result.message}
            </div>
          )}
        </>
      )}
    </div>
  )
}


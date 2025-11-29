'use client'

import { useState, useEffect } from 'react'
import { useTonConnectUI } from '@tonconnect/ui-react'

interface ReferralLinkProps {
  walletAddress: string | null
  playerName: string | null  // 玩家名字
}

export default function ReferralLink({ walletAddress, playerName }: ReferralLinkProps) {
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (walletAddress) {
      // 生成推荐链接（包含当前钱包地址作为推荐人）
      const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
      const link = `${currentUrl}?ref=${walletAddress}`
      setReferralLink(link)
    }
  }, [walletAddress])

  const handleCopy = async () => {
    if (referralLink) {
      try {
        await navigator.clipboard.writeText(referralLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('复制失败:', error)
      }
    }
  }

  const handleShare = async () => {
    if (referralLink && navigator.share) {
      try {
        await navigator.share({
          title: '邀请你加入赛车游戏！',
          text: '通过我的推荐链接加入游戏，首次购买道具将获得免费随机道具！',
          url: referralLink,
        })
      } catch (error) {
        console.error('分享失败:', error)
      }
    }
  }

  if (!walletAddress) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 rounded-2xl backdrop-blur-lg border border-purple-500/30 mb-5">
      <h2 className="text-2xl font-bold mb-4 text-purple-300">推荐链接</h2>
      
      <div className="mb-4">
        {playerName && (
          <div className="bg-black/30 p-3 rounded-xl mb-3 text-center">
            <span className="text-xs text-gray-400 block mb-1">推荐人</span>
            <span className="text-lg font-bold text-purple-300">{playerName}</span>
          </div>
        )}
        <p className="text-sm text-gray-300 mb-2">
          分享你的推荐链接，好友通过链接首次购买道具时：
        </p>
        <ul className="text-sm text-gray-400 space-y-1 mb-4">
          <li>✅ 好友将获得一个免费随机道具</li>
          <li>✅ 你将获得好友消费的10%作为推荐奖励（好友需注册名字）</li>
        </ul>
      </div>

      <div className="bg-black/30 p-4 rounded-xl mb-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 bg-transparent text-sm text-gray-300 font-mono break-all"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-bold whitespace-nowrap"
          >
            {copied ? '已复制!' : '复制'}
          </button>
        </div>
      </div>

      {navigator.share && (
        <button
          onClick={handleShare}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:scale-105 transition-all"
        >
          分享推荐链接
        </button>
      )}
    </div>
  )
}


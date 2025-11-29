'use client'

interface FundDistributionProps {
  distributionConfig: {
    prizePoolPercent: number
    communityPercent: number
    reservePercent: number
  }
  prizePool: number
  communityPool: number
  reservePool: number
  totalInvested: number
  distributionStatus?: string | null  // 分配状态说明
  minGasReserve?: number  // 最小gas保留金额
}

export default function FundDistribution({
  distributionConfig,
  prizePool,
  communityPool,
  reservePool,
  totalInvested,
  distributionStatus = null,
  minGasReserve = 50000000,  // 默认0.05 TON
}: FundDistributionProps) {
  return (
    <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-lg border border-white/10 mb-5">
      <h2 className="text-3xl font-bold mb-6 text-center text-yellow-400">💰 资金分配系统</h2>
      
      {/* 分配比例 */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">资金分配比例</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-black/30 p-5 rounded-xl border-l-4 border-yellow-400">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-sm text-gray-400 uppercase mb-1">奖池</div>
            <div className="text-2xl font-bold">{distributionConfig.prizePoolPercent}%</div>
          </div>
          
          <div className="bg-black/30 p-5 rounded-xl border-l-4 border-green-400">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-sm text-gray-400 uppercase mb-1">社区池</div>
            <div className="text-2xl font-bold">{distributionConfig.communityPercent}%</div>
            <div className="text-xs text-green-400 mt-1">(最低20%)</div>
          </div>
          
          <div className="bg-black/30 p-5 rounded-xl border-l-4 border-purple-400">
            <div className="text-3xl mb-2">💎</div>
            <div className="text-sm text-gray-400 uppercase mb-1">预留池</div>
            <div className="text-2xl font-bold">{distributionConfig.reservePercent}%</div>
          </div>
        </div>
      </div>

      {/* 各池余额 */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">各池余额</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-black/30 p-5 rounded-xl border-2 border-yellow-400">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🏆</span>
              <span className="font-bold">奖池</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400 mb-2">
              {(prizePool / 1000000000).toFixed(4)} TON
            </div>
            <div className="text-xs text-gray-400 mb-1">分配给前三名</div>
            {prizePool < minGasReserve && prizePool > 0 && (
              <div className="text-xs text-orange-400 mt-1">
                ⚠️ 低于最小gas费用 ({(minGasReserve / 1000000000).toFixed(4)} TON)
              </div>
            )}
          </div>
          
          <div className="bg-black/30 p-5 rounded-xl border-2 border-green-400">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">👥</span>
              <span className="font-bold">社区池</span>
            </div>
            <div className="text-2xl font-bold text-green-400 mb-2">
              {(communityPool / 1000000000).toFixed(4)} TON
            </div>
            <div className="text-xs text-gray-400">社区发展基金</div>
          </div>
          
          <div className="bg-black/30 p-5 rounded-xl border-2 border-purple-400">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">💎</span>
              <span className="font-bold">预留池</span>
            </div>
            <div className="text-2xl font-bold text-purple-400 mb-2">
              {(reservePool / 1000000000).toFixed(4)} TON
            </div>
            <div className="text-xs text-gray-400">下一轮初始奖池</div>
          </div>
        </div>
      </div>

      {/* 分配状态说明 */}
      {distributionStatus && (
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-5 rounded-xl border-2 border-orange-400 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-400 mb-2">分配状态说明</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {distributionStatus}
              </p>
              <div className="mt-3 text-xs text-gray-400">
                💡 奖池金额过低，无法支付gas费用进行分配。资金已转入社区池和预留池，用于下一轮游戏。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 总投入 */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-5 rounded-xl border border-yellow-400/30 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg text-gray-300">总投入资金：</span>
          <span className="text-2xl font-bold text-yellow-400">
            {(totalInvested / 1000000000).toFixed(4)} TON
          </span>
        </div>
      </div>

      {/* 奖金分配说明 */}
      <div className="bg-black/30 p-5 rounded-xl border-l-4 border-yellow-400">
        <h3 className="text-lg font-bold mb-3">🏅 奖池分配规则</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="border-b border-white/10 pb-2">🥇 第一名：50%</li>
          <li className="border-b border-white/10 pb-2">🥈 第二名：30%</li>
          <li>🥉 第三名：20%</li>
        </ul>
      </div>
    </div>
  )
}


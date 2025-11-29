'use client'

interface LeaderboardProps {
  ranks?: Array<{
    address: string
    score: number
    invested: number
    boost: number
    name?: string | null  // 玩家名字（如果有注册）
  }>
}

export default function Leaderboard({ ranks = [] }: LeaderboardProps) {
  return (
    <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-lg border border-white/10">
      <h2 className="text-2xl font-bold mb-4">🏆 排行榜</h2>
      
      <div className="space-y-3">
        {ranks.length === 0 ? (
          <div className="bg-black/30 p-4 rounded-xl text-center text-gray-400">
            等待游戏结束...
          </div>
        ) : (
          ranks.map((rank, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-black/30 rounded-xl hover:bg-black/50 transition-colors"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                'bg-gradient-to-r from-orange-600 to-orange-800'
              }`}>
                {index + 1}
              </div>
              
              <div className="flex-1">
                {rank.name ? (
                  <span className="text-lg font-bold text-blue-300">{rank.name}</span>
                ) : (
                  <span className="font-mono text-sm text-gray-300">
                    {rank.address.slice(0, 6)}...{rank.address.slice(-4)}
                  </span>
                )}
              </div>
              
              <div className="text-lg font-bold text-green-400">
                {rank.score}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


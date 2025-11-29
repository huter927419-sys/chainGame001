'use client'

interface CarRaceProps {
  car1Speed: number
  car2Speed: number
  speedGap: number
  leadingCar: number  // 0=平局, 1=Car1领先, 2=Car2领先
}

export default function CarRace({ car1Speed, car2Speed, speedGap, leadingCar }: CarRaceProps) {
  return (
    <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-lg border border-white/10 mb-5">
      <h2 className="text-2xl font-bold mb-6 text-center">🏎️ 双车竞速</h2>
      
      {/* 双车速度对比 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* 车辆1 */}
        <div className={`p-5 rounded-xl border-2 transition-all ${
          leadingCar === 1 
            ? 'border-green-400 bg-green-500/10' 
            : leadingCar === 0
            ? 'border-yellow-400 bg-yellow-500/10'
            : 'border-red-400 bg-red-500/10'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🏎️</span>
            <span className="text-xl font-bold">车辆1</span>
            {leadingCar === 1 && <span className="text-green-400">🏆 领先</span>}
            {leadingCar === 0 && <span className="text-yellow-400">⚖️ 平局</span>}
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {car1Speed} km/h
          </div>
          <div className="text-sm text-gray-400">
            当前速度
          </div>
        </div>
        
        {/* 车辆2 */}
        <div className={`p-5 rounded-xl border-2 transition-all ${
          leadingCar === 2 
            ? 'border-green-400 bg-green-500/10' 
            : leadingCar === 0
            ? 'border-yellow-400 bg-yellow-500/10'
            : 'border-red-400 bg-red-500/10'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🏎️</span>
            <span className="text-xl font-bold">车辆2</span>
            {leadingCar === 2 && <span className="text-green-400">🏆 领先</span>}
            {leadingCar === 0 && <span className="text-yellow-400">⚖️ 平局</span>}
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {car2Speed} km/h
          </div>
          <div className="text-sm text-gray-400">
            当前速度
          </div>
        </div>
      </div>
      
      {/* 速度差距 */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-5 rounded-xl border border-yellow-400/30">
        <div className="flex justify-between items-center">
          <span className="text-lg text-gray-300">速度差距：</span>
          <span className="text-2xl font-bold text-yellow-400">
            {speedGap} km/h
          </span>
        </div>
        {leadingCar === 0 && (
          <div className="text-center text-yellow-400 mt-2">
            ⚖️ 两车速度相同
          </div>
        )}
      </div>
    </div>
  )
}


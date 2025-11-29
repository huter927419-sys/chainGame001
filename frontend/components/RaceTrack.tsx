'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function RaceTrack() {
  const [carImage, setCarImage] = useState('/assets/car-red.png')
  const [effect, setEffect] = useState<'boost' | 'slow' | null>(null)

  return (
    <div className="relative h-64 bg-gradient-to-b from-slate-800 to-black rounded-2xl overflow-hidden mb-5 flex items-center justify-center border border-white/10">
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div className={`relative transition-all duration-500 ${
          effect === 'boost' ? 'translate-x-5 scale-110' : 
          effect === 'slow' ? '-translate-x-5 scale-90' : ''
        }`}>
          <Image
            src={carImage}
            alt="F1赛车"
            width={150}
            height={150}
            className="drop-shadow-[0_0_20px_rgba(255,0,0,0.5)]"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/assets/car-red.svg'
            }}
          />
        </div>
        {effect && (
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            effect === 'boost' ? 'bg-green-500/30' : 'bg-red-500/30'
          } rounded-full blur-xl`} />
        )}
      </div>
      
      <div className="absolute bottom-5 left-0 right-0 h-1 bg-white/20">
        <div className="h-full bg-white animate-[trackMove_2s_linear_infinite] bg-[length:40px_100%] bg-repeat-x" />
      </div>
      
      <style jsx>{`
        @keyframes trackMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(40px); }
        }
      `}</style>
    </div>
  )
}


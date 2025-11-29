'use client'

import { TonConnectProvider } from '@/components/TonConnectProvider'
import GameContainer from '@/components/GameContainer'

export default function Home() {
  return (
    <TonConnectProvider>
      <GameContainer />
    </TonConnectProvider>
  )
}


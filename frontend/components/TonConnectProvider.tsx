'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react'
import { useTelegram } from '@/hooks/useTelegram'

const TonConnectContext = createContext<{
  connected: boolean
  address: string | null
  wallet: string | null
}>({
  connected: false,
  address: null,
  wallet: null,
})

function TonConnectContextProvider({ children }: { children: ReactNode }) {
  const { connected, wallet } = useTonConnectUI()
  const [address, setAddress] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  useEffect(() => {
    if (connected && wallet?.account?.address) {
      setAddress(wallet.account.address)
      setWalletAddress(wallet.account.address)
    } else {
      setAddress(null)
      setWalletAddress(null)
    }
  }, [connected, wallet])

  return (
    <TonConnectContext.Provider value={{ connected, address, wallet: walletAddress }}>
      {children}
    </TonConnectContext.Provider>
  )
}

export function TonConnectProvider({ children }: { children: ReactNode }) {
  const { webApp, isReady } = useTelegram()
  
  // 获取 Telegram Mini App 的 URL
  const manifestUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/tonconnect-manifest.json`
    : ''
  
  const twaReturnUrl = typeof window !== 'undefined' && webApp
    ? window.location.origin
    : ''

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      actionsConfiguration={{
        twaReturnUrl,
        skipRedirectToWallet: false,
      }}
      uiPreferences={{
        theme: 'DARK',
      }}
    >
      <TonConnectContextProvider>
        {children}
      </TonConnectContextProvider>
    </TonConnectUIProvider>
  )
}

export const useTonConnect = () => useContext(TonConnectContext)


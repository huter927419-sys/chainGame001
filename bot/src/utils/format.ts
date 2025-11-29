/**
 * 格式化 TON 金额（从 nanoTON 转换为 TON）
 */
export function formatTon(nanoTon: bigint | number): string {
  const value = typeof nanoTon === 'bigint' ? Number(nanoTon) : nanoTon
  const ton = value / 1e9
  return ton.toFixed(4)
}

/**
 * 格式化时间（秒转换为 MM:SS）
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 格式化地址（显示前6位和后4位）
 */
export function formatAddress(address: string): string {
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}


import { Address, beginCell, Cell, toNano } from '@ton/core'
import { TonClient, WalletContractV4 } from '@ton/ton'

export interface GameState {
  state: number  // 0=未开始, 1=进行中, 2=已结束
  startTime: number
  endTime: number
  totalPlayers: number
  totalItems: number
}

export interface PlayerData {
  totalInvested: bigint
  totalBoost: number
  itemCount: number
  rewardBalance: bigint
  referrer: Address | null
  referralRewards: bigint
  referralCount: number
  name: string | null
}

export interface RankData {
  address: Address
  invested: bigint
  boost: number
  score: number
  name: string | null
}

export class ContractClient {
  private client: TonClient
  private contractAddress: Address

  constructor(
    contractAddress: string,
    network: 'testnet' | 'mainnet' = 'testnet',
    apiKey?: string
  ) {
    this.contractAddress = Address.parse(contractAddress)
    
    const endpoint = network === 'testnet'
      ? apiKey 
        ? `https://testnet.toncenter.com/api/v2/jsonRPC?api_key=${apiKey}`
        : 'https://testnet.toncenter.com/api/v2/jsonRPC'
      : apiKey
        ? `https://toncenter.com/api/v2/jsonRPC?api_key=${apiKey}`
        : 'https://toncenter.com/api/v2/jsonRPC'
    
    this.client = new TonClient({
      endpoint,
      apiKey
    })
  }

  // 获取游戏状态
  async getGameState(): Promise<GameState> {
    try {
      const result = await this.client.runMethod(
        this.contractAddress,
        'getGameState'
      )
      
      if (result.exitCode !== 0) {
        throw new Error(`Contract call failed with exit code ${result.exitCode}`)
      }

      return {
        state: Number(result.stack.readNumber()),
        startTime: Number(result.stack.readNumber()),
        endTime: Number(result.stack.readNumber()),
        totalPlayers: Number(result.stack.readNumber()),
        totalItems: Number(result.stack.readNumber())
      }
    } catch (error) {
      console.error('Error getting game state:', error)
      throw error
    }
  }

  // 获取奖池
  async getPrizePool(): Promise<bigint> {
    try {
      const result = await this.client.runMethod(
        this.contractAddress,
        'getPrizePool'
      )
      
      if (result.exitCode !== 0) {
        throw new Error(`Contract call failed with exit code ${result.exitCode}`)
      }

      return result.stack.readBigNumber()
    } catch (error) {
      console.error('Error getting prize pool:', error)
      throw error
    }
  }

  // 获取社区池
  async getCommunityPool(): Promise<bigint> {
    try {
      const result = await this.client.runMethod(
        this.contractAddress,
        'getCommunityPool'
      )
      
      if (result.exitCode !== 0) {
        throw new Error(`Contract call failed with exit code ${result.exitCode}`)
      }

      return result.stack.readBigNumber()
    } catch (error) {
      console.error('Error getting community pool:', error)
      throw error
    }
  }

  // 获取预留池
  async getReservePool(): Promise<bigint> {
    try {
      const result = await this.client.runMethod(
        this.contractAddress,
        'getReservePool'
      )
      
      if (result.exitCode !== 0) {
        throw new Error(`Contract call failed with exit code ${result.exitCode}`)
      }

      return result.stack.readBigNumber()
    } catch (error) {
      console.error('Error getting reserve pool:', error)
      throw error
    }
  }

  // 获取玩家数据
  async getPlayerData(address: Address): Promise<PlayerData | null> {
    try {
      const result = await this.client.runMethod(
        this.contractAddress,
        'getPlayerData',
        [{ type: 'slice', cell: beginCell().storeAddress(address).endCell() }]
      )
      
      if (result.exitCode !== 0) {
        return null
      }

      // 解析返回的数据结构
      // 注意：这里需要根据实际合约返回的数据结构来解析
      const stack = result.stack
      
      return {
        totalInvested: stack.readBigNumber(),
        totalBoost: Number(stack.readNumber()),
        itemCount: Number(stack.readNumber()),
        rewardBalance: stack.readBigNumber(),
        referrer: null, // 需要根据实际合约解析
        referralRewards: stack.readBigNumber(),
        referralCount: Number(stack.readNumber()),
        name: null // 需要根据实际合约解析
      }
    } catch (error) {
      console.error('Error getting player data:', error)
      return null
    }
  }

  // 获取排行榜
  async getRankings(): Promise<RankData[]> {
    try {
      const rankings: RankData[] = []
      
      // 获取前三名
      for (let rank = 1; rank <= 3; rank++) {
        try {
          const result = await this.client.runMethod(
            this.contractAddress,
            'getRank',
            [{ type: 'int', value: BigInt(rank) }]
          )
          
          if (result.exitCode === 0) {
            const stack = result.stack
            rankings.push({
              address: stack.readAddress(),
              invested: stack.readBigNumber(),
              boost: Number(stack.readNumber()),
              score: Number(stack.readNumber()),
              name: null // 需要根据实际合约解析
            })
          }
        } catch (error) {
          // 如果某个排名不存在，跳过
          break
        }
      }
      
      return rankings
    } catch (error) {
      console.error('Error getting rankings:', error)
      return []
    }
  }

  // 获取最大玩家数
  async getMaxPlayers(): Promise<number> {
    try {
      const result = await this.client.runMethod(
        this.contractAddress,
        'getMaxPlayers'
      )
      
      if (result.exitCode !== 0) {
        return 50 // 默认值
      }

      return Number(result.stack.readNumber())
    } catch (error) {
      console.error('Error getting max players:', error)
      return 50
    }
  }
}


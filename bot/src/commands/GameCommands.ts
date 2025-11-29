import { ContractClient, GameState, RankData } from '../contract/ContractClient'

export class GameCommands {
  constructor(private contractClient: ContractClient) {}

  // 获取游戏状态
  async getGameStatus(): Promise<GameState & { maxPlayers: number }> {
    const state = await this.contractClient.getGameState()
    const maxPlayers = await this.contractClient.getMaxPlayers()
    
    return {
      ...state,
      maxPlayers
    }
  }

  // 获取排行榜
  async getRankings(): Promise<RankData[]> {
    return await this.contractClient.getRankings()
  }

  // 获取玩家信息
  async getPlayerInfo(address: string) {
    // 这里需要解析地址并调用合约
    // 暂时返回 null，需要根据实际需求实现
    return null
  }
}


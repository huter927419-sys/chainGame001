/**
 * RaceGame 合约客户端
 *
 * 封装所有与智能合约的交互逻辑，提供类型安全的 API
 */

import { Address, TonClient, fromNano, toNano } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';

// 合约地址（从环境变量读取）
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

// 网络配置
const NETWORK = (process.env.NEXT_PUBLIC_NETWORK || 'testnet') as 'testnet' | 'mainnet';

// 类型定义
export interface GameState {
  state: number;          // 0=未开始, 1=进行中, 2=已结束
  startTime: number;
  endTime: number;
  totalPlayers: number;
  totalItems: number;
}

export interface PlayerData {
  totalInvested: string;  // 以 nanotons 为单位
  totalBoost: number;
  itemCount: number;
  rewardBalance: string;  // 以 nanotons 为单位
  referrer: string | null;
  referralRewards: string;  // 以 nanotons 为单位
  referralCount: number;
  name: string | null;
}

export interface CarData {
  baseSpeed: number;
  totalBoost: number;
  currentSpeed: number;
  itemCount: number;
}

export interface Item {
  id: number;
  multiplier: number;
  effectType: number;  // 0=加速, 1=减速
  effectValue: number;
  createdAt: number;
  count: number;
}

export interface DistributionConfig {
  prizePoolPercent: number;
  communityPercent: number;
  reservePercent: number;
}

/**
 * RaceGame 合约客户端类
 */
export class RaceGameClient {
  private client: TonClient | null = null;
  private contractAddress: Address | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // 延迟初始化，避免在服务端渲染时出错
    if (typeof window !== 'undefined') {
      this.initPromise = this.initialize();
    }
  }

  /**
   * 初始化 TON 客户端
   */
  private async initialize(): Promise<void> {
    try {
      if (!CONTRACT_ADDRESS) {
        console.warn('合约地址未配置');
        return;
      }

      // 获取 RPC 端点
      const endpoint = await getHttpEndpoint({
        network: NETWORK,
      });

      // 创建客户端
      this.client = new TonClient({
        endpoint,
      });

      // 解析合约地址
      this.contractAddress = Address.parse(CONTRACT_ADDRESS);

      console.log('RaceGameClient 初始化成功');
      console.log('网络:', NETWORK);
      console.log('合约地址:', CONTRACT_ADDRESS);
    } catch (error) {
      console.error('初始化 RaceGameClient 失败:', error);
      throw error;
    }
  }

  /**
   * 确保客户端已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }

    if (!this.client || !this.contractAddress) {
      throw new Error('RaceGameClient 未正确初始化');
    }
  }

  /**
   * 调用合约的 get 方法
   */
  private async callGetMethod(
    method: string,
    args: any[] = []
  ): Promise<any> {
    await this.ensureInitialized();

    try {
      const result = await this.client!.runMethod(
        this.contractAddress!,
        method,
        args
      );

      return result.stack;
    } catch (error) {
      console.error(`调用合约方法 ${method} 失败:`, error);
      throw error;
    }
  }

  // ==================== 游戏状态查询 ====================

  /**
   * 获取游戏状态
   */
  async getGameState(): Promise<GameState> {
    const stack = await this.callGetMethod('getGameState');

    return {
      state: stack.readNumber(),
      startTime: stack.readNumber(),
      endTime: stack.readNumber(),
      totalPlayers: stack.readNumber(),
      totalItems: stack.readNumber(),
    };
  }

  /**
   * 获取玩家数据
   */
  async getPlayerData(address: string): Promise<PlayerData | null> {
    try {
      const playerAddress = Address.parse(address);
      const stack = await this.callGetMethod('getPlayerData', [
        { type: 'slice', cell: playerAddress.toCell() },
      ]);

      // 如果玩家不存在，返回 null
      if (stack.remaining === 0) {
        return null;
      }

      return {
        totalInvested: stack.readBigNumber().toString(),
        totalBoost: stack.readNumber(),
        itemCount: stack.readNumber(),
        rewardBalance: stack.readBigNumber().toString(),
        referrer: stack.readAddressOpt()?.toString() || null,
        referralRewards: stack.readBigNumber().toString(),
        referralCount: stack.readNumber(),
        name: stack.readStringOpt() || null,
      };
    } catch (error) {
      console.error('获取玩家数据失败:', error);
      return null;
    }
  }

  // ==================== 资金池查询 ====================

  /**
   * 获取奖池金额
   */
  async getPrizePool(): Promise<string> {
    const stack = await this.callGetMethod('getPrizePool');
    return stack.readBigNumber().toString();
  }

  /**
   * 获取社区池金额
   */
  async getCommunityPool(): Promise<string> {
    const stack = await this.callGetMethod('getCommunityPool');
    return stack.readBigNumber().toString();
  }

  /**
   * 获取预留池金额
   */
  async getReservePool(): Promise<string> {
    const stack = await this.callGetMethod('getReservePool');
    return stack.readBigNumber().toString();
  }

  /**
   * 获取总投资金额
   */
  async getTotalInvested(): Promise<string> {
    const stack = await this.callGetMethod('getTotalInvested');
    return stack.readBigNumber().toString();
  }

  /**
   * 获取资金分配配置
   */
  async getDistributionConfig(): Promise<DistributionConfig> {
    const stack = await this.callGetMethod('getDistributionConfig');

    return {
      prizePoolPercent: stack.readNumber(),
      communityPercent: stack.readNumber(),
      reservePercent: stack.readNumber(),
    };
  }

  // ==================== 车辆状态查询 ====================

  /**
   * 获取车辆1数据
   */
  async getCar1(): Promise<CarData> {
    const stack = await this.callGetMethod('getCar1');

    return {
      baseSpeed: stack.readNumber(),
      totalBoost: stack.readNumber(),
      currentSpeed: stack.readNumber(),
      itemCount: stack.readNumber(),
    };
  }

  /**
   * 获取车辆2数据
   */
  async getCar2(): Promise<CarData> {
    const stack = await this.callGetMethod('getCar2');

    return {
      baseSpeed: stack.readNumber(),
      totalBoost: stack.readNumber(),
      currentSpeed: stack.readNumber(),
      itemCount: stack.readNumber(),
    };
  }

  /**
   * 获取速度差距
   */
  async getSpeedGap(): Promise<number> {
    const stack = await this.callGetMethod('getSpeedGap');
    return stack.readNumber();
  }

  /**
   * 获取领先车辆
   * @returns 0=平局, 1=Car1, 2=Car2
   */
  async getLeadingCar(): Promise<number> {
    const stack = await this.callGetMethod('getLeadingCar');
    return stack.readNumber();
  }

  // ==================== 道具查询 ====================

  /**
   * 获取玩家道具数量
   */
  async getPlayerItemCount(address: string): Promise<number> {
    try {
      const playerAddress = Address.parse(address);
      const stack = await this.callGetMethod('getPlayerItemCount', [
        { type: 'slice', cell: playerAddress.toCell() },
      ]);

      return stack.readNumber();
    } catch (error) {
      console.error('获取玩家道具数量失败:', error);
      return 0;
    }
  }

  /**
   * 获取玩家指定道具
   */
  async getPlayerItem(address: string, itemId: number): Promise<Item | null> {
    try {
      const playerAddress = Address.parse(address);
      const stack = await this.callGetMethod('getPlayerItem', [
        { type: 'slice', cell: playerAddress.toCell() },
        { type: 'int', value: BigInt(itemId) },
      ]);

      if (stack.remaining === 0) {
        return null;
      }

      return {
        id: stack.readNumber(),
        multiplier: stack.readNumber(),
        effectType: stack.readNumber(),
        effectValue: stack.readNumber(),
        createdAt: stack.readNumber(),
        count: stack.readNumber(),
      };
    } catch (error) {
      console.error(`获取道具 ${itemId} 失败:`, error);
      return null;
    }
  }

  /**
   * 获取玩家所有道具
   */
  async getPlayerItems(address: string): Promise<Item[]> {
    const count = await this.getPlayerItemCount(address);
    const items: Item[] = [];

    for (let i = 1; i <= count; i++) {
      const item = await this.getPlayerItem(address, i);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  // ==================== 价格计算 ====================

  /**
   * 计算当前道具价格
   */
  async calculateItemPrice(itemCount?: number): Promise<string> {
    if (itemCount !== undefined) {
      const stack = await this.callGetMethod('calculateItemPrice', [
        { type: 'int', value: BigInt(itemCount) },
      ]);
      return stack.readBigNumber().toString();
    }

    // 如果没有提供 itemCount，使用当前游戏状态的 totalItems
    const gameState = await this.getGameState();
    const stack = await this.callGetMethod('calculateItemPrice', [
      { type: 'int', value: BigInt(gameState.totalItems) },
    ]);
    return stack.readBigNumber().toString();
  }

  /**
   * 根据策略计算价格和返现
   */
  async calculatePriceWithStrategy(
    basePrice: string,
    strategy: number
  ): Promise<{ finalPrice: string; cashbackAmount: string }> {
    const stack = await this.callGetMethod('calculatePriceWithStrategy', [
      { type: 'int', value: BigInt(basePrice) },
      { type: 'int', value: BigInt(strategy) },
    ]);

    return {
      finalPrice: stack.readBigNumber().toString(),
      cashbackAmount: stack.readBigNumber().toString(),
    };
  }

  // ==================== 配置查询 ====================

  /**
   * 获取基础价格
   */
  async getBaseItemPrice(): Promise<string> {
    const stack = await this.callGetMethod('getBaseItemPrice');
    return stack.readBigNumber().toString();
  }

  /**
   * 获取最大价格
   */
  async getMaxItemPrice(): Promise<string> {
    const stack = await this.callGetMethod('getMaxItemPrice');
    return stack.readBigNumber().toString();
  }

  /**
   * 获取最大玩家数
   */
  async getMaxPlayers(): Promise<number> {
    const stack = await this.callGetMethod('getMaxPlayers');
    return stack.readNumber();
  }

  /**
   * 获取游戏时长配置（秒）
   */
  async getGameDuration(): Promise<number> {
    const stack = await this.callGetMethod('getGameDuration');
    return stack.readNumber();
  }

  // ==================== 工具方法 ====================

  /**
   * 将 nanotons 转换为 TON
   */
  static formatTon(nanotons: string | bigint): string {
    return fromNano(nanotons);
  }

  /**
   * 将 TON 转换为 nanotons
   */
  static parseT(ton: string | number): bigint {
    return toNano(ton);
  }

  /**
   * 格式化地址（简短显示）
   */
  static formatAddress(address: string, start = 6, end = 4): string {
    if (address.length <= start + end) {
      return address;
    }
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  }

  /**
   * 验证地址格式
   */
  static isValidAddress(address: string): boolean {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }
}

// 导出单例实例
export const raceGameClient = new RaceGameClient();

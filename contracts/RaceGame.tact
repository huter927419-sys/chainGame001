import "@stdlib/deploy";
import "@stdlib/ownable";

;; 车辆数据
struct CarData {
    baseSpeed: Int as int;      // 基础速度
    totalBoost: Int as int;     // 总加速效果（所有道具效果总和）
    currentSpeed: Int as int;    // 当前速度 = baseSpeed + totalBoost
    itemCount: Int as int;      // 该车使用的道具数量
}

;; 道具数据结构
struct Item {
    id: Int as int;              // 道具ID（唯一标识）
    multiplier: Int as int;      // 效果倍数（1/2/5/10）
    effectType: Int as int;      // 0=加速, 1=减速
    effectValue: Int as int;     // 实际效果值（正数=加速，负数=减速）
    createdAt: Int as int;       // 创建时间（用于排序）
    count: Int as int;           // 使用次数（使用一次减1，为0时删除）
}

;; 购买策略类型
;; 0 = 保守策略（高返现10%，价格不变）
;; 1 = 平衡策略（标准返现5%，价格不变）
;; 2 = 激进策略（低返现2%，价格降低5%）
;; 3 = 幸运策略（返现3%，但可能获得双倍道具效果）

;; 道具购买消息
message BuyItemMessage {
    referrer: Address? as maybe<Address>;  // 可选的推荐人地址（首次购买时使用）
    strategy: Int as int;  // 购买策略（0-3）
}

;; 使用道具消息
message UseItemMessage {
    itemId: Int as int;  // 道具ID
    carId: Int as int;   // 目标车辆ID（1 = Car1, 2 = Car2）
}

;; 道具效果返回
message ItemEffect {
    itemId: Int as int;          // 道具ID
    multiplier: Int as int;      // 效果倍数（1/2/5/10，正数=加速，负数=减速）
    effectType: Int as int;      // 0=加速, 1=减速
    effectValue: Int as int;     // 实际效果值
    strategy: Int as int;        // 使用的策略（0-3）
    cashbackAmount: Int as coins; // 返现金额
    finalPrice: Int as coins;     // 实际支付价格
}

;; 玩家数据
struct PlayerData {
    totalInvested: Int as coins;
    totalBoost: Int as int;  // 总加速效果（正数=加速，负数=减速）
    itemCount: Int as int;   // 已使用的道具数量
    rewardBalance: Int as coins;  // 可提取的奖金余额（包括大奖奖励和推荐奖励）
    referrer: Address? as maybe<Address>;  // 推荐人地址
    referralRewards: Int as coins;  // 累计推荐奖励
    referralCount: Int as int;  // 推荐人数
    name: String? as maybe<String>;  // 玩家名字（支持中文日文韩文英文表情符号）
    itemCounter: Int as int;  // 道具ID计数器（用于生成唯一ID）
}

;; 游戏状态
message GameState {
    state: Int as int;  // 0=未开始, 1=进行中, 2=已结束
    startTime: Int as int;
    endTime: Int as int;
    totalPlayers: Int as int;
    totalItems: Int as int;
}

;; 排名数据
struct RankData {
    address: Address;
    invested: Int as coins;
    boost: Int as int;
    score: Int as int;  // 综合得分 = invested * (1 + boost/100)
    name: String? as maybe<String>;  // 玩家名字（如果有注册）
}

message() {
}

;; 分配比例配置
struct DistributionConfig {
    prizePoolPercent: Int as int;  // 奖池百分比
    communityPercent: Int as int;  // 社区池百分比（至少20%）
    reservePercent: Int as int;  // 预留池百分比
}

contract RaceGame with Deployable, Ownable {
    gameState: GameState;
    players: Map<Address, PlayerData>;
    ranks: Map<Int, RankData>;  // rank -> player data
    prizePool: Int as coins;  // 奖池总额（给前三名）
    communityPool: Int as coins;  // 社区池
    reservePool: Int as coins;  // 下一轮预留奖金池
    totalInvested: Int as coins;  // 总投入资金
    distributionConfig: DistributionConfig;  // 分配比例配置
    
    // 道具背包系统：每个玩家的道具列表（itemId -> Item）
    playersItems: Map<Address, Map<Int, Item>>;
    
    // 双车系统
    car1: CarData;  // 车辆1
    car2: CarData;  // 车辆2
    baseSpeed: Int as int;  // 基础速度（默认100）
    
    // 玩家数量限制
    maxPlayers: Int as int;  // 最大玩家数量（默认50）
    
    // 动态分配配置（根据玩家数量调整）
    dynamicDistribution: Bool as bool;  // 是否启用动态分配
    
    // 价格配置
    basePrice: Int as int;  // 基础价格（可配置，默认1 TON）
    maxPrice: Int as int;  // 价格上限（可配置，默认5 TON）
    
    // Gas费用配置
    minGasReserve: Int as coins;  // 最小gas保留金额（默认0.05 TON，用于支付分配gas费用）
    distributionStatus: String?;  // 分配状态说明（如果分配失败，记录原因）
    
    // 推荐系统
    referralRewardPercent: Int as int;  // 推荐奖励百分比（默认10%，即被推荐人消费的10%）
    
    // 返现配置
    cashbackPercentConservative: Int as int;  // 保守策略返现比例（默认10%）
    cashbackPercentBalanced: Int as int;      // 平衡策略返现比例（默认5%）
    cashbackPercentAggressive: Int as int;    // 激进策略返现比例（默认2%）
    cashbackPercentLucky: Int as int;         // 幸运策略返现比例（默认3%）
    aggressivePriceDiscount: Int as int;      // 激进策略价格折扣（默认5%）

    // 游戏时长配置（支持多模式）
    gameDuration: Int as int;  // 游戏时长（秒），默认300秒（5分钟）
    
    init(owner: Address) {
        self.ownable = Ownable(owner);
        self.gameState = GameState {
            state: 0,
            startTime: 0,
            endTime: 0,
            totalPlayers: 0,
            totalItems: 0
        };
        self.prizePool = 0.toCoins();
        self.communityPool = 0.toCoins();
        self.reservePool = 0.toCoins();
        self.totalInvested = 0.toCoins();
        
        // 默认分配比例：奖池60%，社区池20%，预留池20%
        self.distributionConfig = DistributionConfig {
            prizePoolPercent: 60,
            communityPercent: 20,
            reservePercent: 20
        };
        
        // 初始化双车系统
        self.baseSpeed = 100;
        self.car1 = CarData {
            baseSpeed: 100,
            totalBoost: 0,
            currentSpeed: 100,
            itemCount: 0
        };
        self.car2 = CarData {
            baseSpeed: 100,
            totalBoost: 0,
            currentSpeed: 100,
            itemCount: 0
        };
        
        // 设置玩家数量上限（默认50）
        self.maxPlayers = 50;
        
        // 默认不启用动态分配（保持简单）
        self.dynamicDistribution = false;
        
        // 设置价格配置（默认0.02 TON起，1 TON上限，优化奖池吸引力）
        self.basePrice = 20000000;    // 0.02 TON (20,000,000 nanoTON)
        self.maxPrice = 1000000000;    // 1 TON (1,000,000,000 nanoTON)
        
        // 设置推荐奖励比例（默认10%）
        self.referralRewardPercent = 10;
        
        // 设置返现配置
        self.cashbackPercentConservative = 10;  // 保守策略：10%返现
        self.cashbackPercentBalanced = 5;      // 平衡策略：5%返现
        self.cashbackPercentAggressive = 2;    // 激进策略：2%返现，价格降低5%
        self.cashbackPercentLucky = 3;         // 幸运策略：3%返现，可能双倍效果
        self.aggressivePriceDiscount = 5;       // 激进策略价格折扣：5%
        
        // 设置最小gas保留金额（0.05 TON = 50000000 nanoTON）
        self.minGasReserve = 50000000.toCoins();
        self.distributionStatus = null();

        // 设置默认游戏时长（5分钟 = 300秒）
        self.gameDuration = 300;
    }
    
    // 设置分配比例（只有所有者可以设置）
    receive("set_distribution", config: DistributionConfig) {
        self.onlyOwner();
        require(config.communityPercent >= 20, "Community percent must be at least 20%");
        require(config.prizePoolPercent + config.communityPercent + config.reservePercent == 100, "Total must be 100%");
        
        self.distributionConfig = config;
    }
    
    // 开始游戏
    receive("start") {
        self.onlyOwner();
        require(self.gameState.state == 0, "Game already started or ended");

        let now = context().now;
        let duration = self.gameDuration;  // 使用配置的游戏时长
        
        // 将预留池的资金转移到奖池（作为本轮初始奖池）
        self.prizePool = self.reservePool;
        self.reservePool = 0.toCoins();
        self.totalInvested = 0.toCoins();
        
        // 重置双车状态
        self.car1 = CarData {
            baseSpeed: self.baseSpeed,
            totalBoost: 0,
            currentSpeed: self.baseSpeed,
            itemCount: 0
        };
        self.car2 = CarData {
            baseSpeed: self.baseSpeed,
            totalBoost: 0,
            currentSpeed: self.baseSpeed,
            itemCount: 0
        };
        
        // 重置玩家数量（新游戏开始）
        self.gameState = GameState {
            state: 1,
            startTime: now,
            endTime: now + duration,
            totalPlayers: 0,  // 重置玩家数量
            totalItems: 0     // 重置道具数量
        };
    }
    
    // 设置基础价格（只有所有者可以设置）
    receive("set_base_price", price: Int as coins) {
        self.onlyOwner();
        require(price > 0.toCoins() && price <= 2000000000.toCoins(), "Base price must be between 0.001 and 2 TON");
        self.basePrice = price.toInt();
    }
    
    // 设置价格上限（只有所有者可以设置）
    receive("set_max_price", price: Int as coins) {
        self.onlyOwner();
        require(price >= self.basePrice.toCoins(), "Max price must be >= base price");
        require(price <= 10000000000.toCoins(), "Max price must be <= 10 TON");
        self.maxPrice = price.toInt();
    }
    
    // 设置推荐奖励比例（只有所有者可以设置）
    receive("set_referral_reward_percent", percent: Int as int) {
        self.onlyOwner();
        require(percent >= 0 && percent <= 50, "Referral reward percent must be between 0 and 50");
        self.referralRewardPercent = percent;
    }
    
    // 注册名字（需要支付gas费）
    receive("register_name", name: String) {
        let sender: Address = context().sender;
        
        // 验证名字长度（1-50个字符，支持中文日文韩文英文表情符号）
        require(name.length() > 0 && name.length() <= 50, "Name must be between 1 and 50 characters");
        
        // 获取或创建玩家数据
        let playerData: PlayerData? = self.players.get(sender);
        let currentData: PlayerData = match playerData {
            p: PlayerData => p,
            _ => PlayerData {
                totalInvested: 0.toCoins(),
                totalBoost: 0,
                itemCount: 0,
                rewardBalance: 0.toCoins(),
                referrer: null(),
                referralRewards: 0.toCoins(),
                referralCount: 0,
                name: null(),
                itemCounter: 0
            }
        };
        
        // 更新名字
        let newData: PlayerData = PlayerData {
            totalInvested: currentData.totalInvested,
            totalBoost: currentData.totalBoost,
            itemCount: currentData.itemCount,
            rewardBalance: currentData.rewardBalance,
            referrer: currentData.referrer,
            referralRewards: currentData.referralRewards,
            referralCount: currentData.referralCount,
            name: name,
            itemCounter: currentData.itemCounter
        };
        
        self.players.set(sender, newData);
    }
    
    // 椭圆算法计算价格: price = base_price * (1 + (item_count / max_items)^2)
    // 添加价格上限保护玩家（带溢出保护）
    fun calculateItemPrice(itemCount: Int): Int {
        require(itemCount >= 0, "Item count cannot be negative");
        require(itemCount <= 1000, "Item count exceeds maximum");

        let maxItems: Int = 1000;
        let ratio: Int = itemCount * 100 / maxItems;  // 百分比（0-100）

        // 确保 ratio 在合理范围内
        require(ratio >= 0 && ratio <= 100, "Invalid ratio");

        let ratioSquared: Int = ratio * ratio / 100;  // 0-100
        let multiplier: Int = 100 + ratioSquared;  // 100-200

        // 确保 multiplier 在合理范围内
        require(multiplier >= 100 && multiplier <= 200, "Invalid multiplier");

        let calculatedPrice: Int = self.basePrice * multiplier / 100;

        // 确保计算的价格为正数
        require(calculatedPrice > 0, "Calculated price must be positive");

        // 返回计算价格和上限中的较小值
        return if (calculatedPrice > self.maxPrice) { self.maxPrice } else { calculatedPrice };
    }
    
    // 根据策略计算实际价格和返现
    fun calculatePriceWithStrategy(basePrice: Int, strategy: Int): (Int, Int) {
        let finalPrice: Int = basePrice;
        let cashbackPercent: Int = 0;
        
        if (strategy == 0) {
            // 保守策略：高返现10%，价格不变
            cashbackPercent = self.cashbackPercentConservative;
            finalPrice = basePrice;
        } else if (strategy == 1) {
            // 平衡策略：标准返现5%，价格不变
            cashbackPercent = self.cashbackPercentBalanced;
            finalPrice = basePrice;
        } else if (strategy == 2) {
            // 激进策略：低返现2%，价格降低5%
            cashbackPercent = self.cashbackPercentAggressive;
            finalPrice = basePrice * (100 - self.aggressivePriceDiscount) / 100;
        } else if (strategy == 3) {
            // 幸运策略：返现3%，价格不变，可能双倍效果
            cashbackPercent = self.cashbackPercentLucky;
            finalPrice = basePrice;
        } else {
            // 默认使用平衡策略
            cashbackPercent = self.cashbackPercentBalanced;
            finalPrice = basePrice;
        }
        
        let cashbackAmount: Int = finalPrice * cashbackPercent / 100;
        return (finalPrice, cashbackAmount);
    }
    
    // 生成随机道具效果: 1X, 2X, 5X, 10X
    fun generateItemEffect(randomSeed: Int): Int {
        let effectType: Int = randomSeed % 2;  // 0=加速, 1=减速
        let multiplierType: Int = randomSeed % 4;  // 0=1X, 1=2X, 2=5X, 3=10X
        
        let multiplier: Int = 1;
        if (multiplierType == 1) { multiplier = 2; }
        if (multiplierType == 2) { multiplier = 5; }
        if (multiplierType == 3) { multiplier = 10; }
        
        if (effectType == 1) {
            multiplier = -multiplier;  // 减速
        }
        
        return multiplier;
    }
    
    // 生成推荐人道具效果（固定1X，随机加速或减速）
    fun generateReferralItemEffect(randomSeed: Int): Int {
        let effectType: Int = randomSeed % 2;  // 0=加速, 1=减速
        
        // 固定为1X
        if (effectType == 1) {
            return -1;  // 减速1X
        } else {
            return 1;   // 加速1X
        }
    }
    
    // 设置玩家数量上限（只有所有者可以设置）
    receive("set_max_players", maxPlayers: Int as int) {
        self.onlyOwner();
        require(maxPlayers > 0 && maxPlayers <= 1000, "Max players must be between 1 and 1000");
        self.maxPlayers = maxPlayers;
    }

    // 设置游戏时长（只有所有者可以设置）
    receive("set_game_duration", duration: Int as int) {
        self.onlyOwner();
        require(duration >= 60 && duration <= 1800, "Duration must be between 1 and 30 minutes");
        require(self.gameState.state == 0, "Can only change duration before game starts");
        self.gameDuration = duration;
    }

    // 启用/禁用动态分配（只有所有者可以设置）
    receive("set_dynamic_distribution", enabled: Bool as bool) {
        self.onlyOwner();
        self.dynamicDistribution = enabled;
    }
    
    // 动态分配计算（根据玩家数量调整比例）
    fun getDynamicDistribution(): (Int, Int, Int) {
        let playerCount: Int = self.gameState.totalPlayers;
        
        // 50玩家及以下：大幅提高奖池比例（吸引玩家，弥补奖池规模小）
        if (playerCount <= 50) {
            return (75, 15, 10);  // 75%奖池 / 15%社区 / 10%预留
        }
        // 50-100玩家：提高奖池比例（吸引玩家）
        else if (playerCount < 100) {
            return (70, 15, 15);  // 70%奖池 / 15%社区 / 15%预留
        }
        // 100-300玩家：标准比例
        else if (playerCount <= 300) {
            return (60, 20, 20);  // 60%奖池 / 20%社区 / 20%预留
        }
        // 300+玩家：适当提高社区池（增加运营收益）
        else {
            return (55, 25, 20);  // 55%奖池 / 25%社区 / 20%预留
        }
    }
    
    // 添加道具到玩家背包的辅助函数
    // 创建默认的玩家数据
    fun createDefaultPlayerData(): PlayerData {
        return PlayerData {
            totalInvested: 0.toCoins(),
            totalBoost: 0,
            itemCount: 0,
            rewardBalance: 0.toCoins(),
            referrer: null(),
            referralRewards: 0.toCoins(),
            referralCount: 0,
            name: null(),
            itemCounter: 0
        };
    }

    // 处理推荐奖励（给推荐人发放道具或进入社区池）
    fun processReferralReward(
        referrer: Address,
        hasName: Bool,
        isNewPlayer: Bool,
        netAmount: Int,
        now: Int,
        itemId: Int
    ) {
        if (hasName) {
            // 被推荐人有名字，给推荐人添加盲盒道具
            let referralItemSeed: Int = now + self.gameState.totalItems + 8888 + itemId;
            let referralEffect: Int = self.generateReferralItemEffect(referralItemSeed);
            let _: Int = self.addItemToBag(referrer, referralEffect, now);

            // 更新推荐人的推荐统计
            let referrerData: PlayerData? = self.players.get(referrer);
            match referrerData {
                refData: PlayerData => {
                    let newReferrerData: PlayerData = PlayerData {
                        totalInvested: refData.totalInvested,
                        totalBoost: refData.totalBoost,
                        itemCount: refData.itemCount,
                        rewardBalance: refData.rewardBalance,
                        referrer: refData.referrer,
                        referralRewards: refData.referralRewards,
                        referralCount: if (isNewPlayer) { refData.referralCount + 1 } else { refData.referralCount },
                        name: refData.name,
                        itemCounter: refData.itemCounter
                    };
                    self.players.set(referrer, newReferrerData);
                },
                _ => {}
            }
        } else {
            // 被推荐人没有名字，推荐奖励进入社区池
            let referralReward: Int = netAmount * self.referralRewardPercent / 100;
            if (referralReward > 0) {
                self.communityPool = self.communityPool + referralReward.toCoins();
            }
        }
    }

    // 分配资金到各个池子（带溢出保护）
    fun distributeFundsTopools(netAmount: Int) {
        require(netAmount >= 0, "Net amount cannot be negative");

        // 按比例分配资金（支持动态调整）
        let (prizePercent, communityPercent, reservePercent): (Int, Int, Int) =
            if (self.dynamicDistribution) {
                self.getDynamicDistribution();
            } else {
                (self.distributionConfig.prizePoolPercent,
                 self.distributionConfig.communityPercent,
                 self.distributionConfig.reservePercent);
            };

        // 验证百分比总和为100
        require(prizePercent + communityPercent + reservePercent == 100, "Percentages must sum to 100");
        require(prizePercent >= 0 && communityPercent >= 0 && reservePercent >= 0, "Percentages must be non-negative");

        let prizeAmount: Int = netAmount * prizePercent / 100;
        let communityAmount: Int = netAmount * communityPercent / 100;
        let reserveAmount: Int = netAmount - prizeAmount - communityAmount;

        // 确保分配的金额都是非负数
        require(prizeAmount >= 0 && communityAmount >= 0 && reserveAmount >= 0, "Distributed amounts must be non-negative");

        // 更新各个池子
        self.prizePool = self.prizePool + prizeAmount.toCoins();
        self.communityPool = self.communityPool + communityAmount.toCoins();
        self.reservePool = self.reservePool + reserveAmount.toCoins();
    }

    fun addItemToBag(playerAddr: Address, effect: Int, createdAt: Int): Int {
        let playerData: PlayerData? = self.players.get(playerAddr);
        let currentData: PlayerData = match playerData {
            p: PlayerData => p,
            _ => self.createDefaultPlayerData()
        };
        
        // 生成道具ID
        let itemId: Int = currentData.itemCounter + 1;
        let effectType: Int = if (effect > 0) { 0 } else { 1 };  // 0=加速, 1=减速
        let absEffect: Int = if (effect < 0) { -effect } else { effect };
        
        // 创建道具（count默认为1，使用一次后减1，为0时删除）
        let newItem: Item = Item {
            id: itemId,
            multiplier: absEffect,  // 1/2/5/10
            effectType: effectType,  // 0=加速, 1=减速
            effectValue: effect,  // 实际效果值（正数=加速，负数=减速）
            createdAt: createdAt,
            count: 1  // 使用次数，默认为1
        };
        
        // 获取或创建道具背包
        let itemsBag: Map<Int, Item>? = self.playersItems.get(playerAddr);
        let newBag: Map<Int, Item> = match itemsBag {
            bag: Map<Int, Item> => bag,
            _ => empty_map()
        };
        newBag.set(itemId, newItem);
        self.playersItems.set(playerAddr, newBag);
        
        // 更新玩家的itemCounter
        let updatedData: PlayerData = PlayerData {
            totalInvested: currentData.totalInvested,
            totalBoost: currentData.totalBoost,
            itemCount: currentData.itemCount,
            rewardBalance: currentData.rewardBalance,
            referrer: currentData.referrer,
            referralRewards: currentData.referralRewards,
            referralCount: currentData.referralCount,
            name: currentData.name,
            itemCounter: itemId
        };
        self.players.set(playerAddr, updatedData);
        
        return itemId;
    }
    
    // 购买道具（盲盒机制，道具存储到背包）
    receive("buy_item", msg: BuyItemMessage) {
        require(self.gameState.state == 1, "Game not in progress");
        require(context().now < self.gameState.endTime, "Game ended");
        
        let sender: Address = context().sender;
        
        // 检查玩家数量上限（只对新玩家检查）
        let playerData: PlayerData? = self.players.get(sender);
        let isNewPlayer: Bool = match playerData {
            _: PlayerData => false,
            _ => true
        };
        
        // 处理新玩家的推荐关系
        let referrer: Address? = match msg.referrer {
            r: Address => {
                // 验证推荐人不能是自己
                if (r != sender) {
                    // 验证推荐人必须是已存在的玩家
                    let referrerData: PlayerData? = self.players.get(r);
                    match referrerData {
                        _: PlayerData => r,
                        _ => null()
                    }
                } else {
                    null()
                }
            },
            _ => null()
        };
        
        // 如果是新玩家，设置推荐关系（只在首次购买时设置，且必须有有效的推荐人）
        let finalReferrer: Address? = if (isNewPlayer) {
            match referrer {
                r: Address => r,
                _ => null()
            }
        } else {
            // 老玩家保持原有推荐关系
            match playerData {
                p: PlayerData => p.referrer,
                _ => null()
            }
        };
        
        if (isNewPlayer) {
            // 使用游戏状态中的玩家数量（更高效）
            require(self.gameState.totalPlayers < self.maxPlayers, "Maximum players reached");
        }
        
        // 验证策略有效性（0-3）
        require(msg.strategy >= 0 && msg.strategy <= 3, "Invalid strategy");
        
        // 计算基础价格
        let baseItemPrice: Int = self.calculateItemPrice(self.gameState.totalItems);
        
        // 根据策略计算实际价格和返现
        let (finalPrice, cashbackAmount): (Int, Int) = self.calculatePriceWithStrategy(baseItemPrice, msg.strategy);
        
        let msgValue = context().myBalance();
        require(msgValue >= finalPrice, "Insufficient balance");
        
        let now: Int = context().now;
        
        // 生成随机道具效果（盲盒机制，购买前未知）
        // 幸运策略（strategy=3）有10%概率获得双倍效果
        let randomSeed: Int = now + self.gameState.totalItems + msgValue + msg.strategy;
        let baseEffect: Int = self.generateItemEffect(randomSeed);
        let effect: Int = if (msg.strategy == 3 && (randomSeed % 10) == 0) {
            // 幸运策略：10%概率双倍效果
            baseEffect * 2
        } else {
            baseEffect
        };
        
        // 将购买的道具添加到玩家背包
        let itemId: Int = self.addItemToBag(sender, effect, now);
        
        // 更新玩家数据（只更新投资金额，不更新boost和itemCount，因为道具还没使用）
        let currentData: PlayerData = match playerData {
            p: PlayerData => p,
            _ => self.createDefaultPlayerData()
        };
        
        // 计算返现并加到玩家余额
        let newRewardBalance: Int = currentData.rewardBalance + cashbackAmount.toCoins();
        
        let newData: PlayerData = PlayerData {
            totalInvested: currentData.totalInvested + finalPrice.toCoins(),  // 使用实际支付价格
            totalBoost: currentData.totalBoost,  // 道具还没使用，不更新boost
            itemCount: currentData.itemCount,  // 道具还没使用，不更新itemCount
            rewardBalance: newRewardBalance,  // 增加返现
            referrer: finalReferrer,
            referralRewards: currentData.referralRewards,
            referralCount: currentData.referralCount,
            name: currentData.name,
            itemCounter: itemId  // 更新itemCounter
        };
        
        self.players.set(sender, newData);

        // 计算净金额（实际用于分配的资金 = 支付价格 - 返现）
        let netAmount: Int = finalPrice - cashbackAmount;

        // 如果是新玩家且有推荐人，处理推荐奖励
        match finalReferrer {
            r: Address => {
                let hasName: Bool = match newData.name {
                    _: String => true,
                    _ => false
                };
                self.processReferralReward(r, hasName, isNewPlayer, netAmount, now, itemId);
            },
            _ => {}
        }
        
        // 如果是新玩家，更新玩家数量
        if (isNewPlayer) {
            self.gameState = GameState {
                state: self.gameState.state,
                startTime: self.gameState.startTime,
                endTime: self.gameState.endTime,
                totalPlayers: self.gameState.totalPlayers + 1,
                totalItems: self.gameState.totalItems
            };
        }
        
        // 分配资金到各个池子
        self.distributeFundsTopools(netAmount);
        self.totalInvested = self.totalInvested + finalPrice.toCoins();  // 总投入使用实际支付价格
        
        // 更新游戏状态（道具数）
        self.gameState = GameState {
            state: self.gameState.state,
            startTime: self.gameState.startTime,
            endTime: self.gameState.endTime,
            totalPlayers: self.gameState.totalPlayers,  // 玩家数已在上面更新（如果是新玩家）
            totalItems: self.gameState.totalItems + 1
        };
        
        // 返回道具信息（支付成功后显示）
        let absEffect: Int = if (effect < 0) { -effect } else { effect };
        let effectType: Int = if (effect > 0) { 0 } else { 1 };
        self.reply(ItemEffect { 
            itemId: itemId,
            multiplier: absEffect,  // 1/2/5/10
            effectType: effectType,  // 0=加速, 1=减速
            effectValue: effect,  // 实际效果值（正数=加速，负数=减速）
            strategy: msg.strategy,  // 使用的策略
            cashbackAmount: cashbackAmount.toCoins(),  // 返现金额
            finalPrice: finalPrice.toCoins()  // 实际支付价格
        });
    }
    
    // 使用道具（从背包中选择道具应用到车辆）
    receive("use_item", msg: UseItemMessage) {
        require(self.gameState.state == 1, "Game not in progress");
        require(context().now < self.gameState.endTime, "Game ended");
        require(msg.carId == 1 || msg.carId == 2, "Invalid car ID");
        
        let sender: Address = context().sender;
        
        // 获取玩家的道具背包
        let itemsBag: Map<Int, Item>? = self.playersItems.get(sender);
        let item: Item? = match itemsBag {
            bag: Map<Int, Item> => bag.get(msg.itemId),
            _ => null()
        };
        
        require(item != null, "Item not found in bag");
        
        let itemData: Item = match item {
            i: Item => i,
            _ => throw("Invalid item")
        };
        
        // 检查道具使用次数（count必须大于0）
        require(itemData.count > 0, "Item count is 0, cannot use");
        
        // 应用道具效果到目标车辆
        if (msg.carId == 1) {
            let newTotalBoost: Int = self.car1.totalBoost + itemData.effectValue;
            self.car1 = CarData {
                baseSpeed: self.car1.baseSpeed,
                totalBoost: newTotalBoost,
                currentSpeed: self.car1.baseSpeed + newTotalBoost,
                itemCount: self.car1.itemCount + 1
            };
        } else {
            let newTotalBoost: Int = self.car2.totalBoost + itemData.effectValue;
            self.car2 = CarData {
                baseSpeed: self.car2.baseSpeed,
                totalBoost: newTotalBoost,
                currentSpeed: self.car2.baseSpeed + newTotalBoost,
                itemCount: self.car2.itemCount + 1
            };
        }
        
        // 更新玩家数据（更新totalBoost和itemCount）
        let playerData: PlayerData? = self.players.get(sender);
        match playerData {
            p: PlayerData => {
                let newData: PlayerData = PlayerData {
                    totalInvested: p.totalInvested,
                    totalBoost: p.totalBoost + itemData.effectValue,  // 更新总加速效果
                    itemCount: p.itemCount + 1,  // 更新已使用道具数
                    rewardBalance: p.rewardBalance,
                    referrer: p.referrer,
                    referralRewards: p.referralRewards,
                    referralCount: p.referralCount,
                    name: p.name,
                    itemCounter: p.itemCounter
                };
                self.players.set(sender, newData);
            },
            _ => throw("Player not found")
        }
        
        // 使用一次，count减1
        let newCount: Int = itemData.count - 1;
        
        // 获取道具背包
        let itemsBag: Map<Int, Item>? = self.playersItems.get(sender);
        match itemsBag {
            bag: Map<Int, Item> => {
                if (newCount > 0) {
                    // count > 0，更新道具
                    let updatedItem: Item = Item {
                        id: itemData.id,
                        multiplier: itemData.multiplier,
                        effectType: itemData.effectType,
                        effectValue: itemData.effectValue,
                        createdAt: itemData.createdAt,
                        count: newCount
                    };
                    bag.set(msg.itemId, updatedItem);
                    self.playersItems.set(sender, bag);
                } else {
                    // count = 0，删除道具
                    bag.delete(msg.itemId);
                    self.playersItems.set(sender, bag);
                }
            },
            _ => {}
        }
        
        // 返回使用结果
        self.reply(ItemEffect {
            itemId: itemData.id,
            multiplier: itemData.multiplier,
            effectType: itemData.effectType,
            effectValue: itemData.effectValue
        });
    }
    
    // 结束游戏并计算排名
    receive("end_game") {
        self.onlyOwner();
        require(self.gameState.state == 1, "Game not in progress");
        require(context().now >= self.gameState.endTime, "Game not ended yet");
        
        self.gameState = GameState {
            state: 2,
            startTime: self.gameState.startTime,
            endTime: self.gameState.endTime,
            totalPlayers: self.gameState.totalPlayers,
            totalItems: self.gameState.totalItems
        };
        
        // 检查两个车是否平局
        let leadingCar: Int = self.getLeadingCar();
        
        if (leadingCar == 0) {
            // 平局：没有获胜者，奖池按比例进入社区池和预留池
            let pool = self.prizePool.toInt();
            // 50%给社区池，50%给预留池
            let communityAmount: Int = pool * 50 / 100;
            let reserveAmount: Int = pool - communityAmount;  // 剩余部分给预留池
            
            self.communityPool = self.communityPool + communityAmount.toCoins();
            self.reservePool = self.reservePool + reserveAmount.toCoins();
            self.prizePool = 0.toCoins();  // 清空奖池
            
            // 平局时不计算排名和分配奖励
        } else {
            // 有获胜者：正常计算排名和分配奖励
            self.calculateRanks();
            self.distributeRewards();
        }
    }
    
    // 计算排名（投入最多且正向效果最好的前三名）
    fun calculateRanks() {
        let rankList: List<RankData> = [];
        
        // 遍历所有玩家，计算得分
        self.players.foreach((addr, data) => {
            // 只考虑正向效果（boost > 0）的玩家
            if (data.totalBoost > 0) {
                // 综合得分 = 投入 * (1 + boost/100)
                let score: Int = data.totalInvested.toInt() * (100 + data.totalBoost) / 100;
                
                rankList.push(RankData {
                    address: addr,
                    invested: data.totalInvested,
                    boost: data.totalBoost,
                    score: score,
                    name: data.name  // 包含玩家名字
                });
            }
        });
        
        // 按得分排序（降序）
        rankList.sort((a, b) => b.score - a.score);
        
        // 保存前三名
        let rank: Int = 1;
        rankList.forEach((data) => {
            if (rank <= 3) {
                self.ranks.set(rank, data);
                rank = rank + 1;
            }
        });
    }
    
    // 分配奖金给前三名（从奖池中分配）
    fun distributeRewards() {
        let pool = self.prizePool.toInt();
        let minGas = self.minGasReserve.toInt();
        
        // 检查奖池是否足够支付gas费用
        // 如果奖池金额小于最小gas保留金额，则不进行分配
        if (pool < minGas) {
            // 奖池过低，无法支付gas费用，将奖池转入社区池和预留池
            let communityAmount: Int = pool * 50 / 100;
            let reserveAmount: Int = pool - communityAmount;
            
            self.communityPool = self.communityPool + communityAmount.toCoins();
            self.reservePool = self.reservePool + reserveAmount.toCoins();
            self.prizePool = 0.toCoins();
            
            // 设置分配状态说明
            // Tact不支持字符串拼接，使用固定说明
            self.distributionStatus = "Prize pool too low for gas fees. Funds transferred to community and reserve pools.";
            
            // 不进行分配，直接返回
            return;
        }
        
        // 清空之前的分配状态说明
        self.distributionStatus = null();
        
        // 奖金分配比例：第一名50%，第二名30%，第三名20%
        let firstPrize: Int = pool * 50 / 100;
        let secondPrize: Int = pool * 30 / 100;
        let thirdPrize: Int = pool * 20 / 100;
        
        // 分配第一名奖金
        let rank1: RankData? = self.ranks.get(1);
        match rank1 {
            r: RankData => {
                let playerData: PlayerData? = self.players.get(r.address);
                match playerData {
                    p: PlayerData => {
                        let newReward = p.rewardBalance + firstPrize.toCoins();
                        self.players.set(r.address, PlayerData {
                            totalInvested: p.totalInvested,
                            totalBoost: p.totalBoost,
                            itemCount: p.itemCount,
                            rewardBalance: newReward,
                            referrer: p.referrer,
                            referralRewards: p.referralRewards,
                            referralCount: p.referralCount,
                            name: p.name
                        });
                    },
                    _ => {}
                }
            },
            _ => {}
        }
        
        // 分配第二名奖金
        let rank2: RankData? = self.ranks.get(2);
        match rank2 {
            r: RankData => {
                let playerData: PlayerData? = self.players.get(r.address);
                match playerData {
                    p: PlayerData => {
                        let newReward = p.rewardBalance + secondPrize.toCoins();
                        self.players.set(r.address, PlayerData {
                            totalInvested: p.totalInvested,
                            totalBoost: p.totalBoost,
                            itemCount: p.itemCount,
                            rewardBalance: newReward,
                            referrer: p.referrer,
                            referralRewards: p.referralRewards,
                            referralCount: p.referralCount,
                            name: p.name
                        });
                    },
                    _ => {}
                }
            },
            _ => {}
        }
        
        // 分配第三名奖金
        let rank3: RankData? = self.ranks.get(3);
        match rank3 {
            r: RankData => {
                let playerData: PlayerData? = self.players.get(r.address);
                match playerData {
                    p: PlayerData => {
                        let newReward = p.rewardBalance + thirdPrize.toCoins();
                        self.players.set(r.address, PlayerData {
                            totalInvested: p.totalInvested,
                            totalBoost: p.totalBoost,
                            itemCount: p.itemCount,
                            rewardBalance: newReward,
                            referrer: p.referrer,
                            referralRewards: p.referralRewards,
                            referralCount: p.referralCount,
                            name: p.name
                        });
                    },
                    _ => {}
                }
            },
            _ => {}
        }
        
        // 清空奖池（奖金已分配）
        self.prizePool = 0.toCoins();
    }
    
    // 获取游戏状态
    get fun getGameState(): GameState {
        return self.gameState;
    }
    
    // 获取玩家数据
    get fun getPlayerData(addr: Address): PlayerData? {
        return self.players.get(addr);
    }
    
    // 获取排名
    get fun getRank(rank: Int): RankData? {
        return self.ranks.get(rank);
    }
    
    // 获取剩余时间（秒）
    get fun getRemainingTime(): Int {
        if (self.gameState.state != 1) {
            return 0;
        }
        let remaining: Int = self.gameState.endTime - context().now;
        return remaining > 0 ? remaining : 0;
    }
    
    // 提取奖金
    receive("withdraw_reward") {
        let sender: Address = context().sender;
        let playerData: PlayerData? = self.players.get(sender);
        
        match playerData {
            p: PlayerData => {
                let reward = p.rewardBalance;
                require(reward > 0.toCoins(), "No reward to withdraw");
                require(context().myBalance() >= reward.toInt(), "Insufficient contract balance");
                
                // 清零奖金余额
                self.players.set(sender, PlayerData {
                    totalInvested: p.totalInvested,
                    totalBoost: p.totalBoost,
                    itemCount: p.itemCount,
                    rewardBalance: 0.toCoins(),
                    referrer: p.referrer,
                    referralRewards: p.referralRewards,
                    referralCount: p.referralCount,
                    name: p.name
                });
                
                // 发送奖金给玩家
                sender.send(reward);
            },
            _ => {
                throw("Player not found");
            }
        }
    }
    
    // 获取奖池总额
    get fun getPrizePool(): Int as coins {
        return self.prizePool;
    }
    
    // 获取社区池
    get fun getCommunityPool(): Int as coins {
        return self.communityPool;
    }
    
    // 获取预留池
    get fun getReservePool(): Int as coins {
        return self.reservePool;
    }
    
    // 获取总投入
    get fun getTotalInvested(): Int as coins {
        return self.totalInvested;
    }
    
    // 获取分配配置
    get fun getDistributionConfig(): DistributionConfig {
        return self.distributionConfig;
    }
    
    // 获取车辆1数据
    get fun getCar1(): CarData {
        return self.car1;
    }
    
    // 获取车辆2数据
    get fun getCar2(): CarData {
        return self.car2;
    }
    
    // 计算两个车的速度差距
    get fun getSpeedGap(): Int as int {
        let gap: Int = self.car1.currentSpeed - self.car2.currentSpeed;
        return if (gap < 0) { -gap } else { gap };
    }
    
    // 获取领先车辆ID（1或2，0表示平局）
    get fun getLeadingCar(): Int as int {
        if (self.car1.currentSpeed > self.car2.currentSpeed) {
            return 1;
        } else if (self.car2.currentSpeed > self.car1.currentSpeed) {
            return 2;
        } else {
            return 0;  // 平局
        }
    }
    
    // 获取玩家数量上限
    get fun getMaxPlayers(): Int as int {
        return self.maxPlayers;
    }

    // 获取当前玩家数量（从游戏状态获取，更高效）
    get fun getCurrentPlayerCount(): Int as int {
        return self.gameState.totalPlayers;
    }

    // 获取游戏时长配置
    get fun getGameDuration(): Int as int {
        return self.gameDuration;
    }
    
    // 获取基础价格
    get fun getBasePrice(): Int as coins {
        return self.basePrice.toCoins();
    }
    
    // 获取价格上限
    get fun getMaxPrice(): Int as coins {
        return self.maxPrice.toCoins();
    }
    
    // 获取推荐奖励比例
    get fun getReferralRewardPercent(): Int as int {
        return self.referralRewardPercent;
    }
    
    // 获取玩家的推荐人
    get fun getReferrer(addr: Address): Address? {
        let playerData: PlayerData? = self.players.get(addr);
        return match playerData {
            p: PlayerData => p.referrer,
            _ => null()
        };
    }
    
    // 获取玩家的推荐奖励统计
    get fun getReferralStats(addr: Address): (Int, Int) {
        let playerData: PlayerData? = self.players.get(addr);
        return match playerData {
            p: PlayerData => (p.referralRewards.toInt(), p.referralCount),
            _ => (0, 0)
        };
    }
    
    // 获取玩家的名字
    get fun getPlayerName(addr: Address): String? {
        let playerData: PlayerData? = self.players.get(addr);
        return match playerData {
            p: PlayerData => p.name,
            _ => null()
        };
    }
    
    // 获取玩家的道具（通过itemId）
    get fun getPlayerItem(addr: Address, itemId: Int): Item? {
        let itemsBag: Map<Int, Item>? = self.playersItems.get(addr);
        return match itemsBag {
            bag: Map<Int, Item> => bag.get(itemId),
            _ => null()
        };
    }
    
    // 获取玩家道具背包中的所有道具ID列表（返回前100个，按创建时间排序）
    get fun getPlayerItemIds(addr: Address): (Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int, Int) {
        // 注意：Tact不支持动态列表返回，这里返回固定数量的ID
        // 实际使用中，前端可以通过遍历itemCounter来获取所有道具
        let itemsBag: Map<Int, Item>? = self.playersItems.get(addr);
        // 返回空值，前端通过itemCounter和getPlayerItem来获取
        return (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
    
    // 获取玩家道具数量（通过itemCounter）
    get fun getPlayerItemCount(addr: Address): Int {
        let playerData: PlayerData? = self.players.get(addr);
        return match playerData {
            p: PlayerData => p.itemCounter,
            _ => 0
        };
    }
    
    // 获取分配状态说明
    get fun getDistributionStatus(): String? {
        return self.distributionStatus;
    }
    
    // 获取最小gas保留金额
    get fun getMinGasReserve(): Int as coins {
        return self.minGasReserve;
    }
    
    // 提取社区池资金（只有所有者可以提取）
    receive("withdraw_community") {
        self.onlyOwner();
        let amount = self.communityPool;
        require(amount > 0.toCoins(), "Community pool is empty");
        require(context().myBalance() >= amount.toInt(), "Insufficient contract balance");
        
        self.communityPool = 0.toCoins();
        self.ownable.owner.send(amount);
    }
}


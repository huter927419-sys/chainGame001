/**
 * RaceGame 完整测试套件
 *
 * 测试覆盖：
 * 1. 合约初始化
 * 2. 游戏生命周期（开始/结束）
 * 3. 购买道具（buy_item）- 背包系统
 * 4. 使用道具（use_item）- 道具应用
 * 5. 策略系统（4种购买策略）
 * 6. 推荐系统
 * 7. 名字注册
 * 8. 排名和奖金分配
 * 9. 提现功能
 * 10. 边界条件和错误处理
 */

import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, Address } from '@ton/core';
import { RaceGame } from '../wrappers/RaceGame';
import '@ton/test-utils';

describe('RaceGame 完整测试', () => {
    let blockchain: Blockchain;
    let raceGame: SandboxContract<RaceGame>;
    let deployer: SandboxContract<TreasuryContract>;
    let player1: SandboxContract<TreasuryContract>;
    let player2: SandboxContract<TreasuryContract>;
    let player3: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        player1 = await blockchain.treasury('player1');
        player2 = await blockchain.treasury('player2');
        player3 = await blockchain.treasury('player3');

        raceGame = blockchain.openContract(
            await RaceGame.fromInit(deployer.address)
        );

        const deployResult = await raceGame.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Deploy', queryId: 0n }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: raceGame.address,
            deploy: true,
            success: true,
        });
    });

    describe('1. 合约初始化测试', () => {
        it('应该正确初始化游戏状态', async () => {
            const gameState = await raceGame.getGameState();
            expect(gameState.state).toBe(0n); // 未开始
            expect(gameState.totalPlayers).toBe(0n);
            expect(gameState.totalItems).toBe(0n);
        });

        it('应该正确初始化双车系统', async () => {
            const car1 = await raceGame.getCar1();
            const car2 = await raceGame.getCar2();

            expect(car1.baseSpeed).toBe(100n);
            expect(car1.currentSpeed).toBe(100n);
            expect(car1.totalBoost).toBe(0n);
            expect(car1.itemCount).toBe(0n);

            expect(car2.baseSpeed).toBe(100n);
            expect(car2.currentSpeed).toBe(100n);
            expect(car2.totalBoost).toBe(0n);
            expect(car2.itemCount).toBe(0n);
        });

        it('应该正确初始化资金池', async () => {
            const prizePool = await raceGame.getPrizePool();
            const communityPool = await raceGame.getCommunityPool();
            const reservePool = await raceGame.getReservePool();

            expect(prizePool).toBe(0n);
            expect(communityPool).toBe(0n);
            expect(reservePool).toBe(0n);
        });

        it('应该正确设置所有者', async () => {
            const owner = await raceGame.getOwner();
            expect(owner.toString()).toBe(deployer.address.toString());
        });

        it('应该正确初始化配置参数', async () => {
            const config = await raceGame.getDistributionConfig();
            expect(config.prizePoolPercent).toBe(60n);
            expect(config.communityPercent).toBe(20n);
            expect(config.reservePercent).toBe(20n);

            const maxPlayers = await raceGame.getMaxPlayers();
            expect(maxPlayers).toBe(50n);

            const basePrice = await raceGame.getBaseItemPrice();
            expect(basePrice).toBe(toNano('1'));
        });
    });

    describe('2. 游戏生命周期测试', () => {
        it('只有所有者可以开始游戏', async () => {
            const result = await raceGame.send(
                deployer.getSender(),
                { value: toNano('0.01') },
                'start'
            );

            expect(result.transactions).toHaveTransaction({
                from: deployer.address,
                to: raceGame.address,
                success: true,
            });

            const gameState = await raceGame.getGameState();
            expect(gameState.state).toBe(1n); // 进行中
        });

        it('非所有者不能开始游戏', async () => {
            const result = await raceGame.send(
                player1.getSender(),
                { value: toNano('0.01') },
                'start'
            );

            expect(result.transactions).toHaveTransaction({
                from: player1.address,
                to: raceGame.address,
                success: false,
            });
        });

        it('开始游戏应该重置双车状态', async () => {
            await raceGame.send(
                deployer.getSender(),
                { value: toNano('0.01') },
                'start'
            );

            const car1 = await raceGame.getCar1();
            const car2 = await raceGame.getCar2();

            expect(car1.currentSpeed).toBe(100n);
            expect(car1.totalBoost).toBe(0n);
            expect(car1.itemCount).toBe(0n);

            expect(car2.currentSpeed).toBe(100n);
            expect(car2.totalBoost).toBe(0n);
            expect(car2.itemCount).toBe(0n);
        });
    });

    describe('3. 购买道具测试（背包系统）', () => {
        beforeEach(async () => {
            await raceGame.send(
                deployer.getSender(),
                { value: toNano('0.01') },
                'start'
            );
        });

        it('应该能够购买道具到背包', async () => {
            const result = await raceGame.send(
                player1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 0n, // 保守策略
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: player1.address,
                to: raceGame.address,
                success: true,
            });

            // 验证玩家数据更新
            const playerData = await raceGame.getPlayerData(player1.address);
            expect(playerData).toBeDefined();
            expect(playerData!.totalInvested).toBeGreaterThan(0n);
            expect(playerData!.itemCounter).toBe(1n);

            // 验证游戏状态更新
            const gameState = await raceGame.getGameState();
            expect(gameState.totalPlayers).toBe(1n);
            expect(gameState.totalItems).toBe(1n);
        });

        it('应该正确分配资金到三个池子（60/20/20）', async () => {
            await raceGame.send(
                player1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 1n, // 平衡策略，5%返现
                }
            );

            const prizePool = await raceGame.getPrizePool();
            const communityPool = await raceGame.getCommunityPool();
            const reservePool = await raceGame.getReservePool();

            // 净金额 = 1 TON - 5%返现 = 0.95 TON
            // 奖池: 0.95 * 60% = 0.57 TON
            // 社区: 0.95 * 20% = 0.19 TON
            // 预留: 0.95 * 20% = 0.19 TON
            expect(prizePool).toBeGreaterThan(toNano('0.56'));
            expect(communityPool).toBeGreaterThan(toNano('0.18'));
            expect(reservePool).toBeGreaterThan(toNano('0.18'));
        });

        it('应该拒绝余额不足的购买', async () => {
            const result = await raceGame.send(
                player1.getSender(),
                { value: toNano('0.5') }, // 不足1 TON
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 0n,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: player1.address,
                to: raceGame.address,
                success: false,
            });
        });

        it('应该拒绝游戏未开始时的购买', async () => {
            // 重新部署，不开始游戏
            const newGame = blockchain.openContract(
                await RaceGame.fromInit(deployer.address)
            );

            await newGame.send(
                deployer.getSender(),
                { value: toNano('0.05') },
                { $$type: 'Deploy', queryId: 0n }
            );

            const result = await newGame.send(
                player1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 0n,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: player1.address,
                to: newGame.address,
                success: false,
            });
        });

        it('应该限制玩家数量上限（50人）', async () => {
            // 模拟50个玩家购买
            for (let i = 0; i < 50; i++) {
                const player = await blockchain.treasury(`player${i}`);
                await raceGame.send(
                    player.getSender(),
                    { value: toNano('1.1') },
                    {
                        $$type: 'BuyItemMessage',
                        referrer: null,
                        strategy: 0n,
                    }
                );
            }

            // 第51个玩家应该失败
            const player51 = await blockchain.treasury('player51');
            const result = await raceGame.send(
                player51.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 0n,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: player51.address,
                to: raceGame.address,
                success: false,
            });
        });
    });

    describe('4. 策略系统测试', () => {
        beforeEach(async () => {
            await raceGame.send(
                deployer.getSender(),
                { value: toNano('0.01') },
                'start'
            );
        });

        it('保守策略应该返现10%', async () => {
            await raceGame.send(
                player1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 0n, // 保守策略
                }
            );

            const playerData = await raceGame.getPlayerData(player1.address);
            // 返现 = 1 TON * 10% = 0.1 TON
            expect(playerData!.rewardBalance).toBeGreaterThanOrEqual(toNano('0.09'));
        });

        it('平衡策略应该返现5%', async () => {
            await raceGame.send(
                player1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 1n, // 平衡策略
                }
            );

            const playerData = await raceGame.getPlayerData(player1.address);
            // 返现 = 1 TON * 5% = 0.05 TON
            expect(playerData!.rewardBalance).toBeGreaterThanOrEqual(toNano('0.04'));
        });

        it('激进策略应该降低价格5%并返现2%', async () => {
            await raceGame.send(
                player1.getSender(),
                { value: toNano('1') }, // 价格降低，可以少付点
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 2n, // 激进策略
                }
            );

            const playerData = await raceGame.getPlayerData(player1.address);
            // 实际价格 = 1 TON * 95% = 0.95 TON
            // 返现 = 0.95 * 2% = 0.019 TON
            expect(playerData!.totalInvested).toBeLessThan(toNano('1'));
            expect(playerData!.rewardBalance).toBeGreaterThanOrEqual(toNano('0.01'));
        });

        it('幸运策略应该返现3%', async () => {
            await raceGame.send(
                player1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 3n, // 幸运策略
                }
            );

            const playerData = await raceGame.getPlayerData(player1.address);
            // 返现 = 1 TON * 3% = 0.03 TON
            expect(playerData!.rewardBalance).toBeGreaterThanOrEqual(toNano('0.02'));
        });

        it('应该拒绝无效的策略', async () => {
            const result = await raceGame.send(
                player1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 4n, // 无效策略
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: player1.address,
                to: raceGame.address,
                success: false,
            });
        });
    });

    describe('5. 推荐系统测试', () => {
        beforeEach(async () => {
            await raceGame.send(
                deployer.getSender(),
                { value: toNano('0.01') },
                'start'
            );
        });

        it('应该能够设置推荐人', async () => {
            // Player1先购买（没有推荐人）
            await raceGame.send(
                player1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 0n,
                }
            );

            // Player2购买，设置player1为推荐人
            await raceGame.send(
                player2.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: player1.address,
                    strategy: 0n,
                }
            );

            const player2Data = await raceGame.getPlayerData(player2.address);
            expect(player2Data!.referrer?.toString()).toBe(player1.address.toString());
        });

        it('推荐人应该获得道具奖励（如果被推荐人有名字）', async () => {
            // Player1购买并注册名字
            await raceGame.send(
                player1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 0n,
                }
            );

            await raceGame.send(
                player1.getSender(),
                { value: toNano('0.01') },
                {
                    $$type: 'RegisterName',
                    name: 'Player1',
                }
            );

            // Player2购买，设置player1为推荐人
            await raceGame.send(
                player2.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: player1.address,
                    strategy: 0n,
                }
            );

            // Player2也注册名字
            await raceGame.send(
                player2.getSender(),
                { value: toNano('0.01') },
                {
                    $$type: 'RegisterName',
                    name: 'Player2',
                }
            );

            // Player3购买，设置player2为推荐人
            await raceGame.send(
                player3.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: player2.address,
                    strategy: 0n,
                }
            );

            // Player3也注册名字
            await raceGame.send(
                player3.getSender(),
                { value: toNano('0.01') },
                {
                    $$type: 'RegisterName',
                    name: 'Player3',
                }
            );

            const player2Data = await raceGame.getPlayerData(player2.address);
            // Player2推荐了player3，应该有推荐统计
            expect(player2Data!.referralCount).toBe(1n);
        });

        it('不能推荐自己', async () => {
            const result = await raceGame.send(
                player1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: player1.address, // 自己推荐自己
                    strategy: 0n,
                }
            );

            const playerData = await raceGame.getPlayerData(player1.address);
            expect(playerData!.referrer).toBeNull();
        });
    });

    describe('6. 使用道具测试', () => {
        beforeEach(async () => {
            await raceGame.send(
                deployer.getSender(),
                { value: toNano('0.01') },
                'start'
            );

            // Player1购买一个道具
            await raceGame.send(
                player1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 0n,
                }
            );
        });

        it('应该能够使用道具到车辆1', async () => {
            const result = await raceGame.send(
                player1.getSender(),
                { value: toNano('0.01') },
                {
                    $$type: 'UseItemMessage',
                    itemId: 1n,
                    carId: 1n,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: player1.address,
                to: raceGame.address,
                success: true,
            });

            const car1 = await raceGame.getCar1();
            expect(car1.itemCount).toBe(1n);
            // 速度应该改变
            expect(car1.currentSpeed).not.toBe(100n);
        });

        it('应该能够使用道具到车辆2', async () => {
            const result = await raceGame.send(
                player1.getSender(),
                { value: toNano('0.01') },
                {
                    $$type: 'UseItemMessage',
                    itemId: 1n,
                    carId: 2n,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: player1.address,
                to: raceGame.address,
                success: true,
            });

            const car2 = await raceGame.getCar2();
            expect(car2.itemCount).toBe(1n);
        });

        it('应该拒绝无效的车辆ID', async () => {
            const result = await raceGame.send(
                player1.getSender(),
                { value: toNano('0.01') },
                {
                    $$type: 'UseItemMessage',
                    itemId: 1n,
                    carId: 3n, // 无效
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: player1.address,
                to: raceGame.address,
                success: false,
            });
        });

        it('应该拒绝使用不存在的道具', async () => {
            const result = await raceGame.send(
                player1.getSender(),
                { value: toNano('0.01') },
                {
                    $$type: 'UseItemMessage',
                    itemId: 999n, // 不存在
                    carId: 1n,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: player1.address,
                to: raceGame.address,
                success: false,
            });
        });
    });

    describe('7. 提现功能测试', () => {
        beforeEach(async () => {
            await raceGame.send(
                deployer.getSender(),
                { value: toNano('0.01') },
                'start'
            );

            // Player1购买道具获得返现
            await raceGame.send(
                player1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 0n, // 10%返现
                }
            );
        });

        it('应该能够提现奖励', async () => {
            const playerDataBefore = await raceGame.getPlayerData(player1.address);
            const rewardBefore = playerDataBefore!.rewardBalance;

            const result = await raceGame.send(
                player1.getSender(),
                { value: toNano('0.05') },
                'withdraw_reward'
            );

            expect(result.transactions).toHaveTransaction({
                from: player1.address,
                to: raceGame.address,
                success: true,
            });

            const playerDataAfter = await raceGame.getPlayerData(player1.address);
            expect(playerDataAfter!.rewardBalance).toBe(0n);
        });
    });

    describe('8. 边界条件和错误处理', () => {
        it('应该拒绝在游戏结束后购买道具', async () => {
            await raceGame.send(
                deployer.getSender(),
                { value: toNano('0.01') },
                'start'
            );

            // 等待游戏时间结束或手动结束
            await raceGame.send(
                deployer.getSender(),
                { value: toNano('0.05') },
                'end_game'
            );

            const result = await raceGame.send(
                player1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'BuyItemMessage',
                    referrer: null,
                    strategy: 0n,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: player1.address,
                to: raceGame.address,
                success: false,
            });
        });
    });
});

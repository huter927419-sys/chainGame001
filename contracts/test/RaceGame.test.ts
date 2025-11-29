/**
 * RaceGame 合约测试脚本
 * 
 * 使用 Tact 测试框架测试合约功能
 */

import { Contract, ContractProvider, Sender, Address, Cell, beginCell } from '@ton/core';
import { compile } from '@ton/blueprint';

// 测试辅助函数
async function deployContract(owner: Address): Promise<Contract> {
    // 这里需要编译后的合约代码
    // 实际测试时需要先编译合约
    throw new Error('需要先编译合约');
}

describe('RaceGame Contract Tests', () => {
    let contract: Contract;
    let owner: Address;
    let player1: Address;
    let player2: Address;

    beforeEach(async () => {
        // 初始化测试地址
        owner = Address.parse('EQD...'); // 替换为实际地址
        player1 = Address.parse('EQD...');
        player2 = Address.parse('EQD...');
        
        // 部署合约
        contract = await deployContract(owner);
    });

    describe('初始化测试', () => {
        it('应该正确初始化游戏状态', async () => {
            const state = await contract.get('getGameState');
            expect(state.state).toBe(0); // 未开始
            expect(state.totalItems).toBe(0);
        });

        it('应该正确初始化双车系统', async () => {
            const car1 = await contract.get('getCar1');
            const car2 = await contract.get('getCar2');
            
            expect(car1.baseSpeed).toBe(100);
            expect(car1.currentSpeed).toBe(100);
            expect(car1.totalBoost).toBe(0);
            expect(car1.itemCount).toBe(0);
            
            expect(car2.baseSpeed).toBe(100);
            expect(car2.currentSpeed).toBe(100);
            expect(car2.totalBoost).toBe(0);
            expect(car2.itemCount).toBe(0);
        });

        it('应该正确初始化分配配置', async () => {
            const config = await contract.get('getDistributionConfig');
            expect(config.prizePoolPercent).toBe(60);
            expect(config.communityPercent).toBe(20);
            expect(config.reservePercent).toBe(20);
        });
    });

    describe('开始游戏测试', () => {
        it('只有所有者可以开始游戏', async () => {
            // 测试所有者可以开始
            await contract.send(owner, { value: 0n }, 'start');
            const state = await contract.get('getGameState');
            expect(state.state).toBe(1); // 进行中
        });

        it('非所有者不能开始游戏', async () => {
            // 应该抛出错误
            await expect(
                contract.send(player1, { value: 0n }, 'start')
            ).rejects.toThrow();
        });

        it('开始游戏应该重置双车状态', async () => {
            await contract.send(owner, { value: 0n }, 'start');
            
            const car1 = await contract.get('getCar1');
            const car2 = await contract.get('getCar2');
            
            expect(car1.currentSpeed).toBe(100);
            expect(car2.currentSpeed).toBe(100);
            expect(car1.totalBoost).toBe(0);
            expect(car2.totalBoost).toBe(0);
        });
    });

    describe('购买道具测试', () => {
        beforeEach(async () => {
            // 先开始游戏
            await contract.send(owner, { value: 0n }, 'start');
        });

        it('应该能够购买道具给车辆1', async () => {
            const itemPrice = 1000000000n; // 1 TON
            
            const message = beginCell()
                .storeUint(0x62796974, 32) // "byit"
                .storeUint(1, 8) // carId = 1
                .endCell();
            
            await contract.send(player1, { value: itemPrice }, message);
            
            const car1 = await contract.get('getCar1');
            expect(car1.itemCount).toBe(1);
            // 速度应该改变（取决于随机效果）
            expect(car1.currentSpeed).not.toBe(100);
        });

        it('应该能够购买道具给车辆2', async () => {
            const itemPrice = 1000000000n;
            
            const message = beginCell()
                .storeUint(0x62796974, 32)
                .storeUint(2, 8) // carId = 2
                .endCell();
            
            await contract.send(player1, { value: itemPrice }, message);
            
            const car2 = await contract.get('getCar2');
            expect(car2.itemCount).toBe(1);
        });

        it('应该拒绝无效的车辆ID', async () => {
            const itemPrice = 1000000000n;
            
            const message = beginCell()
                .storeUint(0x62796974, 32)
                .storeUint(3, 8) // 无效的carId
                .endCell();
            
            await expect(
                contract.send(player1, { value: itemPrice }, message)
            ).rejects.toThrow('Invalid car ID');
        });

        it('应该拒绝余额不足的购买', async () => {
            const insufficientAmount = 100000000n; // 0.1 TON
            
            const message = beginCell()
                .storeUint(0x62796974, 32)
                .storeUint(1, 8)
                .endCell();
            
            await expect(
                contract.send(player1, { value: insufficientAmount }, message)
            ).rejects.toThrow('Insufficient balance');
        });

        it('应该正确更新玩家数据', async () => {
            const itemPrice = 1000000000n;
            
            const message = beginCell()
                .storeUint(0x62796974, 32)
                .storeUint(1, 8)
                .endCell();
            
            await contract.send(player1, { value: itemPrice }, message);
            
            const playerData = await contract.get('getPlayerData', [player1]);
            expect(playerData?.itemCount).toBe(1);
            expect(playerData?.totalInvested.toNumber()).toBeGreaterThan(0);
        });

        it('应该正确分配资金到三个池子', async () => {
            const itemPrice = 1000000000n;
            
            const message = beginCell()
                .storeUint(0x62796974, 32)
                .storeUint(1, 8)
                .endCell();
            
            await contract.send(player1, { value: itemPrice }, message);
            
            const prizePool = await contract.get('getPrizePool');
            const communityPool = await contract.get('getCommunityPool');
            const reservePool = await contract.get('getReservePool');
            
            // 验证资金分配（60%奖池，20%社区，20%预留）
            expect(prizePool.toNumber()).toBe(600000000); // 0.6 TON
            expect(communityPool.toNumber()).toBe(200000000); // 0.2 TON
            expect(reservePool.toNumber()).toBe(200000000); // 0.2 TON
        });
    });

    describe('速度计算测试', () => {
        beforeEach(async () => {
            await contract.send(owner, { value: 0n }, 'start');
        });

        it('应该正确计算车辆速度', async () => {
            // 购买多个道具给车辆1
            const itemPrice = 1000000000n;
            const message1 = beginCell()
                .storeUint(0x62796974, 32)
                .storeUint(1, 8)
                .endCell();
            
            await contract.send(player1, { value: itemPrice }, message1);
            
            const car1 = await contract.get('getCar1');
            // 速度 = 基础速度(100) + 道具效果
            expect(car1.currentSpeed).toBe(car1.baseSpeed + car1.totalBoost);
        });

        it('应该正确计算速度差距', async () => {
            // 给车辆1购买道具
            const itemPrice = 1000000000n;
            const message1 = beginCell()
                .storeUint(0x62796974, 32)
                .storeUint(1, 8)
                .endCell();
            await contract.send(player1, { value: itemPrice }, message1);
            
            // 给车辆2购买道具
            const message2 = beginCell()
                .storeUint(0x62796974, 32)
                .storeUint(2, 8)
                .endCell();
            await contract.send(player2, { value: itemPrice }, message2);
            
            const car1 = await contract.get('getCar1');
            const car2 = await contract.get('getCar2');
            const gap = await contract.get('getSpeedGap');
            
            const expectedGap = Math.abs(car1.currentSpeed - car2.currentSpeed);
            expect(gap).toBe(expectedGap);
        });

        it('应该正确识别领先车辆', async () => {
            // 给车辆1购买加速道具
            const itemPrice = 1000000000n;
            const message = beginCell()
                .storeUint(0x62796974, 32)
                .storeUint(1, 8)
                .endCell();
            await contract.send(player1, { value: itemPrice }, message);
            
            const car1 = await contract.get('getCar1');
            const car2 = await contract.get('getCar2');
            const leadingCar = await contract.get('getLeadingCar');
            
            if (car1.currentSpeed > car2.currentSpeed) {
                expect(leadingCar).toBe(1);
            } else if (car2.currentSpeed > car1.currentSpeed) {
                expect(leadingCar).toBe(2);
            } else {
                expect(leadingCar).toBe(0);
            }
        });
    });

    describe('价格计算测试', () => {
        it('应该使用椭圆算法计算价格', async () => {
            await contract.send(owner, { value: 0n }, 'start');
            
            // 第一个道具价格应该是基础价格
            const firstPrice = 1000000000n; // 1 TON
            
            // 随着道具数量增加，价格应该上升
            // 这里需要实际测试价格计算逻辑
        });
    });

    describe('游戏结束测试', () => {
        it('应该能够结束游戏并分配奖金', async () => {
            await contract.send(owner, { value: 0n }, 'start');
            
            // 模拟游戏进行
            // ...
            
            // 结束游戏（需要等待时间到期或手动结束）
            // await contract.send(owner, { value: 0n }, 'end_game');
            
            // 验证排名和奖金分配
        });
    });
});


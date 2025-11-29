/**
 * RaceGame 合约综合测试脚本
 * 可以多次运行，测试各种场景
 */

const { Contract, Address, Cell, beginCell, toNano } = require('@ton/core');
const { TonClient } = require('@ton/ton');

// 配置
const CONFIG = {
    testnet: true,
    contractAddress: process.env.CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS',
    ownerAddress: process.env.OWNER_ADDRESS || 'YOUR_OWNER_ADDRESS',
    player1Address: process.env.PLAYER1_ADDRESS || 'YOUR_PLAYER1_ADDRESS',
    player2Address: process.env.PLAYER2_ADDRESS || 'YOUR_PLAYER2_ADDRESS',
};

// 测试结果
const testResults = {
    passed: 0,
    failed: 0,
    errors: []
};

// 辅助函数
function log(message) {
    console.log(`[TEST] ${new Date().toISOString()} - ${message}`);
}

function assert(condition, message) {
    if (condition) {
        testResults.passed++;
        log(`✅ PASS: ${message}`);
    } else {
        testResults.failed++;
        testResults.errors.push(message);
        log(`❌ FAIL: ${message}`);
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试用例
class RaceGameTests {
    constructor(contract, client) {
        this.contract = contract;
        this.client = client;
    }

    // 测试1: 初始化状态
    async testInitialization() {
        log('=== 测试1: 初始化状态 ===');
        try {
            const state = await this.contract.get('getGameState');
            assert(state.state === 0, '游戏状态应该是0（未开始）');
            assert(state.totalItems === 0, '初始道具数应该是0');
            
            const car1 = await this.contract.get('getCar1');
            const car2 = await this.contract.get('getCar2');
            assert(car1.baseSpeed === 100, '车辆1基础速度应该是100');
            assert(car1.currentSpeed === 100, '车辆1当前速度应该是100');
            assert(car2.baseSpeed === 100, '车辆2基础速度应该是100');
            assert(car2.currentSpeed === 100, '车辆2当前速度应该是100');
            
            const gap = await this.contract.get('getSpeedGap');
            assert(gap === 0, '初始速度差距应该是0');
            
            const leading = await this.contract.get('getLeadingCar');
            assert(leading === 0, '初始应该是平局');
        } catch (error) {
            assert(false, `初始化测试失败: ${error.message}`);
        }
    }

    // 测试2: 开始游戏
    async testStartGame() {
        log('=== 测试2: 开始游戏 ===');
        try {
            // 发送开始游戏消息
            await this.contract.send(CONFIG.ownerAddress, { value: 0n }, 'start');
            await sleep(2000); // 等待交易确认
            
            const state = await this.contract.get('getGameState');
            assert(state.state === 1, '游戏状态应该是1（进行中）');
            assert(state.startTime > 0, '开始时间应该大于0');
            assert(state.endTime > state.startTime, '结束时间应该大于开始时间');
            
            const car1 = await this.contract.get('getCar1');
            const car2 = await this.contract.get('getCar2');
            assert(car1.currentSpeed === 100, '开始游戏后车辆1速度应该是100');
            assert(car2.currentSpeed === 100, '开始游戏后车辆2速度应该是100');
        } catch (error) {
            assert(false, `开始游戏测试失败: ${error.message}`);
        }
    }

    // 测试3: 购买道具 - 车辆1
    async testBuyItemCar1() {
        log('=== 测试3: 购买道具给车辆1 ===');
        try {
            const itemPrice = toNano('1'); // 1 TON
            const message = beginCell()
                .storeUint(0x62796974, 32) // "byit"
                .storeUint(1, 8) // carId = 1
                .endCell();
            
            const car1Before = await this.contract.get('getCar1');
            const stateBefore = await this.contract.get('getGameState');
            
            await this.contract.send(CONFIG.player1Address, { value: itemPrice }, message);
            await sleep(3000); // 等待交易确认
            
            const car1After = await this.contract.get('getCar1');
            const stateAfter = await this.contract.get('getGameState');
            
            assert(car1After.itemCount === car1Before.itemCount + 1, '车辆1道具数应该增加1');
            assert(car1After.currentSpeed !== car1Before.currentSpeed, '车辆1速度应该改变');
            assert(stateAfter.totalItems === stateBefore.totalItems + 1, '总道具数应该增加1');
            
            // 验证速度计算
            const expectedSpeed = car1After.baseSpeed + car1After.totalBoost;
            assert(car1After.currentSpeed === expectedSpeed, `速度计算正确: ${car1After.currentSpeed} = ${car1After.baseSpeed} + ${car1After.totalBoost}`);
            
            log(`车辆1: 速度 ${car1Before.currentSpeed} → ${car1After.currentSpeed}, 道具数: ${car1After.itemCount}`);
        } catch (error) {
            assert(false, `购买道具测试失败: ${error.message}`);
        }
    }

    // 测试4: 购买道具 - 车辆2
    async testBuyItemCar2() {
        log('=== 测试4: 购买道具给车辆2 ===');
        try {
            const itemPrice = toNano('1');
            const message = beginCell()
                .storeUint(0x62796974, 32)
                .storeUint(2, 8) // carId = 2
                .endCell();
            
            const car2Before = await this.contract.get('getCar2');
            
            await this.contract.send(CONFIG.player2Address, { value: itemPrice }, message);
            await sleep(3000);
            
            const car2After = await this.contract.get('getCar2');
            
            assert(car2After.itemCount === car2Before.itemCount + 1, '车辆2道具数应该增加1');
            assert(car2After.currentSpeed !== car2Before.currentSpeed, '车辆2速度应该改变');
            
            log(`车辆2: 速度 ${car2Before.currentSpeed} → ${car2After.currentSpeed}, 道具数: ${car2After.itemCount}`);
        } catch (error) {
            assert(false, `购买道具给车辆2测试失败: ${error.message}`);
        }
    }

    // 测试5: 速度差距计算
    async testSpeedGap() {
        log('=== 测试5: 速度差距计算 ===');
        try {
            const car1 = await this.contract.get('getCar1');
            const car2 = await this.contract.get('getCar2');
            const gap = await this.contract.get('getSpeedGap');
            const leading = await this.contract.get('getLeadingCar');
            
            const expectedGap = Math.abs(car1.currentSpeed - car2.currentSpeed);
            assert(gap === expectedGap, `速度差距计算正确: ${gap} = |${car1.currentSpeed} - ${car2.currentSpeed}|`);
            
            if (car1.currentSpeed > car2.currentSpeed) {
                assert(leading === 1, '车辆1应该领先');
            } else if (car2.currentSpeed > car1.currentSpeed) {
                assert(leading === 2, '车辆2应该领先');
            } else {
                assert(leading === 0, '应该是平局');
            }
            
            log(`速度差距: ${gap} km/h, 领先车辆: ${leading === 0 ? '平局' : `车辆${leading}`}`);
        } catch (error) {
            assert(false, `速度差距计算测试失败: ${error.message}`);
        }
    }

    // 测试6: 资金分配
    async testFundDistribution() {
        log('=== 测试6: 资金分配 ===');
        try {
            const prizePool = await this.contract.get('getPrizePool');
            const communityPool = await this.contract.get('getCommunityPool');
            const reservePool = await this.contract.get('getReservePool');
            const totalInvested = await this.contract.get('getTotalInvested');
            
            const config = await this.contract.get('getDistributionConfig');
            
            // 验证分配比例
            const totalPools = prizePool.toNumber() + communityPool.toNumber() + reservePool.toNumber();
            const invested = totalInvested.toNumber();
            
            // 允许小的舍入误差
            const tolerance = invested * 0.01; // 1% 容差
            assert(Math.abs(totalPools - invested) < tolerance, `资金分配总和应该等于总投入: ${totalPools} ≈ ${invested}`);
            
            log(`奖池: ${(prizePool.toNumber() / 1e9).toFixed(4)} TON`);
            log(`社区池: ${(communityPool.toNumber() / 1e9).toFixed(4)} TON`);
            log(`预留池: ${(reservePool.toNumber() / 1e9).toFixed(4)} TON`);
            log(`总投入: ${(invested / 1e9).toFixed(4)} TON`);
        } catch (error) {
            assert(false, `资金分配测试失败: ${error.message}`);
        }
    }

    // 测试7: 多次购买道具
    async testMultiplePurchases() {
        log('=== 测试7: 多次购买道具 ===');
        try {
            const iterations = 5;
            const itemPrice = toNano('1');
            
            for (let i = 0; i < iterations; i++) {
                const carId = (i % 2) + 1; // 交替购买
                const message = beginCell()
                    .storeUint(0x62796974, 32)
                    .storeUint(carId, 8)
                    .endCell();
                
                const carBefore = carId === 1 
                    ? await this.contract.get('getCar1')
                    : await this.contract.get('getCar2');
                
                await this.contract.send(CONFIG.player1Address, { value: itemPrice }, message);
                await sleep(2000);
                
                const carAfter = carId === 1
                    ? await this.contract.get('getCar1')
                    : await this.contract.get('getCar2');
                
                assert(carAfter.itemCount === carBefore.itemCount + 1, `第${i+1}次购买后道具数应该增加`);
                assert(carAfter.currentSpeed === carAfter.baseSpeed + carAfter.totalBoost, '速度计算应该正确');
                
                log(`第${i+1}次购买: 车辆${carId}, 速度 ${carBefore.currentSpeed} → ${carAfter.currentSpeed}`);
            }
        } catch (error) {
            assert(false, `多次购买测试失败: ${error.message}`);
        }
    }

    // 测试8: 价格计算
    async testPriceCalculation() {
        log('=== 测试8: 价格计算 ===');
        try {
            const state = await this.contract.get('getGameState');
            const basePrice = 1000000000; // 1 TON
            
            // 验证价格应该随着道具数量增加而增加
            log(`当前道具数: ${state.totalItems}`);
            log(`基础价格: ${(basePrice / 1e9).toFixed(4)} TON`);
            
            // 价格应该符合椭圆算法
            const maxItems = 1000;
            const ratio = (state.totalItems * 100) / maxItems;
            const ratioSquared = (ratio * ratio) / 100;
            const multiplier = 100 + ratioSquared;
            const expectedPrice = Math.floor((basePrice * multiplier) / 100);
            
            log(`预期价格: ${(expectedPrice / 1e9).toFixed(6)} TON (倍数: ${multiplier / 100})`);
        } catch (error) {
            assert(false, `价格计算测试失败: ${error.message}`);
        }
    }

    // 测试9: 玩家数据
    async testPlayerData() {
        log('=== 测试9: 玩家数据 ===');
        try {
            const playerData = await this.contract.get('getPlayerData', [CONFIG.player1Address]);
            
            if (playerData) {
                assert(playerData.itemCount > 0, '玩家应该购买了道具');
                assert(playerData.totalInvested.toNumber() > 0, '玩家总投入应该大于0');
                
                log(`玩家数据: 道具数=${playerData.itemCount}, 总投入=${(playerData.totalInvested.toNumber() / 1e9).toFixed(4)} TON, 总加速=${playerData.totalBoost}`);
            } else {
                log('玩家数据为空（可能还未购买道具）');
            }
        } catch (error) {
            assert(false, `玩家数据测试失败: ${error.message}`);
        }
    }

    // 测试10: 边界情况
    async testEdgeCases() {
        log('=== 测试10: 边界情况 ===');
        try {
            // 测试无效车辆ID（应该通过消息格式验证，这里只是记录）
            log('边界情况测试: 无效车辆ID应该在合约层面拒绝');
            
            // 测试余额不足（需要实际测试）
            log('边界情况测试: 余额不足应该在合约层面拒绝');
            
            // 测试游戏未开始（需要重置游戏状态）
            log('边界情况测试: 游戏未开始时购买应该被拒绝');
        } catch (error) {
            assert(false, `边界情况测试失败: ${error.message}`);
        }
    }
}

// 主测试函数
async function runTests() {
    log('开始综合测试...');
    log(`合约地址: ${CONFIG.contractAddress}`);
    
    // 初始化客户端和合约
    const client = new TonClient({
        endpoint: CONFIG.testnet 
            ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
            : 'https://toncenter.com/api/v2/jsonRPC'
    });
    
    const contract = Contract.createFromAddress(Address.parse(CONFIG.contractAddress));
    
    const tests = new RaceGameTests(contract, client);
    
    // 运行所有测试
    const testFunctions = [
        () => tests.testInitialization(),
        () => tests.testStartGame(),
        () => tests.testBuyItemCar1(),
        () => tests.testBuyItemCar2(),
        () => tests.testSpeedGap(),
        () => tests.testFundDistribution(),
        () => tests.testMultiplePurchases(),
        () => tests.testPriceCalculation(),
        () => tests.testPlayerData(),
        () => tests.testEdgeCases(),
    ];
    
    for (let i = 0; i < testFunctions.length; i++) {
        try {
            await testFunctions[i]();
            await sleep(1000); // 测试间隔
        } catch (error) {
            log(`测试 ${i+1} 执行失败: ${error.message}`);
        }
    }
    
    // 输出测试结果
    log('\n=== 测试结果汇总 ===');
    log(`通过: ${testResults.passed}`);
    log(`失败: ${testResults.failed}`);
    log(`总计: ${testResults.passed + testResults.failed}`);
    
    if (testResults.errors.length > 0) {
        log('\n失败的测试:');
        testResults.errors.forEach((error, index) => {
            log(`${index + 1}. ${error}`);
        });
    }
    
    return testResults.failed === 0;
}

// 多次运行测试
async function runMultipleTests(times = 3) {
    log(`准备运行 ${times} 轮测试...\n`);
    
    for (let round = 1; round <= times; round++) {
        log(`\n${'='.repeat(50)}`);
        log(`第 ${round} 轮测试`);
        log(`${'='.repeat(50)}\n`);
        
        // 重置测试结果
        testResults.passed = 0;
        testResults.failed = 0;
        testResults.errors = [];
        
        const success = await runTests();
        
        log(`\n第 ${round} 轮测试${success ? '通过' : '失败'}`);
        
        if (round < times) {
            log('等待5秒后开始下一轮测试...\n');
            await sleep(5000);
        }
    }
}

// 运行
if (require.main === module) {
    const times = process.argv[2] ? parseInt(process.argv[2]) : 3;
    runMultipleTests(times)
        .then(() => {
            log('\n所有测试完成！');
            process.exit(0);
        })
        .catch(error => {
            log(`\n测试执行出错: ${error.message}`);
            process.exit(1);
        });
}

module.exports = { runTests, runMultipleTests };


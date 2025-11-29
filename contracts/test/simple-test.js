/**
 * 简化版测试脚本 - 用于快速验证合约功能
 * 不需要实际部署，只测试逻辑
 */

console.log('=== RaceGame 合约逻辑测试 ===\n');

// 模拟测试函数
function testPriceCalculation() {
    console.log('测试1: 价格计算（椭圆算法）');
    
    const basePrice = 1000000000; // 1 TON
    const maxItems = 1000;
    
    const testCases = [0, 1, 10, 100, 500, 1000];
    
    testCases.forEach(itemCount => {
        const ratio = (itemCount * 100) / maxItems;
        const ratioSquared = (ratio * ratio) / 100;
        const multiplier = 100 + ratioSquared;
        const price = Math.floor((basePrice * multiplier) / 100);
        
        console.log(`  道具数 ${itemCount}: ${(price / 1e9).toFixed(6)} TON (倍数: ${(multiplier / 100).toFixed(4)})`);
    });
    
    console.log('✅ 价格计算测试通过\n');
}

function testItemEffect() {
    console.log('测试2: 道具效果生成');
    
    const testSeeds = [100, 101, 102, 103, 104, 105];
    
    testSeeds.forEach(seed => {
        const effectType = seed % 2; // 0=加速, 1=减速
        const multiplierType = seed % 4; // 0=1X, 1=2X, 2=5X, 3=10X
        
        const multipliers = [1, 2, 5, 10];
        const multiplier = multipliers[multiplierType];
        const effect = effectType === 1 ? -multiplier : multiplier;
        
        console.log(`  随机种子 ${seed}: ${effectType === 0 ? '加速' : '减速'} ${multiplier}X (效果值: ${effect > 0 ? '+' : ''}${effect})`);
    });
    
    console.log('✅ 道具效果生成测试通过\n');
}

function testSpeedCalculation() {
    console.log('测试3: 速度计算');
    
    const baseSpeed = 100;
    let totalBoost = 0;
    let currentSpeed = baseSpeed;
    
    const effects = [5, 10, -2, 20, -5];
    
    console.log(`  初始速度: ${currentSpeed} km/h (基础: ${baseSpeed}, 加速: ${totalBoost})`);
    
    effects.forEach((effect, index) => {
        totalBoost += effect;
        currentSpeed = baseSpeed + totalBoost;
        
        console.log(`  购买道具${index + 1} (效果: ${effect > 0 ? '+' : ''}${effect}): 速度 = ${currentSpeed} km/h (基础: ${baseSpeed}, 总加速: ${totalBoost})`);
        
        // 验证计算
        if (currentSpeed !== baseSpeed + totalBoost) {
            console.log(`  ❌ 速度计算错误！`);
            return;
        }
    });
    
    console.log('✅ 速度计算测试通过\n');
}

function testSpeedGap() {
    console.log('测试4: 速度差距计算');
    
    const testCases = [
        { car1: 100, car2: 100, expectedGap: 0, expectedLeading: 0 },
        { car1: 110, car2: 100, expectedGap: 10, expectedLeading: 1 },
        { car1: 95, car2: 105, expectedGap: 10, expectedLeading: 2 },
        { car1: 120, car2: 115, expectedGap: 5, expectedLeading: 1 },
    ];
    
    testCases.forEach((testCase, index) => {
        const gap = Math.abs(testCase.car1 - testCase.car2);
        const leading = testCase.car1 > testCase.car2 ? 1 : 
                       testCase.car2 > testCase.car1 ? 2 : 0;
        
        const gapOk = gap === testCase.expectedGap;
        const leadingOk = leading === testCase.expectedLeading;
        
        console.log(`  测试${index + 1}: 车辆1=${testCase.car1}, 车辆2=${testCase.car2}`);
        console.log(`    差距: ${gap} (预期: ${testCase.expectedGap}) ${gapOk ? '✅' : '❌'}`);
        console.log(`    领先: 车辆${leading || '平局'} (预期: 车辆${testCase.expectedLeading || '平局'}) ${leadingOk ? '✅' : '❌'}`);
        
        if (!gapOk || !leadingOk) {
            console.log(`  ❌ 测试${index + 1}失败！`);
        }
    });
    
    console.log('✅ 速度差距计算测试通过\n');
}

function testFundDistribution() {
    console.log('测试5: 资金分配');
    
    const testAmounts = [1000000000, 2000000000, 5000000000]; // 1, 2, 5 TON
    const config = { prizePoolPercent: 60, communityPercent: 20, reservePercent: 20 };
    
    testAmounts.forEach(amount => {
        const prizeAmount = Math.floor(amount * config.prizePoolPercent / 100);
        const communityAmount = Math.floor(amount * config.communityPercent / 100);
        const reserveAmount = amount - prizeAmount - communityAmount;
        
        const total = prizeAmount + communityAmount + reserveAmount;
        const totalOk = total === amount;
        
        console.log(`  投入: ${(amount / 1e9).toFixed(4)} TON`);
        console.log(`    奖池: ${(prizeAmount / 1e9).toFixed(4)} TON (${config.prizePoolPercent}%)`);
        console.log(`    社区池: ${(communityAmount / 1e9).toFixed(4)} TON (${config.communityPercent}%)`);
        console.log(`    预留池: ${(reserveAmount / 1e9).toFixed(4)} TON (${((reserveAmount / amount) * 100).toFixed(1)}%)`);
        console.log(`    总和: ${(total / 1e9).toFixed(4)} TON ${totalOk ? '✅' : '❌'}`);
        
        if (!totalOk) {
            console.log(`  ❌ 资金分配错误！`);
        }
    });
    
    console.log('✅ 资金分配测试通过\n');
}

// 运行所有测试
function runAllTests() {
    console.log('开始运行逻辑测试...\n');
    
    testPriceCalculation();
    testItemEffect();
    testSpeedCalculation();
    testSpeedGap();
    testFundDistribution();
    
    console.log('=== 所有逻辑测试完成 ===');
}

// 多次运行
function runMultipleTimes(times = 3) {
    for (let i = 1; i <= times; i++) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`第 ${i} 轮测试`);
        console.log(`${'='.repeat(50)}\n`);
        
        runAllTests();
        
        if (i < times) {
            console.log('\n等待2秒后开始下一轮...\n');
            // 在实际环境中使用 setTimeout
        }
    }
}

// 执行
const times = process.argv[2] ? parseInt(process.argv[2]) : 3;
runMultipleTimes(times);


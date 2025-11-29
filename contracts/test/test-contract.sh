#!/bin/bash

# RaceGame 合约测试脚本
# 使用 toncli 或 ton 工具进行测试

echo "=== RaceGame 合约测试 ==="

# 设置变量
CONTRACT_ADDRESS="YOUR_CONTRACT_ADDRESS"
OWNER_ADDRESS="YOUR_OWNER_ADDRESS"
PLAYER_ADDRESS="YOUR_PLAYER_ADDRESS"

echo ""
echo "1. 测试初始化状态"
echo "查询游戏状态..."
# toncli get getGameState --address $CONTRACT_ADDRESS

echo ""
echo "查询车辆1数据..."
# toncli get getCar1 --address $CONTRACT_ADDRESS

echo ""
echo "查询车辆2数据..."
# toncli get getCar2 --address $CONTRACT_ADDRESS

echo ""
echo "2. 测试开始游戏"
echo "发送开始游戏消息..."
# toncli call start --address $CONTRACT_ADDRESS --signer $OWNER_ADDRESS

echo ""
echo "3. 测试购买道具"
echo "购买道具给车辆1..."
# toncli call buy_item --address $CONTRACT_ADDRESS --signer $PLAYER_ADDRESS --carId 1 --value 1000000000

echo ""
echo "查询购买后的车辆1数据..."
# toncli get getCar1 --address $CONTRACT_ADDRESS

echo ""
echo "4. 测试速度计算"
echo "查询速度差距..."
# toncli get getSpeedGap --address $CONTRACT_ADDRESS

echo ""
echo "查询领先车辆..."
# toncli get getLeadingCar --address $CONTRACT_ADDRESS

echo ""
echo "5. 测试资金分配"
echo "查询奖池..."
# toncli get getPrizePool --address $CONTRACT_ADDRESS

echo ""
echo "查询社区池..."
# toncli get getCommunityPool --address $CONTRACT_ADDRESS

echo ""
echo "查询预留池..."
# toncli get getReservePool --address $CONTRACT_ADDRESS

echo ""
echo "=== 测试完成 ==="


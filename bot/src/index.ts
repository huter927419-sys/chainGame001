import { Telegraf, Context } from 'telegraf'
import { message } from 'telegraf/filters'
import dotenv from 'dotenv'
import { ContractClient } from './contract/ContractClient'
import { GameCommands } from './commands/GameCommands'
import { formatTon, formatTime } from './utils/format'

dotenv.config()

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is required')
}

const bot = new Telegraf(process.env.BOT_TOKEN)
const contractClient = new ContractClient(
  process.env.CONTRACT_ADDRESS || '',
  process.env.TON_NETWORK || 'testnet',
  process.env.TON_API_KEY
)
const gameCommands = new GameCommands(contractClient)

// 启动命令
bot.start(async (ctx: Context) => {
  await ctx.reply(
    `🏎️ 欢迎来到 F1 赛车竞速游戏！

这是一个基于 TON 区块链的 5 分钟限时竞速游戏。

🎮 游戏规则：
• 每局游戏持续 5 分钟
• 购买随机道具影响赛车速度
• 投入最多且效果最好的前三名获胜
• 奖池按 50%/30%/20% 分配给前三名

📱 使用 Mini App 开始游戏：
点击下方按钮打开游戏界面

💡 可用命令：
/status - 查看游戏状态
/rankings - 查看排行榜
/myinfo - 查看我的数据
/help - 查看帮助信息

🎁 推荐奖励：
邀请好友参与游戏，可获得推荐奖励！`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎮 开始游戏',
              web_app: { url: process.env.MINI_APP_URL || 'https://your-miniapp-url.com' }
            }
          ],
          [
            { text: '📊 游戏状态', callback_data: 'status' },
            { text: '🏆 排行榜', callback_data: 'rankings' }
          ]
        ]
      }
    }
  )
})

// 帮助命令
bot.help(async (ctx: Context) => {
  await ctx.reply(
    `📖 游戏帮助

🎮 游戏命令：
/start - 开始使用 Bot
/status - 查看当前游戏状态
/rankings - 查看排行榜
/myinfo - 查看我的游戏数据
/help - 显示此帮助信息

🎯 游戏流程：
1. 点击 "开始游戏" 打开 Mini App
2. 连接 TON 钱包
3. 购买道具影响赛车速度
4. 游戏结束后查看排名和奖励

💰 奖励系统：
• 🥇 第一名：奖池的 50%
• 🥈 第二名：奖池的 30%
• 🥉 第三名：奖池的 20%

🔗 推荐系统：
邀请好友参与游戏，可获得推荐奖励！

📱 Mini App：
在 Mini App 中可以：
• 实时查看游戏状态
• 购买和使用道具
• 查看排行榜
• 提取奖励`,
    {
      parse_mode: 'Markdown'
    }
  )
})

// 游戏状态命令
bot.command('status', async (ctx: Context) => {
  try {
    const status = await gameCommands.getGameStatus()
    const prizePool = await contractClient.getPrizePool()
    const communityPool = await contractClient.getCommunityPool()
    const reservePool = await contractClient.getReservePool()
    
    const stateText = status.state === 0 ? '⏸️ 未开始' 
      : status.state === 1 ? '▶️ 进行中' 
      : '✅ 已结束'
    
    const remainingTime = status.state === 1 && status.endTime > 0
      ? formatTime(Math.max(0, status.endTime - Math.floor(Date.now() / 1000)))
      : 'N/A'
    
    await ctx.reply(
      `📊 游戏状态

${stateText}
${status.state === 1 ? `⏱️ 剩余时间：${remainingTime}` : ''}

👥 玩家数量：${status.totalPlayers} / ${status.maxPlayers || 50}
🎁 道具数量：${status.totalItems}

💰 资金池：
🏆 奖池：${formatTon(prizePool)} TON
👥 社区池：${formatTon(communityPool)} TON
💎 预留池：${formatTon(reservePool)} TON`,
      {
        parse_mode: 'Markdown'
      }
    )
  } catch (error) {
    console.error('获取游戏状态失败:', error)
    await ctx.reply('❌ 获取游戏状态失败，请稍后重试')
  }
})

// 排行榜命令
bot.command('rankings', async (ctx: Context) => {
  try {
    const rankings = await gameCommands.getRankings()
    
    if (rankings.length === 0) {
      await ctx.reply('📊 暂无排行榜数据')
      return
    }
    
    let message = '🏆 排行榜\n\n'
    rankings.forEach((rank, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
      const name = rank.name || rank.address.slice(0, 8) + '...'
      message += `${medal} ${name}\n`
      message += `   投入：${formatTon(rank.invested)} TON\n`
      message += `   得分：${rank.score}\n\n`
    })
    
    await ctx.reply(message, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('获取排行榜失败:', error)
    await ctx.reply('❌ 获取排行榜失败，请稍后重试')
  }
})

// 我的信息命令
bot.command('myinfo', async (ctx: Context) => {
  try {
    // 注意：需要用户提供地址或从 Mini App 获取
    await ctx.reply(
      `ℹ️ 查看我的信息

请在 Mini App 中查看完整的个人信息。

或者提供你的 TON 地址，我可以帮你查询数据。

使用格式：/myinfo <你的TON地址>`,
      {
        parse_mode: 'Markdown'
      }
    )
  } catch (error) {
    console.error('获取玩家信息失败:', error)
    await ctx.reply('❌ 获取玩家信息失败，请稍后重试')
  }
})

// 回调查询处理
bot.on('callback_query', async (ctx: Context) => {
  const query = ctx.callbackQuery
  if (!query || !('data' in query)) return
  
  await ctx.answerCbQuery()
  
  switch (query.data) {
    case 'status':
      // 触发状态命令
      await ctx.reply('正在获取游戏状态...')
      // 这里可以复用 status 命令的逻辑
      break
    case 'rankings':
      // 触发排行榜命令
      await ctx.reply('正在获取排行榜...')
      // 这里可以复用 rankings 命令的逻辑
      break
  }
})

// 错误处理
bot.catch((err: any, ctx: Context) => {
  console.error('Bot error:', err)
  ctx.reply('❌ 发生错误，请稍后重试')
})

// 启动 Bot
bot.launch().then(() => {
  console.log('🤖 Bot is running...')
}).catch((err) => {
  console.error('Failed to start bot:', err)
  process.exit(1)
})

// 优雅关闭
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))


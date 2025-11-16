// @ts-nocheck
import { InlineKeyboard } from 'grammy';
import { polymarketService } from '../services/polymarket.service';
import { MyContext } from '../types';
import { pancakeSwapService } from '../services/pancakeswap.service';
import { truthBountyService } from '../services/truthbounty.service';
import { config } from '../config';

export async function handleStart(ctx: MyContext) {
  const welcomeMessage = `
🎯 **Welcome to TruthBounty Bot!**

Your all-in-one bot for prediction market monitoring and reputation tracking.

**Features:**
${config.features.enablePolymarket ? '✅ Polymarket - Real-time market alerts' : ''}
${config.features.enablePancakeSwap ? '✅ PancakeSwap Prediction - Round monitoring' : ''}
${config.features.enableTruthScore ? '✅ TruthScore - Track your reputation' : ''}

**Quick Start:**
Use /help to see all available commands
`;

  const keyboard = new InlineKeyboard()
    .text('📊 Browse Markets', 'markets')
    .row()
    .text('🥞 Current Round', 'pancake_round')
    .row()
    .text('📈 My TruthScore', 'my_score')
    .row()
    .text('⚙️ Settings', 'settings');

  await ctx.reply(welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}

export async function handleHelp(ctx: MyContext) {
  const helpMessage = `
📚 **TruthBounty Bot - Commands**

**Polymarket:**
/markets - Browse trending prediction markets
/search <query> - Search for specific markets
/market <id> - Get details about a market

**PancakeSwap Prediction:**
/pancake - Get current round info
/round <epoch> - Get specific round details
/mystats - Your PancakeSwap statistics

**TruthScore:**
/score <address> - Check TruthScore for an address
/myscore - Check your TruthScore
/register <address> - Link your wallet address
/leaderboard - View top predictors

**Alerts:**
/alerts - Manage your alerts
/subscribe <market_id> - Subscribe to market updates
/unsubscribe <market_id> - Unsubscribe from updates

**General:**
/help - Show this help message
/settings - Configure your preferences
/about - About TruthBounty
`;

  await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
}

export async function handleMarkets(ctx: MyContext) {
  await ctx.reply('🔍 Fetching trending markets...');

  try {
    const markets = await polymarketService.getTrendingMarkets(5);

    if (markets.length === 0) {
      await ctx.reply('No markets found at the moment.');
      return;
    }

    await ctx.reply('📊 **Top 5 Trending Markets:**', { parse_mode: 'Markdown' });

    for (const market of markets) {
      const message = polymarketService.formatMarketMessage(market);
      const keyboard = new InlineKeyboard()
        .url('Trade on Polymarket', `https://polymarket.com/event/${market.marketSlug}`)
        .row()
        .text('Get Alerts', `alert_${market.id}`);

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  } catch (error) {
    console.error('Error in handleMarkets:', error);
    await ctx.reply('❌ Failed to fetch markets. Please try again later.');
  }
}

export async function handleSearch(ctx: MyContext) {
  const query = ctx.match as string;

  if (!query || query.trim() === '') {
    await ctx.reply('Please provide a search query. Example: /search election');
    return;
  }

  await ctx.reply(`🔍 Searching for "${query}"...`);

  try {
    const markets = await polymarketService.searchMarkets(query, 5);

    if (markets.length === 0) {
      await ctx.reply('No markets found matching your search.');
      return;
    }

    await ctx.reply(`Found ${markets.length} market(s):`, { parse_mode: 'Markdown' });

    for (const market of markets) {
      const message = polymarketService.formatMarketMessage(market);
      const keyboard = new InlineKeyboard()
        .url('View on Polymarket', `https://polymarket.com/event/${market.marketSlug}`);

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  } catch (error) {
    console.error('Error in handleSearch:', error);
    await ctx.reply('❌ Failed to search markets. Please try again later.');
  }
}

export async function handlePancakeRound(ctx: MyContext) {
  await ctx.reply('🥞 Fetching current PancakeSwap Prediction round...');

  try {
    const round = await pancakeSwapService.getCurrentRound();

    if (!round) {
      await ctx.reply('❌ Failed to fetch round data. Please try again later.');
      return;
    }

    const message = pancakeSwapService.formatRoundMessage(round);
    const keyboard = new InlineKeyboard()
      .url('Trade on PancakeSwap', 'https://pancakeswap.finance/prediction')
      .row()
      .text('Refresh', 'refresh_pancake');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error('Error in handlePancakeRound:', error);
    await ctx.reply('❌ Failed to fetch round data. Please try again later.');
  }
}

export async function handleMyStats(ctx: MyContext, userAddress?: string) {
  if (!userAddress) {
    await ctx.reply('Please link your wallet address first using /register <address>');
    return;
  }

  await ctx.reply('📊 Calculating your PancakeSwap statistics...');

  try {
    const stats = await pancakeSwapService.calculateWinRate(userAddress, 50);

    let message = '🥞 **Your PancakeSwap Statistics**\n\n';
    message += `📈 Total Rounds: ${stats.total}\n`;
    message += `✅ Wins: ${stats.wins}\n`;
    message += `❌ Losses: ${stats.total - stats.wins}\n`;
    message += `🎯 Win Rate: ${stats.winRate.toFixed(1)}%\n`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in handleMyStats:', error);
    await ctx.reply('❌ Failed to fetch your statistics. Please try again later.');
  }
}

export async function handleTruthScore(ctx: MyContext) {
  const address = ctx.match as string;

  if (!address || !truthBountyService.isValidAddress(address)) {
    await ctx.reply('Please provide a valid address. Example: /score 0x...');
    return;
  }

  await ctx.reply('🔍 Fetching TruthScore data...');

  try {
    const data = await truthBountyService.getTruthScore(address);

    if (!data) {
      await ctx.reply('❌ This address is not registered with TruthBounty. Visit https://truthbounty.com to register!');
      return;
    }

    const message = truthBountyService.formatTruthScoreMessage(data);
    const keyboard = new InlineKeyboard()
      .url('View Full Profile', `https://truthbounty.com/profile/${address}`)
      .row()
      .url('Visit Dashboard', 'https://truthbounty.com/dashboard');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error('Error in handleTruthScore:', error);
    await ctx.reply('❌ Failed to fetch TruthScore. Please try again later.');
  }
}

export async function handleAbout(ctx: MyContext) {
  const aboutMessage = `
🎯 **About TruthBounty**

TruthBounty is a universal reputation system for prediction market traders. Track your accuracy across multiple platforms and build verifiable on-chain reputation.

**Platforms Supported:**
• Polymarket - Decentralized prediction markets
• PancakeSwap Prediction - BNB price predictions
• More coming soon!

**Features:**
📊 TruthScore - Universal reputation metric
🏆 Soulbound NFTs - Non-transferable reputation tokens
📈 Multi-platform tracking - Import from any supported platform
🎖️ Tier system - Bronze to Diamond rankings
🌐 Leaderboards - Compete globally

**Links:**
🌐 Website: https://truthbounty.com
📱 Dashboard: https://truthbounty.com/dashboard
📊 Leaderboard: https://truthbounty.com/leaderboard

Built for the Seedify Prediction Markets Hackathon on BNB Chain.
`;

  const keyboard = new InlineKeyboard()
    .url('Visit Website', 'https://truthbounty.com')
    .row()
    .url('Join Community', 'https://t.me/truthbounty');

  await ctx.reply(aboutMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}

export async function handleSettings(ctx: MyContext) {
  const keyboard = new InlineKeyboard()
    .text('🔔 Alert Settings', 'settings_alerts')
    .row()
    .text('👤 Profile Settings', 'settings_profile')
    .row()
    .text('🔙 Back to Menu', 'back_menu');

  await ctx.reply('⚙️ **Settings**\n\nChoose what you want to configure:', {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}

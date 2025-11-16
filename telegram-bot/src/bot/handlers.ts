// @ts-nocheck
import { CallbackQueryContext, Context } from 'grammy';
import { polymarketService } from '../services/polymarket.service';
import { MyContext } from '../types';
import { pancakeSwapService } from '../services/pancakeswap.service';

export async function handleCallbackQuery(ctx: CallbackQueryContext<MyContext>) {
  const data = ctx.callbackQuery.data;

  if (!data) return;

  try {
    if (data === 'markets') {
      await handleMarketsCallback(ctx);
    } else if (data === 'pancake_round') {
      await handlePancakeCallback(ctx);
    } else if (data === 'my_score') {
      await handleMyScoreCallback(ctx);
    } else if (data === 'settings') {
      await handleSettingsCallback(ctx);
    } else if (data === 'refresh_pancake') {
      await handleRefreshPancakeCallback(ctx);
    } else if (data.startsWith('alert_')) {
      await handleAlertCallback(ctx, data);
    } else if (data.startsWith('settings_')) {
      await handleSettingsMenuCallback(ctx, data);
    } else if (data === 'back_menu') {
      await handleBackMenuCallback(ctx);
    }

    await ctx.answerCallbackQuery();
  } catch (error) {
    console.error('Error handling callback query:', error);
    await ctx.answerCallbackQuery({ text: 'Something went wrong. Please try again.' });
  }
}

async function handleMarketsCallback(ctx: CallbackQueryContext<MyContext>) {
  await ctx.editMessageText('🔍 Fetching trending markets...');

  try {
    const markets = await polymarketService.getTrendingMarkets(3);

    if (markets.length === 0) {
      await ctx.editMessageText('No markets found at the moment.');
      return;
    }

    let message = '📊 **Top Trending Markets:**\n\n';
    markets.forEach((market, index) => {
      const prob = (parseFloat(market.outcomePrices[0]) * 100).toFixed(1);
      message += `${index + 1}. ${market.question}\n`;
      message += `   💰 ${market.outcomes[0]}: ${prob}%\n\n`;
    });

    message += 'Use /markets to see more details';

    await ctx.editMessageText(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in handleMarketsCallback:', error);
    await ctx.editMessageText('❌ Failed to fetch markets. Please try again.');
  }
}

async function handlePancakeCallback(ctx: CallbackQueryContext<MyContext>) {
  await ctx.editMessageText('🥞 Fetching current round...');

  try {
    const round = await pancakeSwapService.getCurrentRound();

    if (!round) {
      await ctx.editMessageText('❌ Failed to fetch round data.');
      return;
    }

    const message = pancakeSwapService.formatRoundMessage(round);
    await ctx.editMessageText(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in handlePancakeCallback:', error);
    await ctx.editMessageText('❌ Failed to fetch round data. Please try again.');
  }
}

async function handleMyScoreCallback(ctx: CallbackQueryContext<MyContext>) {
  await ctx.editMessageText(
    '📈 To check your TruthScore:\n\n' +
    '1. Link your wallet: /register <address>\n' +
    '2. Check score: /myscore\n\n' +
    'Or check any address: /score <address>',
    { parse_mode: 'Markdown' }
  );
}

async function handleSettingsCallback(ctx: CallbackQueryContext<MyContext>) {
  const message = '⚙️ **Settings**\n\nUse these commands to configure:\n\n' +
    '/alerts - Manage your alerts\n' +
    '/register <address> - Link your wallet\n';

  await ctx.editMessageText(message, { parse_mode: 'Markdown' });
}

async function handleRefreshPancakeCallback(ctx: CallbackQueryContext<MyContext>) {
  await handlePancakeCallback(ctx);
}

async function handleAlertCallback(ctx: CallbackQueryContext<MyContext>, data: string) {
  const marketId = data.replace('alert_', '');

  await ctx.answerCallbackQuery({
    text: '🔔 Alert feature coming soon! You will be notified of significant changes.',
    show_alert: true,
  });
}

async function handleSettingsMenuCallback(ctx: CallbackQueryContext<MyContext>, data: string) {
  const setting = data.replace('settings_', '');

  let message = '';

  if (setting === 'alerts') {
    message = '🔔 **Alert Settings**\n\n' +
      'Manage your market alerts:\n' +
      '/subscribe <market_id> - Subscribe to alerts\n' +
      '/unsubscribe <market_id> - Unsubscribe\n' +
      '/alerts - View all your alerts';
  } else if (setting === 'profile') {
    message = '👤 **Profile Settings**\n\n' +
      'Manage your profile:\n' +
      '/register <address> - Link wallet\n' +
      '/myscore - View your TruthScore\n' +
      '/mystats - View PancakeSwap stats';
  }

  await ctx.editMessageText(message, { parse_mode: 'Markdown' });
}

async function handleBackMenuCallback(ctx: CallbackQueryContext<MyContext>) {
  const message = '🎯 **TruthBounty Bot**\n\nUse /help to see all commands';
  await ctx.editMessageText(message, { parse_mode: 'Markdown' });
}

export async function handleError(ctx: Context, error: any) {
  console.error('Bot error:', error);
  await ctx.reply('❌ An error occurred. Please try again later.');
}

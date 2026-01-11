/**
 * FETCH ALL REAL MARKETS
 *
 * Quick script to fetch and display real markets from all 7 platforms
 * Run with: npx tsx fetch-all.ts
 */

import {
  fetchPancakeSwapMarkets,
  fetchPolymarketMarkets,
  fetchOvertimeMarkets,
  fetchAzuroMarkets,
  fetchLimitlessMarkets,
  fetchThalesMarkets,
  fetchSXBetMarkets,
  RealMarket,
} from './index';

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
};

function formatOdds(odds: number): string {
  if (odds >= 2) return `${COLORS.green}${odds.toFixed(2)}x${COLORS.reset}`;
  if (odds >= 1.5) return `${COLORS.yellow}${odds.toFixed(2)}x${COLORS.reset}`;
  return `${COLORS.dim}${odds.toFixed(2)}x${COLORS.reset}`;
}

function formatVolume(vol: number): string {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(2)}M`;
  if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

function formatTimeRemaining(date: Date): string {
  const now = Date.now();
  const diff = date.getTime() - now;

  if (diff < 0) return `${COLORS.dim}EXPIRED${COLORS.reset}`;

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  if (mins > 0) return `${mins}m`;
  return `<1m`;
}

function printPlatformHeader(name: string, count: number, emoji: string) {
  console.log(`\n${COLORS.bgBlue}${COLORS.white}${COLORS.bold}`);
  console.log(`  ${emoji} ${name.toUpperCase()} - ${count} LIVE MARKETS  `);
  console.log(`${COLORS.reset}`);
}

function printMarket(market: RealMarket, index: number) {
  const statusColor = market.status === 'open' ? COLORS.green : COLORS.yellow;
  const statusEmoji = market.status === 'open' ? '🟢' : market.status === 'locked' ? '🔒' : '✅';

  console.log(`\n${COLORS.cyan}${index + 1}. ${market.title}${COLORS.reset}`);

  if (market.description) {
    console.log(`   ${COLORS.dim}${market.description.slice(0, 80)}${market.description.length > 80 ? '...' : ''}${COLORS.reset}`);
  }

  console.log(`   ${statusEmoji} ${statusColor}${market.status.toUpperCase()}${COLORS.reset} │ ⏰ ${formatTimeRemaining(market.expiresAt)} │ 📊 ${formatVolume(market.volume)}`);

  console.log(`   ${COLORS.bold}OUTCOMES:${COLORS.reset}`);
  for (const outcome of market.outcomes) {
    const prob = (outcome.impliedProb * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(outcome.impliedProb * 20));
    const emptyBar = '░'.repeat(20 - Math.floor(outcome.impliedProb * 20));

    console.log(`     ├─ ${outcome.name.padEnd(35)} ${formatOdds(outcome.odds).padStart(12)} │ ${COLORS.cyan}${bar}${COLORS.dim}${emptyBar}${COLORS.reset} ${prob}%`);
  }
}

async function main() {
  console.clear();
  console.log(`
${COLORS.bold}${COLORS.magenta}
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███████╗███████╗████████╗ ██████╗██╗  ██╗    █████╗ ██╗     ██╗           ║
║   ██╔════╝██╔════╝╚══██╔══╝██╔════╝██║  ██║   ██╔══██╗██║     ██║           ║
║   █████╗  █████╗     ██║   ██║     ███████║   ███████║██║     ██║           ║
║   ██╔══╝  ██╔══╝     ██║   ██║     ██╔══██║   ██╔══██║██║     ██║           ║
║   ██║     ███████╗   ██║   ╚██████╗██║  ██║   ██║  ██║███████╗███████╗      ║
║   ╚═╝     ╚══════╝   ╚═╝    ╚═════╝╚═╝  ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝      ║
║                                                                              ║
║              🎯 REAL PREDICTION MARKETS - 7 PLATFORMS                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
${COLORS.reset}`);

  console.log(`${COLORS.dim}Fetching live data from all platforms...${COLORS.reset}\n`);

  const startTime = Date.now();

  // Fetch all markets in parallel
  const results = await Promise.allSettled([
    fetchPancakeSwapMarkets(),
    fetchPolymarketMarkets(),
    fetchOvertimeMarkets(),
    fetchAzuroMarkets(),
    fetchLimitlessMarkets(),
    fetchThalesMarkets(),
    fetchSXBetMarkets(),
  ]);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  const [
    pancakeswap,
    polymarket,
    overtime,
    azuro,
    limitless,
    thales,
    sxbet
  ] = results.map(r => r.status === 'fulfilled' ? r.value : []);

  // Summary
  console.log(`${COLORS.bgGreen}${COLORS.white}${COLORS.bold} ✓ FETCH COMPLETE (${elapsed}s) ${COLORS.reset}\n`);

  console.log(`${COLORS.bold}SUMMARY:${COLORS.reset}`);
  console.log(`  🥞 PancakeSwap:  ${pancakeswap.length} rounds`);
  console.log(`  🔮 Polymarket:   ${polymarket.length} events`);
  console.log(`  ⚽ Overtime:     ${overtime.length} games`);
  console.log(`  🎰 Azuro:        ${azuro.length} games`);
  console.log(`  ∞  Limitless:    ${limitless.length} markets`);
  console.log(`  ⚡ Thales:       ${thales.length} options`);
  console.log(`  🎲 SX Bet:       ${sxbet.length} markets`);
  console.log(`  ${COLORS.bold}━━━━━━━━━━━━━━━━━━━━━━━━`);
  const total = pancakeswap.length + polymarket.length + overtime.length +
                azuro.length + limitless.length + thales.length + sxbet.length;
  console.log(`  📊 TOTAL:        ${COLORS.green}${total} markets${COLORS.reset}\n`);

  // ═══════════════════════════════════════════════════════════════
  // 1. PANCAKESWAP
  // ═══════════════════════════════════════════════════════════════
  if (pancakeswap.length > 0) {
    printPlatformHeader('PancakeSwap Prediction', pancakeswap.length, '🥞');
    console.log(`${COLORS.dim}Binary BNB/USD price prediction | 5-minute rounds | BSC Chain${COLORS.reset}`);

    for (let i = 0; i < Math.min(pancakeswap.length, 5); i++) {
      printMarket(pancakeswap[i], i);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. POLYMARKET
  // ═══════════════════════════════════════════════════════════════
  if (polymarket.length > 0) {
    printPlatformHeader('Polymarket', polymarket.length, '🔮');
    console.log(`${COLORS.dim}Event prediction markets | Politics, Crypto, World Events | Polygon${COLORS.reset}`);

    for (let i = 0; i < Math.min(polymarket.length, 5); i++) {
      printMarket(polymarket[i], i);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. OVERTIME MARKETS
  // ═══════════════════════════════════════════════════════════════
  if (overtime.length > 0) {
    printPlatformHeader('Overtime Markets', overtime.length, '⚽');
    console.log(`${COLORS.dim}Sports betting | NFL, NBA, Soccer, UFC | Optimism${COLORS.reset}`);

    for (let i = 0; i < Math.min(overtime.length, 5); i++) {
      printMarket(overtime[i], i);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. AZURO PROTOCOL
  // ═══════════════════════════════════════════════════════════════
  if (azuro.length > 0) {
    printPlatformHeader('Azuro Protocol', azuro.length, '🎰');
    console.log(`${COLORS.dim}Decentralized sports betting | Liquidity pools | Multi-chain${COLORS.reset}`);

    for (let i = 0; i < Math.min(azuro.length, 5); i++) {
      printMarket(azuro[i], i);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. LIMITLESS EXCHANGE
  // ═══════════════════════════════════════════════════════════════
  if (limitless.length > 0) {
    printPlatformHeader('Limitless Exchange', limitless.length, '∞');
    console.log(`${COLORS.dim}Short-term price predictions | Base Chain${COLORS.reset}`);

    for (let i = 0; i < Math.min(limitless.length, 5); i++) {
      printMarket(limitless[i], i);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. THALES SPEED MARKETS
  // ═══════════════════════════════════════════════════════════════
  if (thales.length > 0) {
    printPlatformHeader('Thales Speed Markets', thales.length, '⚡');
    console.log(`${COLORS.dim}Binary options | BTC/ETH | 15min-24hr expiry | Optimism${COLORS.reset}`);

    for (let i = 0; i < Math.min(thales.length, 5); i++) {
      printMarket(thales[i], i);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. SX BET
  // ═══════════════════════════════════════════════════════════════
  if (sxbet.length > 0) {
    printPlatformHeader('SX Bet', sxbet.length, '🎲');
    console.log(`${COLORS.dim}P2P sports betting exchange | SX Network${COLORS.reset}`);

    for (let i = 0; i < Math.min(sxbet.length, 5); i++) {
      printMarket(sxbet[i], i);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BETTING EXAMPLES
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${COLORS.bgBlue}${COLORS.white}${COLORS.bold}`);
  console.log(`  💡 EXACT BETTING MECHANICS PER PLATFORM  `);
  console.log(`${COLORS.reset}\n`);

  console.log(`${COLORS.bold}1. PancakeSwap${COLORS.reset}`);
  console.log(`   • Bet Type: Binary (BULL/BEAR)`);
  console.log(`   • Min Bet: 0.001 BNB (~$0.30)`);
  console.log(`   • Payout: Pool-based (total pool / winning side)`);
  console.log(`   • House Edge: 3% treasury fee`);
  console.log(`   • Resolution: Auto via Chainlink oracle\n`);

  console.log(`${COLORS.bold}2. Polymarket${COLORS.reset}`);
  console.log(`   • Bet Type: CLOB order book`);
  console.log(`   • Min Trade: ~$1 USDC`);
  console.log(`   • Payout: $1 per share if correct`);
  console.log(`   • Fees: 0% maker, 1% taker`);
  console.log(`   • Resolution: UMA oracle + admin\n`);

  console.log(`${COLORS.bold}3. Overtime Markets${COLORS.reset}`);
  console.log(`   • Bet Type: AMM-based sports`);
  console.log(`   • Min Bet: $5 sUSD`);
  console.log(`   • Payout: Fixed odds at purchase`);
  console.log(`   • Fees: ~2-3% spread`);
  console.log(`   • Resolution: API data feeds\n`);

  console.log(`${COLORS.bold}4. Azuro Protocol${COLORS.reset}`);
  console.log(`   • Bet Type: Liquidity pool odds`);
  console.log(`   • Min Bet: ~$1 USDC`);
  console.log(`   • Payout: Odds locked at bet time`);
  console.log(`   • Fees: ~5% margin`);
  console.log(`   • Resolution: Decentralized oracles\n`);

  console.log(`${COLORS.bold}5. Limitless Exchange${COLORS.reset}`);
  console.log(`   • Bet Type: Binary/multiple choice`);
  console.log(`   • Min Trade: Variable`);
  console.log(`   • Payout: Market-determined prices`);
  console.log(`   • Fees: Variable`);
  console.log(`   • Resolution: Creator-defined\n`);

  console.log(`${COLORS.bold}6. Thales Speed Markets${COLORS.reset}`);
  console.log(`   • Bet Type: Binary options`);
  console.log(`   • Min Bet: $5 sUSD`);
  console.log(`   • Max Bet: $200 sUSD`);
  console.log(`   • Payout: ~1.95x (50/50 markets)`);
  console.log(`   • Resolution: Pyth price feeds\n`);

  console.log(`${COLORS.bold}7. SX Bet${COLORS.reset}`);
  console.log(`   • Bet Type: P2P exchange`);
  console.log(`   • Min Trade: $1 SX`);
  console.log(`   • Payout: Order book matching`);
  console.log(`   • Fees: 0.5% winner pays`);
  console.log(`   • Resolution: Sports data feeds\n`);

  console.log(`${COLORS.dim}═══════════════════════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.bold}📝 To place simulated bets, run: npx tsx run-simulation.ts${COLORS.reset}`);
  console.log(`${COLORS.dim}═══════════════════════════════════════════════════════════════════════${COLORS.reset}\n`);

  return { pancakeswap, polymarket, overtime, azuro, limitless, thales, sxbet };
}

main().catch(console.error);

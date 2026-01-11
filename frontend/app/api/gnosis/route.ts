import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Seer.pm is the newer prediction market on Gnosis Chain
const SEER_API = 'https://api.seer.pm';

// Alternative: Query directly from Gnosis chain contracts or use Omen data
async function fetchSeerMarkets(limit: number) {
  try {
    const response = await fetch(`${SEER_API}/markets?status=open&limit=${limit}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error('Seer API error:', e);
  }
  return null;
}

// Helper to generate unique IDs
let marketCounter = 0;
function generateMarketId(prefix: string): string {
  return `gnosis-${prefix}-${++marketCounter}`;
}

interface GnosisMarket {
  id: string;
  conditionId: string;
  questionId: string;
  title: string;
  category: string;
  outcomes: { id: string; name: string; odds: number; probability: number }[];
  status: string;
  volume: number;
  liquidity: number;
  resolvesAt: number;
  creator: string;
  collateralToken: string;
}

function createMarket(
  title: string,
  category: string,
  probability: number,
  volume: number,
  liquidity: number,
  daysUntilResolution: number,
  collateral: 'xDAI' | 'USDC' = 'xDAI'
): GnosisMarket {
  const id = generateMarketId(category.toLowerCase().replace(/\s+/g, '-'));
  return {
    id,
    conditionId: `0x${Math.random().toString(16).slice(2, 10)}`,
    questionId: `q${marketCounter}`,
    title,
    category,
    outcomes: [
      { id: '0', name: 'Yes', odds: parseFloat((1 / probability).toFixed(2)), probability },
      { id: '1', name: 'No', odds: parseFloat((1 / (1 - probability)).toFixed(2)), probability: 1 - probability },
    ],
    status: 'open',
    volume,
    liquidity,
    resolvesAt: Date.now() + daysUntilResolution * 24 * 60 * 60 * 1000,
    creator: `0x${Math.random().toString(16).slice(2, 14)}...`,
    collateralToken: collateral,
  };
}

// Comprehensive curated Gnosis/Omen markets across multiple categories
function getCuratedMarkets(): GnosisMarket[] {
  marketCounter = 0; // Reset counter

  return [
    // ========== AI & TECHNOLOGY ==========
    createMarket('Will GPT-5 be released before July 2026?', 'AI', 0.60, 45000, 28000, 180),
    createMarket('Will OpenAI reach $10B annual revenue by end of 2026?', 'AI', 0.55, 38000, 22000, 365),
    createMarket('Will Claude 4 Opus be released before April 2026?', 'AI', 0.70, 52000, 32000, 90),
    createMarket('Will an AI system pass the Turing Test in a peer-reviewed study in 2026?', 'AI', 0.25, 28000, 15000, 365),
    createMarket('Will Gemini 2.0 beat GPT-4 on MMLU benchmark?', 'AI', 0.45, 35000, 20000, 120),
    createMarket('Will Apple release an AI assistant to compete with ChatGPT in 2026?', 'AI', 0.65, 42000, 25000, 365),
    createMarket('Will Meta open source a model with >500B parameters in 2026?', 'AI', 0.50, 31000, 18000, 365),
    createMarket('Will AI-generated content be banned on major social platforms in 2026?', 'AI', 0.20, 24000, 14000, 365),

    // ========== CRYPTO & BLOCKCHAIN ==========
    createMarket('Will Ethereum staking yield exceed 5% APY in 2026?', 'Crypto', 0.45, 89000, 42000, 365),
    createMarket('Will Gnosis Chain TVL exceed $500M in 2026?', 'Crypto', 0.50, 34000, 18000, 365),
    createMarket('Will Bitcoin ETF daily volume exceed $5B average in Q1 2026?', 'Crypto', 0.55, 72000, 38000, 90),
    createMarket('Will Ethereum complete the Pectra upgrade by March 2026?', 'Crypto', 0.75, 56000, 32000, 75),
    createMarket('Will a major US bank offer crypto custody by end of 2026?', 'Crypto', 0.60, 48000, 28000, 365),
    createMarket('Will total crypto market cap exceed $5 trillion in 2026?', 'Crypto', 0.40, 95000, 52000, 365),
    createMarket('Will Solana flip Ethereum in daily DEX volume in 2026?', 'Crypto', 0.35, 67000, 38000, 365),
    createMarket('Will a major DeFi protocol get hacked for >$100M in 2026?', 'Crypto', 0.70, 41000, 24000, 365),
    createMarket('Will Uniswap v4 launch before April 2026?', 'Crypto', 0.65, 53000, 30000, 90),
    createMarket('Will any L2 exceed Ethereum mainnet in daily transactions?', 'Crypto', 0.55, 62000, 35000, 180),

    // ========== ECONOMICS & FINANCE ==========
    createMarket('Will EU launch digital Euro pilot by end of 2026?', 'Economics', 0.65, 67000, 35000, 365, 'USDC'),
    createMarket('Will Fed cut rates below 4% by end of 2026?', 'Economics', 0.55, 82000, 45000, 365, 'USDC'),
    createMarket('Will US inflation drop below 2.5% in 2026?', 'Economics', 0.45, 76000, 42000, 365, 'USDC'),
    createMarket('Will S&P 500 reach 6,500 in 2026?', 'Economics', 0.50, 91000, 48000, 365, 'USDC'),
    createMarket('Will NVIDIA market cap exceed $4 trillion in 2026?', 'Economics', 0.40, 68000, 38000, 365, 'USDC'),
    createMarket('Will Tesla stock price exceed $500 in 2026?', 'Economics', 0.35, 55000, 32000, 365, 'USDC'),
    createMarket('Will US GDP growth exceed 3% in 2026?', 'Economics', 0.40, 48000, 28000, 365, 'USDC'),
    createMarket('Will China lift all COVID restrictions by mid-2026?', 'Economics', 0.80, 32000, 18000, 180),

    // ========== POLITICS & GOVERNANCE ==========
    createMarket('Will US pass comprehensive crypto regulation in 2026?', 'Politics', 0.45, 58000, 32000, 365),
    createMarket('Will EU MiCA regulations take full effect by Q2 2026?', 'Politics', 0.85, 42000, 24000, 180),
    createMarket('Will any G7 country adopt Bitcoin as legal tender in 2026?', 'Politics', 0.10, 28000, 16000, 365),
    createMarket('Will SEC approve Ethereum spot ETF by March 2026?', 'Politics', 0.75, 85000, 48000, 75),
    createMarket('Will UK hold a general election before 2027?', 'Politics', 0.60, 36000, 20000, 365),
    createMarket('Will Germany form a new coalition government by Q2 2026?', 'Politics', 0.70, 31000, 18000, 180),
    createMarket('Will Trump be the Republican nominee for 2028?', 'Politics', 0.55, 72000, 42000, 365),
    createMarket('Will any US state ban AI in education in 2026?', 'Politics', 0.30, 25000, 14000, 365),

    // ========== SCIENCE & SPACE ==========
    createMarket('Will SpaceX Starship complete orbital flight in Q1 2026?', 'Science', 0.80, 62000, 35000, 90),
    createMarket('Will Artemis III land humans on Moon in 2026?', 'Science', 0.35, 48000, 28000, 365),
    createMarket('Will CRISPR therapy be approved for cancer treatment in 2026?', 'Science', 0.40, 38000, 22000, 365),
    createMarket('Will nuclear fusion achieve net energy gain commercially in 2026?', 'Science', 0.15, 32000, 18000, 365),
    createMarket('Will global average temperature exceed 1.5C above pre-industrial in 2026?', 'Science', 0.60, 45000, 26000, 365),
    createMarket('Will a major automaker announce end of ICE production by 2030?', 'Science', 0.50, 35000, 20000, 180),
    createMarket('Will Apple release AR glasses in 2026?', 'Science', 0.55, 52000, 30000, 365),
    createMarket('Will Neuralink receive FDA approval for human trials in 2026?', 'Science', 0.45, 41000, 24000, 365),

    // ========== SPORTS ==========
    createMarket('Will Real Madrid win Champions League 2025-26?', 'Sports', 0.25, 85000, 48000, 180),
    createMarket('Will Manchester City win Premier League 2025-26?', 'Sports', 0.35, 72000, 42000, 180),
    createMarket('Will USA win most gold medals at 2026 Winter Olympics?', 'Sports', 0.20, 55000, 32000, 60),
    createMarket('Will a European team win FIFA Club World Cup 2025?', 'Sports', 0.60, 48000, 28000, 180),
    createMarket('Will LeBron James retire in 2026?', 'Sports', 0.30, 42000, 24000, 365),
    createMarket('Will F1 have more than 24 races in 2026 season?', 'Sports', 0.55, 28000, 16000, 365),
    createMarket('Will Max Verstappen win F1 Championship in 2026?', 'Sports', 0.40, 65000, 38000, 365),
    createMarket('Will an esports tournament prize pool exceed $50M in 2026?', 'Sports', 0.35, 31000, 18000, 365),

    // ========== ENTERTAINMENT & CULTURE ==========
    createMarket('Will GTA 6 release before December 2026?', 'Entertainment', 0.70, 92000, 52000, 365),
    createMarket('Will a streaming service surpass Netflix in subscribers in 2026?', 'Entertainment', 0.25, 45000, 26000, 365),
    createMarket('Will any movie gross over $3B worldwide in 2026?', 'Entertainment', 0.20, 38000, 22000, 365),
    createMarket('Will Taylor Swift announce retirement from touring in 2026?', 'Entertainment', 0.15, 52000, 30000, 365),
    createMarket('Will Disney+ become profitable in 2026?', 'Entertainment', 0.60, 42000, 24000, 365),
    createMarket('Will Twitter/X reach 1B monthly active users in 2026?', 'Entertainment', 0.30, 35000, 20000, 365),
  ];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
  const category = searchParams.get('category');

  try {
    // Try Seer API first
    const seerData = await fetchSeerMarkets(limit);
    
    let markets;
    let isMock = false;
    
    if (seerData && seerData.markets && seerData.markets.length > 0) {
      markets = seerData.markets.map((m: any) => ({
        id: `gnosis-${m.id}`,
        conditionId: m.conditionId || m.id,
        questionId: m.questionId || m.id,
        title: m.title || m.question,
        category: m.category || 'General',
        outcomes: m.outcomes || [
          { id: '0', name: 'Yes', odds: 2, probability: 0.5 },
          { id: '1', name: 'No', odds: 2, probability: 0.5 },
        ],
        status: m.status || 'open',
        volume: m.volume || 0,
        liquidity: m.liquidity || 0,
        resolvesAt: m.resolvesAt,
        creator: m.creator,
        collateralToken: m.collateralToken || 'xDAI',
      }));
    } else {
      // Use curated markets as fallback
      markets = getCuratedMarkets();
      isMock = true;
    }

    // Filter by category if specified
    if (category) {
      markets = markets.filter((m: any) =>
        m.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      data: markets.slice(0, limit),
      count: markets.length,
      isMock,
      platform: 'Gnosis/Omen',
      chain: 'Gnosis',
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Gnosis API error:', error.message);
    
    // Return curated markets on error
    const markets = getCuratedMarkets();
    return NextResponse.json({
      success: true,
      data: markets,
      count: markets.length,
      isMock: true,
      platform: 'Gnosis/Omen',
      chain: 'Gnosis',
      timestamp: Date.now(),
    });
  }
}

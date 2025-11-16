import dotenv from 'dotenv';

dotenv.config();

export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  },
  blockchain: {
    bscRpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
    bscTestnetRpcUrl: process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
    network: process.env.NETWORK || 'testnet',
  },
  contracts: {
    truthBountyCore: process.env.TRUTH_BOUNTY_CORE_ADDRESS || '',
    reputationNFT: process.env.REPUTATION_NFT_ADDRESS || '',
    scoreCalculator: process.env.SCORE_CALCULATOR_ADDRESS || '',
    pancakePrediction: process.env.PANCAKE_PREDICTION_ADDRESS || '0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA',
  },
  polymarket: {
    apiUrl: process.env.POLYMARKET_API_URL || 'https://gamma-api.polymarket.com',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  alerts: {
    checkInterval: parseInt(process.env.ALERT_CHECK_INTERVAL || '60000'),
    priceChangeThreshold: parseFloat(process.env.PRICE_CHANGE_THRESHOLD || '5'),
    volumeChangeThreshold: parseFloat(process.env.VOLUME_CHANGE_THRESHOLD || '10'),
  },
  features: {
    enablePolymarket: process.env.ENABLE_POLYMARKET === 'true',
    enablePancakeSwap: process.env.ENABLE_PANCAKESWAP === 'true',
    enableTruthScore: process.env.ENABLE_TRUTHSCORE === 'true',
  },
  admin: {
    userIds: (process.env.ADMIN_USER_IDS || '').split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export function validateConfig(): void {
  if (!config.telegram.botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }

  console.log('✅ Configuration validated');
  console.log(`📡 Network: ${config.blockchain.network}`);
  console.log(`🔧 Features: Polymarket=${config.features.enablePolymarket}, PancakeSwap=${config.features.enablePancakeSwap}, TruthScore=${config.features.enableTruthScore}`);
}

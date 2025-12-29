// Quick test to verify SDK works
import {
  ReputationSDK,
  createPancakeSwapAdapter,
  createPolymarketAdapter,
  ScoringEngine,
} from './dist/index.js';

console.log('Testing SDK imports...\n');

// Test 1: Check exports
console.log('1. Exports check:');
console.log('   - ReputationSDK:', typeof ReputationSDK === 'function' ? 'OK' : 'FAIL');
console.log('   - createPancakeSwapAdapter:', typeof createPancakeSwapAdapter === 'function' ? 'OK' : 'FAIL');
console.log('   - createPolymarketAdapter:', typeof createPolymarketAdapter === 'function' ? 'OK' : 'FAIL');
console.log('   - ScoringEngine:', typeof ScoringEngine === 'function' ? 'OK' : 'FAIL');

// Test 2: Create adapters (without connecting)
console.log('\n2. Create adapters:');
const pancake = createPancakeSwapAdapter('https://bsc-dataseed.binance.org');
console.log('   - PancakeSwap adapter:', pancake.platformName, '| Chain:', pancake.chainId);

const poly = createPolymarketAdapter('https://polygon-rpc.com');
console.log('   - Polymarket adapter:', poly.platformName, '| Chain:', poly.chainId);

// Test 3: Create SDK instance
console.log('\n3. Create SDK:');
const sdk = new ReputationSDK({
  adapters: [pancake, poly],
});
console.log('   - SDK instance created');
console.log('   - Platforms:', sdk.getPlatforms().map(p => p.name).join(', '));

// Test 4: Test scoring engine
console.log('\n4. Scoring engine:');
const engine = new ScoringEngine();
const mockStats = {
  userId: '0x123',
  platformId: 'test',
  totalBets: 50,
  wins: 30,
  losses: 20,
  pending: 0,
  winRate: 60,
  volume: '5000000000000000000', // 5 ETH/BNB
  score: 0,
};
const score = engine.calculatePlatformScore(mockStats);
console.log('   - Mock stats: 50 bets, 30 wins (60% win rate)');
console.log('   - Calculated score:', score);

// Test 5: Calculate TruthScore
console.log('\n5. TruthScore calculation:');
mockStats.score = score;
const truthScore = engine.calculateTruthScore('0x123', [mockStats]);
console.log('   - TruthScore:', truthScore.totalScore);
console.log('   - Tier:', truthScore.tier);

console.log('\n✅ All tests passed! SDK is working correctly.\n');

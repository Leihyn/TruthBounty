/**
 * PancakeSwap Prediction Indexer
 *
 * Indexes prediction data from PancakeSwap Prediction V2 contract on BSC
 * Stores user bets and stats in Supabase database
 */

import 'dotenv/config';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { bsc, bscTestnet } from 'viem/chains';
import { createClient } from '@supabase/supabase-js';

// Configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  network: process.env.NETWORK || 'testnet',
  startBlock: process.env.START_BLOCK ? BigInt(process.env.START_BLOCK) : undefined,
};

// Contract addresses
const CONTRACTS = {
  mainnet: '0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA' as const,
  testnet: '0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA' as const,
};

// Initialize clients
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

const publicClient = createPublicClient({
  chain: config.network === 'mainnet' ? bsc : bscTestnet,
  transport: http(
    config.network === 'mainnet'
      ? (process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org')
      : (process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545')
  ),
});

const contractAddress = CONTRACTS[config.network as 'mainnet' | 'testnet'];

// Event signatures
const EVENTS = {
  BetBear: parseAbiItem('event BetBear(address indexed sender, uint256 indexed epoch, uint256 amount)'),
  BetBull: parseAbiItem('event BetBull(address indexed sender, uint256 indexed epoch, uint256 amount)'),
  Claim: parseAbiItem('event Claim(address indexed sender, uint256 indexed epoch, uint256 amount)'),
  EndRound: parseAbiItem('event EndRound(uint256 indexed epoch, uint256 indexed roundId, int256 price)'),
  StartRound: parseAbiItem('event StartRound(uint256 indexed epoch)'),
};

interface BetEvent {
  user: string;
  epoch: bigint;
  amount: bigint;
  position: 'Bull' | 'Bear';
  txHash: string;
  blockNumber: bigint;
  timestamp: number;
}

interface ClaimEvent {
  user: string;
  epoch: bigint;
  amount: bigint;
  txHash: string;
  blockNumber: bigint;
  timestamp: number;
}

interface RoundResult {
  epoch: bigint;
  price: bigint;
  blockNumber: bigint;
  timestamp: number;
}

class PancakeSwapIndexer {
  private platformId: number | null = null;
  private lastProcessedBlock: bigint;
  private isRunning = false;

  constructor() {
    this.lastProcessedBlock = config.startBlock || 0n;
  }

  async initialize() {
    console.log('🚀 Initializing PancakeSwap Prediction indexer...');
    console.log(`   Network: ${config.network}`);
    console.log(`   Contract: ${contractAddress}`);

    // Get or create platform in database
    const { data: platform, error } = await supabase
      .from('platforms')
      .select('id')
      .eq('name', 'PancakeSwap Prediction')
      .single();

    if (error) {
      console.error('❌ Failed to get platform:', error);
      throw error;
    }

    this.platformId = platform.id;
    console.log(`✅ Platform ID: ${this.platformId}`);
    console.log(`📌 START_BLOCK from .env: ${config.startBlock || 'not set'}`);

    // Get last processed block from database (if any)
    const { data: lastBlock } = await supabase
      .from('bets')
      .select('block_number')
      .eq('platform_id', this.platformId)
      .order('block_number', { ascending: false })
      .limit(1)
      .single();

    // Always prefer the database block if it exists (avoid pruned block errors)
    const currentBlock = await publicClient.getBlockNumber();
    if (lastBlock?.block_number) {
      const dbBlock = BigInt(lastBlock.block_number);
      this.lastProcessedBlock = dbBlock;
      console.log(`📍 Resuming from DB block: ${this.lastProcessedBlock}`);
      if (config.startBlock && config.startBlock < dbBlock) {
        console.log(`⚠️  START_BLOCK (${config.startBlock}) is older than DB block - ignoring to avoid pruned blocks`);
      }
    } else if (config.startBlock) {
      this.lastProcessedBlock = config.startBlock;
      console.log(`📍 No previous bets found, using START_BLOCK: ${this.lastProcessedBlock}`);
    } else {
      // If no DB block and no START_BLOCK, use current block minus 1000 (safe default)
      this.lastProcessedBlock = currentBlock - 1000n;
      console.log(`📍 No START_BLOCK set, starting from recent block: ${this.lastProcessedBlock}`);
    }

    console.log(`📊 Current block: ${currentBlock}`);
    console.log(`📈 Blocks to process: ${currentBlock - this.lastProcessedBlock}`);
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Indexer is already running');
      return;
    }

    this.isRunning = true;
    console.log('\n🏁 Starting indexer...\n');

    while (this.isRunning) {
      try {
        await this.indexBatch();

        // Wait 5 seconds before next batch (reduced delay for faster indexing)
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('❌ Indexing error:', error);
        // Wait 15 seconds before retry on error (reduced from 30s)
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    }
  }

  stop() {
    console.log('\n⏹️  Stopping indexer...');
    this.isRunning = false;
  }

  private async indexBatch() {
    const currentBlock = await publicClient.getBlockNumber();
    const batchSize = 50n; // Process 50 blocks at a time (heavily reduced for free RPC limits)

    const fromBlock = this.lastProcessedBlock + 1n;
    const toBlock = fromBlock + batchSize > currentBlock ? currentBlock : fromBlock + batchSize;

    if (fromBlock > currentBlock) {
      console.log('✅ All caught up! Waiting for new blocks...');
      return;
    }

    console.log(`📦 Processing blocks ${fromBlock} → ${toBlock}`);

    // Fetch all events in parallel
    const [betBullEvents, betBearEvents, claimEvents, endRoundEvents] = await Promise.all([
      this.fetchBetBullEvents(fromBlock, toBlock),
      this.fetchBetBearEvents(fromBlock, toBlock),
      this.fetchClaimEvents(fromBlock, toBlock),
      this.fetchEndRoundEvents(fromBlock, toBlock),
    ]);

    const allBets = [...betBullEvents, ...betBearEvents].sort((a, b) =>
      Number(a.blockNumber - b.blockNumber)
    );

    console.log(`   📊 Found ${allBets.length} bets, ${claimEvents.length} claims, ${endRoundEvents.length} round ends`);

    // Process bets
    if (allBets.length > 0) {
      await this.processBets(allBets, endRoundEvents);
    }

    // Process claims
    if (claimEvents.length > 0) {
      await this.processClaims(claimEvents);
    }

    this.lastProcessedBlock = toBlock;
    console.log(`✅ Processed up to block ${toBlock}\n`);
  }

  private async fetchBetBullEvents(fromBlock: bigint, toBlock: bigint): Promise<BetEvent[]> {
    const logs = await publicClient.getLogs({
      address: contractAddress,
      event: EVENTS.BetBull,
      fromBlock,
      toBlock,
    });

    return Promise.all(
      logs.map(async (log) => {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        return {
          user: log.args.sender!,
          epoch: log.args.epoch!,
          amount: log.args.amount!,
          position: 'Bull' as const,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          timestamp: Number(block.timestamp),
        };
      })
    );
  }

  private async fetchBetBearEvents(fromBlock: bigint, toBlock: bigint): Promise<BetEvent[]> {
    const logs = await publicClient.getLogs({
      address: contractAddress,
      event: EVENTS.BetBear,
      fromBlock,
      toBlock,
    });

    return Promise.all(
      logs.map(async (log) => {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        return {
          user: log.args.sender!,
          epoch: log.args.epoch!,
          amount: log.args.amount!,
          position: 'Bear' as const,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          timestamp: Number(block.timestamp),
        };
      })
    );
  }

  private async fetchClaimEvents(fromBlock: bigint, toBlock: bigint): Promise<ClaimEvent[]> {
    const logs = await publicClient.getLogs({
      address: contractAddress,
      event: EVENTS.Claim,
      fromBlock,
      toBlock,
    });

    return Promise.all(
      logs.map(async (log) => {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        return {
          user: log.args.sender!,
          epoch: log.args.epoch!,
          amount: log.args.amount!,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          timestamp: Number(block.timestamp),
        };
      })
    );
  }

  private async fetchEndRoundEvents(fromBlock: bigint, toBlock: bigint): Promise<RoundResult[]> {
    const logs = await publicClient.getLogs({
      address: contractAddress,
      event: EVENTS.EndRound,
      fromBlock,
      toBlock,
    });

    return Promise.all(
      logs.map(async (log) => {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        return {
          epoch: log.args.epoch!,
          price: log.args.price!,
          blockNumber: log.blockNumber,
          timestamp: Number(block.timestamp),
        };
      })
    );
  }

  private async processBets(bets: BetEvent[], roundResults: RoundResult[]) {
    const roundResultsMap = new Map(
      roundResults.map(r => [r.epoch.toString(), r])
    );

    for (const bet of bets) {
      try {
        // Get or create user
        const { data: user, error: userError } = await supabase
          .from('users')
          .upsert(
            { wallet_address: bet.user.toLowerCase() },
            { onConflict: 'wallet_address' }
          )
          .select()
          .single();

        if (userError || !user) {
          console.error(`Failed to create user ${bet.user}:`, userError);
          continue;
        }

        // Determine if bet won (if round is finished)
        const roundResult = roundResultsMap.get(bet.epoch.toString());
        let won: boolean | null = null;

        if (roundResult) {
          // TODO: Fetch round's lock price to determine winner
          // For now, we'll mark as unknown until claim event
          won = null;
        }

        // Insert bet
        const { error: betError } = await supabase
          .from('bets')
          .insert({
            user_id: user.id,
            platform_id: this.platformId,
            market_id: bet.epoch.toString(),
            position: bet.position,
            amount: bet.amount.toString(),
            won,
            tx_hash: bet.txHash,
            block_number: Number(bet.blockNumber),
            timestamp: new Date(bet.timestamp * 1000).toISOString(),
          });

        if (betError && betError.code !== '23505') { // Ignore duplicate key errors
          console.error(`Failed to insert bet ${bet.txHash}:`, betError);
        }
      } catch (error) {
        console.error(`Error processing bet:`, error);
      }
    }
  }

  private async processClaims(claims: ClaimEvent[]) {
    for (const claim of claims) {
      try {
        // Get user ID first
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('wallet_address', claim.user.toLowerCase())
          .single();

        if (!user) {
          console.log(`User not found for claim ${claim.txHash}, skipping`);
          continue;
        }

        // Update bet with claim amount and mark as won
        const { error } = await supabase
          .from('bets')
          .update({
            won: true,
            claimed_amount: claim.amount.toString(),
          })
          .eq('platform_id', this.platformId)
          .eq('market_id', claim.epoch.toString())
          .eq('user_id', user.id);

        if (error) {
          console.error(`Failed to update claim for ${claim.txHash}:`, error);
        }
      } catch (error) {
        console.error(`Error processing claim:`, error);
      }
    }
  }
}

// Main execution
async function main() {
  const indexer = new PancakeSwapIndexer();

  await indexer.initialize();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    indexer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    indexer.stop();
    process.exit(0);
  });

  await indexer.start();
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { PancakeSwapIndexer };

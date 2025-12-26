# TruthBounty MVP

**Turn your prediction accuracy into verifiable on-chain reputation.**

TruthBounty is a decentralized reputation protocol that tracks prediction market performance across multiple platforms and mints soulbound NFTs representing your prediction accuracy. Build your TruthScore, climb the leaderboard, and let top traders copy your strategies.

Built for the **Seedify Prediction Markets Hackathon** on BNB Chain.

**Live Demo:** https://truth-bounty-4r9b.vercel.app/

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Smart Contracts](#smart-contracts)
- [Frontend Application](#frontend-application)
- [Services](#services)
- [How It Works](#how-it-works)
- [TruthScore System](#truthscore-system)
- [Copy Trading](#copy-trading)
- [Supported Platforms](#supported-platforms)
- [Deployment](#deployment)
- [License](#license)

---

## Features

### Core Features

- **Soulbound Reputation NFTs** - Non-transferable NFTs that track your prediction market performance
- **Multi-Platform Integration** - Import predictions from PancakeSwap Prediction and Polymarket
- **TruthScore Algorithm** - Proprietary scoring system: `(WinRate x 100) x sqrt(Volume) / 100`
- **Dynamic Tier System** - Bronze, Silver, Gold, Platinum, Diamond based on performance
- **Global Leaderboard** - Compete with other prediction market traders worldwide
- **Trader Search** - Look up any address to view their complete betting history
- **Copy Trading** - Follow successful traders and automatically copy their bets (simulation mode available)
- **Direct Betting** - Place bets on PancakeSwap directly from the app
- **Public Profiles** - Shareable profiles showing stats, wins/losses, and bet history

### User Experience

- **Responsive Design** - Works seamlessly on desktop and mobile
- **Real-time Updates** - Live market data with automatic refreshing
- **Wallet Integration** - RainbowKit + wagmi for smooth Web3 connections
- **Dark Mode UI** - Beautiful gradient-based design with glassmorphism
- **Interactive Dashboards** - Comprehensive analytics and visualizations

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: wagmi v2, viem, RainbowKit
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: React Hooks
- **Animations**: Framer Motion

### Smart Contracts
- **Language**: Solidity 0.8.28
- **Framework**: Foundry
- **Network**: BNB Smart Chain (Testnet & Mainnet)
- **Standards**: ERC-721 (Soulbound), ERC-165

### Backend/Services
- **Runtime**: Node.js, Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **External APIs**:
  - The Graph (PancakeSwap data)
  - Polymarket REST API
  - BSCScan API

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Testing**: Foundry Test Suite
- **Linting**: ESLint, Prettier

---

## Project Structure

```
truthbounty-mvp/
├── contracts/                 # Smart contracts (Foundry project)
│   ├── src/
│   │   ├── core/
│   │   │   ├── TruthBountyCore.sol      # Main protocol contract
│   │   │   ├── ReputationNFT.sol        # Soulbound NFT implementation
│   │   │   ├── ScoreCalculator.sol      # TruthScore algorithm
│   │   │   ├── PlatformRegistry.sol     # Platform management
│   │   │   └── CopyTradingVault.sol     # Copy trading vault
│   │   ├── interfaces/                   # Contract interfaces
│   │   └── libraries/                    # Shared libraries
│   ├── script/                           # Deployment scripts
│   ├── test/                             # Contract tests
│   └── foundry.toml                      # Foundry config
│
├── frontend/                  # Next.js application
│   ├── app/                              # App router pages
│   │   ├── page.tsx                      # Home page
│   │   ├── dashboard/                    # User dashboard
│   │   ├── markets/                      # Prediction markets
│   │   ├── leaderboard/                  # Global rankings
│   │   ├── profile/[address]/            # Public profiles
│   │   ├── traders/                      # Trader search
│   │   ├── copy-trading/                 # Copy trading dashboard
│   │   ├── monitor/                      # Live monitoring
│   │   └── api/                          # API routes
│   │       ├── copy-trading/             # Copy trading APIs
│   │       ├── leaderboard/              # Leaderboard APIs
│   │       ├── pancakeswap/              # PancakeSwap APIs
│   │       └── polymarket-leaderboard/   # Polymarket APIs
│   ├── components/                       # React components
│   ├── hooks/                            # Custom React hooks
│   ├── lib/                              # Utilities & config
│   └── public/                           # Static assets
│
├── services/                  # Backend services
│   ├── copy-trading/                     # Copy trading service
│   │   ├── index.ts                      # On-chain executor
│   │   ├── simulator.ts                  # Simulation mode
│   │   └── package.json
│   └── indexer/                          # Bet indexer service
│       ├── index.js                      # Main indexer
│       ├── backfill.js                   # Historical data backfill
│       └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Foundry (for smart contracts)
- MetaMask or compatible Web3 wallet
- Git

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Leihyn/TruthBounty.git
cd truthbounty-mvp
```

#### 2. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Smart Contracts:**
```bash
cd contracts
forge install
```

**Services:**
```bash
cd services/copy-trading
npm install

cd ../indexer
npm install
```

#### 3. Environment Setup

Create `.env.local` in the `frontend` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

Create `.env` in `services/copy-trading`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
BSC_RPC_URL=https://bsc.publicnode.com
BSC_TESTNET_RPC=https://bsc-testnet.publicnode.com
EXECUTOR_PRIVATE_KEY=your_executor_private_key
```

#### 4. Run Development Server

**Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Copy Trading Simulator:**
```bash
cd services/copy-trading
npx ts-node simulator.ts
```

**Smart Contracts (Testing):**
```bash
cd contracts
forge test
```

---

## Smart Contracts

### Core Contracts

#### TruthBountyCore.sol
Main protocol contract managing user registration and reputation.

**Key Functions:**
- `registerUser()` - Mint reputation NFT
- `getUserProfile(address)` - Get user stats
- `updateScore(address, TruthScore memory)` - Update reputation
- `hasRegistered(address)` - Check registration status

#### ReputationNFT.sol
ERC-721 soulbound NFT with dynamic metadata.

**Features:**
- Non-transferable (soulbound)
- Dynamic SVG generation
- Tier-based visual design
- On-chain metadata

#### ScoreCalculator.sol
Calculates TruthScore based on performance metrics.

**Formula:**
```solidity
score = (winRate x volumeSqrt) / 100
where:
  winRate = (correctPredictions / totalPredictions) x 10000
  volumeSqrt = sqrt(totalVolume / 1e16)
```

#### CopyTradingVault.sol
Manages copy trading funds and automated bet execution.

**Deployed Address (BSC Testnet):** `0xBf5341E79bc0507a16807C244b5267Ad8333a6ed`

**Features:**
- User balance management
- Copy follow settings per trader
- Automated bet execution
- Reward claiming

### Contract Deployment

```bash
cd contracts

# Deploy to BSC Testnet
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://bsc-testnet.publicnode.com \
  --broadcast \
  --verify
```

---

## Services

### Copy Trading Service

Two modes of operation:

**1. Simulator Mode (simulator.ts)**
- Monitors mainnet PancakeSwap leader bets
- Logs virtual trades to Supabase
- Calculates PnL when rounds resolve
- No on-chain execution, no gas fees

**2. Executor Mode (index.ts)**
- Executes real on-chain copy trades
- Uses CopyTradingVault funds
- Requires executor wallet with gas

### Indexer Service

Tracks and indexes prediction bets:
- Backfills historical data
- Calculates user statistics
- Updates leaderboard rankings

---

## How It Works

### 1. User Registration

1. Connect wallet (BNB Smart Chain)
2. Click "Claim Your Bounty"
3. Transaction mints soulbound NFT with initial score of 0
4. NFT TokenID linked to your address

### 2. Import Predictions

**PancakeSwap:**
- Queries The Graph API for prediction history
- Fetches all bet/claim transactions
- Calculates win/loss records

**Polymarket:**
- Calls Polymarket REST API
- Fetches position history
- Determines settled outcomes

### 3. TruthScore Calculation

```typescript
const winRate = (correctPredictions / totalPredictions) * 10000;
const volumePoints = totalVolume / 1e16; // 1 BNB = 100 points
const volumeSqrt = Math.sqrt(volumePoints);
const truthScore = (winRate * volumeSqrt) / 100;
```

### 4. Tier System

| Tier | Threshold | Color |
|------|-----------|-------|
| Bronze | 0 - 499 | Orange |
| Silver | 500 - 999 | Silver |
| Gold | 1,000 - 1,999 | Gold |
| Platinum | 2,000 - 4,999 | Cyan |
| Diamond | 5,000+ | Blue |

---

## TruthScore System

### Components

**1. Base Score (Win Rate)**
- Percentage of correct predictions
- Precision: 2 decimals (7550 = 75.50%)
- Range: 0 - 10000

**2. Volume Multiplier**
- Rewards trading activity
- Square root scaling prevents whale dominance
- 1 BNB = 100 volume points

**3. Final Score**
- Combines accuracy and volume
- No hard upper limit
- Typical range: 0 - 20,000

### Score Examples

| Win Rate | Volume | TruthScore | Tier |
|----------|--------|------------|------|
| 50% | 1 BNB | 500 | Silver |
| 70% | 10 BNB | 2,213 | Platinum |
| 75% | 50 BNB | 5,303 | Diamond |
| 80% | 100 BNB | 8,000 | Diamond |

### Why Square Root?

**Without sqrt:** 100 BNB trader has 100x advantage over 1 BNB trader
**With sqrt:** 100 BNB trader has 10x advantage (sqrt(100) vs sqrt(1))

This ensures **skill matters more than bankroll** while still rewarding volume.

---

## Copy Trading

### How It Works

**1. Follow a Trader**
```typescript
{
  trader: "0x...",
  allocationPercentage: 25,  // Copy 25% of their bet size
  maxBetAmount: "0.5 BNB",   // Cap at 0.5 BNB per bet
  isActive: true
}
```

**2. Simulation Mode**
- Monitors mainnet leader bets via WebSocket
- Logs virtual trades to database
- Calculates what PnL would have been
- No real funds at risk

**3. Execution Mode**
- Deposit BNB to CopyTradingVault
- Automated copy trades on-chain
- Claim winnings back to vault

---

## Supported Platforms

### PancakeSwap Prediction

**Network:** BNB Smart Chain
**Asset:** BNB/USD price predictions
**Round Duration:** 5 minutes
**Integration:** The Graph API + Direct Betting

**Features:**
- Live round data
- Bull/Bear betting
- Historical round results
- Place bets directly from TruthBounty

### Polymarket

**Network:** Polygon
**Asset:** Event-based predictions
**Markets:** Politics, Sports, Crypto, etc.
**Integration:** REST API + Deep Linking

**Features:**
- Event outcome probabilities
- Volume and liquidity data
- Market descriptions and tags
- Direct deep linking to Polymarket

---

## Deployment

### Smart Contracts

```bash
cd contracts

forge script script/Deploy.s.sol:Deploy \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

### Frontend (Vercel)

The frontend auto-deploys from GitHub to Vercel.

Manual deployment:
```bash
cd frontend
npm i -g vercel
vercel --prod
```

---

## Testing

### Smart Contract Tests

```bash
cd contracts

# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Generate coverage
forge coverage
```

### Frontend

```bash
cd frontend

# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

---

## FAQ

**Q: Is my NFT transferable?**
A: No, it's a soulbound (non-transferable) NFT tied to your wallet address forever.

**Q: How often does my TruthScore update?**
A: Manually when you import predictions or after each bet if using integrated platforms.

**Q: Can I have multiple profiles?**
A: One profile per wallet address. Each wallet can register once.

**Q: What happens if I lose bets?**
A: Your TruthScore will decrease as your win rate drops.

**Q: Is copy trading automated?**
A: Yes. In simulation mode, trades are logged virtually. In execution mode, bets are copied on-chain automatically.

**Q: Which network should I use?**
A: BNB Smart Chain for TruthBounty and PancakeSwap. Polygon for Polymarket.

**Q: Are there any fees?**
A: Only blockchain gas fees. No platform fees.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **PancakeSwap** - For the prediction market platform
- **Polymarket** - For decentralized prediction markets
- **The Graph** - For indexing blockchain data
- **RainbowKit** - For wallet connection UI
- **wagmi** - For React hooks for Ethereum
- **Foundry** - For smart contract development
- **Next.js** - For the web framework
- **shadcn/ui** - For UI components

---

**Built for the Seedify Prediction Markets Hackathon**

Star us on GitHub if you find this project interesting!

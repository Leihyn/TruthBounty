# TruthBounty MVP

**Turn your prediction accuracy into verifiable on-chain reputation.**

TruthBounty is a decentralized reputation protocol that tracks prediction market performance across multiple platforms and mints soulbound NFTs representing your prediction accuracy. Build your TruthScore, climb the leaderboard, and let top traders copy your strategies.

Built for the **Seedify Prediction Markets Hackathon** on BNB Chain.

---

## 🎯 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Smart Contracts](#-smart-contracts)
- [Frontend Application](#-frontend-application)
- [How It Works](#-how-it-works)
- [TruthScore System](#-truthscore-system)
- [Copy Trading](#-copy-trading)
- [Supported Platforms](#-supported-platforms)
- [Deployment](#-deployment)
- [License](#-license)

---

## ✨ Features

### 🏆 Core Features

- **Soulbound Reputation NFTs** - Non-transferable NFTs that track your prediction market performance
- **Multi-Platform Integration** - Import predictions from PancakeSwap Prediction and Polymarket
- **TruthScore Algorithm** - Proprietary scoring system: `(WinRate × 100) × √(Volume) / 100`
- **Dynamic Tier System** - Bronze → Silver → Gold → Platinum → Diamond based on performance
- **Global Leaderboard** - Compete with other prediction market traders worldwide
- **Trader Search** - Look up any address to view their complete betting history
- **Copy Trading** - Follow successful traders and automatically copy their bets
- **Direct Betting** - Place bets on PancakeSwap directly from the app
- **Public Profiles** - Shareable profiles showing stats, wins/losses, and bet history

### 🎨 User Experience

- **Responsive Design** - Works seamlessly on desktop and mobile
- **Real-time Updates** - Live market data with automatic refreshing
- **Wallet Integration** - RainbowKit + wagmi for smooth Web3 connections
- **Dark Mode UI** - Beautiful gradient-based design with glassmorphism
- **Interactive Dashboards** - Comprehensive analytics and visualizations

---

## 🛠 Tech Stack

### **Frontend**
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: wagmi v2, viem, RainbowKit
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: React Hooks
- **Animations**: Framer Motion

### **Smart Contracts**
- **Language**: Solidity 0.8.28
- **Framework**: Foundry
- **Network**: BNB Smart Chain (Testnet & Mainnet)
- **Standards**: ERC-721 (Soulbound), ERC-165

### **Backend/APIs**
- **Runtime**: Next.js API Routes
- **External APIs**:
  - The Graph (PancakeSwap data)
  - Polymarket REST API
  - BSCScan API

### **Development Tools**
- **Package Manager**: npm/yarn
- **Version Control**: Git
- **Testing**: Foundry Test Suite
- **Linting**: ESLint, Prettier

---

## 📁 Project Structure

```
truthbounty-mvp/
├── contracts/                 # Smart contracts (Foundry project)
│   ├── src/
│   │   ├── core/
│   │   │   ├── TruthBountyCore.sol      # Main protocol contract
│   │   │   ├── ReputationNFT.sol        # Soulbound NFT implementation
│   │   │   ├── ScoreCalculator.sol      # TruthScore algorithm
│   │   │   └── PlatformRegistry.sol     # Platform management
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
│   │   └── analytics/                    # Analytics & insights
│   ├── components/                       # React components
│   │   ├── ui/                           # shadcn/ui components
│   │   ├── polymarket/                   # Polymarket integrations
│   │   ├── pancakeswap/                  # PancakeSwap integrations
│   │   ├── ConnectWallet.tsx             # Wallet connection
│   │   ├── TruthScoreCard.tsx            # Score display
│   │   └── NFTDisplay.tsx                # NFT renderer
│   ├── hooks/                            # Custom React hooks
│   │   ├── useTruthBounty.ts             # Main contract hook
│   │   └── use-toast.ts                  # Toast notifications
│   ├── lib/                              # Utilities & config
│   │   ├── contracts.ts                  # Contract ABIs & addresses
│   │   ├── wagmi.ts                      # wagmi configuration
│   │   ├── polymarket.ts                 # Polymarket service
│   │   └── pancakeswap.ts                # PancakeSwap service
│   ├── public/                           # Static assets
│   └── styles/                           # Global styles
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Foundry (for smart contracts)
- MetaMask or compatible Web3 wallet
- Git

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/truthbounty-mvp.git
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

#### 3. Environment Setup

Create `.env.local` in the `frontend` directory with the required environment variables.

**Note:** Environment variable details are documented separately for security.

#### 4. Run Development Server

**Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Smart Contracts (Testing):**
```bash
cd contracts
forge test
```

---

## 📜 Smart Contracts

### Core Contracts

#### **TruthBountyCore.sol**
Main protocol contract managing user registration and reputation.

**Key Functions:**
- `registerUser()` - Mint reputation NFT
- `getUserProfile(address)` - Get user stats
- `updateScore(address, TruthScore memory)` - Update reputation
- `hasRegistered(address)` - Check registration status

#### **ReputationNFT.sol**
ERC-721 soulbound NFT with dynamic metadata.

**Features:**
- Non-transferable (soulbound)
- Dynamic SVG generation
- Tier-based visual design
- On-chain metadata

#### **ScoreCalculator.sol**
Calculates TruthScore based on performance metrics.

**Formula:**
```solidity
score = (winRate × volumeSqrt) / 100
where:
  winRate = (correctPredictions / totalPredictions) × 10000
  volumeSqrt = sqrt(totalVolume / 1e16)
```

#### **PlatformRegistry.sol**
Manages supported prediction platforms.

**Supported Platforms:**
- PancakeSwap Prediction (ID: 1)
- Polymarket (ID: 2)

#### **CopyTradingVault.sol**
Manages copy trading funds and automated bet execution.

**Features:**
- User balance management
- Copy follow settings per trader
- Automated bet execution
- Reward claiming
- Platform whitelisting

### Contract Deployment

```bash
cd contracts

# Deploy to BSC Testnet
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  --broadcast \
  --verify

# Deploy to BSC Mainnet
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url https://bsc-dataseed1.binance.org \
  --broadcast \
  --verify
```

---

## 🎨 Frontend Application

### Pages

#### **Home (`/`)**
- Hero section with wallet connection
- Feature overview
- How it works guide
- Tier system showcase
- Platform integrations

#### **Dashboard (`/dashboard`)**
- Personal TruthScore card
- NFT display with dynamic rendering
- Import predictions from platforms
- Recent activity feed
- Performance statistics

#### **Markets (`/markets`)**
- Live PancakeSwap Prediction rounds
- **Direct betting** on PancakeSwap
- Polymarket event predictions
- **Deep linking** to Polymarket with wallet info
- Real-time market data

#### **Leaderboard (`/leaderboard`)**
- Global rankings by TruthScore
- Filter by tier and platform
- Search by address
- Top 3 spotlight
- Platform-specific leaderboards

#### **Trader Search (`/traders`)**
- Search any wallet address
- View complete bet history
- See wins/losses breakdown
- Filter by outcome (wins, losses, pending)
- Copy trading integration

#### **Public Profile (`/profile/[address]`)**
- Shareable profile pages
- Comprehensive statistics
- Recent predictions timeline
- Performance breakdown
- Copy trade button

#### **Copy Trading (`/copy-trading`)**
- Active follows management
- Copy trade history
- Performance metrics
- Pause/resume/delete follows
- Allocation and risk controls

#### **Analytics (`/analytics`)**
- Performance insights
- Win rate trends
- Volume analysis
- Platform comparison

---

## 🔄 How It Works

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
// Simplified calculation
const winRate = (correctPredictions / totalPredictions) × 10000;
const volumePoints = totalVolume / 1e16; // 1 BNB = 100 points
const volumeSqrt = Math.sqrt(volumePoints);
const truthScore = (winRate × volumeSqrt) / 100;
```

**Example:**
- 100 predictions, 70 correct
- 50 BNB total volume
- Win rate: 70% (7000)
- Volume: √5000 ≈ 70.71
- **TruthScore: 4,950** (Platinum tier)

### 4. Tier Advancement

| Tier | Threshold | Color |
|------|-----------|-------|
| 🥉 Bronze | 0 - 499 | Orange |
| 🥈 Silver | 500 - 999 | Silver |
| 🥇 Gold | 1,000 - 1,999 | Gold |
| 💎 Platinum | 2,000 - 4,999 | Cyan |
| 💠 Diamond | 5,000+ | Blue |

NFT metadata updates automatically when crossing thresholds.

---

## 📊 TruthScore System

### Components

#### **1. Base Score (Win Rate)**
- Percentage of correct predictions
- Precision: 2 decimals (7550 = 75.50%)
- Range: 0 - 10000

#### **2. Volume Multiplier**
- Rewards trading activity
- Square root scaling prevents whale dominance
- 1 BNB = 100 volume points

#### **3. Final Score**
- Combines accuracy and volume
- No hard upper limit
- Typical range: 0 - 20,000

### Score Examples

| Win Rate | Volume | Calculation | TruthScore | Tier |
|----------|--------|-------------|------------|------|
| 50% | 1 BNB | (5000 × √100) / 100 | 500 | Silver |
| 70% | 10 BNB | (7000 × √1000) / 100 | 2,213 | Platinum |
| 75% | 50 BNB | (7500 × √5000) / 100 | 5,303 | Diamond |
| 80% | 100 BNB | (8000 × √10000) / 100 | 8,000 | Diamond |

### Why Square Root?

**Without √:** 100 BNB trader has 100× advantage over 1 BNB trader
**With √:** 100 BNB trader has 10× advantage (√100 vs √1)

This ensures **skill matters more than bankroll** while still rewarding volume.

---

## 🔁 Copy Trading

### How Copy Trading Works

#### **1. Follow a Trader**
```typescript
// Set copy trading parameters
{
  trader: "0x...",
  allocationPercentage: 25,  // Copy 25% of their bet size
  maxBetAmount: "0.5 BNB",   // Cap at 0.5 BNB per bet
  isActive: true
}
```

#### **2. Automated Execution**
When the trader places a bet:
1. Backend detects the bet event
2. Calculates your copy amount: `traderBet × 25% = yourBet`
3. Checks max bet limit
4. Executes bet from your vault balance
5. Records the copy trade

#### **3. Vault Management**
- Deposit BNB to `CopyTradingVault`
- Funds used for automated copy trades
- Withdraw unused balance anytime
- Claim winnings back to vault

---

## 🌐 Supported Platforms

### **PancakeSwap Prediction**

**Network:** BNB Smart Chain
**Asset:** BNB/USD price predictions
**Round Duration:** 5 minutes
**Integration:** The Graph API + Direct Betting

**Features:**
- Live round data
- Bull/Bear betting
- Historical round results
- **Place bets directly from TruthBounty**

### **Polymarket**

**Network:** Polygon
**Asset:** Event-based predictions
**Markets:** Politics, Sports, Crypto, etc.
**Integration:** REST API + Deep Linking

**Features:**
- Event outcome probabilities
- Volume and liquidity data
- Market descriptions and tags
- **Direct deep linking to Polymarket**

---

## 📱 Key Features

### **Direct PancakeSwap Betting**

1. Navigate to Markets page
2. Find a LIVE PancakeSwap round
3. Click "Place Bet" button
4. Select Bull (UP) or Bear (DOWN)
5. Enter bet amount
6. Review potential payout
7. Confirm transaction
8. Bet is placed on-chain!

### **Polymarket Deep Linking**

1. Navigate to Markets page
2. Click on any Polymarket market
3. View market details
4. Click "Trade on Polymarket"
5. Opens Polymarket at exact market
6. Connect wallet and trade

---

## 🚢 Deployment

### Smart Contracts

```bash
cd contracts

# Deploy all contracts
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

### Frontend

#### Vercel Deployment

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 🧪 Testing

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

### Frontend Testing

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

## 🗺️ Roadmap

### ✅ Phase 1: MVP (Current)
- [x] Soulbound NFT implementation
- [x] TruthScore algorithm
- [x] PancakeSwap integration
- [x] Polymarket integration
- [x] Copy trading system
- [x] Leaderboard
- [x] Direct betting on PancakeSwap
- [x] Trader search functionality

### 🚧 Phase 2: Enhanced Features
- [ ] More platforms (Azuro, Thales, Augur)
- [ ] Advanced analytics dashboard
- [ ] Social features
- [ ] Tournament system
- [ ] Mobile app

### 🔮 Phase 3: Decentralization
- [ ] DAO governance
- [ ] Token launch
- [ ] Community-driven features
- [ ] Cross-chain expansion

---

## 💡 FAQ

**Q: Is my NFT transferable?**
A: No, it's a soulbound (non-transferable) NFT tied to your wallet address forever.

**Q: How often does my TruthScore update?**
A: Manually when you import predictions or after each bet if using integrated platforms.

**Q: Can I have multiple profiles?**
A: One profile per wallet address. Each wallet can register once.

**Q: What happens if I lose bets?**
A: Your TruthScore will decrease as your win rate drops.

**Q: Is copy trading automated?**
A: Yes, once you deposit to the vault and follow a trader, bets are copied automatically.

**Q: Which network should I use?**
A: BNB Smart Chain for TruthBounty and PancakeSwap. Polygon for Polymarket.

**Q: Are there any fees?**
A: Only blockchain gas fees. No platform fees.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **PancakeSwap** - For the prediction market platform
- **Polymarket** - For decentralized prediction markets
- **The Graph** - For indexing blockchain data
- **RainbowKit** - For wallet connection UI
- **wagmi** - For React hooks for Ethereum
- **Foundry** - For smart contract development
- **Next.js** - For the web framework
- **shadcn/ui** - For UI components

---

<div align="center">

**Built with ❤️ for the Seedify Prediction Markets Hackathon**

⭐ Star us on GitHub if you find this project interesting!

</div>

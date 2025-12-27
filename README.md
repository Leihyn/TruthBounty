# TruthBounty

**Turn prediction accuracy into verifiable on-chain reputation.**

TruthBounty is a decentralized reputation protocol that aggregates prediction market performance across platforms into a unified, soulbound NFT-based identity.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://truth-bounty-4r9b.vercel.app/)
[![Network](https://img.shields.io/badge/Network-BNB%20Chain-yellow?style=for-the-badge)](https://www.bnbchain.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## The Problem

Prediction market traders have no portable way to prove their track record. Your winning streak on Polymarket means nothing on PancakeSwap. Every platform is a fresh start.

## The Solution

TruthBounty creates a **universal reputation layer** for prediction markets:

- **Soulbound NFTs** that evolve with your performance
- **Cross-platform tracking** (PancakeSwap, Polymarket, more coming)
- **Anti-gaming scoring** using Wilson Score statistics
- **Copy trading** to follow top performers

---

## Features

### For Traders
- Mint your reputation NFT and build your TruthScore
- Import prediction history from supported platforms
- Climb the global leaderboard
- Share your verified track record

### For Followers
- Discover top-performing traders
- Copy trade with customizable allocation
- Simulation mode to test strategies risk-free

---

## TruthScore Algorithm

TruthScore is a robust reputation metric designed to reward skill over luck, with built-in anti-gaming measures.

### Score Components

| Component | Max Points | Calculation |
|-----------|-----------|-------------|
| Skill Score | 500 | `(WilsonScore - 0.5) * 1000` |
| Activity Score | 500 | `log10(wins) * 166` |
| Volume Bonus | 200 | `log10(volumeBNB) * 100` |
| Consistency Bonus | 100 | Sharpe-like ratio |
| **Max Total** | **1300** | |

### Anti-Gaming Features

**Wilson Score Lower Bound**

Unlike raw win rate, Wilson Score accounts for sample size uncertainty:

| Scenario | Raw Win Rate | Wilson Score |
|----------|--------------|--------------|
| 3/3 wins | 100% | 43.8% |
| 650/1000 wins | 65% | 62.1% |

This prevents new accounts from gaming the leaderboard with a few lucky wins.

**Additional Safeguards**
- Minimum 10 bets to appear on leaderboard
- Full score requires 50+ bets (linear scaling)
- New accounts capped at 50% for 14 days
- Logarithmic volume scaling prevents whale dominance

### Tier Structure

| Tier | Threshold | Description |
|------|-----------|-------------|
| Bronze | 0 | Getting started |
| Silver | 200 | Active trader |
| Gold | 400 | Skilled trader |
| Platinum | 650 | Expert trader |
| Diamond | 900 | Elite (~2% of traders) |

### Score Examples

| Profile | Win Rate | Wins | Volume | Score | Tier |
|---------|----------|------|--------|-------|------|
| Beginner | 52% | 15 | 2 BNB | ~120 | Bronze |
| Regular | 55% | 50 | 10 BNB | ~350 | Silver |
| Skilled | 60% | 100 | 30 BNB | ~520 | Gold |
| Expert | 65% | 200 | 50 BNB | ~720 | Platinum |
| Elite | 70% | 500 | 100 BNB | ~950 | Diamond |

---

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- wagmi v2, viem, RainbowKit

### Smart Contracts
- Solidity 0.8.28
- Foundry
- BNB Smart Chain (Testnet)

### Backend
- Next.js API Routes
- Supabase (PostgreSQL)
- The Graph, Polymarket API

---

## Project Structure

```
truthbounty/
├── contracts/              # Solidity smart contracts
│   ├── src/core/
│   │   ├── TruthBountyCore.sol
│   │   ├── ReputationNFT.sol
│   │   ├── ScoreCalculator.sol
│   │   └── CopyTradingVault.sol
│   └── test/
│
├── frontend/               # Next.js application
│   ├── app/
│   │   ├── dashboard/
│   │   ├── markets/
│   │   ├── leaderboard/
│   │   ├── copy-trading/
│   │   └── api/
│   ├── components/
│   └── lib/
│
└── services/
    ├── indexer/            # Bet indexing service
    └── copy-trading/       # Copy trade executor
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- Git
- MetaMask wallet

### Installation

```bash
# Clone repository
git clone https://github.com/Leihyn/TruthBounty.git
cd TruthBounty

# Install frontend dependencies
cd frontend
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your keys

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Smart Contracts

```bash
cd contracts
forge install
forge test
```

---

## Smart Contracts

### Deployed Addresses (BNB Testnet)

| Contract | Address |
|----------|---------|
| TruthBountyCore | See `.env` |
| ReputationNFT | See `.env` |
| CopyTradingVault | `0xBf5341E79bc0507a16807C244b5267Ad8333a6ed` |

### Core Contracts

**TruthBountyCore.sol** - Main protocol coordinator
- User registration and profile management
- Score update orchestration

**ReputationNFT.sol** - Soulbound ERC-721
- Non-transferable by design
- Dynamic on-chain SVG metadata
- Tier-based visual evolution

**CopyTradingVault.sol** - Copy trading infrastructure
- Deposit/withdraw management
- Follow settings per trader
- Automated bet execution

---

## Supported Platforms

### PancakeSwap Prediction
- **Network:** BNB Smart Chain
- **Type:** BNB/USD price predictions
- **Round Duration:** 5 minutes
- **Integration:** The Graph + Direct betting

### Polymarket
- **Network:** Polygon
- **Type:** Event-based predictions
- **Markets:** Politics, Sports, Crypto
- **Integration:** REST API + Deep linking

---

## Copy Trading

### How It Works

1. **Deposit BNB** to the CopyTradingVault
2. **Follow traders** with custom settings:
   ```
   Allocation: 25%      (copy 25% of their bet size)
   Max Bet: 0.5 BNB     (cap per trade)
   ```
3. **Auto-execute** when leaders place bets
4. **Claim winnings** back to your wallet

### Simulation Mode

Test strategies without risking funds:
- Monitors mainnet leader activity
- Logs virtual trades to database
- Calculates hypothetical PnL

---

## Services

### Indexer Service
Tracks and indexes prediction bets:
- Backfills historical PancakeSwap data
- Calculates user statistics using Wilson Score
- Updates leaderboard rankings

### Copy Trading Service
Two modes:
- **Simulator:** Virtual trades, no gas
- **Executor:** Real on-chain copy trades

---

## API Reference

### Leaderboard
```
GET /api/leaderboard-db?sortBy=score&limit=100
```

### User Profile
```
GET /api/user/[address]
```

### Markets
```
GET /api/pancake-markets
GET /api/polymarket
```

---

## FAQ

**Q: Is my NFT transferable?**
A: No, it's soulbound (non-transferable) and tied to your wallet forever.

**Q: How often does my TruthScore update?**
A: After importing predictions or placing bets on integrated platforms.

**Q: Can I have multiple profiles?**
A: One profile per wallet address.

**Q: Is copy trading automated?**
A: Yes. Simulation mode logs virtual trades; execution mode copies on-chain.

---

## Contributing

Contributions welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built for the **Seedify Prediction Markets Hackathon** on BNB Chain.

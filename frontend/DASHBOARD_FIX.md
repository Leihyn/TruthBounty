# Dashboard Fix - Show ALL Platform Bets

## Problem

The dashboard was **only showing pending bets from 2 platforms**:
- ✅ PancakeSwap
- ✅ Polymarket
- ❌ Speed Markets (missing!)
- ❌ Overtime (missing!)
- ❌ Azuro (missing!)
- ❌ And 7 other platforms (missing!)

Even though you could place bets on all 12 platforms, only PancakeSwap and Polymarket bets appeared in the "Pending bets" section on the dashboard.

## Root Cause

The `useDashboardTrades` hook in `/lib/queries.ts` (line 810) was hardcoded to only fetch from:
1. `/api/copy-trading/simulation` (PancakeSwap)
2. `/api/polymarket/simulate` (Polymarket)

It completely ignored the other 10 platforms:
- Speed Markets
- Overtime
- Azuro
- SX Bet
- Limitless
- Drift
- Omen (Gnosis)
- Kalshi
- Manifold
- Metaculus

## Solution

### 1. Updated `PendingBet` Interface

**Before:**
```typescript
interface PendingBet {
  id: number;
  platform: 'pancakeswap' | 'polymarket'; // Only 2 platforms!
  market: string;
  position: string;
  amount: number;
  entryPrice?: number;
  timestamp: string;
}
```

**After:**
```typescript
interface PendingBet {
  id: number;
  platform: 'pancakeswap' | 'polymarket' | 'speedmarkets' | 'overtime' | 'azuro' | 'sxbet' | 'limitless' | 'drift' | 'gnosis' | 'kalshi' | 'manifold' | 'metaculus'; // All 12 platforms!
  market: string;
  position: string;
  amount: number;
  entryPrice?: number;
  timestamp: string;
  maturity?: string; // Added for time-based bets
  asset?: string;    // Added for Speed Markets (BTC/ETH)
}
```

### 2. Rewrote `useDashboardTrades` to Fetch ALL Platforms

**Before:**
```typescript
// Only PancakeSwap
const pancakeBetsRes = await fetch(`/api/copy-trading/simulation?follower=${address}`);

// Only Polymarket
const polyBetsRes = await fetch(`/api/polymarket/simulate?follower=${address}`);

const pendingBets = [...pancakePending, ...polyPending];
```

**After:**
```typescript
// All 12 platforms
const platforms = [
  { key: 'pancakeswap', endpoint: '/api/copy-trading/simulation' },
  { key: 'polymarket', endpoint: '/api/polymarket/simulate' },
  { key: 'speedmarkets', endpoint: '/api/speedmarkets/simulate' },
  { key: 'overtime', endpoint: '/api/overtime/simulate' },
  { key: 'azuro', endpoint: '/api/azuro/simulate' },
  { key: 'sxbet', endpoint: '/api/sxbet/simulate' },
  { key: 'limitless', endpoint: '/api/limitless/simulate' },
  { key: 'drift', endpoint: '/api/drift/simulate' },
  { key: 'gnosis', endpoint: '/api/gnosis/simulate' },
  { key: 'kalshi', endpoint: '/api/kalshi/simulate' },
  { key: 'manifold', endpoint: '/api/manifold/simulate' },
  { key: 'metaculus', endpoint: '/api/metaculus/simulate' },
];

// Fetch all in parallel
await Promise.all(
  platforms.map(async ({ key, endpoint }) => {
    const res = await fetch(`${endpoint}?follower=${address}&limit=50`);
    // ... map pending bets
  })
);
```

### 3. Platform-Specific Mapping

Each platform has different data structures, so we added custom mapping for each:

```typescript
switch (key) {
  case 'pancakeswap':
    bet.market = `Epoch ${t.epoch}`;
    bet.position = t.isBull ? 'Bull' : 'Bear';
    bet.amount = parseFloat(t.amountBNB || '0');
    break;

  case 'speedmarkets':
    bet.market = `${t.asset} ${t.direction}`; // "BTC UP"
    bet.position = t.direction; // "UP" or "DOWN"
    bet.amount = parseFloat(t.amountUsd || '0');
    bet.maturity = t.maturity;
    bet.asset = t.asset; // "BTC" or "ETH"
    bet.entryPrice = parseFloat(t.strikePrice || '0');
    break;

  case 'overtime':
    bet.market = `${t.homeTeam} vs ${t.awayTeam}`;
    bet.position = t.outcomeLabel; // "Home", "Away", "Draw"
    bet.amount = parseFloat(t.amountUsd || '0');
    bet.maturity = t.maturity;
    break;

  // ... and so on for all 12 platforms
}
```

## Files Changed

### `/lib/queries.ts`
- **Line 632-640**: Updated `PendingBet` interface to support all 12 platforms
- **Line 807-950**: Completely rewrote `useDashboardTrades` to fetch from all platforms in parallel

### `/app/dashboard/page.tsx`
- **Line 268-276**: Updated `PendingBet` interface to match

## How It Works Now

### Dashboard Data Flow

1. **User loads dashboard** → `useDashboardTrades` hook is called
2. **Fetches pending bets** from ALL 12 platforms in parallel
3. **Maps each platform's data** to the common `PendingBet` format
4. **Combines all pending bets** into a single array
5. **Sorts by timestamp** (most recent first)
6. **Displays in "Pending bets" section** on dashboard

### Example Output

Dashboard now shows:
```
Pending bets (5)

[PancakeSwap] Epoch 12345 • Bull • 0.05 BNB
[Speed Markets] BTC UP • $50 • Strike: $95,000
[Polymarket] Will AGI be achieved by 2030? • No • $200 @ 0.65
[Overtime] Lakers vs Warriors • Home • $100
[Azuro] Real Madrid vs Barcelona • Away • $75
```

## Statistics Integration

The dashboard stats (Total Pending, Win Rate, etc.) already used `useAllPlatformStats`, which correctly fetches from all platforms. The issue was ONLY with the "Pending bets" list display.

Now everything is aligned:
- ✅ **Stats cards** show aggregated data from all 12 platforms
- ✅ **Pending bets list** shows bets from all 12 platforms
- ✅ **Recent trades** show resolved bets from all 12 platforms
- ✅ **Resolve button** resolves bets across all 12 platforms

## Testing

### Before Fix:
1. Place a Speed Markets bet → ❌ Doesn't appear on dashboard
2. Dashboard shows "Pending: 0" → ❌ Even though you have pending bets
3. Can only see Speed Markets bets on `/speed-markets` page

### After Fix:
1. Place a Speed Markets bet → ✅ Appears on dashboard immediately
2. Dashboard shows "Pending: 1" → ✅ Correctly counted
3. Bet is visible in both dashboard AND `/speed-markets` page
4. Clicking resolve on dashboard → ✅ Resolves the Speed Markets bet

## Performance

- **Parallel Fetching**: All 12 platforms are fetched concurrently using `Promise.all`
- **30s Polling**: Dashboard auto-refreshes every 30 seconds to show new/resolved bets
- **Error Handling**: If one platform API fails, others still load successfully
- **Caching**: React Query caches results to avoid duplicate requests

## What's Next

### Recommended Enhancements:

1. **Platform Filter** - Add dropdown to filter by platform
   ```typescript
   <Select>
     <option value="all">All Platforms</option>
     <option value="speedmarkets">Speed Markets</option>
     <option value="pancakeswap">PancakeSwap</option>
     // ... etc
   </Select>
   ```

2. **Platform Badges** - Color-code each platform
   ```typescript
   <Badge className={PLATFORM_COLORS[bet.platform]}>
     {bet.platform}
   </Badge>
   ```

3. **Maturity Countdown** - Show time remaining for Speed Markets/Overtime bets
   ```typescript
   {bet.maturity && (
     <span>{formatTimeRemaining(bet.maturity)}</span>
   )}
   ```

4. **Grouped View** - Group pending bets by platform
   ```typescript
   {platformsWithBets.map(platform => (
     <div key={platform}>
       <h3>{platform}</h3>
       {betsForPlatform(platform).map(...)}
     </div>
   ))}
   ```

## Summary

✅ **Fixed**: Dashboard now shows pending bets from ALL 12 platforms
✅ **Fixed**: Speed Markets bets now appear on dashboard
✅ **Fixed**: All platform bets can be resolved from dashboard
✅ **Improved**: Parallel fetching for better performance
✅ **Improved**: Better data mapping for each platform
✅ **Improved**: Type safety with updated interfaces

**Result**: The dashboard is now the **central hub** for viewing and managing bets across all platforms, just as it should be!

## Deployment

**Commit**: `fb427ee` - "Fix dashboard to show pending bets from ALL 12 platforms"

**Status**:
- ✅ Committed to GitHub
- ✅ Pushed to main branch
- 🔄 Deploying to Vercel
- ⏳ Will be live on https://truthbounty.xyz shortly

**Local**: Changes are already live on http://localhost:3003

# Mock Jupiter Service for Devnet Testing

## Overview

The Mock Jupiter Service simulates the Jupiter DEX aggregator for devnet testing without requiring real Jupiter API calls or mainnet funds. This allows full UI testing with realistic behavior.

## Features

### ✅ Realistic Price Simulation
- Base prices for common tokens (SOL, USDC, mSOL, etc.)
- ±2% random volatility to simulate market movements
- Prices change on each quote request

### ✅ Slippage Calculation
- Dynamic slippage based on trade size and simulated liquidity
- Larger trades = higher price impact
- Caps at 5% maximum slippage

### ✅ Transaction Building
- Creates valid Solana transactions
- Requires real wallet signatures (via Phantom)
- Transactions are NOT submitted to blockchain (safe testing)

### ✅ Execution Simulation
- 2-4 second delays to simulate blockchain confirmations
- 95% success rate (5% random failures for testing error handling)
- Returns mock transaction signatures (prefixed with `MOCK`)

### ✅ Full UI Flow Support
- Quote generation
- Transaction preview
- Wallet signing
- Confirmation display
- Error handling

## Usage

### Automatic Detection

The system automatically uses mock mode when:
- `cluster` parameter is set to `'devnet'`
- Environment variable `USE_MOCK_JUPITER=true`

```typescript
import { executeJupiterSwap } from '@/lib/solana/jupiterSwapWithMock';

const result = await executeJupiterSwap(
  {
    inputMint: 'So11111111111111111111111111111111111111112', // SOL
    outputMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // USDC devnet
    amount: 1000000, // 0.001 SOL (in lamports)
    slippageBps: 50, // 0.5% slippage tolerance
    userPublicKey: walletPublicKey,
    cluster: 'devnet', // Triggers mock mode
  },
  phantomProvider // For signing
);
```

### Manual Mock Service Usage

```typescript
import { getMockJupiterQuote, getMockJupiterSwap } from '@/lib/solana/mockJupiterService';

// Get a quote
const quote = await getMockJupiterQuote({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  amount: '1000000',
  slippageBps: 50,
});

console.log('Expected output:', quote.outAmount);
console.log('Price impact:', quote.priceImpactPct);

// Build swap transaction
const swapTx = await getMockJupiterSwap({
  quoteResponse: quote,
  userPublicKey: wallet.publicKey.toString(),
});
```

## Mock Price Database

Current simulated prices (in USDC):

| Token | Symbol | Price (USDC) | Liquidity |
|-------|--------|--------------|-----------|
| So111...112 | SOL/WSOL | $150 | High |
| 4zMMC...DncDU | USDC | $1 | Very High |
| mSoL | mSOL | $160 | Medium |

Prices fluctuate ±2% on each request to simulate real market conditions.

## Mock vs Real Behavior

| Feature | Mock Mode | Real Jupiter API |
|---------|-----------|------------------|
| **Network** | Devnet | Mainnet only |
| **Cost** | Free | Real SOL fees |
| **Quotes** | Simulated | Real market data |
| **Execution** | Simulated (no on-chain TX) | Real blockchain transaction |
| **Funds** | No risk | Real funds at risk |
| **Signature Required** | Yes (for testing UX) | Yes |
| **Confirmation Time** | 2-4 seconds (simulated) | 0.4-2 seconds (real) |
| **Success Rate** | 95% (with random failures) | Network-dependent |

## UI Indicators

### Mock Mode Banner

When in mock mode, a prominent banner displays:

```
🎭 Mock Mode Active

You're using simulated Jupiter swaps for devnet testing.
- Quotes are generated with realistic price movements
- Transactions require real signatures but aren't submitted to blockchain
- Mock confirmations simulate 2-4 second blockchain delays
- No real funds are at risk
```

### Toast Notifications

Mock swaps show:
```
🎭 Mock Swap Confirmed
Signature: MOCK1730912345abc...
Output: 149.85 USDC
```

## Testing Scenarios

### 1. Successful Swap
```typescript
// 95% chance of success
const result = await executeJupiterSwap({ ... });
// result.success === true
// result.signature === "MOCK..."
```

### 2. Failed Swap (Random)
```typescript
// 5% chance of simulated failure
const result = await executeJupiterSwap({ ... });
// result.success === false
// result.error === "Simulated transaction failure..."
```

### 3. Invalid Configuration
```typescript
// Same input and output token
const result = await executeJupiterSwap({
  inputMint: 'So111...',
  outputMint: 'So111...', // Same!
  ...
});
// result.success === false
// result.error === "Input and output tokens must be different"
```

## Configuration

### Environment Variables

Create `.env.local`:

```env
# Force mock mode even on mainnet (for testing)
USE_MOCK_JUPITER=true

# Or let it auto-detect based on cluster parameter
```

### Customizing Mock Prices

Edit `client/src/lib/solana/mockJupiterService.ts`:

```typescript
const MOCK_PRICES: Record<string, number> = {
  'So11111111111111111111111111111111111111112': 150.0, // SOL
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU': 1.0,   // USDC
  // Add your tokens here
  'YourTokenMint...': 50.0,
};
```

### Adjusting Volatility

```typescript
// In mockJupiterService.ts
const PRICE_VOLATILITY = 0.02; // ±2% (change as needed)
```

### Changing Success Rate

```typescript
// In simulateMockSwapExecution()
const success = Math.random() > 0.05; // 95% success (adjust threshold)
```

## Development Workflow

### Phase 1: UI Development (Mock Mode)
1. Build and test UI flows with mock service
2. Test error handling and edge cases
3. Verify wallet integration and signing flow
4. Iterate quickly without mainnet costs

### Phase 2: Integration Testing (Still Mock)
5. Test end-to-end workflows
6. Measure performance and UX
7. Validate observability and logging

### Phase 3: Mainnet Validation (Real API)
8. Switch Phantom to mainnet
9. Change `cluster: 'mainnet'` in code
10. Test with small amounts (0.01-0.1 SOL)
11. Verify real Jupiter integration

## Switching to Mainnet

To use real Jupiter API:

1. **Update Phantom wallet**: Settings → Change Network → Mainnet-Beta
2. **Get mainnet SOL**: Buy 0.1-0.2 SOL from exchange
3. **Update code**:
   ```typescript
   const result = await executeJupiterSwap({
     ...params,
     cluster: 'mainnet', // Changed from 'devnet'
   }, phantomProvider);
   ```

4. **Verify in logs**: Should see "Using REAL service" instead of "Using MOCK service"

## Troubleshooting

### Mock mode not activating
- Check `cluster` parameter is set to `'devnet'`
- Verify `shouldUseMockJupiter()` returns `true`
- Check browser console for "Using MOCK service" log

### Signatures not validating
- Mock signatures are for display only
- They won't validate on-chain (by design)
- This is normal and expected behavior

### Want to test real devnet transactions?
Jupiter API doesn't support devnet. Options:
1. Use mock mode (recommended)
2. Switch to mainnet with small amounts
3. Set up local Solana test validator (complex)

## Files

- `client/src/lib/solana/mockJupiterService.ts` - Core mock service
- `client/src/lib/solana/jupiterSwapWithMock.ts` - Unified swap interface
- `client/src/components/MockModeBanner.tsx` - UI banner component
- `client/src/components/WorkflowCanvas.tsx` - Integration point

## Benefits

✅ **Zero Cost**: Test without spending real SOL  
✅ **Fast Iteration**: No blockchain delays  
✅ **Safe**: No risk of losing funds  
✅ **Realistic**: Simulates real behavior accurately  
✅ **Error Testing**: Built-in failure scenarios  
✅ **Full UX**: Complete wallet signing flow  

## Limitations

❌ **Not Real Blockchain**: Transactions aren't on-chain  
❌ **Simplified Routing**: Single-hop swaps only  
❌ **Static Liquidity**: Doesn't reflect real pool states  
❌ **No MEV**: No front-running or sandwich attacks  

Perfect for development and testing, but always validate on mainnet before production!

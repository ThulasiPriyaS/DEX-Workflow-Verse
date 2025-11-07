# Wallet Balance Update System

## Overview
The WalletBalance component provides a simulated wallet balance display that updates automatically after swaps are executed. This creates a realistic user experience without requiring actual blockchain transactions.

## How It Works

### 1. Balance Storage
- Balances are stored in browser's `localStorage` per wallet address
- Default balances initialized on first connect:
  - SOL: 1.5
  - USDC: 100
  - USDT: 50

### 2. Balance Updates
When a swap is executed, the WorkflowCanvas dispatches a custom event:

```typescript
const balanceUpdateEvent = new CustomEvent('walletBalanceUpdate', {
  detail: {
    fromToken: 'SOL',     // Token being swapped from
    toToken: 'USDC',      // Token being swapped to
    fromAmount: '0.5',    // Amount sent
    toAmount: '50.25',    // Amount received
  }
});
window.dispatchEvent(balanceUpdateEvent);
```

### 3. WalletBalance Component
The `WalletBalance` component listens for these events and updates the displayed balances:

```typescript
// Listens for balance updates
window.addEventListener('walletBalanceUpdate', handleBalanceUpdate);

// Updates balances by:
// 1. Deducting fromAmount from fromToken
// 2. Adding toAmount to toToken
// 3. Saving updated balances to localStorage
```

## Usage

### Adding Balance Display to a Page

```typescript
import { WalletBalance } from '@/components/WalletBalance';

function MyPage() {
  return (
    <div>
      <WalletBalance />
      {/* Rest of your page */}
    </div>
  );
}
```

### Triggering Balance Updates

After any swap or token transfer operation:

```typescript
// Dispatch the update event
const balanceUpdateEvent = new CustomEvent('walletBalanceUpdate', {
  detail: {
    fromToken: inputSymbol,
    toToken: outputSymbol,
    fromAmount: inputAmount,
    toAmount: outputAmount,
  }
});
window.dispatchEvent(balanceUpdateEvent);
```

## Component Features

- **Auto-persistence**: Balances saved to localStorage automatically
- **Per-wallet**: Each connected wallet has its own balance state
- **Real-time updates**: Balance updates immediately on swap confirmation
- **Wallet address display**: Shows truncated wallet address below balances

## Integration Points

1. **WorkflowCanvas** (`client/src/components/WorkflowCanvas.tsx`)
   - Dispatches balance update events after successful swaps

2. **WalletBalance** (`client/src/components/WalletBalance.tsx`)
   - Listens for events and updates display
   - Manages localStorage persistence

3. **Transaction Details Page** (`client/src/pages/transaction-details.tsx`)
   - Shows swap details after transaction
   - Balances already updated when user arrives on this page

## Example Flow

1. User initiates swap: 0.5 SOL → USDC
2. Phantom confirms transaction
3. WorkflowCanvas dispatches `walletBalanceUpdate` event
4. WalletBalance component:
   - Deducts 0.5 from SOL balance
   - Adds received amount to USDC balance
   - Saves to localStorage
5. User navigated to transaction details page
6. Balance display reflects new balances

## Notes

- **Mock Mode**: This is a simulated balance system for devnet testing
- **Persistence**: Balances persist across page reloads via localStorage
- **Reset**: Clear localStorage or disconnect/reconnect wallet to reset balances
- **Real Phantom**: The actual Phantom wallet will NOT show these simulated balances - this is purely a UI feature in the app

## Future Enhancements

Potential improvements:
- Fetch real on-chain balances when available
- Add animation for balance changes
- Show transaction history
- Support more tokens dynamically
- Add balance refresh button

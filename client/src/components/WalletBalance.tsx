import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useWallet } from '@/pages/home';

interface TokenBalance {
  symbol: string;
  amount: number;
  mint: string;
}

export function WalletBalance() {
  const { wallet } = useWallet();
  const [balances, setBalances] = useState<TokenBalance[]>([]);

  useEffect(() => {
    if (!wallet?.address) {
      setBalances([]);
      return;
    }

    // Initialize with default balances
    const defaultBalances: TokenBalance[] = [
      { symbol: 'SOL', amount: 1.5, mint: 'So11111111111111111111111111111111111111112' },
      { symbol: 'USDC', amount: 100, mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
      { symbol: 'USDT', amount: 50, mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
    ];

    // Load balances from localStorage
    const stored = localStorage.getItem(`wallet_balances_${wallet.address}`);
    if (stored) {
      setBalances(JSON.parse(stored));
    } else {
      // Set default balances
      setBalances(defaultBalances);
      localStorage.setItem(`wallet_balances_${wallet.address}`, JSON.stringify(defaultBalances));
    }

    // Listen for balance updates
    const handleBalanceUpdate = (event: CustomEvent) => {
      const { fromToken, toToken, fromAmount, toAmount } = event.detail;
      
      setBalances(prev => {
        const updated = [...prev];
        
        // Deduct from token
        const fromIndex = updated.findIndex(b => b.symbol === fromToken);
        if (fromIndex !== -1) {
          updated[fromIndex] = {
            ...updated[fromIndex],
            amount: Math.max(0, updated[fromIndex].amount - parseFloat(fromAmount))
          };
        }
        
        // Add to token
        const toIndex = updated.findIndex(b => b.symbol === toToken);
        if (toIndex !== -1) {
          updated[toIndex] = {
            ...updated[toIndex],
            amount: updated[toIndex].amount + parseFloat(toAmount)
          };
        }
        
        // Save to localStorage
        localStorage.setItem(`wallet_balances_${wallet.address}`, JSON.stringify(updated));
        
        return updated;
      });
    };

    window.addEventListener('walletBalanceUpdate' as any, handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('walletBalanceUpdate' as any, handleBalanceUpdate);
    };
  }, [wallet?.address]);

  if (!wallet?.address) {
    return null;
  }

  return (
    <Card className="p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">💰 Wallet Balance</h3>
      <div className="space-y-2">
        {balances.map((balance) => (
          <div key={balance.mint} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="text-sm font-medium">{balance.symbol}</span>
            <span className="text-sm font-mono font-semibold">{balance.amount.toFixed(4)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Wallet: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
        </p>
        <p className="text-xs text-green-600 mt-1">
          ✓ Updates after each swap
        </p>
      </div>
    </Card>
  );
}

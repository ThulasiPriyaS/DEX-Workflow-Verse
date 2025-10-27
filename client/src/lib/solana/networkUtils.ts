import { Connection, clusterApiUrl } from "@solana/web3.js";

// Network utilities for Solana - Force devnet only
export async function detectWalletNetwork() {
  try {
    const provider: any = (window as any)?.solana;
    if (!provider?.isPhantom) {
      return 'no-wallet';
    }

    // Force devnet detection - be more strict about mainnet detection
    const devnetConnection = new Connection(clusterApiUrl("devnet"));
    
    if (provider.publicKey) {
      const publicKey = provider.publicKey;
      
      try {
        // Check if wallet has any devnet activity
        const devnetAccount = await devnetConnection.getAccountInfo(publicKey);
        console.log('Devnet account info:', devnetAccount);
        
        // If wallet has devnet SOL, assume devnet
        if (devnetAccount && devnetAccount.lamports > 0) {
          console.log('✅ Wallet has devnet SOL:', devnetAccount.lamports / 1e9, 'SOL');
          return 'devnet';
        }
        
        // If no devnet activity, assume mainnet (safer assumption)
        console.log('⚠️ No devnet activity found - likely mainnet wallet');
        return 'mainnet';
        
      } catch (e) {
        console.log('Devnet check failed:', e);
        return 'mainnet'; // Assume mainnet if devnet check fails
      }
    }
    
    return 'unknown';
  } catch (error) {
    console.error('Network detection failed:', error);
    return 'mainnet'; // Default to mainnet for safety
  }
}

export async function showNetworkWarning() {
  const network = await detectWalletNetwork();
  
  if (network === 'mainnet' || network === 'unknown') {
    console.error('🚨 BLOCKING TRANSACTION: Wallet appears to be on MAINNET or unknown network');
    console.error('🔧 REQUIRED: Switch Phantom to DEVNET:');
    console.error('   1. Open Phantom Settings');
    console.error('   2. Change Network → Devnet');
    console.error('   3. Get devnet SOL from faucet');
    console.error('   4. Refresh and try again');
    return false; // Block transaction
  }
  
  if (network === 'devnet') {
    console.log('✅ Devnet confirmed - safe to proceed');
    return true;
  }
  
  console.warn(`🌐 Network detection: ${network} - blocking for safety`);
  return false; // Block by default
}

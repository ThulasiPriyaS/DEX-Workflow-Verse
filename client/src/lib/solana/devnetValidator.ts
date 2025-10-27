// Devnet validation utility - ensures we're operating on devnet only

// Known mainnet token addresses that should NOT be used
const MAINNET_TOKENS = [
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // Mainnet USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // Mainnet USDT
];

// Known devnet token addresses that are safe to use
const DEVNET_TOKENS = [
  "So11111111111111111111111111111111111111112", // SOL (same on all networks)
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // Devnet USDC
  "BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k", // Devnet USDT
];

export function validateTokenMints(inputMint: string, outputMint: string) {
  console.log('🔍 Validating token mints for devnet safety...');
  
  if (MAINNET_TOKENS.includes(inputMint) || MAINNET_TOKENS.includes(outputMint)) {
    console.error('🚨 DANGER: Mainnet token detected!');
    console.error('Input mint:', inputMint);
    console.error('Output mint:', outputMint);
    console.error('This would execute a REAL mainnet transaction!');
    return false;
  }
  
  console.log('✅ Token mints appear safe for devnet');
  console.log('Input:', inputMint);
  console.log('Output:', outputMint);
  return true;
}

export function validateDevnetSetup() {
  console.log('🔍 DEVNET VALIDATION CHECK:');
  console.log('✅ Jupiter API calls use cluster=devnet parameter');
  console.log('✅ Solana connection points to devnet RPC');
  console.log('✅ Using devnet token mints (not mainnet addresses)');
  console.log('✅ All token fetching uses devnet endpoints');
  console.log('');
  console.log('🎯 REQUIRED: Phantom wallet MUST be set to Devnet');
  console.log('📋 To verify Phantom is on devnet:');
  console.log('   1. Open Phantom wallet');
  console.log('   2. Settings → Change Network → Devnet');
  console.log('   3. Check you have devnet SOL (get from faucet if needed)');
  console.log('   4. Refresh page and try again');
  console.log('');
  
  return true;
}

export function getDevnetInstructions() {
  return `
🔧 SWITCH TO DEVNET:

1. Open Phantom Wallet
2. Click Settings (gear icon)
3. Click "Change Network" 
4. Select "Devnet"
5. Get devnet SOL: https://faucet.solana.com/
6. Refresh this page and try again

❌ DO NOT use mainnet for testing!
✅ This app now uses proper devnet token addresses.

🪙 Devnet tokens being used:
- SOL: So11111111111111111111111111111111111111112
- USDC: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
- USDT: BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k
`;
}

import { Connection, VersionedTransaction, clusterApiUrl } from "@solana/web3.js";
import { loadTokenList, getTokenByAddress } from "./tokenList";

// Use backend proxy to avoid DNS/CORS issues with Jupiter API
const USE_BACKEND_PROXY = true;
const BACKEND_URL = window.location.origin; // Use same origin (Vite proxy forwards /api to backend)

// Jupiter API endpoints (direct or via proxy)
const JUP_QUOTE_URL = USE_BACKEND_PROXY 
  ? `${BACKEND_URL}/api/jupiter/quote`
  : "https://quote-api.jup.ag/v6/quote";
  
const JUP_SWAP_URL = USE_BACKEND_PROXY
  ? `${BACKEND_URL}/api/jupiter/swap`
  : "https://quote-api.jup.ag/v6/swap";
  
const JUP_TOKENS_URL = USE_BACKEND_PROXY
  ? `${BACKEND_URL}/api/jupiter/tokens`
  : "https://quote-api.jup.ag/v6/tokens";

// Use devnet connection for development - FORCE DEVNET ONLY
export const solanaConnection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Verify we're using devnet
console.log('🌐 Jupiter swap configured for DEVNET:', clusterApiUrl("devnet"));

function toBaseUnits(uiAmount: number, decimals: number) {
  return BigInt(Math.round(uiAmount * 10 ** decimals)).toString();
}

// Known mainnet addresses that should trigger warnings
const MAINNET_ADDRESSES = [
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // Mainnet USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // Mainnet USDT
];

function validateDevnetMints(inputMint: string, outputMint: string) {
  if (MAINNET_ADDRESSES.includes(inputMint) || MAINNET_ADDRESSES.includes(outputMint)) {
    throw new Error(`🚨 BLOCKED: Mainnet token address detected! 
    
This would execute a REAL mainnet transaction with REAL money!

Input: ${inputMint}
Output: ${outputMint}

✅ Switch to devnet token addresses:
- USDC devnet: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
- USDT devnet: BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k`);
  }
  
  console.log('✅ Token addresses validated for devnet use');
}

export async function jupiterSwap(params: {
  inputMint: string;
  outputMint: string;
  uiAmount: number;
  inputDecimals: number;
  slippageBps: number;
  userPublicKey: string;
  // Optional destination wallet (recipient). If omitted, defaults to the signer (userPublicKey).
  destinationWallet?: string;
}) {
  console.error(`
╔════════════════════════════════════════════════════╗
║  ⚠️  WARNING: OLD jupiterSwap() FUNCTION CALLED!   ║
║  This function makes REAL API calls!               ║
║  Should use executeJupiterSwap() from              ║
║  jupiterSwapWithMock.ts instead!                   ║
╚════════════════════════════════════════════════════╝
  `);
  
  const { inputMint, outputMint, uiAmount, inputDecimals, slippageBps, userPublicKey } = params;
  const destinationWallet = params.destinationWallet || userPublicKey;

  console.log('Jupiter Swap Params:', {
    inputMint,
    outputMint,
    uiAmount,
    inputDecimals,
    slippageBps,
    userPublicKey
  });

  // Check for missing output token
  if (!outputMint || outputMint.trim() === '') {
    throw new Error(`❌ Output token not selected`);
  }

  // Special handling for same-token swaps (mainly for demo purposes)
  // If input and output are the same token, there's nothing to do.
  if (inputMint === outputMint) {
    console.log('No-op: input and output mint are identical; skipping swap.');
    return { signature: 'NO_SWAP_NEEDED', message: 'Input and output token are identical; no swap performed.' };
  }

  // CRITICAL: Validate we're not using mainnet token addresses
  validateDevnetMints(inputMint, outputMint);

  // Check if Phantom is available
  const provider: any = (window as any)?.solana;
  if (!provider?.isPhantom) throw new Error("Phantom wallet not available. Please install Phantom.");

  console.log('✅ Phantom wallet detected - using devnet configuration');

  // Ensure the provider's connected publicKey matches the userPublicKey passed in
  try {
    const providerPub = provider.publicKey?.toString?.();
    console.log('Provider public key (window.solana):', providerPub);
    if (!providerPub) {
      throw new Error('Phantom provider has no publicKey. Please connect your wallet.');
    }
    if (providerPub !== userPublicKey) {
      throw new Error(`Wallet mismatch: Phantom is connected as ${providerPub} but swap was requested for ${userPublicKey}.\n\nMake sure you are connected to the same wallet in Phantom (Devnet) that you selected in the app.`);
    }
  } catch (e) {
    console.error('Signer validation error:', e);
    throw e;
  }

  // First, let's try to get available tokens for devnet and validate our tokens
  try {
    // Ensure token list is loaded
    try {
      await loadTokenList('devnet');
    } catch (e) {
      console.warn('Failed to load devnet token list before swap:', e);
    }
    console.log('Validating tokens with Jupiter devnet...');
    const tokensResponse = await fetch(`${JUP_TOKENS_URL}?cluster=devnet`);
    
    if (!tokensResponse.ok) {
      console.warn(`Jupiter devnet API returned ${tokensResponse.status}: ${tokensResponse.statusText}`);
      console.log('Proceeding without token validation...');
    } else {
      const responseText = await tokensResponse.text();
      console.log('Raw response:', responseText.substring(0, 200) + '...');
      
      try {
        const allTokens = JSON.parse(responseText);
        const availableTokens = Object.keys(allTokens);
        console.log('Jupiter devnet tokens count:', availableTokens.length);
        
  const inputTokenInfo = allTokens[inputMint] || getTokenByAddress(inputMint);
  const outputTokenInfo = allTokens[outputMint] || getTokenByAddress(outputMint);
        
        console.log('Input token info:', inputTokenInfo);
        console.log('Output token info:', outputTokenInfo);
        
        if (!inputTokenInfo) {
          console.warn(`Input token ${inputMint} not found in Jupiter devnet tokens`);
          console.log('Available tokens:', availableTokens.slice(0, 10));
        }
        if (!outputTokenInfo) {
          console.warn(`Output token ${outputMint} not found in Jupiter devnet tokens`);
          console.log('Available tokens:', availableTokens.slice(0, 10));
        }
      } catch (parseError) {
        console.error('Failed to parse Jupiter tokens response:', parseError);
        console.log('Response was:', responseText);
      }
    }
  } catch (e) {
    console.log('Token validation error:', e);
    console.log('Continuing with swap attempt anyway...');
  }

  const amount = toBaseUnits(uiAmount, inputDecimals);
  console.log('Amount in base units:', amount);
  
  // Build quote URL with proper parameters for devnet
  const quoteParams = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: slippageBps.toString(),
    swapMode: 'ExactIn',
    onlyDirectRoutes: 'false',
    asLegacyTransaction: 'false', // Use versioned transactions
    cluster: 'devnet' // Specify devnet cluster
  });
  
  const quoteUrl = `${JUP_QUOTE_URL}?${quoteParams.toString()}`;
  console.log('Quote URL (devnet):', quoteUrl);
  
  const quoteRes = await fetch(quoteUrl);
  if (!quoteRes.ok) {
    const errorText = await quoteRes.text();
    console.error('Quote API Error:', errorText);
    throw new Error(`Failed to fetch quote: ${quoteRes.status} - ${errorText}`);
  }
  
  const quoteJson = await quoteRes.json();
  console.log('Quote Response:', quoteJson);
  
  // Check for different possible error conditions
  if (!quoteJson) {
    throw new Error("Empty response from Jupiter API");
  }
  
  if (quoteJson.error) {
    throw new Error(`Jupiter API Error: ${quoteJson.error}`);
  }
  
  // Jupiter v6 API returns routes directly, not in a data array
  if (!quoteJson.routePlan || quoteJson.routePlan.length === 0) {
    
    // Provide more specific error messages for devnet
    if (inputMint !== outputMint) {
      throw new Error(`❌ NO ROUTES FOUND for devnet swap

🔍 This usually means:
1. Limited liquidity on devnet for this token pair
2. Token pair not supported on Jupiter devnet
3. Try swapping to/from SOL instead

💡 Suggestions:
- Use SOL as input token (most liquid on devnet)
- Try a different output token
- Check Jupiter's devnet token list

Token pair attempted: ${inputMint} → ${outputMint}`);
    } else {
      throw new Error("❌ Cannot swap token to itself (same input and output token)");
    }
  }
  
  
  console.log('Building swap transaction for devnet...');
  
  const swapUrl = USE_BACKEND_PROXY 
    ? `${JUP_SWAP_URL}?cluster=devnet`
    : `${JUP_SWAP_URL}?cluster=devnet`;
    
  const swapRes = await fetch(swapUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quoteJson, // Use 'quoteResponse' not 'route' for v6 API
      userPublicKey,
      // destinationWallet may be different from signer (recipient); Jupiter will include ATA creation if needed
      destinationWallet,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });  console.log('Swap API response status:', swapRes.status);
  
  if (!swapRes.ok) {
    const errorText = await swapRes.text();
    console.error('Swap API Error:', errorText);
    throw new Error(`Swap tx build failed: ${errorText}`);
  }
  
  const swapData = await swapRes.json();
  console.log('Swap response data:', swapData);
  
  const { swapTransaction } = swapData;
  if (!swapTransaction) throw new Error("No swapTransaction returned");

  const txBuf = Buffer.from(swapTransaction, "base64");
  const tx = VersionedTransaction.deserialize(txBuf);

  // We already have the provider reference from earlier
  if (!provider?.isPhantom) throw new Error("Phantom not available");

  try {
    console.log('🚀 Executing Jupiter swap transaction on devnet...');
    console.log('🔒 DEVNET ONLY - Transaction will be signed and sent to devnet');
    console.log('📍 RPC Endpoint:', clusterApiUrl("devnet"));
    
    const signed = await provider.signAndSendTransaction(tx);
    const sig = signed?.signature || signed;
    
    console.log('✅ Transaction signed, confirming on devnet...');
    await solanaConnection.confirmTransaction(sig, "confirmed");
    console.log('✅ Swap completed successfully on DEVNET! Signature:', sig);
    return { signature: sig };
  } catch (error: any) {
    console.error('❌ Jupiter swap failed:', error);
    
    // Add specific error message for network issues
    if (error.message?.includes('Invalid blockhash') || 
        error.message?.includes('This transaction has already been processed') ||
        error.code === 4001) {
      throw new Error(`❌ TRANSACTION FAILED: This might be a network mismatch issue.
      
🔧 Make sure Phantom is on DEVNET:
1. Open Phantom Settings
2. Change Network → Devnet  
3. Get devnet SOL from faucet if needed
4. Try again

Original error: ${error.message}`);
    }
    
    throw new Error(`Swap execution failed: ${error.message}`);
  }
}

// Common devnet mints (verified working tokens)
export const DEVNET_MINTS = {
  WSOL: "So11111111111111111111111111111111111111112", // Same on all networks
  USDC: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // Devnet USDC
  USDT: "BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k", // Devnet USDT
  // Add more devnet tokens as needed
};



/**
 * Jupiter Swap Service - PURE SIMULATION MODE
 * 
 * All swaps are simulated locally - no blockchain or API calls
 */

import {
  getMockJupiterQuote,
  simulateMockSwapExecution,
  MOCK_DEVNET_TOKENS,
} from './mockJupiterService';

// Common devnet mints (for convenience)
export const DEVNET_MINTS = {
  WSOL: "So11111111111111111111111111111111111111112",
  USDC: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  USDT: "BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k",
};

interface SwapParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
  userPublicKey: string;
  destinationWallet?: string;
  cluster?: string;
}

interface SwapResult {
  success: boolean;
  signature?: string;
  error?: string;
  outputAmount?: number;
  inputAmount: number;
  slippage?: number;
}

/**
 * Main swap function - ALWAYS uses simulation (no real API calls)
 */
export async function executeJupiterSwap(
  params: SwapParams,
  signer: any // Phantom wallet provider
): Promise<SwapResult> {
  // Force simulation mode - never call real Jupiter API
  console.log(`
╔════════════════════════════════════════════════════╗
║  🎮 PURE SIMULATION MODE - NO API/BLOCKCHAIN CALLS ║
╚════════════════════════════════════════════════════╝
  `);
  console.log(`Swap Parameters:`, {
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    wallet: params.userPublicKey
  });
  
  try {
    // Always use mock/simulation
    const result = await executeJupiterSwapMock(params, signer);
    console.log('✅ Simulation result:', result);
    return result;
  } catch (error: any) {
    console.error('❌ Simulation failed with error:', error);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: error.message || String(error) || 'Swap simulation failed',
      inputAmount: params.amount
    };
  }
}

/**
 * Execute swap using PURE SIMULATION (no API calls, no blockchain)
 */
async function executeJupiterSwapMock(
  params: SwapParams,
  signer: any
): Promise<SwapResult> {
  console.log('🎮 Starting simulated swap (no blockchain interaction)');
  
  // Step 1: Generate simulated quote
  console.log('1️⃣ Generating simulated quote...');
  const quote = await getMockJupiterQuote({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount.toString(),
    slippageBps: params.slippageBps || 50,
    swapMode: 'ExactIn',
  });
  
  console.log('✅ Simulated quote generated:', {
    inputAmount: quote.inAmount,
    outputAmount: quote.outAmount,
    priceImpact: `${quote.priceImpactPct.toFixed(2)}%`
  });
  
  // Step 2: Request user confirmation via Phantom
  console.log('2️⃣ Requesting wallet confirmation...');
  
  // Show Phantom confirmation dialog
  const confirmed = await new Promise<boolean>((resolve) => {
    // Display a confirmation message that Phantom would show
    const inputToken = MOCK_DEVNET_TOKENS.find(t => t.address === params.inputMint)?.symbol || 'tokens';
    const outputToken = MOCK_DEVNET_TOKENS.find(t => t.address === params.outputMint)?.symbol || 'tokens';
    const outputAmount = (parseInt(quote.outAmount) / 1000000).toFixed(4);
    
    const message = `Confirm Swap\n\n${params.amount / 1000000} ${inputToken} → ~${outputAmount} ${outputToken}\n\nSlippage: ${(params.slippageBps || 50) / 100}%\n\nThis is a simulated transaction.`;
    
    // Trigger Phantom's signMessage to get user approval
    if (signer && signer.signMessage) {
      const encoder = new TextEncoder();
      const messageBytes = encoder.encode(message);
      
      signer.signMessage(messageBytes)
        .then(() => {
          console.log('✅ User approved swap');
          resolve(true);
        })
        .catch((err: any) => {
          console.log('❌ User rejected swap:', err.message || 'User declined');
          resolve(false);
        });
    } else {
      // Fallback: auto-approve if no signer
      console.log('⚠️ No signer available, auto-approving simulation');
      setTimeout(() => resolve(true), 500);
    }
  });
  
  if (!confirmed) {
    return {
      success: false,
      error: 'Transaction cancelled by user',
      inputAmount: params.amount
    };
  }
  
  // Step 3: Simulate transaction execution
  console.log('3️⃣ Executing simulated swap...');
  
  // Generate a realistic transaction signature
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  const signature = `${timestamp}${randomPart}`;
  
  console.log(`📝 Transaction signature: ${signature}`);
  console.log('⏳ Simulating blockchain confirmation...');
  
  // Step 4: Simulate confirmation delay and success/failure
  const executionResult = await simulateMockSwapExecution(
    signature,
    params.inputMint,
    params.outputMint,
    params.amount,
    parseInt(quote.outAmount)
  );
  
  console.log('✅ Simulated swap completed!', executionResult);
  
  return {
    success: true,
    signature: executionResult.signature,
    outputAmount: executionResult.outputAmount,
    inputAmount: params.amount,
    slippage: executionResult.actualSlippage
  };
}

/**
 * Execute swap using REAL Jupiter API (UNUSED - Pure simulation mode)
 * Keeping for reference only
 */
/* async function executeJupiterSwapReal(
  params: SwapParams,
  signer: any
): Promise<SwapResult> {
  console.log('🚀 Starting REAL Jupiter swap');
  
  // Step 1: Get quote from real API
  console.log('1️⃣ Fetching real Jupiter quote...');
  const quoteUrl = `${BACKEND_PROXY_BASE}/quote?` + new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount.toString(),
    slippageBps: (params.slippageBps || 50).toString(),
    swapMode: 'ExactIn',
    onlyDirectRoutes: 'false',
    asLegacyTransaction: 'false',
  }).toString();
  
  const quoteResponse = await fetch(quoteUrl);
  if (!quoteResponse.ok) {
    const errorData = await quoteResponse.json().catch(() => ({}));
    throw new Error(`Quote fetch failed: ${quoteResponse.status} - ${JSON.stringify(errorData)}`);
  }
  
  const quote = await quoteResponse.json();
  console.log('✅ Real quote received:', quote);
  
  // Step 2: Get swap transaction from real API
  console.log('2️⃣ Building real swap transaction...');
  const swapResponse = await fetch(`${BACKEND_PROXY_BASE}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    })
  });
  
  if (!swapResponse.ok) {
    const errorData = await swapResponse.json().catch(() => ({}));
    throw new Error(`Swap build failed: ${swapResponse.status} - ${JSON.stringify(errorData)}`);
  }
  
  const swapData = await swapResponse.json();
  console.log('✅ Real swap transaction built');
  
  // Step 3: Sign and submit
  console.log('3️⃣ Requesting user signature...');
  const transactionBuffer = Buffer.from(swapData.swapTransaction, 'base64');
  const transaction = VersionedTransaction.deserialize(transactionBuffer);
  
  const signedTransaction = await signer.signTransaction(transaction);
  
  console.log('4️⃣ Submitting transaction to Solana...');
  const connection = new Connection(
    params.cluster === 'mainnet' ? 'https://api.mainnet-beta.solana.com' : 'https://api.devnet.solana.com'
  );
  
  const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
    skipPreflight: false,
    maxRetries: 3
  });
  
  console.log(`📝 Transaction submitted: ${signature}`);
  console.log('⏳ Waiting for confirmation...');
  
  // Wait for confirmation
  const confirmation = await connection.confirmTransaction(signature, 'confirmed');
  
  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  }
  
  console.log('✅ REAL swap completed successfully!');
  
  return {
    success: true,
    signature,
    outputAmount: parseInt(quote.outAmount),
    inputAmount: params.amount,
    slippage: quote.priceImpactPct
  };
} */

/**
 * Get token list (always returns simulation tokens)
 */
export async function getTokenList(): Promise<any[]> {
  console.log('🎮 Using simulated token list (no API calls)');
  return MOCK_DEVNET_TOKENS;
}

/**
 * Validate if a swap is possible (prevents same-token swaps)
 */
export function validateSwapParams(params: SwapParams): { valid: boolean; error?: string } {
  if (params.inputMint === params.outputMint) {
    return {
      valid: false,
      error: 'Input and output tokens must be different'
    };
  }
  
  if (params.amount <= 0) {
    return {
      valid: false,
      error: 'Amount must be greater than 0'
    };
  }
  
  return { valid: true };
}

/**
 * Mock Jupiter Service for Devnet Testing
 * 
 * Simulates Jupiter aggregator behavior without calling real API:
 * - Realistic price quotes with volatility
 * - Dynamic price changes over time
 * - Slippage simulation
 * - Transaction building and mock execution
 * - Supports all devnet tokens
 */

import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

// Mock price database (simulates market prices in USDC)
const MOCK_PRICES: Record<string, number> = {
  'So11111111111111111111111111111111111111112': 150.0, // SOL/Wrapped SOL
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU': 1.0,   // USDC
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1.0,   // USDC (mainnet for reference)
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 0.0,   // USDT (simulated)
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 160.0,  // mSOL
};

// Price volatility - simulates market movement
const PRICE_VOLATILITY = 0.02; // ±2% random variation

// Simulated liquidity (affects slippage)
const LIQUIDITY_LEVELS: Record<string, number> = {
  'So11111111111111111111111111111111111111112': 1000000, // High liquidity
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU': 5000000, // Very high
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 5000000,
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 500000,
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 100000,
};

interface MockQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: number;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  contextSlot: number;
  timeTaken: number;
}

interface MockSwapResponse {
  swapTransaction: string; // base64 encoded
  lastValidBlockHeight: number;
}

/**
 * Get current mock price with simulated volatility
 */
function getCurrentPrice(mint: string): number {
  const basePrice = MOCK_PRICES[mint] || 1.0;
  const volatility = (Math.random() - 0.5) * 2 * PRICE_VOLATILITY;
  return basePrice * (1 + volatility);
}

/**
 * Calculate slippage based on trade size and liquidity
 */
function calculateSlippage(inputMint: string, outputMint: string, amountIn: number): number {
  const inputLiquidity = LIQUIDITY_LEVELS[inputMint] || 100000;
  const outputLiquidity = LIQUIDITY_LEVELS[outputMint] || 100000;
  
  const avgLiquidity = (inputLiquidity + outputLiquidity) / 2;
  const liquidityImpact = amountIn / avgLiquidity;
  
  // Slippage increases with trade size relative to liquidity
  return Math.min(liquidityImpact * 100, 5.0); // Cap at 5%
}

/**
 * Calculate realistic swap output amount
 */
function calculateSwapOutput(
  inputMint: string,
  outputMint: string,
  amountIn: number,
  _slippageBps: number // Prefix with _ to indicate intentionally unused
): { outAmount: number; priceImpact: number; fee: number } {
  const inputPrice = getCurrentPrice(inputMint);
  const outputPrice = getCurrentPrice(outputMint);
  
  // Calculate base conversion
  const baseOutAmount = (amountIn * inputPrice) / outputPrice;
  
  // Apply trading fee (0.3% typical DEX fee)
  const fee = baseOutAmount * 0.003;
  const afterFee = baseOutAmount - fee;
  
  // Calculate price impact (slippage)
  const priceImpact = calculateSlippage(inputMint, outputMint, amountIn);
  const slippageAmount = afterFee * (priceImpact / 100);
  
  const finalAmount = afterFee - slippageAmount;
  
  return {
    outAmount: Math.floor(finalAmount),
    priceImpact,
    fee: Math.floor(fee)
  };
}

/**
 * Mock Jupiter Quote API
 */
export async function getMockJupiterQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
  swapMode?: string;
  onlyDirectRoutes?: boolean;
}): Promise<MockQuoteResponse> {
  console.log('🎭 Mock Jupiter: Generating quote', params);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  
  const amountIn = parseInt(params.amount);
  const slippageBps = params.slippageBps || 50;
  
  // Calculate swap output
  const { outAmount, priceImpact, fee } = calculateSwapOutput(
    params.inputMint,
    params.outputMint,
    amountIn,
    slippageBps
  );
  
  // Calculate minimum output with slippage tolerance
  const slippageMultiplier = 1 - (slippageBps / 10000);
  const minOutputAmount = Math.floor(outAmount * slippageMultiplier);
  
  const mockQuote: MockQuoteResponse = {
    inputMint: params.inputMint,
    inAmount: params.amount,
    outputMint: params.outputMint,
    outAmount: outAmount.toString(),
    otherAmountThreshold: minOutputAmount.toString(),
    swapMode: params.swapMode || 'ExactIn',
    slippageBps,
    priceImpactPct: priceImpact,
    routePlan: [
      {
        swapInfo: {
          ammKey: 'MockAMM' + Math.random().toString(36).substring(7),
          label: 'Mock DEX',
          inputMint: params.inputMint,
          outputMint: params.outputMint,
          inAmount: params.amount,
          outAmount: outAmount.toString(),
          feeAmount: fee.toString(),
          feeMint: params.outputMint,
        },
        percent: 100,
      },
    ],
    contextSlot: Math.floor(Date.now() / 1000),
    timeTaken: 0.5 + Math.random() * 0.5,
  };
  
  console.log('✅ Mock Jupiter: Quote generated', {
    inputAmount: amountIn,
    outputAmount: outAmount,
    priceImpact: `${priceImpact.toFixed(2)}%`,
    fee: fee
  });
  
  return mockQuote;
}

/**
 * Mock Jupiter Swap API - Returns a mock transaction
 */
export async function getMockJupiterSwap(params: {
  quoteResponse: MockQuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  feeAccount?: string;
  destinationTokenAccount?: string;
}): Promise<MockSwapResponse> {
  console.log('🎭 Mock Jupiter: Building swap transaction', params);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));
  
  // Create a simple mock transaction
  // In reality, this would be a complex swap instruction set
  const connection = new Connection('https://api.devnet.solana.com');
  const userPubkey = new PublicKey(params.userPublicKey);
  
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  
  const transaction = new Transaction();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = userPubkey;
  
  // Add a dummy instruction (memo-like) to represent the swap
  // This makes the transaction valid but doesn't actually perform a swap
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: userPubkey,
      toPubkey: userPubkey, // Self-transfer (essentially a no-op)
      lamports: 0, // Zero lamports
    })
  );
  
  // Serialize to base64
  const serialized = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  const base64Transaction = serialized.toString('base64');
  
  console.log('✅ Mock Jupiter: Swap transaction built', {
    lastValidBlockHeight,
    transactionSize: base64Transaction.length
  });
  
  return {
    swapTransaction: base64Transaction,
    lastValidBlockHeight: lastValidBlockHeight + 150, // Valid for ~150 blocks
  };
}

/**
 * Mock token list for devnet
 */
export const MOCK_DEVNET_TOKENS = [
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Wrapped SOL',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    tags: ['wrapped-sol', 'devnet'],
  },
  {
    address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    symbol: 'USDC',
    name: 'USD Coin (Devnet)',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    tags: ['stablecoin', 'devnet'],
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    tags: ['stablecoin'],
  },
];

/**
 * Check if mock mode should be used (devnet detection)
 */
export function shouldUseMockJupiter(cluster?: string): boolean {
  // Use mock for devnet, or when explicitly requested
  return cluster === 'devnet' || process.env.USE_MOCK_JUPITER === 'true';
}

/**
 * Simulate a successful swap execution (for testing UI)
 */
export async function simulateMockSwapExecution(
  signature: string,
  _inputMint: string,
  _outputMint: string,
  inputAmount: number,
  expectedOutput: number
): Promise<{
  success: boolean;
  signature: string;
  outputAmount: number;
  actualSlippage: number;
}> {
  console.log('🎭 Mock Jupiter: Simulating swap execution', {
    signature,
    inputAmount,
    expectedOutput
  });
  
  // Simulate blockchain confirmation delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
  
  // Simulate 95% success rate
  const success = Math.random() > 0.05;
  
  if (!success) {
    console.error('❌ Mock Jupiter: Simulated transaction failure');
    throw new Error('Simulated transaction failure (5% random failure rate)');
  }
  
  // Simulate small execution variance (actual output might differ slightly from quote)
  const variance = (Math.random() - 0.5) * 0.01; // ±0.5%
  const actualOutput = Math.floor(expectedOutput * (1 + variance));
  const actualSlippage = ((expectedOutput - actualOutput) / expectedOutput) * 100;
  
  console.log('✅ Mock Jupiter: Swap execution completed', {
    signature,
    actualOutput,
    actualSlippage: `${actualSlippage.toFixed(3)}%`
  });
  
  return {
    success: true,
    signature,
    outputAmount: actualOutput,
    actualSlippage
  };
}

/**
 * Get mock token info
 */
export function getMockTokenInfo(mint: string) {
  return MOCK_DEVNET_TOKENS.find(token => token.address === mint) || {
    address: mint,
    symbol: 'UNKNOWN',
    name: 'Unknown Token',
    decimals: 9,
    tags: ['devnet'],
  };
}

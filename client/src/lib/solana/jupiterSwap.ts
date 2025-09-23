import { Connection, VersionedTransaction, clusterApiUrl } from "@solana/web3.js";

// Use devnet for testing with Jupiter's devnet API
const JUP_QUOTE_URL = "https://quote-api.jup.ag/v6/quote";
const JUP_SWAP_URL = "https://quote-api.jup.ag/v6/swap";
const JUP_TOKENS_URL = "https://quote-api.jup.ag/v6/tokens";

// Use devnet connection for development
export const solanaConnection = new Connection(clusterApiUrl("devnet"), "confirmed");

function toBaseUnits(uiAmount: number, decimals: number) {
  return BigInt(Math.round(uiAmount * 10 ** decimals)).toString();
}

export async function jupiterSwap(params: {
  inputMint: string;
  outputMint: string;
  uiAmount: number;
  inputDecimals: number;
  slippageBps: number;
  userPublicKey: string;
}) {
  const { inputMint, outputMint, uiAmount, inputDecimals, slippageBps, userPublicKey } = params;

  console.log('Jupiter Swap Params:', {
    inputMint,
    outputMint,
    uiAmount,
    inputDecimals,
    slippageBps,
    userPublicKey
  });

  // First, let's try to get available tokens for devnet and validate our tokens
  try {
    console.log('Validating tokens with Jupiter devnet...');
    const tokensResponse = await fetch(`${JUP_TOKENS_URL}?cluster=devnet`);
    const allTokens = await tokensResponse.json();
    console.log('Jupiter devnet tokens count:', Object.keys(allTokens).length);
    
    const inputTokenInfo = allTokens[inputMint];
    const outputTokenInfo = allTokens[outputMint];
    
    console.log('Input token info:', inputTokenInfo);
    console.log('Output token info:', outputTokenInfo);
    
    if (!inputTokenInfo) {
      console.warn(`Input token ${inputMint} not found in Jupiter devnet tokens`);
    }
    if (!outputTokenInfo) {
      console.warn(`Output token ${outputMint} not found in Jupiter devnet tokens`);
    }
  } catch (e) {
    console.log('Token validation error:', e);
    // Continue anyway, let the quote API give us the real error
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
    throw new Error("No routes found. This token pair might not be available on Devnet or lacks sufficient liquidity. Try using SOL as input token.");
  }
  
  console.log('Building swap transaction for devnet...');
  
  const swapRes = await fetch(`${JUP_SWAP_URL}?cluster=devnet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quoteJson, // Use 'quoteResponse' not 'route' for v6 API
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });
  
  console.log('Swap API response status:', swapRes.status);
  
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

  const provider: any = (window as any)?.solana;
  if (!provider?.isPhantom) throw new Error("Phantom not available");

  const signed = await provider.signAndSendTransaction(tx);
  const sig = signed?.signature || signed;
  await solanaConnection.confirmTransaction(sig, "confirmed");
  return { signature: sig };
}

// Common devnet mints (verified working tokens)
export const DEVNET_MINTS = {
  WSOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // Verified USDC devnet
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // Verified USDT devnet
};



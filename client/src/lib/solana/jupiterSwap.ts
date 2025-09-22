import { Connection, VersionedTransaction, clusterApiUrl } from "@solana/web3.js";

const JUP_QUOTE_URL = "https://quote-api.jup.ag/v6/quote";
const JUP_SWAP_URL = "https://quote-api.jup.ag/v6/swap";

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

  const amount = toBaseUnits(uiAmount, inputDecimals);
  const quoteUrl = `${JUP_QUOTE_URL}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&swapMode=ExactIn&onlyDirectRoutes=false`;
  const quoteRes = await fetch(quoteUrl);
  if (!quoteRes.ok) {
    const errorText = await quoteRes.text();
    throw new Error(`Failed to fetch quote: ${errorText}`);
  }
  const quoteJson = await quoteRes.json();
  if (!quoteJson || !quoteJson.data || quoteJson.data.length === 0) {
    throw new Error("No routes found");
  }
  const route = quoteJson.data[0];

  const swapRes = await fetch(JUP_SWAP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      route,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });
  if (!swapRes.ok) {
    const t = await swapRes.text();
    throw new Error(`Swap tx build failed: ${t}`);
  }
  const { swapTransaction } = await swapRes.json();
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



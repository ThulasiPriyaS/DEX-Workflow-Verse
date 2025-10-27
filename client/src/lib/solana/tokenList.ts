// Token list service for fetching devnet tokens
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

// Use backend proxy to avoid DNS issues
const USE_BACKEND_PROXY = true;
const BACKEND_URL = window.location.origin;

// Jupiter devnet token list loader
const DEVNET_TOKEN_LIST_URL = USE_BACKEND_PROXY
  ? `${BACKEND_URL}/api/jupiter/tokens?cluster=devnet`
  : "https://token.jup.ag/strict?cluster=devnet";
  
const MAINNET_TOKEN_LIST_URL = USE_BACKEND_PROXY
  ? `${BACKEND_URL}/api/jupiter/tokens`
  : "https://token.jup.ag/strict";

let tokenList: any[] = [];

export async function loadTokenList(network = "devnet") {
  const url = network === "devnet" ? DEVNET_TOKEN_LIST_URL : MAINNET_TOKEN_LIST_URL;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch token list: ${res.status}`);
    tokenList = await res.json();
  } catch (err) {
    console.warn('loadTokenList failed, falling back to bundled devnet tokens:', err);
    // Fallback: minimal devnet token list so the UI still works when token.jup.ag is unreachable
    tokenList = [
      {
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Wrapped SOL',
        decimals: 9,
        logoURI: undefined,
        tags: ['solana']
      },
      {
        address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
        symbol: 'USDC',
        name: 'USDC (Devnet)',
        decimals: 6,
        logoURI: undefined,
        tags: ['stablecoin']
      },
      {
        address: 'BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k',
        symbol: 'USDT',
        name: 'USDT (Devnet)',
        decimals: 6,
        logoURI: undefined,
        tags: ['stablecoin']
      }
    ];
  }
}

export function getTokenByAddress(address: string) {
  if (!address) return undefined;
  return tokenList.find((t: any) => (t.address || t.mint || t.pubkey || t.tokenAddress) === address);
}

// Example safety check for validation
export function validateDevnetMints(inputMint: string, outputMint: string) {
  const inputToken = getTokenByAddress(inputMint);
  const outputToken = getTokenByAddress(outputMint);
  if (!inputToken || !outputToken) {
    throw new Error("Token not found in devnet token list. Please use devnet tokens.");
  }
}

// Fetch devnet tokens and return them in our Token[] shape for UI components
export async function fetchDevnetTokens(): Promise<Token[]> {
  try {
    if (!tokenList || tokenList.length === 0) {
      await loadTokenList('devnet');
    }

    // tokenList is expected to be an array of token objects from token.jup.ag
    const tokens: Token[] = (tokenList || []).map((t: any) => ({
      address: t.address || t.mint || t.pubkey || t.tokenAddress,
      symbol: t.symbol || t.ticker || 'TKN',
      name: t.name || t.symbol || 'Token',
      decimals: t.decimals ?? 9,
      logoURI: t.logoURI || t.logo || undefined,
      tags: t.tags || [],
    }));

    // Ensure SOL exists at the front if present
    const solIndex = tokens.findIndex(tok => tok.address === 'So11111111111111111111111111111111111111112');
    if (solIndex > 0) {
      const sol = tokens.splice(solIndex, 1)[0];
      tokens.unshift(sol);
    }

    return tokens.slice(0, 200);
  } catch (err) {
    console.warn('fetchDevnetTokens failed:', err);
    return [];
  }
}



// Get token by symbol

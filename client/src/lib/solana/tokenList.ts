// Token list service for fetching devnet tokens
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

// Hardcoded fallback devnet tokens - will be replaced by Jupiter's actual devnet tokens
export const DEVNET_TOKENS: Token[] = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Wrapped SOL",
    decimals: 9,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    tags: ["devnet", "fallback"]
  }
];

// Function to fetch devnet tokens from Jupiter's devnet API
export async function fetchDevnetTokens(): Promise<Token[]> {
  try {
    // Get actual Jupiter-supported tokens from devnet
    const response = await fetch('https://quote-api.jup.ag/v6/tokens?cluster=devnet');
    if (!response.ok) {
      console.warn('Failed to fetch devnet tokens from Jupiter, using fallback list');
      return DEVNET_TOKENS;
    }
    
    const allTokens = await response.json();
    console.log('Jupiter devnet supported tokens:', Object.keys(allTokens).length);
    
    // Convert Jupiter token format to our format - use all available devnet tokens
    const tokenList: Token[] = Object.entries(allTokens)
      .map(([address, token]: [string, any]) => ({
        address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoURI: token.logoURI,
        tags: ['jupiter', 'devnet', 'tradable']
      }))
      .slice(0, 20); // Limit to top 20 tokens for UI performance
    
    console.log('Jupiter devnet tokens:', tokenList);
    
    // Always include SOL as the first option if available
    const solToken = tokenList.find(t => t.address === 'So11111111111111111111111111111111111111112');
    if (solToken) {
      return [solToken, ...tokenList.filter(t => t.address !== 'So11111111111111111111111111111111111111112')];
    }
    
    return tokenList.length > 0 ? tokenList : DEVNET_TOKENS;
  } catch (error) {
    console.warn('Error fetching devnet tokens:', error);
    return DEVNET_TOKENS;
  }
}

// Get token by address
export function getTokenByAddress(address: string): Token | undefined {
  return DEVNET_TOKENS.find(token => token.address === address);
}

// Get token by symbol
export function getTokenBySymbol(symbol: string): Token | undefined {
  return DEVNET_TOKENS.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
}

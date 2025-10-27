// Fetch actual tradable devnet tokens from Jupiter API
export async function getJupiterDevnetTokens() {
  try {
    console.log('🔍 Fetching actual tradable devnet tokens from Jupiter...');
    
    const response = await fetch('https://quote-api.jup.ag/v6/tokens?cluster=devnet');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const tokens = await response.json();
    const tokenAddresses = Object.keys(tokens);
    
    console.log(`✅ Found ${tokenAddresses.length} tradable devnet tokens`);
    
    // Log first 10 tokens for inspection
    console.log('🪙 Available devnet tokens:');
    tokenAddresses.slice(0, 10).forEach((address, i) => {
      const token = tokens[address] as any;
      console.log(`${i + 1}. ${token.symbol} (${token.name}): ${address}`);
    });
    
    // Look for common tokens
    const commonTokens: { SOL: string; USDC: string | null; USDT: string | null } = {
      SOL: 'So11111111111111111111111111111111111111112',
      USDC: null,
      USDT: null,
    };
    
    // Find USDC-like tokens
    for (const [address, tokenData] of Object.entries(tokens)) {
      const token = tokenData as any;
      if (token.symbol?.toLowerCase().includes('usdc')) {
        commonTokens.USDC = address;
        console.log(`🎯 Found USDC-like token: ${token.symbol} (${token.name}): ${address}`);
        break;
      }
    }
    
    // Find USDT-like tokens
    for (const [address, tokenData] of Object.entries(tokens)) {
      const token = tokenData as any;
      if (token.symbol?.toLowerCase().includes('usdt')) {
        commonTokens.USDT = address;
        console.log(`🎯 Found USDT-like token: ${token.symbol} (${token.name}): ${address}`);
        break;
      }
    }
    
    // If no USDC/USDT found, use any available token as output
    if (!commonTokens.USDC && tokenAddresses.length > 1) {
      // Use the second token (first is usually SOL)
      const fallbackAddress = tokenAddresses[1];
      const fallbackToken = tokens[fallbackAddress] as any;
      commonTokens.USDC = fallbackAddress;
      console.log(`📌 Using fallback token: ${fallbackToken.symbol} (${fallbackToken.name}): ${fallbackAddress}`);
    }
    
    return {
      allTokens: tokens,
      tradableAddresses: tokenAddresses,
      recommended: commonTokens
    };
    
  } catch (error) {
    console.error('❌ Failed to fetch Jupiter devnet tokens:', error);
    
    // Return fallback tokens
    return {
      allTokens: {},
      tradableAddresses: ['So11111111111111111111111111111111111111112'],
      recommended: {
        SOL: 'So11111111111111111111111111111111111111112',
        USDC: null,
        USDT: null
      }
    };
  }
}

// Test the token availability
export async function testTokenPair(inputMint: string, outputMint: string) {
  try {
    console.log(`🧪 Testing token pair: ${inputMint} → ${outputMint}`);
    
    const quoteUrl = `https://quote-api.jup.ag/v6/quote?cluster=devnet&inputMint=${inputMint}&outputMint=${outputMint}&amount=1000000&slippageBps=50`;
    
    const response = await fetch(quoteUrl);
    const result = await response.json();
    
    if (response.ok && result.routePlan && result.routePlan.length > 0) {
      console.log('✅ Token pair is tradable on devnet');
      return true;
    } else {
      console.log('❌ Token pair not tradable:', result.error || 'No routes found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing token pair:', error);
    return false;
  }
}

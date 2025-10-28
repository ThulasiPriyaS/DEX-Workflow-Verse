import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cluster = req.query.cluster || 'mainnet-beta';
    const url = `https://quote-api.jup.ag/v6/tokens?cluster=${cluster}`;
    
    console.log(`[Jupiter Tokens] Fetching: ${url}`);
    const response = await fetch(url);
    
    console.log(`[Jupiter Tokens] Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Jupiter Tokens] Error ${response.status}:`, errorText);
      return res.status(response.status).json({ 
        error: `Jupiter API error: ${response.status}`,
        details: errorText 
      });
    }
    
    const data = await response.json();
    console.log(`[Jupiter Tokens] Success - ${Array.isArray(data) ? data.length : 'N/A'} tokens`);
    return res.json(data);
  } catch (error: any) {
    console.error('[Jupiter Tokens] Exception:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Failed to fetch tokens from Jupiter',
      message: error.message 
    });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cluster = req.query.cluster || 'mainnet-beta';
    const url = `https://quote-api.jup.ag/v6/swap?cluster=${cluster}`;
    
    console.log(`[Jupiter Swap] Posting to: ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    console.log(`[Jupiter Swap] Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Jupiter Swap] Error ${response.status}:`, errorText);
      return res.status(response.status).json({ 
        error: `Jupiter API error: ${response.status}`,
        details: errorText 
      });
    }
    
    const data = await response.json();
    console.log(`[Jupiter Swap] Success`);
    return res.json(data);
  } catch (error: any) {
    console.error('[Jupiter Swap] Exception:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Failed to build swap transaction',
      message: error.message 
    });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const queryString = new URLSearchParams(req.query as any).toString();
    const url = `https://quote-api.jup.ag/v6/quote?${queryString}`;
    
    console.log(`[Jupiter Quote] Fetching: ${url}`);
    const response = await fetch(url);
    
    console.log(`[Jupiter Quote] Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Jupiter Quote] Error ${response.status}:`, errorText);
      return res.status(response.status).json({ 
        error: `Jupiter API error: ${response.status}`,
        details: errorText 
      });
    }
    
    const data = await response.json();
    console.log(`[Jupiter Quote] Success`);
    return res.json(data);
  } catch (error: any) {
    console.error('[Jupiter Quote] Exception:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Failed to fetch quote from Jupiter',
      message: error.message 
    });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cluster = req.query.cluster || 'mainnet-beta';
    const url = `https://quote-api.jup.ag/v6/swap?cluster=${cluster}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Jupiter swap proxy error:', error);
    res.status(500).json({ error: 'Failed to build swap transaction' });
  }
}

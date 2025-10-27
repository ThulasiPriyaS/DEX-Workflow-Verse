import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cluster = req.query.cluster || 'mainnet-beta';
    const url = `https://quote-api.jup.ag/v6/tokens?cluster=${cluster}`;
    
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Jupiter tokens proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch tokens from Jupiter' });
  }
}

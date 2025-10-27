import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const queryString = new URLSearchParams(req.query as any).toString();
    const url = `https://quote-api.jup.ag/v6/quote?${queryString}`;
    
    console.log(`Fetching Jupiter quote: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Jupiter quote proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch quote from Jupiter' });
  }
}

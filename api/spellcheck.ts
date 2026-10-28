import type { VercelRequest, VercelResponse } from '@vercel/node';
import { spellCheckFlowchart } from '../lib/flowchartAi';

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, boxes } = req.body || {};

    const result = await spellCheckFlowchart({ title, boxes });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error in /api/spellcheck:', err);
    return res.status(502).json({
      error: err?.message || 'Spell check failed. Please try again.',
    });
  }
}

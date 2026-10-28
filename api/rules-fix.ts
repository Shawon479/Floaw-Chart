import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fixFlowchartRules } from '../lib/flowchartAi';

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, boxes, targetGrammar } = req.body || {};

    const result = await fixFlowchartRules({ title, boxes, targetGrammar });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error in /api/rules-fix:', err);
    return res.status(502).json({
      error: err?.message || 'AI rule fix failed. Please try again.',
    });
  }
}

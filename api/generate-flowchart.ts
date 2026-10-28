import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateFlowchart } from '../lib/flowchartAi';

// Allow the third-party AI enough time to answer on Vercel.
export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, passage, grammaticalStyle, boxCount } = req.body || {};

    const result = await generateFlowchart({
      topic,
      passage,
      grammaticalStyle,
      boxCount,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error generating flowchart:', err);
    return res.status(502).json({
      error: err?.message || 'Failed to generate flowchart. Please try again.',
    });
  }
}

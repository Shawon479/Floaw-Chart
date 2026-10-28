import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateFlowchart, spellCheckFlowchart, fixFlowchartRules } from './lib/flowchartAi';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

// Generate a board-standard HSC flowchart with the third-party AI API.
app.post('/api/generate-flowchart', async (req, res) => {
  try {
    const result = await generateFlowchart(req.body || {});
    res.json(result);
  } catch (err: any) {
    console.error('Error generating flowchart:', err);
    res.status(502).json({ error: err?.message || 'Failed to generate flowchart.' });
  }
});

// Scan the heading and boxes for spelling mistakes with the third-party AI API.
app.post('/api/spellcheck', async (req, res) => {
  try {
    const result = await spellCheckFlowchart(req.body || {});
    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/spellcheck:', err);
    res.status(502).json({ error: err?.message || 'Spell check failed.' });
  }
});

// Harmonize a flowchart with the HSC board rules using the third-party AI API.
app.post('/api/rules-fix', async (req, res) => {
  try {
    const result = await fixFlowchartRules(req.body || {});
    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/rules-fix:', err);
    res.status(502).json({ error: err?.message || 'AI rule fix failed.' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, aiProvider: 'https://shawon-gpt-api.vercel.app/' });
});

// Serve frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`HSC Flowchart Server running at http://localhost:${port}`);
});

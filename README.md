# Flow-chart maker — HSC English 1st Paper

An exam-ready flowchart builder for Bangladesh HSC English 1st Paper (Question No. 2),
with AI generation, an HSC rule auditor, an AI spelling checker and PDF/PNG export.

## AI service

All AI features use a third-party AI API — no API key is required:

```
POST https://shawon-gpt-api.vercel.app/   { "text": "<prompt>" }
GET  https://shawon-gpt-api.vercel.app/?text=<prompt>
```

The browser never calls that API directly. Requests are proxied through the serverless
functions in `api/`:

| Route | Purpose |
| --- | --- |
| `POST /api/generate-flowchart` | Generates a 6-box HSC flowchart |
| `POST /api/spellcheck` | Finds typos and returns corrected text |
| `POST /api/rules-fix` | Rewrites a chart to follow NCTB board rules |

Shared prompt + parsing logic lives in `lib/flowchartAi.ts` and `lib/aiClient.ts`, so the
Vercel functions and the local Express server behave exactly the same.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
```

## Deploy to Vercel

1. Push this folder to a Git repository.
2. Import it in Vercel — the framework preset `Vite` and the `vercel.json` settings are
   already configured.
3. Deploy. No environment variables are required.

The API functions are configured with a 60 second maximum duration so the AI has enough
time to respond.

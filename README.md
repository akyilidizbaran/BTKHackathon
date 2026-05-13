# CommercePilot

CommercePilot is a hackathon MVP for a dual-sided commerce intelligence platform.

The project starts with a Next.js web foundation and mock data. Agentic/LLM-backed workflows will be added incrementally after the deterministic commerce workflows are stable.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `npm run dev` - start the local development server.
- `npm run build` - create a production build.
- `npm run start` - run the production build.
- `npm run lint` - run ESLint.

## Environment

Copy `.env.example` to `.env.local` when LLM integration starts. Do not commit real API keys.

## Current Milestone

Milestone 0: project foundation.

## Planned Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Mock TypeScript/JSON data first
- Deterministic workflows before LLM-backed agents
- OpenAI as temporary LLM provider, Gemini as final hackathon target

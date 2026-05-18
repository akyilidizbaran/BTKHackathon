# CommercePilot

[![CI](https://github.com/akyilidizbaran/BTKHackathon/actions/workflows/ci.yml/badge.svg)](https://github.com/akyilidizbaran/BTKHackathon/actions/workflows/ci.yml)

CommercePilot is a hackathon MVP for a dual-sided commerce intelligence platform: a familiar marketplace for buyers, a seller operations cockpit for merchants, and a context-aware commerce agent that can explain, recommend, preview, and apply approved actions.

The core technical idea is simple:

```text
curated commerce data
  -> deterministic scoring and workflows
  -> LLM intent, ranking, explanation, and draft generation
  -> typed validation and guardrails
  -> user approval
  -> deterministic apply functions
```

This is not a static UI prototype. The app contains typed API contracts, workflow validation, LLM provider abstraction, catalog and role guardrails, approval boundaries, local mutation/audit stores, component tests, and a repeatable validation script.

## Current Status

CommercePilot is in delivery-ready hackathon MVP state.

What is intentionally real:

- Buyer and seller app surfaces built with Next.js App Router, React, TypeScript, and Tailwind CSS.
- Deterministic commerce scoring for product health, stock risk, review risk, return risk, profitability, listing quality, and promotion readiness.
- Buyer Agent and Seller Agent API contracts with LLM-assisted orchestration.
- Provider-neutral LLM layer with OpenAI and Gemini adapters plus deterministic fallback.
- Structured JSON parsing and validation before any LLM output reaches UI or apply contracts.
- Guardrails that block catalog hallucination, role mismatch, stale LLM action prompts, and unapproved mutations.
- Buyer cart apply and seller listing apply flows with explicit user approval.
- Local audit and rollback behavior for seller listing mutations.
- Component tests for extracted agent panels and workflow contract validation.

What is intentionally mock or local-only:

- Commerce data comes from curated mock datasets in `src/data/mock`.
- Auth, database persistence, payments, inventory reservation, and fulfillment are out of scope for the hackathon MVP.
- Buyer cart, buyer profile, seller profile, seller listing audit, and floating agent controls use `localStorage`.
- Product imagery uses a controlled sprite asset instead of production SKU media.

## Demo Routes

Use these routes to review the product quickly:

- `/` - role gateway.
- `/buyer/products` - buyer marketplace catalog with category, sorting, product cards, and cart entry points.
- `/buyer/products/[slug]` - buyer product detail and purchase panel.
- `/buyer/cart` - local cart state, quantity controls, suggested products, and checkout mock.
- `/buyer/agent` - buyer agent prompt, product recommendations, and approved cart mutation.
- `/buyer/profile` - profile preferences, review history, and personalization signals.
- `/seller` - seller overview with risk cards and deduplicated priority queue.
- `/seller/products` - seller product radar with focus filters, search, sort, product health, and linked actions.
- `/seller/actions` - seller action queue by category/focus.
- `/seller/actions/[id]` - action detail with affected products, work steps, draft copy, and LLM explanation.
- `/seller/agent` - seller agent findings, listing draft preview, approval, audit, and rollback.
- `/seller/profile` - seller store settings, agent permissions, alert rules, quiet hours, and audit trail.
- `/demo` - rehearsal command center for buyer, seller, floating agent, QA, and proof routes.

## Architecture Map

```text
src/data/mock
  curated demo products, sellers, buyers, orders, reviews, inventory, relations

src/lib/data
  typed data access helpers over the mock commerce dataset

src/lib/scoring
  deterministic product health and commerce scoring modules

src/lib/workflows
  buyer smart-cart, seller actions, and product-health workflows

src/lib/api
  UI-facing and route-facing typed API contract builders

src/lib/llm
  provider-neutral LLM adapters, structured JSON generation, parsing, fallback

src/lib/agents
  runtime registry, guardrails, apply contracts, local apply helpers, floating context

src/components/commerce
  buyer, seller, floating agent, demo, and proof UI components

src/app
  Next.js App Router pages and API routes
```

## Agent And LLM Boundaries

The LLM does not directly mutate cart or seller listing state.

Buyer flow:

1. User writes a shopping request.
2. Deterministic smart-cart workflow creates catalog-bound candidates.
3. LLM may explain, rank, and phrase the recommendation.
4. Validator removes invalid product ids and unsupported catalog references.
5. User chooses append or replace.
6. Client applies the validated cart mutation to local cart state.

Seller flow:

1. User asks for seller operations help.
2. Deterministic seller workflows compute product/action candidates.
3. LLM may choose focus, rank findings, and draft listing text.
4. Validator checks product ids, action ids, and mutation shape.
5. User reviews before/after listing preview.
6. Approved mutation writes to local listing override and audit store.
7. Rollback is available for applied local audit entries.

Floating Agent:

- Uses route context from the current buyer/seller page.
- Keeps each panel opening fresh; stored chat history is not sent back to the API.
- Blocks buyer prompts from running seller operations and seller prompts from running buyer cart actions.
- Can perform the same approved cart/listing operations as the full agent pages.

## Guardrails

CommercePilot currently protects these behaviors:

- Buyer Agent only recommends products from the existing CommercePilot catalog.
- Unsupported catalog prompts such as phones, consoles, TVs, white goods, or shoes return a boundary response instead of fake recommendations.
- Seller Agent cannot apply listing, price, campaign, stock, or description changes without approval.
- LLM JSON is parsed and validated before entering route contracts or UI state.
- Stale or contradictory LLM action prompts are overridden by the current explicit user prompt.
- Review intelligence only uses allowed review ids and allowed theme labels.
- Buyer product warnings are derived from profile preferences, previous complaints, and product review/metric risk signals.

## Quality And Verification

Main local check:

```bash
npm run check
```

This runs:

- ESLint.
- TypeScript typecheck.
- `scripts/validate-workflows.js`.
- Vitest component tests for commerce components.

Additional production check:

```bash
npm run build
```

The technical audit document records the latest route/API/component smoke coverage:

- `TECHNICAL_AUDIT_COMPONENT_MOCKS.md`

The validation script checks mock data integrity, scoring, workflows, API contracts, agent runtime, LLM provider behavior, guardrails, demo contracts, and extracted component contracts:

- `scripts/validate-workflows.js`

## Getting Started

Prerequisites used during development:

- Node.js 22.22.1
- npm 10.9.4

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build and run production locally:

```bash
npm run build
npm run start
```

## Scripts

- `npm run dev` - start the local development server.
- `npm run build` - create a production build.
- `npm run start` - run the production build.
- `npm run lint` - run ESLint.
- `npm run typecheck` - run TypeScript without emit.
- `npm run validate:workflows` - validate data, workflows, API contracts, LLM/agent guardrails, and demo contracts.
- `npm run test:components` - run Vitest component tests under `src/components/commerce`.
- `npm run check` - run lint, typecheck, workflow validation, and component tests.

## Environment

Copy `.env.example` to `.env.local` for LLM-backed local runs.

```bash
cp .env.example .env.local
```

Supported environment variable names:

```text
LLM_PROVIDER
OPENAI_MODEL
OPENAI_API_KEY
GEMINI_MODEL
GEMINI_API_KEY
```

Notes:

- `LLM_PROVIDER=openai` uses the OpenAI adapter.
- `LLM_PROVIDER=gemini` uses the Gemini OpenAI-compatible adapter.
- Missing keys or provider failures fall back to deterministic behavior where supported.
- Never commit real API keys.

## Tech Stack

- Next.js App Router 16
- React 19
- TypeScript
- Tailwind CSS
- GSAP and `@gsap/react` for UI motion
- Phosphor Icons
- Vitest, jsdom, React Testing Library, and User Event
- Provider-neutral LLM adapter layer for OpenAI, Gemini, and deterministic fallback

## Important Documents

- `PROJECT_MEMORY.md` - append-only project memory, decisions, milestones, conventions, and current state.
- `TECHNICAL_AUDIT_COMPONENT_MOCKS.md` - technical audit, smoke results, component extraction status, mock/local inventory, and priorities.
- `LLM_AGENT_PROVIDER_INDEPENDENT_PLAN.md` - provider-independent LLM and agent implementation plan.
- `COMMERCEPILOT_AGENT_MARKETPLACE_ROADMAP.md` - product and milestone roadmap.

## Known Technical Debt

The core agent architecture is coherent for a hackathon MVP. The main remaining engineering risks are:

- Large workspace components still need more extraction, especially seller profile, seller agent, seller products, and seller actions.
- Browser smoke is currently documented but should become a committed repeatable script.
- Local storage persistence should eventually move behind server persistence boundaries.
- Hardcoded demo identities should become a typed auth/session abstraction before production.
- LLM latency and telemetry should be measured more explicitly.

## Repository State For Reviewers

If you are reviewing the code, start here:

1. Run `npm run check`.
2. Run `npm run build`.
3. Open `/demo`.
4. Inspect `src/lib/agents`, `src/lib/api`, `src/lib/workflows`, and `scripts/validate-workflows.js`.
5. Read `TECHNICAL_AUDIT_COMPONENT_MOCKS.md` for current smoke coverage and known limits.

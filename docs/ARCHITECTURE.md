# CommercePilot Architecture

This document explains how CommercePilot works internally. It is written for reviewers who want to understand the engineering shape without reading every route and component first.

## 1. System Overview

CommercePilot is built around a strict separation between deterministic commerce logic and LLM-assisted language or ranking work.

```text
curated mock commerce data
  -> typed data access helpers
  -> deterministic scoring modules
  -> workflow builders
  -> UI/API contract builders
  -> LLM orchestration, when needed
  -> typed validation and guardrails
  -> user approval
  -> deterministic local apply functions
```

The LLM never owns the source of truth. It can explain, rank, draft, and summarize. Product selection, mutation payloads, catalog boundaries, approval requirements, and rollback behavior remain typed application contracts.

## 2. Reviewer Proof Map

This table maps the main technical claims to the files a reviewer should inspect first.

| Claim | Primary files | How to verify |
|---|---|---|
| The catalog and commerce state are curated, not random fixtures. | `src/data/mock/*`, `src/lib/data/*` | Run `npm run validate:workflows` and inspect product/review counts. |
| Product health and seller actions come from deterministic scoring. | `src/lib/scoring/*`, `src/lib/workflows/seller-actions.ts`, `src/lib/workflows/product-health.ts` | Inspect score evidence fields and run `npm run check`. |
| Buyer recommendations are catalog-bound. | `src/lib/workflows/buyer-smart-cart.ts`, `src/lib/api/buyer-agent.ts`, `src/lib/agents/buyer-catalog-guardrails.ts` | Try unsupported prompts such as phones or consoles; validation blocks fake products. |
| LLM output is validated before UI/apply usage. | `src/lib/llm/json.ts`, `src/lib/api/buyer-agent.ts`, `src/lib/api/seller-agent.ts`, `src/lib/api/review-intelligence.ts` | Inspect validator functions and fallback paths. |
| Cart and seller listing mutations require approval. | `src/lib/agents/buyer-cart-apply.ts`, `src/lib/agents/seller-listing-apply.ts`, client apply helpers | Follow `/buyer/agent` and `/seller/agent`; apply buttons are explicit. |
| Floating Agent shares route-agent boundaries. | `src/lib/api/floating-agent.ts`, `src/components/commerce/floating-agent-panel.tsx` | Route mismatch and unsupported catalog prompts are blocked. |
| CI can run without API keys. | `.github/workflows/ci.yml`, `src/lib/llm/*`, `scripts/validate-workflows.js` | CI uses deterministic provider mode and runs `check` + `build`. |

## 3. Layer Map

```text
src/data/mock
  Products, sellers, buyers, orders, reviews, carts, inventory events, relations.

src/lib/data
  Read helpers and joined commerce views over the mock dataset.

src/lib/scoring
  Product health, inventory, reviews, listing, returns, shipping, profitability,
  and promotion-readiness scores.

src/lib/workflows
  Use-case workflows such as buyer smart cart, seller growth actions,
  and product health analysis.

src/lib/api
  Typed contract builders used by both App Router pages and API routes.

src/lib/llm
  Provider-neutral text/JSON generation, OpenAI adapter, Gemini adapter,
  deterministic fallback, JSON extraction, and normalization helpers.

src/lib/agents
  Runtime registry, tool metadata, route/floating context, catalog guardrails,
  profile warnings, apply contracts, local apply helpers, audit and rollback.

src/components/commerce
  Product-facing buyer/seller UI, agent UI, proof/demo UI, and extracted panels.

src/app
  Next.js App Router pages and API routes.
```

## 4. Data And Scoring

The app starts with curated mock data in `src/data/mock`. The mock data is intentionally shaped around demo stories rather than random fixtures.

Important entry points:

- `src/data/mock/products.ts`
- `src/data/mock/reviews.ts`
- `src/data/mock/orders.ts`
- `src/data/mock/inventory-events.ts`
- `src/data/mock/product-relations.ts`
- `src/data/mock/buyers.ts`
- `src/data/mock/sellers.ts`

Scoring lives in `src/lib/scoring`. It turns raw commerce signals into explainable scores:

- Inventory risk.
- Review and sentiment risk.
- Listing quality.
- Return risk.
- Shipping reliability.
- Profitability and margin pressure.
- Promotion readiness.
- Aggregate product health.

Workflows in `src/lib/workflows` consume those scores and produce use-case outputs:

- `buyer-smart-cart.ts` creates buyer recommendation candidates.
- `seller-actions.ts` creates seller growth/action recommendations.
- `product-health.ts` creates product-level health analysis.

## 5. API Contract Pattern

CommercePilot avoids duplicating logic between pages and API routes. Shared builders in `src/lib/api` produce the typed data contracts; route handlers and server components both consume the same builders.

Examples:

- `src/lib/api/buyer-catalog.ts` powers buyer catalog UI and `GET /api/buyer/catalog`.
- `src/lib/api/buyer-agent.ts` powers `/buyer/agent` and `POST /api/buyer/agent`.
- `src/lib/api/seller.ts` powers seller overview, products, actions, product health, and buyer signals.
- `src/lib/api/seller-agent.ts` powers `/seller/agent` and `POST /api/seller/agent`.
- `src/lib/api/floating-agent.ts` powers the floating panel API.
- `src/lib/api/review-intelligence.ts` powers review intelligence.

The API envelope convention is:

```text
success/data/error
```

The shared response helpers live in `src/lib/api/responses.ts`.

## 6. LLM Provider Layer

The LLM layer is provider-neutral by design.

Important files:

- `src/lib/llm/index.ts`
- `src/lib/llm/common.ts`
- `src/lib/llm/openai.ts`
- `src/lib/llm/gemini.ts`
- `src/lib/llm/json.ts`
- `src/lib/llm/types.ts`

Supported provider modes:

- `openai`
- `gemini`
- `deterministic`

Environment variables:

```text
LLM_PROVIDER
OPENAI_MODEL
OPENAI_API_KEY
GEMINI_MODEL
GEMINI_API_KEY
```

Structured generation uses `generateLlmJson<T>()`. It extracts JSON, normalizes strings and arrays, runs a caller-provided validator, and falls back deterministically when parsing or validation fails.

This matters because CommercePilot uses LLM output only after type-level and domain-level validation.

## 7. Agent Runtime

The shared agent runtime registry lives in `src/lib/agents/runtime.ts`.

It defines:

- Prompt templates.
- Tool registry.
- Tool plans.
- Runtime snapshots.
- Guardrail summaries.
- Application-level execution trace metadata.

Current high-level agent roles:

- `buyer`
- `seller`

Current surfaces:

- `route`
- `floating`

Important runtime concepts:

- Prompt templates define max prompt length, role, endpoint, and response contract.
- Tool definitions mark whether approval is required.
- Trace items describe workflow, context, LLM, tool, guardrail, and approval layers.
- Runtime snapshots let `/demo` and technical proof surfaces show what the agent is allowed to do.

## 8. Buyer Agent Flow

The buyer agent flow is catalog-bound.

```text
User prompt
  -> validateBuyerAgentRequest
  -> buyer catalog + profile + smart-cart workflow
  -> LLM JSON orchestration for message, ranking, reasons, risk notes
  -> product id whitelist and unsupported catalog guardrails
  -> BuyerAgentApiData
  -> user chooses append or replace
  -> /api/buyer/agent/apply validation
  -> buyer-cart-apply-client writes local cart state
```

Important files:

- `src/lib/api/buyer-agent.ts`
- `src/lib/agents/buyer-catalog-guardrails.ts`
- `src/lib/agents/buyer-cart-apply.ts`
- `src/lib/agents/buyer-cart-apply-client.ts`
- `src/lib/cart/buyer-cart.ts`
- `src/components/commerce/buyer-agent-workspace.tsx`
- `src/components/commerce/buyer-agent-panels.tsx`

Key boundaries:

- Buyer Agent can only recommend existing catalog products.
- Unsupported product families return a boundary answer instead of fake recommendations.
- Cart mutations require explicit user action.
- Apply is deterministic and client-side over validated payloads.

## 9. Seller Agent Flow

The seller agent flow is approval-bound.

```text
User prompt
  -> validateSellerAgentRequest
  -> seller products + seller actions workflows
  -> LLM JSON orchestration for focus, ranking, reasons, draft listing text
  -> product/action id whitelist and mutation shape validation
  -> SellerAgentApiData
  -> before/after listing preview
  -> user approval
  -> /api/seller/agent/apply validation
  -> seller-listing-apply-client writes local override and audit entry
  -> rollback can reverse applied local audit entries
```

Important files:

- `src/lib/api/seller-agent.ts`
- `src/lib/agents/seller-listing-apply.ts`
- `src/lib/agents/seller-listing-apply-client.ts`
- `src/components/commerce/seller-agent-workspace.tsx`
- `src/components/commerce/seller-agent-listing-panels.tsx`

Key boundaries:

- Seller Agent cannot mutate listing, price, campaign, stock, or copy without approval.
- LLM-generated drafts are normalized into the shared listing mutation preview contract.
- Audit and rollback are local-only for the MVP, but the apply boundary is explicit.

## 10. Floating Agent Flow

The floating agent is not a separate toy widget. It shares the same runtime and apply boundaries as the route-level buyer and seller agents.

```text
Current route
  -> createFloatingAgentContext
  -> default role/context/capability hints
  -> user prompt
  -> validateFloatingAgentRequest
  -> route/role intent guardrails
  -> buyer-agent, seller-agent, or chat mode
  -> approved apply uses shared buyer/seller apply helpers
```

Important files:

- `src/lib/agents/floating-agent.ts`
- `src/lib/agents/floating-agent-client.ts`
- `src/lib/api/floating-agent.ts`
- `src/components/commerce/floating-agent-panel.tsx`
- `src/components/commerce/floating-agent-result-panel.tsx`

Key boundaries:

- Each panel opening starts fresh.
- Stored floating history is not sent to the API.
- Buyer surfaces do not run seller operations.
- Seller surfaces do not run buyer cart operations.
- Approved cart/listing operations use the same shared apply contracts as full agent pages.

## 11. Review Intelligence And Product Warnings

Review intelligence is a separate typed LLM contract.

Important files:

- `src/lib/api/review-intelligence.ts`
- `src/lib/api/seller-action-explanations.ts`
- `src/lib/api/buyer-smart-cart-explanations.ts`
- `src/lib/agents/buyer-profile-product-alerts.ts`

Review intelligence can produce:

- Review clusters.
- Repeated complaint themes.
- Risk summary.
- Listing fix suggestions.
- Seller reply drafts.
- Buyer-facing warning.

Guardrails:

- Source review ids must be from known reviews.
- Theme labels must be from allowed known themes.
- Review intelligence enriches explanations and warnings; it does not mutate product data.

Buyer product warnings combine:

- Buyer profile preferences.
- Previous complaint themes.
- Product reviews and metric risk signals.
- Route context for floating proactive state.

## 12. UI Structure

Primary product surfaces:

- Buyer catalog: `src/components/commerce/buyer-catalog-grid.tsx`
- Buyer cart: `src/components/commerce/buyer-cart-workspace.tsx`
- Buyer profile: `src/components/commerce/buyer-profile-workspace.tsx`
- Seller overview: `src/components/commerce/seller-overview-workspace.tsx`
- Seller products: `src/components/commerce/seller-products-workspace.tsx`
- Seller actions: `src/components/commerce/seller-actions-workspace.tsx`
- Seller profile: `src/components/commerce/seller-profile-workspace.tsx`
- Shared shell: `src/components/commerce/workspace-shell.tsx`

Agent/proof surfaces:

- Buyer Agent: `src/components/commerce/buyer-agent-workspace.tsx`
- Seller Agent: `src/components/commerce/seller-agent-workspace.tsx`
- Floating Agent: `src/components/commerce/floating-agent-panel.tsx`
- Runtime proof: `src/components/commerce/agent-runtime-panel.tsx`
- Execution trace proof: `src/components/commerce/agent-execution-trace-panel.tsx`
- Demo route: `src/components/commerce/demo-rehearsal-workspace.tsx`

The app intentionally keeps technical proof mostly out of buyer/floating user surfaces while exposing it in seller/demo/proof surfaces where it helps technical review.

## 13. Persistence Model

This MVP does not use a real database.

Local storage keys:

- Buyer cart: `commercepilot.buyerCart.v1`
- Buyer profile draft: `commercepilot.buyerProfile.v1`
- Seller profile draft: `commercepilot.sellerProfile.v1`
- Seller listing mutations/audit: `commercepilot.sellerListingMutations.v1`
- Floating Agent controls: `commercepilot.floatingAgent.v1`

The important architectural choice is that apply contracts already exist. Replacing local storage with server persistence should not require the LLM or UI layers to own mutation semantics.

## 14. Verification

Primary command:

```bash
npm run check
```

This runs:

- `eslint`
- `tsc --noEmit`
- `scripts/validate-workflows.js`
- `vitest run src/components/commerce`

Production build:

```bash
npm run build
```

GitHub Actions runs both commands with:

```text
LLM_PROVIDER=deterministic
```

This keeps CI independent of API keys and external LLM availability.

## 15. Current Technical Debt

Known engineering gaps:

- Large workspace components still need more extraction.
- Browser smoke coverage is documented but not yet committed as a repeatable script.
- Persistence is local-only.
- Demo identities are hardcoded.
- LLM latency and telemetry need stronger instrumentation.
- API route tests should be added without requiring a live Next server.

These are known limits, not hidden architecture assumptions.

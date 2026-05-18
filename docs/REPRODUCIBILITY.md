# CommercePilot Reproducibility Guide

This document is for reviewers who want to run the project, verify the technical claims, and understand which parts are real, deterministic, LLM-assisted, or intentionally mocked.

## 1. Environment

Development was validated with:

```text
Node.js 22.22.1
npm 10.9.4
Next.js 16.2.6
```

Install dependencies:

```bash
npm install
```

Optional LLM configuration:

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

The repository can be reviewed without API keys. When a provider is missing or unavailable, supported routes use deterministic fallback behavior.

## 2. One-Command Verification

Run:

```bash
npm run check
```

This command runs:

```text
eslint
tsc --noEmit
node scripts/validate-workflows.js
vitest run src/components/commerce
```

Expected result:

```text
Workflow validation passed.
Test Files  3 passed (3)
Tests       13 passed (13)
```

## 3. Production Build Verification

Run:

```bash
npm run build
```

Expected result:

```text
Compiled successfully
Generating static pages
Finalizing page optimization
```

Then run:

```bash
npm run start
```

Open:

```text
http://localhost:3000
```

## 4. Reviewer Route Order

Use this order for a fast technical review:

| Order | Route | What to inspect |
|---:|---|---|
| 1 | `/demo` | Proof route, runbook, guardrail/agent trace framing. |
| 2 | `/buyer/products` | Catalog contract, product images, categories, sort, cart entry points. |
| 3 | `/buyer/products/calliel-spf50-gunes-kremi` | Product detail, store link, purchase controls, review pagination. |
| 4 | `/buyer/agent` | Catalog-bound recommendation, approval boundary, cart apply preview. |
| 5 | `/buyer/cart` | Local cart mutation and suggested product surface. |
| 6 | `/seller` | Risk cards, deduplicated priority queue, seller decision surface. |
| 7 | `/seller/products` | Product radar, health signals, action links. |
| 8 | `/seller/actions` | Seller action queue and focus filters. |
| 9 | `/seller/agent` | Seller findings, listing draft preview, approval and rollback boundary. |
| 10 | `/seller/profile` | Permission model, alert rules, audit/control settings. |

## 5. Deterministic Technical Claims

These claims can be checked without external services:

- The mock catalog has 48 products.
- The mock review set has 55 reviews.
- Buyer Agent product recommendations are catalog-bound.
- Unsupported catalog families are blocked instead of hallucinated.
- Seller listing mutations require approval before local apply.
- Review intelligence accepts only allowed review ids and allowed themes.
- Buyer cart, buyer profile, seller profile, seller listing audit, and floating controls are local MVP state.

The validation source is:

```text
scripts/validate-workflows.js
```

## 6. LLM-Assisted Claims

The LLM layer is provider-neutral:

```text
src/lib/llm
```

Supported modes:

- `openai`
- `gemini`
- `deterministic`

The LLM can explain, rank, summarize, and draft. It does not directly mutate cart or seller listing state. Mutation payloads are validated by typed application contracts before the client applies them.

## 7. Known Non-Reproducible Parts

The following are intentionally outside MVP scope:

- Real authentication.
- Real database persistence.
- Payment or checkout.
- Real inventory reservation.
- Real shipping/fulfillment integration.
- Production analytics/telemetry.
- Production SKU media.

These are documented as known limitations rather than hidden assumptions.

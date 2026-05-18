# CommercePilot Demo Script

This script is for judges, reviewers, and teammates who want to evaluate CommercePilot quickly without guessing the intended path through the app.

The goal is to show three things:

1. CommercePilot feels like a real buyer/seller commerce product, not a static dashboard.
2. The Agent can recommend, explain, preview, and apply approved actions.
3. The technical boundary is explicit: deterministic commerce logic first, LLM assistance second, typed validation and approval before any mutation.

## 1. Setup

Install and run:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

For production-like local rehearsal:

```bash
npm run build
npm run start
```

Optional LLM setup:

```bash
cp .env.example .env.local
```

Set one provider:

```text
LLM_PROVIDER=openai
OPENAI_API_KEY=...
```

or:

```text
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
```

If keys are missing, supported flows fall back deterministically. CI runs with:

```text
LLM_PROVIDER=deterministic
```

## 2. Pre-Demo Checks

Run these before presenting:

```bash
npm run check
npm run build
```

Expected result:

- Lint passes.
- TypeScript passes.
- Workflow validation passes.
- Component tests pass.
- Next production build completes.

Useful proof files:

- [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- [TECHNICAL_AUDIT_COMPONENT_MOCKS.md](../TECHNICAL_AUDIT_COMPONENT_MOCKS.md)
- [scripts/validate-workflows.js](../scripts/validate-workflows.js)

## 3. Fast Reviewer Path

If someone only has 5 minutes:

1. Open `/demo`.
2. Open `/buyer/products`.
3. Open `/buyer/agent`.
4. Open `/seller`.
5. Open `/seller/agent`.
6. Read [docs/ARCHITECTURE.md](ARCHITECTURE.md).
7. Run `npm run check`.

What they should understand:

- Buyer and seller surfaces are both productized.
- Agent flows are backed by typed contracts.
- The LLM does not directly mutate state.
- Guardrails and approval boundaries are first-class.

## 4. Full Demo Flow

Recommended length: 10 to 12 minutes.

### Opening: Role Gateway

Route:

```text
/
```

Say:

> CommercePilot is a two-sided commerce intelligence platform. Buyers get a familiar shopping experience with an assistant that can build a cart. Sellers get an operations cockpit that turns stock, reviews, returns, margin, and product health into approved actions.

Show:

- Buyer entry.
- Seller entry.
- Demo route if visible.

Technical point:

- The app is split into buyer, seller, agent, and demo surfaces, but they share commerce data and typed agent contracts.

## 5. Buyer Demo

### Step 1: Product Discovery

Route:

```text
/buyer/products
```

Show:

- Category filters.
- Product cards.
- Product images.
- Price, rating, delivery, discount, and add-to-cart controls.

Say:

> The buyer side is intentionally familiar. The Agent does not replace shopping; it works on top of an actual marketplace surface.

Expected result:

- Product grid renders.
- Product card CTAs are visible.
- The user can inspect products before using the Agent.

Technical point:

- Catalog data is contract-driven by `src/lib/api/buyer-catalog.ts`.
- The Agent can only choose from this catalog.

### Step 2: Product Detail

Route:

```text
/buyer/products/clearcam-webcam
```

Show:

- Product media.
- Purchase panel.
- Quantity controls.
- Delivery and campaign information.
- Seller information.

Say:

> Product detail behaves like a commerce page, not an AI answer page. The Agent can help, but product context and purchase controls remain explicit.

Expected result:

- Product detail route works for catalog products.
- Add-to-cart and buy controls are visible.

Technical point:

- Dynamic product routes are generated from the shared product data.

### Step 3: Buyer Agent Recommendation

Route:

```text
/buyer/agent
```

Suggested prompt:

```text
Toplantı için uyumlu kamera mikrofon hub öner.
```

Show:

- Agent answer.
- Recommended catalog products.
- Reasons and risk notes.
- Append/replace cart approval buttons.

Say:

> The Agent can explain and rank, but it is catalog-bound. It cannot invent unsupported products, and it cannot write to the cart until the user chooses append or replace.

Expected result:

- Buyer Agent returns product recommendations.
- Approval buttons are visible.
- If LLM is configured, provider/status is visible where supported; otherwise deterministic fallback keeps the demo working.

Technical point:

- `src/lib/api/buyer-agent.ts` orchestrates deterministic candidates plus LLM JSON.
- `src/lib/agents/buyer-catalog-guardrails.ts` blocks unsupported product families.
- `src/lib/agents/buyer-cart-apply.ts` validates apply payloads.

### Step 4: Cart Apply

Route:

```text
/buyer/cart
```

Show:

- Existing cart items.
- Quantity controls.
- Suggested products.
- Floating Agent panel.

Optional prompt in Floating Agent:

```text
Toplantı için sepetimi tamamla.
```

Say:

> The floating Agent uses the same apply boundary as the full Buyer Agent page. It is not a separate widget with different rules.

Expected result:

- Approved cart mutation updates local cart state.
- Cart quantity controls remain user-editable.

Technical point:

- Client apply is handled by `src/lib/agents/buyer-cart-apply-client.ts` and `src/lib/cart/buyer-cart.ts`.
- State is intentionally localStorage for the MVP.

## 6. Seller Demo

### Step 1: Seller Overview

Route:

```text
/seller
```

Show:

- Four risk cards.
- Priority queue.
- Product distribution.
- Products that need attention.

Say:

> The seller side converts commerce signals into an operations queue: stock risk, negative reviews, return risk, and slow movers.

Expected result:

- Risk cards link to product/action focus routes.
- Priority queue has no duplicate action links.

Technical point:

- Seller overview is built by `src/lib/api/seller.ts`.
- Product health and action priority come from deterministic scoring and workflows.

### Step 2: Seller Product Radar

Route:

```text
/seller/products?focus=stock-risk
```

Show:

- Focus chips.
- Search and sorting.
- Product rows with health, stock, sales, reviews, and risk signals.
- Linked action CTA.

Say:

> Overview cards do not just display metrics. They route into a real product management surface with filters and linked actions.

Expected result:

- Stock-risk filter is active.
- Risk products and linked actions are visible.

Technical point:

- The same seller product contract powers UI and API behavior.

### Step 3: Seller Action Detail

Route:

```text
/seller/actions/restock-ergoflex-calisma-sandalyesi
```

Show:

- Action priority.
- Affected products.
- Work steps.
- Evidence/signal panel.
- Explanation panel.

Say:

> Seller actions are explainable. The user sees affected products and work steps before going to the Agent for a draft or mutation.

Expected result:

- Action detail loads.
- Affected product links are visible.
- Explanation panel is concise and product-facing.

Technical point:

- Action details come from `src/lib/api/seller.ts`.
- Explanations use `src/lib/api/seller-action-explanations.ts`.

### Step 4: Seller Agent Approval And Audit

Route:

```text
/seller/agent
```

Suggested prompt:

```text
Stok riski olan ürünleri göster ve bugün ne yapacağımı sırala.
```

Show:

- Seller findings.
- Action suggestions.
- Listing before/after preview.
- Approval button.
- Audit log.
- Rollback.

Say:

> This is the key technical boundary: the Agent can draft a listing change, but the seller must approve it. Approved changes go into an audit trail, and local rollback is available.

Expected result:

- Draft preview is visible.
- Apply requires explicit click.
- Audit entry appears after apply.
- Rollback can reverse applied local state.

Technical point:

- `src/lib/api/seller-agent.ts` builds the agent result.
- `src/lib/agents/seller-listing-apply.ts` validates apply requests.
- `src/lib/agents/seller-listing-apply-client.ts` writes local override and audit state.

## 7. Floating Agent Demo

### Step 1: Buyer Context

Route:

```text
/buyer/cart
```

Show:

- Open the floating Agent panel.
- Ask a buyer cart question or recommendation prompt.
- Confirm that buyer actions are available.

Say:

> The floating Agent reads route context and exposes buyer capabilities on buyer pages.

Expected result:

- Floating panel opens.
- Buyer-focused prompt routes to buyer-agent behavior when action-oriented.

### Step 2: Seller Context

Route:

```text
/seller/products
```

Show:

- Open floating Agent.
- Ask for seller product/action help.
- Confirm seller-focused behavior.

Say:

> The same mini panel changes capabilities by route. It does not run buyer cart actions on seller pages.

Expected result:

- Seller-focused prompt routes to seller-agent behavior.
- Listing apply still requires approval.

### Step 3: Controls

Route:

```text
/seller/products
```

Show:

- Mute.
- Disable warnings on this page.
- Hide controls if relevant.

Say:

> A proactive Agent needs user controls. CommercePilot keeps mute and page-level controls in local state.

Expected result:

- Floating control state persists locally.

Technical point:

- Floating controls use `commercepilot.floatingAgent.v1`.
- The panel starts fresh and does not send stored history back to the API.

## 8. Review Intelligence Proof

Route:

```text
/seller/actions/review_attention-connectplus-usb-c-hub
```

Show:

- Real review highlights.
- Review-related action summary.
- Seller response or copy suggestion area where visible.

Say:

> Review intelligence is a typed LLM contract. It can cluster and summarize existing reviews, but it cannot invent source review ids or mutate product data.

Expected result:

- Review action page shows actual review content.
- Review risk is grounded in existing product reviews.

Technical point:

- `src/lib/api/review-intelligence.ts` validates source review ids and allowed theme labels.

## 9. Technical Proof Route

Route:

```text
/demo
```

Show:

- Buyer demo lane.
- Seller demo lane.
- Floating Agent lane.
- LLM proof list.
- Agent trace proof list.
- QA checks.

Say:

> The demo route is the proof surface. Product-facing buyer screens stay clean, while `/demo` keeps runtime, LLM, trace, and QA evidence discoverable.

Expected result:

- Runbook lanes are visible.
- QA cards point to `npm run check`, `npm run build`, runtime smoke, and browser rehearsal.

Technical point:

- `/demo` is backed by `src/lib/demo/rehearsal.ts`.

## 10. Guardrail Scenarios

Use these if reviewers ask how hallucination or role mismatch is handled.

### Unsupported Buyer Catalog Prompt

Route:

```text
/buyer/agent
```

Prompt:

```text
iPhone öner
```

Expected:

- Agent should not invent phone products.
- It should return a catalog-boundary answer or fallback behavior.

Proof:

- `src/lib/agents/buyer-catalog-guardrails.ts`
- `scripts/validate-workflows.js`

### Buyer-Seller Role Mismatch

Route:

```text
/buyer/cart
```

Floating prompt:

```text
Stok riski olan ürünleri sırala.
```

Expected:

- Buyer surface should not run seller operations.

### Seller-Buyer Role Mismatch

Route:

```text
/seller/products
```

Floating prompt:

```text
Sepetime 3 ürün ekle.
```

Expected:

- Seller surface should not run buyer cart mutation.

## 11. What To Emphasize

Use these points in the final explanation:

- CommercePilot is not using LLM output as raw truth.
- Deterministic workflows choose the candidate universe.
- LLM output is parsed, normalized, and validated.
- Buyer Agent is catalog-bound.
- Seller Agent is approval-bound.
- Floating Agent shares the same apply contracts as full agent pages.
- Technical proof is visible in `/demo`, docs, validation script, and CI.

## 12. Known Limits To State Clearly

Be direct about these limits:

- Data is curated mock commerce data.
- Auth and database persistence are not implemented.
- Cart/profile/listing audit state is localStorage.
- Product media uses a controlled sprite.
- Payment, order creation, fulfillment, and real inventory reservation are out of scope.

The intended positioning:

> Mock data, real LLM orchestration, typed guardrails, approved local mutations.

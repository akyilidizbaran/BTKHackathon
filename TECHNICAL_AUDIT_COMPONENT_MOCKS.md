# TECHNICAL_AUDIT_COMPONENT_MOCKS

Date: 2026-05-17

## 1) Audit Scope

This audit checks three areas:

* Technical improvements needed before delivery.
* Which large UI modules should be extracted into smaller testable components.
* Which parts of the site are still mock/demo/local-only.

## 2) Tests Run

Commands:

* `npm run check` passed.
* `npm run build` passed.
* `git diff --check` passed.
* `npm run typecheck` passed after component extraction.
* `npm run validate:workflows` now includes extracted component export/use contract checks.
* `npm run test:components` passed with 3 test files and 13 component/user-event tests.

Route smoke:

* `/`, `/buyer/products`, `/buyer/cart`, `/buyer/agent`, `/buyer/profile`, `/buyer/products/ergoflex-calisma-sandalyesi`
* `/seller`, `/seller/products`, `/seller/products/ergoflex-calisma-sandalyesi`, `/seller/actions`, `/seller/actions/restock-ergoflex-calisma-sandalyesi`, `/seller/agent`, `/seller/profile`
* `/demo`

All returned HTTP 200 on `http://localhost:3000`.

API smoke:

* `GET /api/buyer/catalog` returned 48 products.
* `POST /api/agent/floating` chat question returned `mode=chat`.
* `POST /api/agent/floating` buyer action returned `mode=buyer-agent`.
* `POST /api/buyer/agent` returned OpenAI generated recommendations.
* `POST /api/seller/agent` returned OpenAI generated seller findings.
* `POST /api/review-intelligence` returned OpenAI generated review intelligence.
* `GET /api/seller/products`, `/api/seller/actions`, `/api/seller/profile`, `/api/buyer/profile` returned success.

Reviewer proof route table:

| Surface | Route/API | Proof signal |
|---|---|---|
| Role gateway | `/` | Buyer/seller entry points are separated but share one commerce system. |
| Buyer catalog | `/buyer/products` | 48 contract-backed products, category filters, sorting, sprite-backed product images. |
| Buyer product detail | `/buyer/products/calliel-spf50-gunes-kremi` | Purchase panel, store CTA, 4-item review/note pagination, Agent note. |
| Buyer Agent | `/buyer/agent`, `POST /api/buyer/agent` | Catalog-bound recommendation and explicit append/replace approval. |
| Buyer cart | `/buyer/cart` | Local cart state, quantity controls, suggested products. |
| Seller overview | `/seller`, `GET /api/seller/overview` | Risk cards, buyer/seller signal loop and deduplicated priority queue. |
| Seller products | `/seller/products`, `GET /api/seller/products` | Product radar, health score, search/sort/focus filters. |
| Seller actions | `/seller/actions`, `GET /api/seller/actions` | Action queue grouped by focus, product evidence links. |
| Seller action detail | `/seller/actions/[id]`, `GET /api/seller/actions/[id]` | Work steps, affected products, explanation contract, review highlights where relevant. |
| Seller Agent | `/seller/agent`, `POST /api/seller/agent` | Findings, draft listing preview, approval and local rollback boundary. |
| Floating Agent | `POST /api/agent/floating` | Route-aware buyer/seller/chat modes and role mismatch guardrails. |
| Review Intelligence | `POST /api/review-intelligence` | Source review id/theme constrained LLM contract. |
| Demo proof | `/demo` | Human-readable runbook and proof stack for jury/reviewer walkthrough. |

Puppeteer component smoke:

* `BuyerCatalogGrid`: horizontal slider exists, 48 product cards render, faded cards are gone, add-to-cart writes to local cart state.
* `BuyerProfileWorkspace`: review pagination exists and can move to page 2.
* `FloatingAgentPanel`: chat question stays chat-only; follow-up buyer action produces product recommendation and approval buttons.
* `FloatingAgentPanel` fresh-session guard: unsupported `iPhone` prompt produced catalog boundary, no apply buttons rendered, reopen started fresh, textarea stayed empty and persisted history length stayed 0.
* Agent hallucination guard: unsupported `PlayStation` prompt, buyer-role seller operation prompt, seller-role buyer cart prompt and stale `iPhone` LLM narrative are blocked/sanitized in validation.
* Buyer profile/product warning: `/buyer/products/ergoflex-calisma-sandalyesi` produces a profile-based fast-shipping warning for Aylin and pushes it into Floating Agent proactive state.
* `SellerProductsWorkspace`: products render with selected evidence rail.
* `SellerActionsWorkspace`: action cards and detail links render.
* Component extraction pass: `/buyer/agent` still renders Buyer composer, FAQ and approval panel without technical trace; Floating panel opens with empty textarea and route default as placeholder; `/seller/agent` still renders tool-calling trace, listing snapshots, approval button and audit log.

Component test coverage:

* `buyer-agent-panels.test.tsx`: conversation copy, recommendation card links, approval append/replace callbacks, disabled apply state and FAQ expansion.
* `floating-agent-result-panel.test.tsx`: buyer result append/replace, loading disabled state, seller draft apply/rollback and null render for missing role data.
* `seller-agent-listing-panels.test.tsx`: before/after snapshots, draft delta rows, empty audit state, apply callback, rollback callback, applied/rolled-back/error notices.

## 3) Issue Found And Fixed During Audit

Floating Agent had a multi-turn risk:

* The textarea used the route default prompt as an actual value.
* When a user typed after an existing message, the new prompt could concatenate with the previous/default prompt.
* In a chat-to-action sequence, this could keep the request in chat mode instead of routing to buyer-agent.

Fix applied:

* Floating textarea now uses `placeholder={context.defaultPrompt}` and starts empty.
* After a successful send, the textarea clears.
* Floating intent router now overrides history/model misroutes when the current prompt is clearly an agentic buyer/seller action.
* Validation now protects this behavior.

Second guard added after unsupported catalog testing:

* Floating panel now keeps only in-panel ephemeral `sessionTurns` and sends `history: []` to `/api/agent/floating`.
* Each panel opening resets prompt, result cards, apply state and local chat turns.
* Buyer prompts for clearly unsupported product families such as iPhone/phone/console/TV/white goods/shoes return a catalog-boundary chat answer instead of `buyer-agent` recommendations.
* If an LLM/model override returns a stale `actionPrompt`, explicit current buyer/seller action prompts win before the downstream Agent contract runs.
* Validation checks `history: []`, `openFreshSession`, no persistent `appendFloatingAgentTurn` use in the panel, unsupported catalog boundary and stale `actionPrompt` override.

Third guard added after manual hallucination testing:

* `src/lib/agents/buyer-catalog-guardrails.ts` centralizes unsupported buyer catalog detection.
* `/api/buyer/agent` now rejects unsupported catalog prompts before smart-cart orchestration.
* Floating Agent now blocks role mismatch: buyer panel does not run seller operations, seller panel does not run buyer cart/hediye commands.
* Buyer Agent LLM narrative fields are sanitized if they mention unsupported catalog terms such as `iPhone`.
* Smart-cart budget extraction now supports written Turkish amounts such as `iki bin tl`.
* `src/lib/agents/buyer-profile-product-alerts.ts` computes buyer product-detail warnings from profile preferences, previous complaint themes and product review/metric risk signals.

## 4) Component Extraction Status And Priority

Completed first extraction pass:

| Area | New file | Kept in orchestration file |
|---|---|---|
| Floating Agent result/apply UI | `src/components/commerce/floating-agent-result-panel.tsx` | `src/components/commerce/floating-agent-panel.tsx` keeps route context, prompt submit, buyer/seller apply and controls. |
| Buyer Agent panels | `src/components/commerce/buyer-agent-panels.tsx` | `src/components/commerce/buyer-agent-workspace.tsx` keeps prompt/API request, profile selection, cart count and apply state. |
| Seller listing approval UI | `src/components/commerce/seller-agent-listing-panels.tsx` | `src/components/commerce/seller-agent-workspace.tsx` keeps prompt/API request, audit state, product findings, runtime and trace proof. |

Current line counts after first pass:

| File | Lines |
|---|---:|
| `src/components/commerce/floating-agent-panel.tsx` | 452 |
| `src/components/commerce/floating-agent-result-panel.tsx` | 149 |
| `src/components/commerce/buyer-agent-workspace.tsx` | 377 |
| `src/components/commerce/buyer-agent-panels.tsx` | 341 |
| `src/components/commerce/seller-agent-workspace.tsx` | 740 |
| `src/components/commerce/seller-agent-listing-panels.tsx` | 231 |

Current largest UI modules:

| Priority | File | Lines | Why it should be extracted |
|---|---:|---:|---|
| P0 | `src/components/commerce/seller-profile-workspace.tsx` | 1010 | Too many form controls, permission cards, notification controls, alert rules and status panels in one file. |
| P0 | `src/components/commerce/seller-agent-workspace.tsx` | 740 | Product findings, conversation, evidence panels and trace/sidebar still remain; listing approval was extracted. |
| P1 | `src/components/commerce/buyer-agent-workspace.tsx` | 377 | First pass completed; next risk is adding dedicated component/user-event tests. |
| P1 | `src/components/commerce/seller-actions-workspace.tsx` | 676 | Filter state, action cards, selected rail and empty state are coupled. |
| P1 | `src/components/commerce/seller-products-workspace.tsx` | 668 | Filter/search/sort, product rows and selected rail should be split. |
| P1 | `src/components/commerce/demo-rehearsal-workspace.tsx` | 656 | Demo proof cards and runbook cards are static render components that can be extracted. |
| P1 | `src/components/commerce/buyer-profile-workspace.tsx` | 605 | Profile form, preference chips, color editor and review pagination should be split. |
| P1 | `src/components/commerce/floating-agent-panel.tsx` | 452 | Result cards are extracted; remaining split candidates are history, prompt form and controls. |

Recommended extraction order:

1. `SellerAgentWorkspace`: extract `SellerAgentConversation`, `SellerProductFindingCard`, `EvidenceSummaryPanel`, `NextStepsPanel`.
2. `FloatingAgentPanel`: extract `FloatingChatHistory`, `FloatingPromptForm`, `FloatingControls`.
3. `SellerProfileWorkspace`: extract reusable form controls first, then permission/capability/audit sections.
4. `SellerProductsWorkspace` and `SellerActionsWorkspace`: extract list item cards and selected rail components.
5. Add broader user-event tests for profile pagination/forms, seller filters and floating prompt submit flows.

## 5) Test Infrastructure Status

Dedicated component test stack is now present in `package.json`.

Current coverage is:

* `eslint`
* `tsc --noEmit`
* `scripts/validate-workflows.js`
* `vitest` + `jsdom`
* React Testing Library + User Event
* manual/automated HTTP smoke
* Puppeteer smoke

What is still missing:

* Broader user-event tests for full forms, filters and pagination.
* API route tests that run without a live Next server.
* Browser regression tests committed as repeatable scripts.

Recommended next test expansion:

* Vitest for pure functions and API contract builders.
* More React Testing Library coverage for seller profile, buyer profile and product/action list filters.
* Committed Puppeteer smoke script for buyer/seller/floating critical paths.

## 6) Mock / Demo / Local-Only Inventory

Mock data source:

* `src/data/mock/*`: products, reviews, orders, carts, inventory events, relations, buyers and sellers.
* `src/lib/data/*`: reads only local mock data.

Mock commerce contracts:

* `src/lib/api/buyer-catalog.ts`: `source: "mock-commerce-catalog"`.
* `src/lib/api/seller.ts`: `source: "mock-workflow"` and `demoSellerId = "seller-commercepilot"`.
* `src/lib/api/buyer-profile.ts`: `source: "buyer-profile-mock"`.
* `src/lib/api/seller-profile.ts`: `source: "seller-profile-mock"`.

Local-only state:

* Buyer cart: `commercepilot.buyerCart.v1` in `localStorage`.
* Buyer profile draft: `commercepilot.buyerProfile.v1` in `localStorage`.
* Seller profile draft: `commercepilot.sellerProfile.v1` in `localStorage`.
* Seller listing mutation/audit store: `commercepilot.sellerListingMutations.v1` in `localStorage`.
* Floating Agent control state: `commercepilot.floatingAgent.v1` in `localStorage`; legacy `history` may exist in the store shape but the current panel does not persist new chat turns or send stored history to the API.

Mock mutations:

* Buyer cart apply validates payload server-side, then client writes to `localStorage`.
* Seller listing apply validates preview/apply server-side, then client writes override and audit log to `localStorage`.
* Rollback is client-side over the local audit store.

Mock visual assets:

* Product/category imagery uses the shared sprite `public/catalog/buyer-product-sprite.png`.
* This is acceptable for demo, but weaker than product-specific assets for final presentation polish.

LLM fallback/demo behavior:

* Initial GET/default agent data is deterministic and does not call LLM.
* Live POST agent/explanation endpoints call the configured provider, with deterministic fallback if provider/key/model output fails.
* Gemini final provider switch is still planned for 9A.

Not real yet:

* Authentication/session/roles.
* Database persistence.
* Payment/checkout/order creation.
* Real inventory reservation.
* Real shipping/fulfillment.
* Real seller account management.
* Server-side audit trail.
* Server-side cart/profile persistence.
* Product image generation per SKU.
* Production analytics/telemetry.

## 7) Technical Improvements To Prioritize

1. Add repeatable test stack.
   Current validation is strong for data/workflow contracts, but not enough for component behavior. Add Vitest + React Testing Library and turn the Puppeteer smoke cases above into a script.

2. Extract large workspace components.
   The biggest risk is not runtime failure; it is future edits breaking UI behavior because too many concerns live in each workspace file.

3. Replace localStorage persistence with a server persistence boundary.
   Cart, profile, floating history, seller listing audit and rollback should eventually move behind API/storage interfaces.

4. Add auth/session abstraction.
   `buyer-aylin` and `seller-commercepilot` are hardcoded demo identities. This should become a typed session/user context before any real deployment story.

5. Improve LLM latency and observability.
   Smoke showed generated calls can take several seconds, with seller agent around 10s in one run. Add request timeout, latency metadata, UI loading thresholds and provider telemetry.

6. Strengthen intent router tests.
   The audit already found one chat-to-action issue. Keep adding adversarial multi-turn tests: help question -> product task, product task -> safety question, seller action -> rollback question.

7. Move technical proof away from user surfaces but keep `/demo` proof strong.
   Buyer/Floating should stay product-like; `/demo`, validation and API contracts should carry jury proof.

8. Decide what remains intentionally mock for delivery.
   Real operations are out of scope, but the presentation should state clearly: "mock data, real LLM orchestration, typed guardrails, local approved mutations."

## 8) Current Assessment

Technically the project is coherent for a hackathon product:

* The app is not just static TSX; it has typed API contracts, workflow validation, LLM provider abstraction, agent guardrails and approval boundaries.
* The biggest remaining weakness is test isolation and persistence, not the core agent architecture.
* The clearest next engineering step is extracting components plus adding component tests before adding more features.

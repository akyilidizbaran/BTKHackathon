# Validation Output Reference

This file records the expected high-signal output of the deterministic workflow validator.

Run:

```bash
npm run validate:workflows
```

Current expected output:

```text
Workflow validation passed.
Products: 48
Reviews: 55
Seller actions: 5
Seller action detail endpoint: /api/seller/actions/restock-ergoflex-calisma-sandalyesi
Seller action explanation endpoint: /api/seller/actions/restock-ergoflex-calisma-sandalyesi/explanation
Review intelligence endpoint: /api/review-intelligence
Buyer smart cart explanation endpoint: /api/buyer/smart-cart/explanation
Seller API products: 48
Seller buyer signals: 15
Buyer catalog products: 48
Buyer agent endpoint: /api/buyer/agent
Seller agent endpoint: /api/seller/agent
Floating agent endpoint: /api/agent/floating
Shared agent runtime endpoint: /api/agent/runtime
Seller profile endpoint: /api/seller/profile
Buyer profile endpoint: /api/buyer/profile
Buyer API examples: 5
Buyer prompts: 7
```

The validator is intentionally more than a smoke command. It checks that the core demo stories still line up across mock data, scoring, workflows, API contracts, agent runtime, guardrails, and extracted UI contracts.

Important source:

```text
scripts/validate-workflows.js
```

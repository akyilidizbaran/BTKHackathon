# Validation Çıktısı Referansı

Bu dosya, deterministik workflow validator için beklenen yüksek sinyalli çıktıyı kaydeder.

Çalıştırın:

```bash
npm run validate:workflows
```

Güncel beklenen çıktı:

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

Validator yalnızca smoke komutu değildir. Core demo hikayelerinin mock data, scoring, workflow, API contract, agent runtime, guardrail ve ayrıştırılmış UI contract'ları boyunca hâlâ tutarlı kaldığını kontrol eder.

Önemli kaynak:

```text
scripts/validate-workflows.js
```

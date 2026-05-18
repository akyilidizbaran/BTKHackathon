# Alışveriş Arkadaşım Mimarisi

Bu doküman, Alışveriş Arkadaşım'ın içeride nasıl çalıştığını açıklar. Amaç, teknik inceleyicinin her route ve component'i tek tek okumadan önce mühendislik yapısını hızlıca anlamasıdır.

## 1. Sistem Özeti

Alışveriş Arkadaşım, deterministik commerce logic ile LLM destekli dil/sıralama katmanını kesin şekilde ayırır.

```text
curated commerce dataset
  -> runtime mock data helper'ları
  -> Supabase Postgres migration + seed kopyası
  -> deterministik scoring modülleri
  -> workflow builder'ları
  -> UI/API contract builder'ları
  -> gerektiğinde LLM orchestration
  -> typed validation ve guardrail'ler
  -> kullanıcı onayı
  -> deterministik local apply fonksiyonları
```

LLM hiçbir zaman source of truth değildir. Açıklama yapabilir, sıralayabilir, draft üretebilir ve özetleyebilir. Ürün seçimi, mutation payload'ları, katalog sınırları, onay gereklilikleri ve rollback davranışı typed application contract'ları tarafından korunur.

## 2. Teknik İnceleyici Kanıt Haritası

Bu tablo, ana teknik iddiaları teknik inceleyicinin önce incelemesi gereken dosyalarla eşler.

| İddia | Ana dosyalar | Nasıl doğrulanır |
|---|---|---|
| Catalog ve commerce state rastgele fixture değil, curated dataset'tir. | `src/data/mock/*`, `prisma/schema.prisma`, `prisma/seed.ts` | `npm run validate:workflows` çalıştırın; Supabase P1 için `npm run db:migrate:deploy` ve `npm run db:seed` akışını inceleyin. |
| Product health ve seller action'lar deterministik scoring'den gelir. | `src/lib/scoring/*`, `src/lib/workflows/seller-actions.ts`, `src/lib/workflows/product-health.ts` | Score evidence alanlarını inceleyin ve `npm run check` çalıştırın. |
| Buyer önerileri katalogla sınırlıdır. | `src/lib/workflows/buyer-smart-cart.ts`, `src/lib/api/buyer-agent.ts`, `src/lib/agents/buyer-catalog-guardrails.ts` | Telefon/konsol gibi desteklenmeyen prompt'ları deneyin; validation fake ürünleri engeller. |
| LLM çıktısı UI/apply kullanımından önce validate edilir. | `src/lib/llm/json.ts`, `src/lib/api/buyer-agent.ts`, `src/lib/api/seller-agent.ts`, `src/lib/api/review-intelligence.ts` | Validator fonksiyonlarını ve fallback yollarını inceleyin. |
| Cart ve seller listing mutation'ları onay ister. | `src/lib/agents/buyer-cart-apply.ts`, `src/lib/agents/seller-listing-apply.ts`, client apply helper'ları | `/buyer/agent` ve `/seller/agent` akışlarını izleyin; apply butonları açık kullanıcı aksiyonudur. |
| Floating Agent, route agent boundary'lerini paylaşır. | `src/lib/api/floating-agent.ts`, `src/components/commerce/floating-agent-panel.tsx` | Role mismatch ve unsupported catalog prompt'ları engellenir. |
| CI API key olmadan çalışabilir. | `.github/workflows/ci.yml`, `src/lib/llm/*`, `scripts/validate-workflows.js` | CI deterministic provider modunda `check` ve `build` çalıştırır. |

## 3. Katman Haritası

```text
src/data/mock
  Products, sellers, buyers, orders, reviews, carts, inventory events, relations.

prisma
  Supabase/Postgres schema, migration ve curated dataset seed script'i.

src/lib/data
  Runtime'da hâlâ mock dataset üzerinde read helper'ları ve birleşik commerce view'ları.

src/lib/scoring
  Product health, inventory, reviews, listing, returns, shipping, profitability
  ve promotion-readiness skorları.

src/lib/workflows
  Buyer smart cart, seller growth actions ve product health analysis gibi use-case workflow'ları.

src/lib/api
  App Router page'leri ve API route'ları tarafından paylaşılan typed contract builder'lar.

src/lib/llm
  Provider-neutral text/JSON generation, OpenAI adapter, Gemini adapter,
  deterministic fallback, JSON extraction ve normalization helper'ları.

src/lib/agents
  Runtime registry, tool metadata, route/floating context, catalog guardrail'leri,
  profile warning'leri, apply contract'ları, local apply helper'ları, audit ve rollback.

src/components/commerce
  Buyer/seller ürün yüzeyleri, agent UI, proof/demo UI ve ayrıştırılmış paneller.

src/app
  Next.js App Router page ve API route'ları.
```

## 4. Veri ve Scoring

Uygulama runtime'da `src/data/mock` içindeki curated mock data ile başlar. Mock data rastgele fixture gibi değil, demo hikayelerini taşıyacak şekilde tasarlanmıştır. Aynı dataset P1 database readiness adımı olarak Prisma migration ve `prisma/seed.ts` ile Supabase Postgres'e taşındı.

Önemli giriş noktaları:

- `src/data/mock/products.ts`
- `src/data/mock/reviews.ts`
- `src/data/mock/orders.ts`
- `src/data/mock/inventory-events.ts`
- `src/data/mock/product-relations.ts`
- `src/data/mock/buyers.ts`
- `src/data/mock/sellers.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260518190000_init_commercepilot_schema/migration.sql`
- `prisma/seed.ts`

Scoring katmanı `src/lib/scoring` altında yaşar ve ham commerce sinyallerini açıklanabilir skorlara çevirir:

- Inventory risk.
- Review ve sentiment risk.
- Listing quality.
- Return risk.
- Shipping reliability.
- Profitability ve margin pressure.
- Promotion readiness.
- Aggregate product health.

`src/lib/workflows` altındaki workflow'lar bu skorları kullanarak use-case çıktıları üretir:

- `buyer-smart-cart.ts` buyer recommendation candidate'ları üretir.
- `seller-actions.ts` seller growth/action recommendation'ları üretir.
- `product-health.ts` ürün bazlı health analysis üretir.

## 5. API Contract Pattern

Alışveriş Arkadaşım, page ve API route arasında logic tekrarını önler. `src/lib/api` içindeki shared builder'lar typed data contract üretir; route handler'lar ve server component'ler aynı builder'ları kullanır.

Örnekler:

- `src/lib/api/buyer-catalog.ts`, buyer catalog UI ve `GET /api/buyer/catalog` için veri üretir.
- `src/lib/api/buyer-agent.ts`, `/buyer/agent` ve `POST /api/buyer/agent` akışını besler.
- `src/lib/api/seller.ts`, seller overview, products, actions, product health ve buyer signals yüzeylerini besler.
- `src/lib/api/seller-agent.ts`, `/seller/agent` ve `POST /api/seller/agent` akışını besler.
- `src/lib/api/floating-agent.ts`, floating panel API'sini besler.
- `src/lib/api/review-intelligence.ts`, review intelligence contract'ını üretir.

API envelope konvansiyonu:

```text
success/data/error
```

Shared response helper'ları:

```text
src/lib/api/responses.ts
```

## 6. LLM Provider Katmanı

LLM katmanı provider bağımsız tasarlanmıştır.

Önemli dosyalar:

- `src/lib/llm/index.ts`
- `src/lib/llm/common.ts`
- `src/lib/llm/openai.ts`
- `src/lib/llm/gemini.ts`
- `src/lib/llm/json.ts`
- `src/lib/llm/types.ts`

Desteklenen sağlayıcı modları:

- `openai`
- `gemini`
- `deterministic`

Ortam değişkeni isimleri:

```text
LLM_PROVIDER
OPENAI_MODEL
OPENAI_API_KEY
GEMINI_MODEL
GEMINI_API_KEY
```

Hackathon sunumunda ana pozisyon Gemini veya deterministik fallback olmalıdır. OpenAI adapter'ı provider abstraction kanıtı ve lokal geliştirme esnekliği için bulunur.

Structured generation `generateLlmJson<T>()` üzerinden yapılır. Bu helper JSON çıkarır, string/array normalize eder, caller-provided validator çalıştırır ve parsing/validation başarısız olursa deterministik fallback'e döner.

Bu kritik çünkü Alışveriş Arkadaşım LLM çıktısını yalnızca type-level ve domain-level validation sonrası kullanır.

## 7. Agent Runtime

Shared agent runtime registry:

```text
src/lib/agents/runtime.ts
```

Bu katman şunları tanımlar:

- Prompt template'leri.
- Tool registry.
- Tool plan'ları.
- Runtime snapshot'ları.
- Guardrail özetleri.
- Application-level execution trace metadata.

Mevcut high-level agent rolleri:

- `buyer`
- `seller`

Mevcut surface'ler:

- `route`
- `floating`

Önemli runtime kavramları:

- Prompt template'leri max prompt length, role, endpoint ve response contract bilgisi taşır.
- Tool definition'ları approval gerekip gerekmediğini belirtir.
- Trace item'ları workflow, context, LLM, tool, guardrail ve approval katmanlarını açıklar.
- Runtime snapshot'ları `/demo` ve teknik proof yüzeylerinde agent'ın ne yapabileceğini gösterir.

## 8. Buyer Agent Akışı

Buyer agent akışı katalogla sınırlıdır.

```text
User prompt
  -> validateBuyerAgentRequest
  -> buyer catalog + profile + smart-cart workflow
  -> message, ranking, reasons, risk notes için LLM JSON orchestration
  -> product id whitelist ve unsupported catalog guardrail'leri
  -> BuyerAgentApiData
  -> kullanıcı append veya replace seçer
  -> /api/buyer/agent/apply validation
  -> buyer-cart-apply-client local cart state'e yazar
```

Önemli dosyalar:

- `src/lib/api/buyer-agent.ts`
- `src/lib/agents/buyer-catalog-guardrails.ts`
- `src/lib/agents/buyer-cart-apply.ts`
- `src/lib/agents/buyer-cart-apply-client.ts`
- `src/lib/cart/buyer-cart.ts`
- `src/components/commerce/buyer-agent-workspace.tsx`
- `src/components/commerce/buyer-agent-panels.tsx`

Ana boundary'ler:

- Buyer Agent yalnızca mevcut katalog ürünlerini önerebilir.
- Desteklenmeyen ürün aileleri fake recommendation yerine boundary answer döndürür.
- Cart mutation'ları açık kullanıcı aksiyonu gerektirir.
- Apply deterministiktir ve validated payload üzerinden client-side çalışır.

## 9. Seller Agent Akışı

Seller agent akışı approval-bound tasarlanmıştır.

```text
User prompt
  -> validateSellerAgentRequest
  -> seller products + seller actions workflows
  -> focus, ranking, reasons, draft listing text için LLM JSON orchestration
  -> product/action id whitelist ve mutation shape validation
  -> SellerAgentApiData
  -> before/after listing preview
  -> user approval
  -> /api/seller/agent/apply validation
  -> seller-listing-apply-client local override ve audit entry yazar
  -> rollback applied local audit entry'leri geri alabilir
```

Önemli dosyalar:

- `src/lib/api/seller-agent.ts`
- `src/lib/agents/seller-listing-apply.ts`
- `src/lib/agents/seller-listing-apply-client.ts`
- `src/components/commerce/seller-agent-workspace.tsx`
- `src/components/commerce/seller-agent-listing-panels.tsx`

Ana boundary'ler:

- Seller Agent listing, price, campaign, stock veya copy alanlarını onay olmadan değiştiremez.
- LLM-generated draft'lar shared listing mutation preview contract'ına normalize edilir.
- Audit ve rollback MVP'de yalnızca lokaldir; buna rağmen apply boundary açıktır.

## 10. Floating Agent Akışı

Floating agent ayrı bir oyuncak widget değildir. Route-level buyer/seller agent'larla aynı runtime ve apply boundary'lerini paylaşır.

```text
Mevcut route
  -> createFloatingAgentContext
  -> default role/context/capability hints
  -> user prompt
  -> validateFloatingAgentRequest
  -> route/role intent guardrail'leri
  -> buyer-agent, seller-agent veya chat mode
  -> approved apply shared buyer/seller apply helper'larını kullanır
```

Önemli dosyalar:

- `src/lib/agents/floating-agent.ts`
- `src/lib/agents/floating-agent-client.ts`
- `src/lib/api/floating-agent.ts`
- `src/components/commerce/floating-agent-panel.tsx`
- `src/components/commerce/floating-agent-result-panel.tsx`

Ana boundary'ler:

- Her panel açılışı temiz başlar.
- Stored floating history API'ye gönderilmez.
- Buyer surface seller operation çalıştırmaz.
- Seller surface buyer cart operation çalıştırmaz.
- Onaylı cart/listing operation'ları full agent page'leriyle aynı shared apply contract'larını kullanır.

## 11. Review Intelligence ve Product Warning'ler

Review intelligence ayrı bir typed LLM contract'tır.

Önemli dosyalar:

- `src/lib/api/review-intelligence.ts`
- `src/lib/api/seller-action-explanations.ts`
- `src/lib/api/buyer-smart-cart-explanations.ts`
- `src/lib/agents/buyer-profile-product-alerts.ts`

Review intelligence şu çıktıları üretebilir:

- Review cluster'ları.
- Tekrar eden complaint theme'leri.
- Risk summary.
- Listing fix suggestion'ları.
- Seller reply draft'ları.
- Buyer-facing warning.

Guardrail'ler:

- Source review id'leri bilinen yorumlardan gelmelidir.
- Theme label'ları izinli known theme setinden gelmelidir.
- Review intelligence açıklama ve warning'leri zenginleştirir; product data'yı mutate etmez.

Buyer product warning'leri şunları birleştirir:

- Buyer profile tercihleri.
- Önceki complaint theme'leri.
- Product review ve metric risk sinyalleri.
- Floating proactive state için route context.

## 12. UI Yapısı

Ana ürün yüzeyleri:

- Buyer catalog: `src/components/commerce/buyer-catalog-grid.tsx`
- Buyer cart: `src/components/commerce/buyer-cart-workspace.tsx`
- Buyer profile: `src/components/commerce/buyer-profile-workspace.tsx`
- Seller overview: `src/components/commerce/seller-overview-workspace.tsx`
- Seller products: `src/components/commerce/seller-products-workspace.tsx`
- Seller actions: `src/components/commerce/seller-actions-workspace.tsx`
- Seller profile: `src/components/commerce/seller-profile-workspace.tsx`
- Shared shell: `src/components/commerce/workspace-shell.tsx`

Agent/proof yüzeyleri:

- Buyer Agent: `src/components/commerce/buyer-agent-workspace.tsx`
- Seller Agent: `src/components/commerce/seller-agent-workspace.tsx`
- Floating Agent: `src/components/commerce/floating-agent-panel.tsx`
- Runtime proof: `src/components/commerce/agent-runtime-panel.tsx`
- Execution trace proof: `src/components/commerce/agent-execution-trace-panel.tsx`
- Demo route: `src/components/commerce/demo-rehearsal-workspace.tsx`

Uygulama, teknik proof bilgisini buyer/floating kullanıcı yüzeylerinden büyük ölçüde uzak tutar; bu bilgiyi teknik inceleme için seller/demo/proof yüzeylerinde görünür kılar.

## 13. Persistence Modeli

Bu MVP'de Supabase Postgres schema/migration/seed hazırdır ve curated dataset DB'ye yazılmıştır. Ancak uygulamanın runtime read layer'ı bilinçli olarak hâlâ `src/lib/data/*` mock helper'ları üzerinden çalışır. Cart, profile ve listing audit gibi kullanıcıya ait mutable state'ler P2 öncesinde server-backed persistence'a taşınmadı.

Local storage key'leri:

- Buyer cart: `commercepilot.buyerCart.v1`
- Buyer profile draft: `commercepilot.buyerProfile.v1`
- Seller profile draft: `commercepilot.sellerProfile.v1`
- Seller listing mutations/audit: `commercepilot.sellerListingMutations.v1`
- Floating Agent controls: `commercepilot.floatingAgent.v1`

Önemli mimari karar, apply contract'larının şimdiden var olmasıdır. Local storage'ı server persistence ile değiştirmek LLM veya UI katmanının mutation semantics sahibi olmasını gerektirmemelidir.

DB readiness dosyaları:

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `docs/SUPABASE_DATABASE.md`

## 14. Doğrulama

Ana komut:

```bash
npm run check
```

Bu komut şunları çalıştırır:

- `eslint`
- `tsc --noEmit`
- `scripts/validate-workflows.js`
- `vitest run src/components/commerce`

Production build:

```bash
npm run build
```

GitHub Actions iki komutu da şu provider moduyla çalıştırır:

```text
LLM_PROVIDER=deterministic
```

Böylece CI API key ve harici LLM erişimine bağımlı kalmaz.

## 15. Güncel Teknik Borç

Bilinen mühendislik boşlukları:

- Büyük workspace component'leri daha fazla ayrıştırılmalı.
- Browser smoke coverage dokümante edildi ama tekrar çalıştırılabilir script olarak commitlenmedi.
- Persistence yalnızca lokal.
- Demo identity'ler hardcoded.
- LLM latency ve telemetry daha güçlü instrumentation gerektiriyor.
- Canlı Next server gerektirmeyen API route testleri eklenmeli.

Bunlar gizlenen mimari varsayımlar değil, bilinen limitlerdir.

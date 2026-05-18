# Alışveriş Arkadaşım

[![CI](https://github.com/akyilidizbaran/BTKHackathon/actions/workflows/ci.yml/badge.svg)](https://github.com/akyilidizbaran/BTKHackathon/actions/workflows/ci.yml)

Alışveriş Arkadaşım, hackathon MVP'si olarak geliştirilmiş çift taraflı bir ticaret zekası platformudur. Alıcı tarafında tanıdık bir marketplace deneyimi, satıcı tarafında operasyon paneli ve iki tarafın üzerinde çalışan context-aware bir commerce agent bulunur. Agent; açıklama yapabilir, ürün önerebilir, satıcı aksiyonlarını önizleyebilir ve yalnızca kullanıcı onayı sonrası geçerli aksiyonları uygulayabilir.

Çekirdek teknik fikir:

```text
curated commerce verisi
  -> deterministik scoring ve workflow'lar
  -> LLM intent, sıralama, açıklama ve draft üretimi
  -> typed validation ve guardrail'ler
  -> kullanıcı onayı
  -> deterministik apply fonksiyonları
```

Bu proje statik bir UI prototipi değildir. Uygulama typed API contract'ları, workflow validation, LLM provider abstraction, katalog/rol guardrail'leri, approval boundary'leri, local mutation/audit store'ları, component testleri ve tekrar çalıştırılabilir validation script'i içerir.

## Jüri Hızlı Akış

Hackathon jürisi için en kısa inceleme yolu:

1. Deploy edilmiş uygulamayı açın.
2. `/demo` rotasından ürün hikayesini görün.
3. `/buyer/products` üzerinden marketplace yüzeyini inceleyin.
4. `/buyer/agent` ile katalogdan sepet önerisi alın ve onay sınırını görün.
5. `/seller` ve `/seller/actions` ile satıcı risk/aksiyon yüzeyini inceleyin.
6. `/seller/agent` ile listing draft preview, onay ve rollback sınırını görün.
7. Teknik kanıt için `npm run check` ve [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) dosyasına bakın.

## Teknik İnceleyici Hızlı Çalıştırma

Kod inceleyicisi için en hızlı tekrar üretilebilir yol:

```bash
npm install
npm run check
npm run build
npm run start
```

Sonra açın:

```text
http://localhost:3000
```

Önerilen inceleme sırası:

1. `npm run check` çalıştırın ve workflow validation çıktısını inceleyin.
2. Kanıt odaklı walkthrough için `/demo` rotasını açın.
3. `/buyer/products`, `/buyer/agent`, `/seller` ve `/seller/agent` rotalarını açın.
4. [docs/REPRODUCIBILITY.md](docs/REPRODUCIBILITY.md) ve [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) dosyalarını okuyun.

Uygulama API key olmadan da incelenebilir. LLM key yoksa desteklenen akışlar deterministik fallback davranışına döner.

Hackathon tesliminde demo anlatısı Gemini veya deterministik fallback üzerinden kurulmalıdır. OpenAI adapter'ı provider bağımsız mimariyi göstermek ve lokal geliştirme esnekliği sağlamak için kodda durur; final sunumun ana iddiası OpenAI bağımlılığı değildir.

## Güncel Durum

Alışveriş Arkadaşım, teslim edilebilir hackathon MVP seviyesindedir.

Bilinçli olarak gerçek olan kısımlar:

- Buyer ve seller uygulama yüzeyleri Next.js App Router, React, TypeScript ve Tailwind CSS ile geliştirildi.
- Product health, stock risk, review risk, return risk, profitability, listing quality ve promotion readiness için deterministik commerce scoring katmanı var.
- Buyer Agent ve Seller Agent API contract'ları LLM destekli orchestration ile çalışır.
- OpenAI, Gemini ve deterministic fallback destekleyen provider bağımsız LLM katmanı var.
- LLM çıktıları UI veya apply contract'larına girmeden önce structured JSON parsing ve validation'dan geçer.
- Catalog hallucination, role mismatch, stale LLM action prompt ve onaysız mutation davranışlarını engelleyen guardrail'ler var.
- Buyer cart apply ve seller listing apply akışları açık kullanıcı onayı ister.
- Seller listing mutation'ları için local audit ve rollback davranışı var.
- Ayrıştırılmış agent panelleri ve workflow contract validation için testler bulunur.
- Curated commerce dataset Prisma migration ve seed script'iyle Supabase Postgres'e taşındı; DB tabloları ve seed sayıları doğrulandı.

Bilinçli olarak mock veya yalnızca lokal olan kısımlar:

- Runtime data access hâlâ `src/data/mock` helper'larından okur; Supabase kopyası P1 database readiness kanıtıdır.
- Kimlik doğrulama, ödeme, stok rezervasyonu ve fulfillment hackathon MVP kapsamı dışındadır.
- Buyer cart, buyer profile, seller profile, seller listing audit ve floating agent controls `localStorage` kullanır.
- Ürün görselleri gerçek SKU medyası yerine kontrollü sprite asset kullanır.

## Demo Rotaları

Ürünü hızlı incelemek için ana rotalar:

- `/` - rol giriş ekranı.
- `/buyer/products` - kategori, sıralama, ürün kartları ve sepet girişleri olan buyer marketplace catalog.
- `/buyer/products/[slug]` - buyer ürün detay ve satın alma paneli.
- `/buyer/cart` - local cart state, adet kontrolleri, önerilen ürünler ve mock checkout.
- `/buyer/agent` - buyer agent prompt, ürün önerileri ve onaylı cart mutation.
- `/buyer/profile` - profil tercihleri, yorum geçmişi ve kişiselleştirme sinyalleri.
- `/seller` - risk kartları ve deduplicate edilmiş priority queue içeren seller overview.
- `/seller/products` - focus filtreleri, search, sort, product health ve action linkleri olan seller product radar.
- `/seller/actions` - kategori/focus bazlı seller action queue.
- `/seller/actions/[id]` - etkilenen ürünler, iş adımları, draft copy ve LLM explanation içeren action detail.
- `/seller/agent` - seller agent bulguları, listing draft preview, onay, audit ve rollback.
- `/seller/profile` - mağaza ayarları, agent permissions, alert rules, quiet hours ve audit trail.
- `/demo` - buyer, seller, floating agent, QA ve proof rotaları için rehearsal command center.

Önerilen demo sırası için [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) dosyasını kullanın.

## Mimari Haritası

Daha detaylı teknik walkthrough için [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) dosyasını okuyun.

```text
src/data/mock
  curated demo products, sellers, buyers, orders, reviews, inventory, relations

prisma
  Supabase/Postgres schema, migration ve curated dataset seed

src/lib/data
  runtime mock commerce dataset üzerinde typed data access helper'ları

src/lib/scoring
  deterministik product health ve commerce scoring modülleri

src/lib/workflows
  buyer smart-cart, seller actions ve product-health workflow'ları

src/lib/api
  UI ve route handler'ların kullandığı typed API contract builder'ları

src/lib/llm
  provider bağımsız LLM adapter'ları, structured JSON generation, parsing, fallback

src/lib/agents
  runtime registry, guardrail'ler, apply contract'ları, local apply helper'ları, floating context

src/components/commerce
  buyer, seller, floating agent, demo ve proof UI component'leri

src/app
  Next.js App Router page ve API route'ları
```

## Agent ve LLM Sınırları

LLM, cart veya seller listing state'ini doğrudan değiştirmez.

Buyer akışı:

1. Kullanıcı alışveriş isteğini yazar.
2. Deterministik smart-cart workflow katalogla sınırlı adayları üretir.
3. LLM öneriyi açıklayabilir, sıralayabilir ve cümleleştirebilir.
4. Validator geçersiz product id'leri ve desteklenmeyen katalog referanslarını temizler.
5. Kullanıcı append veya replace seçer.
6. Client doğrulanmış cart mutation'ını local cart state'e uygular.

Seller akışı:

1. Kullanıcı seller operation yardımı ister.
2. Deterministik seller workflow'ları ürün/aksiyon adaylarını hesaplar.
3. LLM focus seçebilir, bulguları sıralayabilir ve listing text draft'ı üretebilir.
4. Validator product id, action id ve mutation shape'i kontrol eder.
5. Kullanıcı before/after listing preview'i inceler.
6. Onaylanan mutation local listing override ve audit store'a yazılır.
7. Uygulanan local audit entry'leri için rollback yapılabilir.

Floating Agent:

- Mevcut buyer/seller route context'ini kullanır.
- Her panel açılışı temiz başlar; stored chat history API'ye geri gönderilmez.
- Buyer prompt'larının seller operation çalıştırmasını, seller prompt'larının buyer cart action çalıştırmasını engeller.
- Full agent sayfalarıyla aynı onaylı cart/listing operation boundary'lerini kullanır.

## Guardrail'ler

Alışveriş Arkadaşım şu davranışları korur:

- Buyer Agent yalnızca mevcut Alışveriş Arkadaşım katalog ürünlerini önerir.
- Telefon, konsol, TV, beyaz eşya veya ayakkabı gibi desteklenmeyen katalog prompt'ları sahte öneri yerine boundary response döndürür.
- Seller Agent listing, price, campaign, stock veya description değişikliklerini onay olmadan uygulayamaz.
- LLM JSON route contract veya UI state'e girmeden önce parse ve validate edilir.
- Stale veya çelişkili LLM action prompt'ları mevcut açık kullanıcı prompt'u ile override edilir.
- Review intelligence yalnızca izinli review id'leri ve izinli theme label'ları kullanır.
- Buyer product warning'leri profil tercihleri, önceki şikayetler ve ürün review/metric risk sinyallerinden türetilir.

## Kalite ve Doğrulama

Ana lokal kontrol:

```bash
npm run check
```

Bu komut şunları çalıştırır:

- ESLint.
- TypeScript typecheck.
- `scripts/validate-workflows.js`.
- Commerce component'leri için Vitest testleri.

Ek üretim derleme kontrolü:

```bash
npm run build
```

Son route/API/component smoke kapsamı teknik audit dokümanında kayıtlıdır:

- `TECHNICAL_AUDIT_COMPONENT_MOCKS.md`

Validation script'i mock data bütünlüğünü, scoring, workflow, API contract, agent runtime, LLM provider davranışı, guardrail, demo contract ve ayrıştırılmış component contract'larını kontrol eder:

- `scripts/validate-workflows.js`
- [docs/VALIDATION_OUTPUT.md](docs/VALIDATION_OUTPUT.md) beklenen yüksek sinyalli validator çıktısını kaydeder.

## Kurulum

Geliştirme sırasında kullanılan ön koşullar:

- Node.js 22.22.1
- npm 10.9.4

Bağımlılıkları kurun:

```bash
npm install
```

Geliştirme server'ını çalıştırın:

```bash
npm run dev
```

Açın:

```text
http://localhost:3000
```

Üretim build'i ve lokal üretim çalıştırması:

```bash
npm run build
npm run start
```

## Komutlar

- `npm run dev` - lokal development server'ı başlatır.
- `npm run build` - production build üretir.
- `npm run start` - production build'i çalıştırır.
- `npm run lint` - ESLint çalıştırır.
- `npm run typecheck` - TypeScript'i emit olmadan kontrol eder.
- `npm run validate:workflows` - data, workflow, API contract, LLM/agent guardrail ve demo contract'larını doğrular.
- `npm run test:components` - `src/components/commerce` altındaki Vitest component testlerini çalıştırır.
- `npm run db:validate` - Prisma schema'yı Supabase bağlantısı gerektirmeden doğrular.
- `npm run db:generate` - Prisma Client üretir.
- `npm run db:migrate:deploy` - commitlenmiş Prisma migration'larını Supabase/Postgres DB'ye uygular.
- `npm run db:seed` - Alışveriş Arkadaşım curated dataset'ini Supabase/Postgres DB'ye seed eder.
- `npm run db:studio` - Prisma Studio'yu açar.
- `npm run check` - lint, typecheck, workflow validation ve component testlerini çalıştırır.

## Ortam Değişkenleri

LLM destekli lokal çalıştırma için `.env.example` dosyasını `.env.local` olarak kopyalayın:

```bash
cp .env.example .env.local
```

Desteklenen ortam değişkeni isimleri:

```text
LLM_PROVIDER
OPENAI_MODEL
OPENAI_API_KEY
GEMINI_MODEL
GEMINI_API_KEY
DATA_SOURCE
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
DATABASE_URL
DIRECT_URL
```

Notlar:

- `LLM_PROVIDER=gemini`, Gemini OpenAI-compatible adapter'ını kullanır.
- `LLM_PROVIDER=openai`, OpenAI adapter'ını kullanır.
- Eksik key veya provider hatası durumunda desteklenen akışlar deterministik fallback'e döner.
- Gerçek API key asla commitlenmemelidir.
- Supabase Postgres kurulumu için [docs/SUPABASE_DATABASE.md](docs/SUPABASE_DATABASE.md) dosyasındaki adımları izleyin.

## Teknoloji Yığını

- Next.js App Router 16
- React 19
- TypeScript
- Tailwind CSS
- UI motion için GSAP ve `@gsap/react`
- Phosphor Icons
- Vitest, jsdom, React Testing Library ve User Event
- OpenAI, Gemini ve deterministic fallback için provider bağımsız LLM adapter katmanı

## Önemli Dokümanlar

- [docs/README.md](docs/README.md) - dokümantasyon seti için teknik inceleyici odaklı indeks.
- [PROJECT_MEMORY.md](PROJECT_MEMORY.md) - append-only proje hafızası, kararlar, milestone'lar, konvansiyonlar ve güncel durum.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - sistem mimarisi, agent boundary'leri, LLM provider katmanı, guardrail'ler, persistence ve verification modeli.
- [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) - rota, prompt, beklenen sonuç ve kanıt noktaları içeren jüri/teknik inceleyici demo script'i.
- [docs/REPRODUCIBILITY.md](docs/REPRODUCIBILITY.md) - ortam, teknik inceleyici rota sırası, doğrulama komutları, deterministik iddialar ve MVP dışında kalan kısımlar.
- [docs/VALIDATION_OUTPUT.md](docs/VALIDATION_OUTPUT.md) - beklenen `npm run validate:workflows` çıktısı ve neyi kanıtladığı.
- [docs/SUPABASE_DATABASE.md](docs/SUPABASE_DATABASE.md) - Supabase Postgres kurulumu, Prisma migration ve mock dataset seed adımları.
- [TECHNICAL_AUDIT_COMPONENT_MOCKS.md](TECHNICAL_AUDIT_COMPONENT_MOCKS.md) - teknik denetim, smoke sonuçları, component extraction durumu, mock/lokal envanter ve öncelikler.
- [LLM_AGENT_PROVIDER_INDEPENDENT_PLAN.md](LLM_AGENT_PROVIDER_INDEPENDENT_PLAN.md) - provider bağımsız LLM ve agent uygulama planı.
- [ALISVERIS_ARKADASIM_AGENT_MARKETPLACE_ROADMAP.md](ALISVERIS_ARKADASIM_AGENT_MARKETPLACE_ROADMAP.md) - ürün ve milestone roadmap'i.

## Bilinen Teknik Borçlar

Core agent mimarisi hackathon MVP için tutarlı. Kalan ana mühendislik riskleri:

- Büyük workspace component'leri hâlâ daha fazla ayrıştırılmalı; özellikle seller profile, seller agent, seller products ve seller actions.
- Browser smoke dokümante edildi ama committed repeatable script haline getirilmeli.
- Local storage persistence ileride server persistence boundary'leri arkasına taşınmalı.
- Sabit demo kimlikleri production öncesi typed auth/session abstraction'a dönüşmeli.
- LLM latency ve telemetry daha açık ölçülmeli.

## Bilinen MVP Sınırları

Bunlar hackathon teslimi için bilinçli scope sınırlarıdır:

| Alan | Mevcut MVP davranışı | Production yönü |
|---|---|---|
| Veri | Runtime `src/data/mock` okur; aynı curated dataset Supabase Postgres'e migration + seed ile taşındı. | `DATA_SOURCE=database` destekli DB read layer ve seed/production data ayrımı. |
| Kimlik | Sabit demo buyer/seller kimlikleri. | Auth, session ve role model. |
| Persistence | Cart, profile ve audit state `localStorage` kullanır. | Kullanıcı/account sahipliği olan server-backed persistence. |
| Ödeme | Checkout mock yüzeydir. | Payment/order creation entegrasyonu. |
| Stok | Stock ve fulfillment simüle edilir. | Reservation, fulfillment ve shipment entegrasyonları. |
| Medya | Ürün görselleri kontrollü sprite asset kullanır. | Ürüne özel medya pipeline'ı. |
| LLM güvenilirliği | Provider bağımsız adapter ve deterministik fallback. | Latency budget, retry, telemetry ve provider monitoring. |

## Teknik İnceleyici İçin Repo Durumu

Kodu inceliyorsanız buradan başlayın:

1. `npm run check` çalıştırın.
2. `npm run build` çalıştırın.
3. `/demo` rotasını açın.
4. `src/lib/agents`, `src/lib/api`, `src/lib/workflows` ve `scripts/validate-workflows.js` dosyalarını inceleyin.
5. Güncel smoke kapsamı ve bilinen limitler için `TECHNICAL_AUDIT_COMPONENT_MOCKS.md` dosyasını okuyun.

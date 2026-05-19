# Alışveriş Arkadaşım Tekrar Üretilebilirlik Rehberi

Bu doküman, projeyi çalıştırmak, teknik iddiaları doğrulamak ve hangi kısımların gerçek, deterministik, LLM destekli veya bilinçli olarak mock olduğunu anlamak isteyen teknik inceleyiciler için yazıldı.

## 1. Ortam

Geliştirme ve doğrulama şu sürümlerle yapıldı:

```text
Node.js 22.22.1
npm 10.9.4
Next.js 16.2.6
```

Bağımlılıkları kurun:

```bash
npm install
```

Opsiyonel LLM konfigürasyonu:

```bash
cp .env.example .env.local
```

Desteklenen ortam değişkeni isimleri:

```text
LLM_PROVIDER
GEMINI_MODEL
GEMINI_API_KEY
```

Repo API key olmadan da incelenebilir. Provider eksikse veya erişilemiyorsa desteklenen akışlar deterministik fallback davranışına döner.

## 2. Tek Komutla Doğrulama

Çalıştırın:

```bash
npm run check
```

Bu komut şunları çalıştırır:

```text
eslint
tsc --noEmit
node scripts/validate-workflows.js
vitest run src/components/commerce
```

Beklenen sonuç:

```text
Workflow validation passed.
Test Files  3 passed (3)
Tests       13 passed (13)
```

## 3. Production Derleme Doğrulaması

Çalıştırın:

```bash
npm run build
```

Beklenen sonuç:

```text
Compiled successfully
Generating static pages
Finalizing page optimization
```

Ardından üretim server'ını açın:

```bash
npm run start
```

Tarayıcıda açın:

```text
http://localhost:3000
```

## 4. Teknik İnceleyici Rota Sırası

Hızlı teknik inceleme için önerilen sıra:

| Sıra | Route | İncelenecek nokta |
|---:|---|---|
| 1 | `/demo` | Kanıt rotası, runbook, guardrail ve agent trace çerçevesi. |
| 2 | `/buyer/products` | Catalog contract, ürün görselleri, kategoriler, sıralama ve sepet girişleri. |
| 3 | `/buyer/products/calliel-spf50-gunes-kremi` | Ürün detay, mağaza linki, satın alma kontrolleri ve yorum pagination. |
| 4 | `/buyer/agent` | Katalogla sınırlı öneri, onay sınırı ve cart apply preview. |
| 5 | `/buyer/cart` | Local cart mutation ve önerilen ürün yüzeyi. |
| 6 | `/seller` | Risk kartları, deduplicate edilmiş öncelik kuyruğu ve satıcı karar yüzeyi. |
| 7 | `/seller/products` | Ürün radarı, sağlık sinyalleri ve aksiyon linkleri. |
| 8 | `/seller/actions` | Satıcı aksiyon kuyruğu ve focus filtreleri. |
| 9 | `/seller/agent` | Satıcı bulguları, listing draft preview, onay ve rollback sınırı. |
| 10 | `/seller/profile` | Permission modeli, alert kuralları, audit ve kontrol ayarları. |

## 5. Deterministik Teknik İddialar

Bu iddialar harici servis olmadan kontrol edilebilir:

- Mock katalogda 48 ürün vardır.
- Mock review setinde 55 yorum vardır.
- Buyer Agent ürün önerileri katalogla sınırlıdır.
- Desteklenmeyen ürün aileleri uydurulmaz, boundary response ile durdurulur.
- Seller listing mutation'ları local apply öncesinde kullanıcı onayı ister.
- Review intelligence yalnızca izinli review id'leri ve izinli theme etiketlerini kabul eder.
- Buyer cart, buyer profile, seller profile, seller listing audit ve floating controls MVP'de local state olarak tutulur.

Doğrulama kaynağı:

```text
scripts/validate-workflows.js
```

## 6. LLM Destekli İddialar

LLM katmanı provider bağımsızdır:

```text
src/lib/llm
```

Desteklenen modlar:

- `gemini`
- `deterministic`

LLM açıklama, sıralama, özetleme ve draft üretme görevlerinde kullanılabilir. Cart veya seller listing state'ini doğrudan değiştirmez. Mutation payload'ları client uygulanmadan önce typed application contract'ları tarafından doğrulanır.

## 7. Tekrar Üretilemeyen / MVP Dışında Kalan Kısımlar

Aşağıdakiler bilinçli olarak MVP kapsamı dışındadır:

- Gerçek kimlik doğrulama.
- Runtime için server-backed cart/profile/audit kalıcılığı.
- Supabase Postgres schema/migration/seed hazırdır; curated dataset DB'ye taşındı, ancak uygulama read layer'ı bu fazda hâlâ mock helper'ları kullanır.
- Ödeme veya gerçek checkout.
- Gerçek stok rezervasyonu.
- Gerçek kargo/fulfillment entegrasyonu.
- Production analytics/telemetry.
- Production SKU görsel medya hattı.

Bu maddeler gizli varsayım değil, bilinen MVP sınırlarıdır.

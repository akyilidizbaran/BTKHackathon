# Alışveriş Arkadaşım Demo Metni

Bu metin; jüri, teknik inceleyici ve ekip arkadaşlarının uygulama içinde doğru yolu tahmin etmek zorunda kalmadan Alışveriş Arkadaşım'ı hızlı değerlendirebilmesi için yazıldı.

Demo üç şeyi göstermeli:

1. Alışveriş Arkadaşım statik dashboard değil, gerçek bir buyer/seller commerce ürünü gibi davranır.
2. Agent öneri yapabilir, açıklayabilir, preview üretebilir ve yalnızca onaylanan aksiyonları uygulayabilir.
3. Teknik sınır açıktır: önce deterministik commerce logic, sonra LLM desteği, mutation öncesi typed validation ve kullanıcı onayı.

## 1. Kurulum

Kurun ve çalıştırın:

```bash
npm install
npm run dev
```

Açın:

```text
http://localhost:3000
```

Production benzeri lokal prova:

```bash
npm run build
npm run start
```

Opsiyonel LLM kurulumu:

```bash
cp .env.example .env.local
```

Hackathon sunumunda hedef sağlayıcı:

```text
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
```

API key yoksa desteklenen akışlar deterministik fallback'e döner. CI şu modda çalışır:

```text
LLM_PROVIDER=deterministic
```

## 2. Demo Öncesi Kontroller

Sunumdan önce çalıştırın:

```bash
npm run check
npm run build
```

Beklenen sonuç:

- Lint geçer.
- TypeScript geçer.
- Workflow validation geçer.
- Component testleri geçer.
- Next üretim build'i tamamlanır.

Faydalı kanıt dosyaları:

- [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/REPRODUCIBILITY.md](REPRODUCIBILITY.md)
- [docs/VALIDATION_OUTPUT.md](VALIDATION_OUTPUT.md)
- [TECHNICAL_AUDIT_COMPONENT_MOCKS.md](../TECHNICAL_AUDIT_COMPONENT_MOCKS.md)
- [scripts/validate-workflows.js](../scripts/validate-workflows.js)

## 3. 7 Dakikalık Jüri Modu

Kısa sunum için önerilen akış:

| Süre | Rota | Ne gösterilecek |
|---:|---|---|
| 0:00-0:30 | `/` veya `/demo` | Alışveriş Arkadaşım'ın çift taraflı commerce intelligence ürünü olduğu anlatılır. |
| 0:30-1:30 | `/buyer/products` | Buyer marketplace, kategori, ürün görseli, fiyat, rating, teslimat ve sepet girişi gösterilir. |
| 1:30-2:30 | `/buyer/agent` | “Toplantı için uyumlu kamera mikrofon hub öner.” prompt'u ile katalogla sınırlı öneri ve cart approval gösterilir. |
| 2:30-3:30 | `/seller` | Satıcı risk kartları, öncelik kuyruğu ve seller intelligence yüzeyi gösterilir. |
| 3:30-4:30 | `/seller/actions` | Aksiyon kuyruğu ve ürün kanıtları gösterilir. |
| 4:30-6:00 | `/seller/agent` | Listing draft preview, onay, local audit ve rollback boundary gösterilir. |
| 6:00-7:00 | `/demo` + terminal | `npm run check`, guardrail ve Gemini/deterministic fallback pozisyonu anlatılır. |

Kapanış cümlesi:

> Alışveriş Arkadaşım bir AI wrapper değil; Supabase'e seed edilmiş curated commerce dataset'i, deterministik workflow, LLM validation, kullanıcı onayı ve local apply boundary'leri olan agentic commerce MVP'sidir.

## 4. Hızlı Teknik İnceleyici Rotası

Teknik inceleyicinin yalnızca 5 dakikası varsa:

1. `/demo` rotasını açın.
2. `/buyer/products` rotasını açın.
3. `/buyer/agent` rotasını açın.
4. `/seller` rotasını açın.
5. `/seller/agent` rotasını açın.
6. [docs/ARCHITECTURE.md](ARCHITECTURE.md) dosyasını okuyun.
7. `npm run check` çalıştırın.

Anlaması gereken ana noktalar:

- Buyer ve seller yüzeyleri ürünleşmiş durumda.
- Agent akışları typed contract'lara dayanıyor.
- LLM doğrudan state mutate etmiyor.
- Guardrail ve approval boundary birinci sınıf mimari parça.

## 5. Tam Demo Akışı

Önerilen süre: 10-12 dakika.

### Açılış: Rol Girişi

Rota:

```text
/
```

Söylenecek:

> Alışveriş Arkadaşım iki taraflı bir commerce intelligence platformu. Alıcı tarafı tanıdık bir alışveriş deneyimi sunar; satıcı tarafı stok, yorum, iade, margin ve product health sinyallerini onaylanabilir aksiyonlara çevirir.

Gösterilecekler:

- Buyer girişi.
- Seller girişi.
- Varsa demo rotası.

Teknik nokta:

- Uygulama buyer, seller, agent ve demo yüzeylerine ayrılmıştır ama commerce verisi ve typed agent contract'ları ortaktır.

## 6. Buyer Demo

### Adım 1: Ürün Keşfi

Rota:

```text
/buyer/products
```

Gösterilecekler:

- Kategori filtreleri.
- Ürün kartları.
- Ürün görselleri.
- Fiyat, puan, teslimat, indirim ve sepete ekleme kontrolleri.

Söylenecek:

> Buyer tarafı bilerek tanıdık tutuldu. Agent alışverişin yerine geçmiyor; gerçek marketplace yüzeyinin üzerinde çalışıyor.

Beklenen sonuç:

- Ürün grid'i render olur.
- Ürün kartı CTA'ları görünür.
- Kullanıcı Agent kullanmadan önce ürünleri inceleyebilir.

Teknik nokta:

- Catalog verisi `src/lib/api/buyer-catalog.ts` contract'ından gelir.
- Agent yalnızca bu katalogdan seçim yapabilir.

### Adım 2: Ürün Detay

Rota:

```text
/buyer/products/calliel-spf50-gunes-kremi
```

Gösterilecekler:

- Ürün görseli.
- Satın alma paneli.
- Adet kontrolleri.
- Teslimat ve kampanya bilgisi.
- Satıcı bilgisi.
- 4'lü sayfalama ile ürün yorumları ve ürün notları.

Söylenecek:

> Ürün detay sayfası AI cevap ekranı gibi değil, commerce sayfası gibi davranır. Agent yardımcı olur ama ürün bağlamı ve satın alma kontrolleri açık kalır.

Beklenen sonuç:

- Dynamic product detail route çalışır.
- Add-to-cart ve buy kontrolleri görünür.
- `Mağazaya Git` gerçek mağaza filtre linkine gider.

Teknik nokta:

- Dynamic product route'ları shared product data'dan üretilir.

### Adım 3: Buyer Agent Önerisi

Rota:

```text
/buyer/agent
```

Önerilen prompt:

```text
Toplantı için uyumlu kamera mikrofon hub öner.
```

Gösterilecekler:

- Agent cevabı.
- Önerilen katalog ürünleri.
- Gerekçeler ve risk notları.
- Append/replace cart approval butonları.

Söylenecek:

> Agent açıklayabilir ve sıralayabilir ama katalogla sınırlıdır. Desteklenmeyen ürün uyduramaz ve kullanıcı append veya replace seçmeden sepete yazamaz.

Beklenen sonuç:

- Buyer Agent ürün önerisi döndürür.
- Approval butonları görünür.
- LLM ayarlıysa provider/status görülebilir; değilse deterministik fallback demo'yu çalışır tutar.

Teknik nokta:

- `src/lib/api/buyer-agent.ts` deterministik candidate'ları LLM JSON orchestration ile birleştirir.
- `src/lib/agents/buyer-catalog-guardrails.ts` desteklenmeyen ürün ailelerini engeller.
- `src/lib/agents/buyer-cart-apply.ts` apply payload'larını validate eder.

### Adım 4: Cart Apply

Rota:

```text
/buyer/cart
```

Gösterilecekler:

- Mevcut sepet ürünleri.
- Adet kontrolleri.
- Önerilen ürünler.
- Floating Agent paneli.

Opsiyonel Floating Agent prompt'u:

```text
Toplantı için sepetimi tamamla.
```

Söylenecek:

> Floating Agent, full Buyer Agent sayfasıyla aynı apply boundary'yi kullanır. Ayrı kuralları olan farklı bir widget değildir.

Beklenen sonuç:

- Onaylanan cart mutation local cart state'i günceller.
- Cart quantity kontrolleri kullanıcı tarafından düzenlenebilir kalır.

Teknik nokta:

- Client apply `src/lib/agents/buyer-cart-apply-client.ts` ve `src/lib/cart/buyer-cart.ts` üzerinden yapılır.
- State MVP'de bilinçli olarak `localStorage` kullanır.

## 7. Seller Demo

### Adım 1: Seller Overview

Rota:

```text
/seller
```

Gösterilecekler:

- Dört risk kartı.
- Priority queue.
- Ürün dağılımı.
- Dikkat isteyen ürünler.

Söylenecek:

> Seller tarafı commerce sinyallerini operasyon kuyruğuna çevirir: stok riski, negatif yorumlar, iade riski ve satılmayan ürünler.

Beklenen sonuç:

- Risk kartları ilgili product/action focus rotalarına gider.
- Priority queue duplicate action link göstermez.

Teknik nokta:

- Seller overview `src/lib/api/seller.ts` tarafından oluşturulur.
- Product health ve action priority deterministik scoring/workflow katmanından gelir.

### Adım 2: Seller Product Radar

Rota:

```text
/seller/products?focus=stock-risk
```

Gösterilecekler:

- Focus chip'leri.
- Search ve sorting.
- Health, stock, sales, review ve risk sinyali taşıyan ürün satırları.
- Linked action CTA.

Söylenecek:

> Overview kartları sadece metrik göstermez; gerçek ürün yönetim yüzeyine, filtrelere ve bağlantılı aksiyonlara gider.

Beklenen sonuç:

- Stock-risk filtresi aktiftir.
- Riskli ürünler ve bağlı aksiyonlar görünür.

Teknik nokta:

- Aynı seller product contract UI ve API davranışını besler.

### Adım 3: Seller Action Detail

Rota:

```text
/seller/actions/restock-ergoflex-calisma-sandalyesi
```

Gösterilecekler:

- Action priority.
- Etkilenen ürünler.
- İş adımları.
- Evidence/signal panel.
- Explanation panel.

Söylenecek:

> Seller action'lar açıklanabilirdir. Kullanıcı Agent'a draft veya mutation için gitmeden önce etkilenen ürünleri ve yapılacak işi görür.

Beklenen sonuç:

- Action detail yüklenir.
- Etkilenen ürün linkleri görünür.
- Explanation panel kısa ve ürün odaklıdır.

Teknik nokta:

- Action detail verisi `src/lib/api/seller.ts` içinden gelir.
- Açıklamalar `src/lib/api/seller-action-explanations.ts` ile üretilir.

### Adım 4: Seller Agent Approval ve Audit

Rota:

```text
/seller/agent
```

Önerilen prompt:

```text
Stok riski olan ürünleri göster ve bugün ne yapacağımı sırala.
```

Gösterilecekler:

- Seller findings.
- Action suggestion'ları.
- Listing before/after preview.
- Approval butonu.
- Audit log.
- Rollback.

Söylenecek:

> En kritik teknik sınır burada: Agent listing değişikliği draft eder ama satıcı onaylamadan uygulayamaz. Onaylanan değişiklik audit trail'e gider ve local rollback yapılabilir.

Beklenen sonuç:

- Draft preview görünür.
- Apply açık kullanıcı click'i ister.
- Apply sonrası audit entry oluşur.
- Rollback local state'i geri alabilir.

Teknik nokta:

- `src/lib/api/seller-agent.ts` agent sonucunu üretir.
- `src/lib/agents/seller-listing-apply.ts` apply request'lerini validate eder.
- `src/lib/agents/seller-listing-apply-client.ts` local override ve audit state yazar.

## 8. Floating Agent Demo

### Adım 1: Buyer Context

Rota:

```text
/buyer/cart
```

Gösterilecekler:

- Floating Agent panelini açın.
- Buyer cart sorusu veya öneri prompt'u yazın.
- Buyer action'ların kullanılabilir olduğunu gösterin.

Söylenecek:

> Floating Agent route context'i okur ve buyer sayfalarında buyer capability'leri açar.

Beklenen sonuç:

- Floating panel açılır.
- Action-oriented buyer prompt buyer-agent davranışına yönlenir.

### Adım 2: Seller Context

Rota:

```text
/seller/products
```

Gösterilecekler:

- Floating Agent'ı açın.
- Seller product/action yardımı isteyin.
- Seller odaklı davranışı gösterin.

Söylenecek:

> Aynı mini panel route'a göre capability değiştirir. Seller sayfasında buyer cart action çalıştırmaz.

Beklenen sonuç:

- Seller prompt seller-agent davranışına yönlenir.
- Listing apply yine onay ister.

### Adım 3: Kontroller

Rota:

```text
/seller/products
```

Gösterilecekler:

- Sessize al.
- Bu sayfada uyarma.
- Gerekirse gizle kontrolleri.

Söylenecek:

> Proactive Agent kullanıcı kontrolü gerektirir. Alışveriş Arkadaşım mute ve page-level kontrolleri local state'te tutar.

Beklenen sonuç:

- Floating control state local olarak korunur.

Teknik nokta:

- Floating kontroller `commercepilot.floatingAgent.v1` kullanır.
- Panel temiz başlar ve stored history API'ye gönderilmez.

## 9. Review Intelligence Kanıtı

Rota:

```text
/seller/actions/review_attention-connectplus-usb-c-hub
```

Gösterilecekler:

- Gerçek review highlight'ları.
- Review-related action summary.
- Görünüyorsa seller response veya copy suggestion alanı.

Söylenecek:

> Review intelligence typed LLM contract'tır. Mevcut yorumları cluster/summarize edebilir ama source review id uyduramaz ve product data mutate edemez.

Beklenen sonuç:

- Review action page gerçek yorum içeriği gösterir.
- Review risk mevcut product review'larına dayanır.

Teknik nokta:

- `src/lib/api/review-intelligence.ts` source review id ve allowed theme label doğrulaması yapar.

## 10. Teknik Proof Rotası

Rota:

```text
/demo
```

Gösterilecekler:

- Buyer demo lane.
- Seller demo lane.
- Floating Agent lane.
- LLM proof listesi.
- Agent trace proof listesi.
- QA check'leri.

Söylenecek:

> Demo route proof surface'tir. Buyer ekranları ürün gibi temiz kalır; `/demo` runtime, LLM, trace ve QA kanıtlarını görünür tutar.

Beklenen sonuç:

- Runbook lane'leri görünür.
- QA kartları `npm run check`, `npm run build`, runtime smoke ve browser rehearsal'a işaret eder.

Teknik nokta:

- `/demo`, `src/lib/demo/rehearsal.ts` tarafından beslenir.

## 11. Guardrail Senaryoları

Teknik inceleyici hallucination veya rol uyuşmazlığı sorarsa bunları kullanın.

### Desteklenmeyen Buyer Catalog Prompt

Rota:

```text
/buyer/agent
```

Prompt:

```text
iPhone öner
```

Beklenen:

- Agent telefon ürünü uydurmamalı.
- Catalog-boundary answer veya fallback davranışı dönmeli.

Kanıt:

- `src/lib/agents/buyer-catalog-guardrails.ts`
- `scripts/validate-workflows.js`

### Buyer-Seller Role Mismatch

Rota:

```text
/buyer/cart
```

Floating prompt:

```text
Stok riski olan ürünleri sırala.
```

Beklenen:

- Buyer surface seller operation çalıştırmamalı.

### Seller-Buyer Role Mismatch

Rota:

```text
/seller/products
```

Floating prompt:

```text
Sepetime 3 ürün ekle.
```

Beklenen:

- Seller surface buyer cart mutation çalıştırmamalı.

## 12. Vurgulanacak Noktalar

Final anlatıda bu noktaları kullanın:

- Alışveriş Arkadaşım LLM çıktısını ham gerçeklik olarak kullanmaz.
- Deterministik workflow'lar candidate universe'ü seçer.
- LLM çıktısı parse, normalize ve validate edilir.
- Buyer Agent katalogla sınırlıdır.
- Seller Agent approval-bound çalışır.
- Floating Agent full agent sayfalarıyla aynı apply contract'larını paylaşır.
- Teknik proof `/demo`, dokümanlar, validation script ve CI içinde görünürdür.

## 13. Açık Söylenecek Limitler

Bu limitleri doğrudan söyleyin:

- Veri curated commerce dataset'idir; Supabase Postgres'e migration + seed ile taşındı, runtime okuma katmanı bu fazda hâlâ mock helper'ları kullanır.
- Kimlik doğrulama ve server-backed kullanıcı kalıcılığı uygulanmadı.
- Cart/profile/listing audit state `localStorage` kullanır.
- Ürün medyası kontrollü sprite kullanır.
- Ödeme, sipariş oluşturma, fulfillment ve gerçek stok rezervasyonu scope dışında.

Doğru konumlandırma:

> Mock data, gerçek LLM orchestration, typed guardrail'ler ve onaylı local mutation'lar.

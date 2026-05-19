# PROJECT_MEMORY

## 0) TL;DR (En güncel durum)

* Şu an ne yapıyoruz?
  * Vercel deploy öncesi runtime ve dokümantasyon snapshot'ı Gemini-only hale getirildi.
* Son değişiklik neydi?
  * Buyer malformed manualPreferences 400'e bağlandı; Seller listing apply fiyat/before policy guard'ı eklendi; opt-in Gemini smoke workflow eklendi.
* Bir sonraki net adım ne?
  * Vercel env değerleri girilip deploy alınacak.

## 1) Proje Amacı ve Kapsam

* Amaç:
  * Alışveriş Arkadaşım, klasik marketplace deneyimi ile alıcı/satıcı tarafında çalışan agent arayüzünü birleştiren çift taraflı e-ticaret zekası MVP'sidir.
* Kapsam içi:
  * Buyer tarafı: ürün katalogu, ürün detay, sepet, profil, agent destekli sepet önerileri ve onaylı cart mutation.
  * Seller tarafı: overview, ürün radarı, aksiyon kuyruğu, profil, agent destekli listing draft preview, onaylı mutation ve rollback.
  * Curated mock commerce dataset'i, Prisma schema/migration/seed ve Supabase Postgres readiness.
  * Gemini destekli LLM orchestration ve deterministik fallback.
* Kapsam dışı:
  * Gerçek ödeme, auth, fulfillment, stok rezervasyonu ve production persistence.

## 2) Non-negotiables / Kırmızı Çizgiler

* AI/LLM çıktıları doğrudan state mutate etmez; typed validation, guardrail ve kullanıcı onayı zorunludur.
* Buyer Agent yalnızca mevcut katalog ürünlerinden seçim yapar; katalog dışı ürün uydurmaz.
* Seller Agent listing, price, campaign, stock veya copy alanlarını onay olmadan değiştirmez.
* UI gerçek marketplace yüzeyi gibi davranır; teknik proof bilgisi normal kullanıcı deneyimini bastırmaz.
* Gerçek secret commitlenmez; `.env.local` git dışında kalır.
* Final runtime sağlayıcısı Gemini'dir; current snapshot içinde eski sağlayıcı izleri bırakılmamalıdır.

## 3) Mimari Özet

* Bileşenler:
  * Buyer workspace: katalog, ürün detay, sepet, agent ve profil.
  * Seller workspace: overview, products, actions, agent ve profil.
  * Intelligence katmanı: scoring, workflow, LLM orchestration, validation ve apply boundaries.
* Veri akışı:
  * `src/data/mock` -> `src/lib/scoring` -> `src/lib/workflows` -> `src/lib/api` -> UI/API routes -> optional Gemini output -> typed validation -> user approval -> local apply helper.
* Önemli dizinler/modüller:
  * `src/lib/llm/*`: Gemini text/JSON wrapper, JSON extraction, normalization ve fallback contract'ı.
  * `src/lib/api/*`: shared route/page contract builder'ları.
  * `src/lib/agents/*`: runtime registry, guardrail, apply contract, floating context ve client apply helper'ları.
  * `src/components/commerce/*`: buyer/seller/floating/demo UI yüzeyleri.
  * `prisma/*`: DB schema, migration ve curated seed.

## 4) Konvansiyonlar ve Standartlar

* Kod stili / lint / format:
  * Next.js App Router + React + TypeScript + Tailwind CSS.
  * UI motion için `gsap` + `@gsap/react`, ikonlar için `@phosphor-icons/react`.
  * Ana kontroller: `npm run lint`, `npm run typecheck`, `npm run validate:workflows`, `npm run test:components`, `npm run check`, `npm run build`.
* Branch/commit yaklaşımı:
  * Tamamlanan deploy öncesi değişiklikler commitlenip `main` branch'ine pushlanır.
* İsimlendirme/klasör düzeni:
  * Agent mantığı UI içine gömülmez; workflow/API/agent katmanlarında tutulur.
  * Mutable local state helper'ları `src/lib/agents/*-client.ts` ve profile/cart storage dosyalarında merkezileşir.

## 5) Kurulum & Çalıştırma

* Gereksinimler:
  * Node.js 22.22.1
  * npm 10.9.4
* Komutlar:
  * `npm install`
  * `npm run dev`
  * `npm run check`
  * `npm run build`
  * `npm run start`
* Ortam değişkenleri (sadece İSİMLER):
  * LLM_PROVIDER
  * GEMINI_MODEL
  * GEMINI_API_KEY
  * DATA_SOURCE
  * NEXT_PUBLIC_SUPABASE_URL
  * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  * NEXT_PUBLIC_SUPABASE_ANON_KEY
  * DATABASE_URL
  * DIRECT_URL
* Lokal geliştirme notları:
  * `LLM_PROVIDER=gemini` canlı Gemini çağrısı yapar.
  * `LLM_PROVIDER=deterministic` harici servis kullanmadan fallback contract'larını doğrular.

## 6) Decision Log (append-only)

* 2026-05-19 — Karar: Deploy öncesi current snapshot Gemini-only hale getirilecek. | Gerekçe: Son commit içinde eski sağlayıcı izleri görünmemeli. | Etki: LLM router, env örneği, dokümantasyon ve proje hafızası Gemini/deterministic contract'ına göre temizlenir. | Alternatifler: Eski adapter'ı kodda bırakıp sadece varsayılanı Gemini yapmak.
* 2026-05-19 — Karar: Gemini adaptörü native `generateContent` endpoint'ini kullanacak. | Gerekçe: Uyumluluk endpoint'i current snapshot içinde istenmeyen sağlayıcı kelimesi taşıyor ve final kodun net Gemini olmasını engelliyor. | Etki: `src/lib/llm/gemini.ts` request/response shape'i native Gemini API'ye taşınır.
* 2026-05-19 — Karar: Runtime LLM varsayılanı `gemini-2.5-flash` olacak. | Gerekçe: Demo stabilitesi ve JSON contract güvenilirliği. | Etki: `.env.example`, validation ve Vercel env beklentileri aynı model kodunu kullanır.
* 2026-05-19 — Karar: Deploy öncesi dış review bulgularındaki contract bug'ları kod seviyesinde kapatılacak. | Gerekçe: Buyer malformed nested preferences 500'e, Seller apply aşırı fiyat mutation'ına düşebiliyordu. | Etki: Buyer validation nested array/enum/number shape'lerini 400'e çevirir; Seller apply server-side fiyat aralığı ve before snapshot tutarlılığı doğrular. | Alternatifler: Sadece UI/LLM draft guard'ına güvenmek.
* 2026-05-19 — Karar: Canlı LLM kontrolü default CI'a değil opt-in workflow'a alınacak. | Gerekçe: Ana CI secretsız ve stabil kalmalı; gerçek provider response shape/auth/model kırılmaları manuel tetiklenen smoke ile görülebilmeli. | Etki: `npm run smoke:llm` ve `.github/workflows/llm-smoke.yml` eklendi.

## 7) Milestones / Dönüm Noktaları (append-only)

* 2026-05-19 — Milestone: Gemini deploy readiness. | Sonuç: Current snapshot Gemini/deterministic LLM hattına indirildi; check/build ve trace taraması deploy öncesi doğrulama olarak çalıştırılacak.
* 2026-05-19 — Milestone: Deploy öncesi temiz HEAD doğrulandı. | Sonuç: `npm run check`, `npm run build`, canlı `/api/buyer/agent` smoke ve GitHub CI run `26097249110` başarılı; current tree trace taraması temiz.
* 2026-05-19 — Milestone: External review hardening. | Sonuç: Buyer malformed preferences ve Seller excessive price route repro'ları 400/422 dönecek şekilde kapatıldı; `npm run check`, `npm run build`, `npm run smoke:llm` geçti.

## 8) Yapılanlar

* [x] Buyer/seller commerce yüzeyleri ve agent akışları kuruldu.
* [x] Curated dataset Prisma migration ve seed script'i ile DB readiness seviyesine taşındı.
* [x] Gemini LLM adapter'ı, structured JSON validation ve deterministic fallback contract'ı kuruldu.
* [x] Buyer cart ve seller listing apply boundary'leri kullanıcı onayına bağlandı.
* [x] Floating Agent route-aware mini panel olarak eklendi.
* [x] External review bulgularındaki buyer validation ve seller apply policy açıkları kapatıldı.

## 9) Yapılacaklar (Next)

* [x] Trace taramasını current tracked snapshot için sıfır sonuçla doğrula.
* [x] `npm run check` ve `npm run build` çalıştır.
* [x] Değişiklikleri commit ve push et.
* [ ] Vercel env değerlerini Gemini/Supabase değişkenlerine göre girip deploy et.

## 10) Bilinen Sorunlar / Teknik Borç / Riskler

* Runtime read layer hâlâ mock helper'ları kullanıyor; Supabase read geçişi ayrı faz.
* Büyük UI workspace dosyaları daha fazla component extraction isteyebilir.
* Browser regression script'i dokümante edildi ama committed tekrar çalıştırılabilir script olarak genişletilmedi.
* Production telemetry, rate limit görünürlüğü ve server-backed persistence sonraki faz.
* `npm audit` high/critical bulgu göstermiyor; 5 moderate bulgu Next/Prisma zincirinden geliyor ve önerilen otomatik fix kırıcı downgrade olduğu için deploy öncesi uygulanmadı.

## 11) Notlar ve Tuzaklar (Pitfalls)

* LLM route'larında model çıktısı UI/apply contract'ına girmeden önce mutlaka parse ve validate edilmeli.
* Gemini key yoksa fallback davranışı hata değil, bilinçli demo-safe moddur.
* Canlı Gemini entegrasyonu için `npm run smoke:llm` lokal/Vercel secret ortamında çalışır; GitHub'da manuel `LLM Smoke` workflow'u `GEMINI_API_KEY` secret'ı ister.
* Local storage state'leri deploy öncesi üretim persistence sanılmamalı.
* Secret değerleri yalnızca local/Vercel env içinde tutulmalı.

### Güncelleme Kaydı

* Son güncelleme: 2026-05-19

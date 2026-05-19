# PROJECT_MEMORY

## 0) TL;DR (En güncel durum)

* Şu an ne yapıyoruz?
  * GitHub repo ve Vercel proje/paylaşım adı `alisveris-arkadasim` slug'ına taşındı; public marka adı `Alışveriş Arkadaşım`.
* Son değişiklik neydi?
  * Vercel alias `https://alisveris-arkadasim.vercel.app` eklendi; GitHub repo `akyilidizbaran/alisveris-arkadasim` oldu.
* Bir sonraki net adım ne?
  * Rename sonrası README/package metadata commitlenip yeni remote'a pushlanacak.

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
  * Tamamlanan değişiklikler commitlenip `main` branch'ine pushlanır.
  * GitHub remote: `https://github.com/akyilidizbaran/alisveris-arkadasim.git`.
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
* 2026-05-19 — Karar: Audit moderate bulguları için Next/Prisma downgrade yerine transitive override kullanılacak. | Gerekçe: Direct paketler latest sürümdeydi; `npm audit fix --force` kırıcı downgrade öneriyordu. | Etki: `postcss` 8.5.15 ve `@hono/node-server` 2.0.3 override edildi; audit sıfırlandı. | Alternatifler: Force downgrade veya audit bulgularını deploy sonrası izlemek.
* 2026-05-19 — Karar: İlk production deploy Vercel CLI ile alınacak. | Gerekçe: Vercel GitHub bağlantısı CLI sırasında otomatik kurulamadı, fakat production deploy env'leri hazırdı. | Etki: Canlı URL üretildi; otomatik GitHub deploy için Vercel panelinde repo bağlantısı ayrıca kurulmalı.
* 2026-05-19 — Karar: Vercel GitHub entegrasyonu main branch için kullanılacak. | Gerekçe: Bundan sonraki deploy'lar Git push ile izlenebilir ve tekrarlanabilir olmalı. | Etki: `akyilidizbaran/BTKHackathon` repo bağlantısı doğrulandı; sonraki push otomatik Vercel deployment tetiklemeli.
* 2026-05-19 — Karar: Demo hero teknik milestone dili yerine kullanıcıya dönük metin kullanacak. | Gerekçe: Jüri/sunum ekranında 8R gibi iç faz kodları ve başlık içi dekoratif görseller dikkat dağıtıyordu. | Etki: `/demo` hero etiketi `Demo akışı` oldu; başlık contract metninden düz render edilir. | Alternatifler: Teknik etiketi alt bölümde tutmak.
* 2026-05-19 — Karar: Demo kart arka planları local ve konuya bağlı asset'lerden beslenecek. | Gerekçe: Rastgele dış görsel servisi doğa fotoğrafları üretiyor ve demo anlatısıyla çelişiyordu. | Etki: `/public/demo/*-demo-bg.png` asset'leri eklendi; `/demo` kartları buyer catalog, seller audit ve floating agent bağlamını gösterir. | Alternatifler: Harici stock fotoğraf URL'leri kullanmak.
* 2026-05-19 — Karar: Paylaşım adı `Alışveriş Arkadaşım`, teknik slug `alisveris-arkadasim` olacak. | Gerekçe: GitHub/Vercel URL'leri için boşluksuz ASCII slug güvenli; marka adı Türkçe olarak README, açıklama ve site içinde korunur. | Etki: GitHub repo, Vercel project, package metadata ve public alias yeni sluga taşındı; eski GitHub URL redirect eder. | Alternatifler: Eski `btk-hackathon` slug'ını korumak veya özel domain almak.

## 7) Milestones / Dönüm Noktaları (append-only)

* 2026-05-19 — Milestone: Gemini deploy readiness. | Sonuç: Current snapshot Gemini/deterministic LLM hattına indirildi; check/build ve trace taraması deploy öncesi doğrulama olarak çalıştırılacak.
* 2026-05-19 — Milestone: Deploy öncesi temiz HEAD doğrulandı. | Sonuç: `npm run check`, `npm run build`, canlı `/api/buyer/agent` smoke ve GitHub CI run `26097249110` başarılı; current tree trace taraması temiz.
* 2026-05-19 — Milestone: External review hardening. | Sonuç: Buyer malformed preferences ve Seller excessive price route repro'ları 400/422 dönecek şekilde kapatıldı; `npm run check`, `npm run build`, `npm run smoke:llm` geçti.
* 2026-05-19 — Milestone: Audit hardening. | Sonuç: `npm audit --audit-level=moderate` 0 vulnerability döndü; check/build/Gemini smoke tekrar geçti.
* 2026-05-19 — Milestone: Vercel production deploy. | Sonuç: `https://btk-hackathon-red.vercel.app` READY; canlı `/`, `/demo`, `/buyer/products`, `/seller`, `/seller/agent`, catalog API, Gemini buyer agent ve guardrail repro smoke testleri geçti.
* 2026-05-19 — Milestone: Vercel GitHub integration verified. | Sonuç: `vercel git connect` repo bağlantısını doğruladı; canlı buyer agent üç ardışık çağrıda Gemini `generated` döndü.
* 2026-05-19 — Milestone: Demo hero cleanup. | Sonuç: Lokal `/demo` render'ında eski teknik etiket ve H1 içi inline görsel kaldırıldı; check/build geçti.
* 2026-05-19 — Milestone: Demo card media cleanup. | Sonuç: Lokal `/demo` render'ında prova kartları local konu görsellerini kullanıyor; `picsum.photos` DOM'da yok; check/build geçti.
* 2026-05-19 — Milestone: Project rename. | Sonuç: GitHub repo `akyilidizbaran/alisveris-arkadasim`, Vercel project `alisveris-arkadasim`, public URL `https://alisveris-arkadasim.vercel.app`.

## 8) Yapılanlar

* [x] Buyer/seller commerce yüzeyleri ve agent akışları kuruldu.
* [x] Curated dataset Prisma migration ve seed script'i ile DB readiness seviyesine taşındı.
* [x] Gemini LLM adapter'ı, structured JSON validation ve deterministic fallback contract'ı kuruldu.
* [x] Buyer cart ve seller listing apply boundary'leri kullanıcı onayına bağlandı.
* [x] Floating Agent route-aware mini panel olarak eklendi.
* [x] External review bulgularındaki buyer validation ve seller apply policy açıkları kapatıldı.
* [x] Audit moderate bulguları minimal dependency override ile sıfırlandı.
* [x] Vercel production deploy alındı ve canlı smoke doğrulandı.
* [x] Demo hero teknik 8R etiketi ve başlık içi dış görsel temizlendi.
* [x] Demo prova kartlarındaki rastgele doğa arka planları local konu görselleriyle değiştirildi.
* [x] GitHub repo ve Vercel proje/paylaşım adı `alisveris-arkadasim` slug'ına taşındı.

## 9) Yapılacaklar (Next)

* [x] Trace taramasını current tracked snapshot için sıfır sonuçla doğrula.
* [x] `npm run check` ve `npm run build` çalıştır.
* [x] Değişiklikleri commit ve push et.
* [x] Vercel env değerlerini Gemini/Supabase değişkenlerine göre girip deploy et.
* [x] Vercel GitHub integration bağlantısını panelden tamamla.

## 10) Bilinen Sorunlar / Teknik Borç / Riskler

* Runtime read layer hâlâ mock helper'ları kullanıyor; Supabase read geçişi ayrı faz.
* Büyük UI workspace dosyaları daha fazla component extraction isteyebilir.
* Browser regression script'i dokümante edildi ama committed tekrar çalıştırılabilir script olarak genişletilmedi.
* Production telemetry, rate limit görünürlüğü ve server-backed persistence sonraki faz.
* Dependency override'ları future upstream güncellemelerde yeniden değerlendirilmeli; direct Next/Prisma latest kalıyor.

## 11) Notlar ve Tuzaklar (Pitfalls)

* LLM route'larında model çıktısı UI/apply contract'ına girmeden önce mutlaka parse ve validate edilmeli.
* Gemini key yoksa fallback davranışı hata değil, bilinçli demo-safe moddur.
* Canlı Gemini entegrasyonu için `npm run smoke:llm` lokal/Vercel secret ortamında çalışır; GitHub'da manuel `LLM Smoke` workflow'u `GEMINI_API_KEY` secret'ı ister.
* Local storage state'leri deploy öncesi üretim persistence sanılmamalı.
* Secret değerleri yalnızca local/Vercel env içinde tutulmalı.
* Production env'ler Vercel'e eklendi; preview/development env'leri gerekirse panelden ayrıca eklenmeli.
* Eski GitHub repo URL'si GitHub redirect'iyle çalışır; local remote yeni URL'ye güncellendi.

### Güncelleme Kaydı

* Son güncelleme: 2026-05-19

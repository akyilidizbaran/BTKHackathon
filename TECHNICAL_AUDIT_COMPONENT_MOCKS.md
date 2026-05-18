# TECHNICAL_AUDIT_COMPONENT_MOCKS

Tarih: 2026-05-17

## 1) Denetim Kapsamı

Bu teknik denetim üç alanı kontrol eder:

* Teslim öncesi güçlendirilmesi gereken teknik noktalar.
* Daha küçük ve test edilebilir bileşenlere ayrılması gereken büyük UI modülleri.
* Sitede hâlâ mock, demo veya sadece lokal çalışan bölümler.

## 2) Çalıştırılan Testler

Komutlar:

* `npm run check` geçti.
* `npm run build` geçti.
* `git diff --check` geçti.
* `npm run typecheck`, component extraction sonrasında geçti.
* `npm run validate:workflows` artık çıkarılan component export/use contract kontrollerini de içeriyor.
* `npm run test:components`, 3 test dosyası ve 13 component/user-event testiyle geçti.

Rota smoke testi:

* `/`, `/buyer/products`, `/buyer/cart`, `/buyer/agent`, `/buyer/profile`, `/buyer/products/ergoflex-calisma-sandalyesi`
* `/seller`, `/seller/products`, `/seller/products/ergoflex-calisma-sandalyesi`, `/seller/actions`, `/seller/actions/restock-ergoflex-calisma-sandalyesi`, `/seller/agent`, `/seller/profile`
* `/demo`

Tüm rotalar `http://localhost:3000` üzerinde HTTP 200 döndürdü.

API smoke testi:

* `GET /api/buyer/catalog` 48 ürün döndürdü.
* `POST /api/agent/floating` sohbet sorusunda `mode=chat` döndürdü.
* `POST /api/agent/floating` buyer aksiyonunda `mode=buyer-agent` döndürdü.
* `POST /api/buyer/agent` OpenAI tarafından üretilmiş öneriler döndürdü.
* `POST /api/seller/agent` OpenAI tarafından üretilmiş satıcı bulguları döndürdü.
* `POST /api/review-intelligence` OpenAI tarafından üretilmiş review intelligence çıktısı döndürdü.
* `GET /api/seller/products`, `/api/seller/actions`, `/api/seller/profile`, `/api/buyer/profile` başarılı döndü.

Teknik inceleyici kanıt route tablosu:

| Yüzey | Route/API | Kanıt sinyali |
|---|---|---|
| Rol geçidi | `/` | Buyer/seller girişleri ayrıdır ama aynı commerce sistemini paylaşır. |
| Buyer katalog | `/buyer/products` | 48 contract-backed ürün, kategori filtreleri, sıralama ve sprite-backed ürün görselleri. |
| Buyer ürün detayı | `/buyer/products/calliel-spf50-gunes-kremi` | Satın alma paneli, mağaza CTA'sı, 4 kayıtlık yorum/not sayfalama ve Agent notu. |
| Buyer Agent | `/buyer/agent`, `POST /api/buyer/agent` | Katalog sınırları içinde öneri ve açık append/replace onayı. |
| Buyer sepet | `/buyer/cart` | Lokal sepet state'i, adet kontrolleri ve önerilen ürünler. |
| Seller overview | `/seller`, `GET /api/seller/overview` | Risk kartları, buyer/seller sinyal döngüsü ve deduplicate edilmiş öncelik kuyruğu. |
| Seller ürünler | `/seller/products`, `GET /api/seller/products` | Product radar, health score, arama/sıralama/focus filtreleri. |
| Seller aksiyonlar | `/seller/actions`, `GET /api/seller/actions` | Focus'a göre gruplanmış aksiyon kuyruğu ve ürün kanıt linkleri. |
| Seller aksiyon detayı | `/seller/actions/[id]`, `GET /api/seller/actions/[id]` | İş adımları, etkilenen ürünler, açıklama contract'ı ve ilgili yerlerde yorum öne çıkanları. |
| Seller Agent | `/seller/agent`, `POST /api/seller/agent` | Bulgular, draft listing preview, onay ve lokal rollback sınırı. |
| Floating Agent | `POST /api/agent/floating` | Route-aware buyer/seller/chat modları ve rol uyuşmazlığı guardrail'leri. |
| Review Intelligence | `POST /api/review-intelligence` | Source review id/theme ile sınırlandırılmış LLM contract'ı. |
| Demo proof | `/demo` | Jüri/teknik inceleyici yürüyüşü için insan tarafından okunabilir runbook ve proof stack. |

Puppeteer component smoke testi:

* `BuyerCatalogGrid`: yatay slider var, 48 ürün kartı render oluyor, soluk kartlar kaldırıldı, sepete ekleme lokal sepet state'ine yazıyor.
* `BuyerProfileWorkspace`: yorum sayfalama var ve 2. sayfaya geçilebiliyor.
* `FloatingAgentPanel`: sohbet sorusu chat-only kalıyor; devamındaki buyer aksiyonu ürün önerisi ve onay butonları üretiyor.
* `FloatingAgentPanel` temiz oturum guard'ı: desteklenmeyen `iPhone` prompt'u katalog sınırı cevabı üretti, apply butonları render olmadı, yeniden açılış temiz başladı, textarea boş kaldı ve kalıcı history uzunluğu 0 kaldı.
* Agent hallucination guard: desteklenmeyen `PlayStation` prompt'u, buyer rolünde seller operasyon prompt'u, seller rolünde buyer sepet prompt'u ve stale `iPhone` LLM anlatısı validation tarafından engelleniyor veya sanitize ediliyor.
* Buyer profil/ürün uyarısı: `/buyer/products/ergoflex-calisma-sandalyesi`, Aylin için profil bazlı hızlı kargo uyarısı üretiyor ve bunu Floating Agent proactive state'ine taşıyor.
* `SellerProductsWorkspace`: ürünler seçili evidence rail ile render oluyor.
* `SellerActionsWorkspace`: aksiyon kartları ve detay linkleri render oluyor.
* Component extraction pass: `/buyer/agent` hâlâ Buyer composer, FAQ ve approval panelini teknik trace göstermeden render ediyor; Floating panel boş textarea ve route default placeholder ile açılıyor; `/seller/agent` tool-calling trace, listing snapshots, onay butonu ve audit log'u render ediyor.

Bileşen test kapsamı:

* `buyer-agent-panels.test.tsx`: sohbet metinleri, öneri kartı linkleri, append/replace onay callback'leri, disabled apply state ve FAQ açılımı.
* `floating-agent-result-panel.test.tsx`: buyer result append/replace, loading disabled state, seller draft apply/rollback ve role data eksikken null render.
* `seller-agent-listing-panels.test.tsx`: before/after snapshots, draft delta satırları, boş audit state, apply callback, rollback callback, applied/rolled-back/error notice'ları.

## 3) Denetimde Bulunan ve Çözülen Sorunlar

Floating Agent'ta çok turlu akış riski vardı:

* Textarea, route default prompt'unu gerçek değer olarak kullanıyordu.
* Kullanıcı mevcut mesajdan sonra yazdığında yeni prompt önceki/default prompt ile birleşebiliyordu.
* Chat'ten aksiyona geçişte bu durum isteği buyer-agent yerine chat modunda tutabiliyordu.

Uygulanan düzeltme:

* Floating textarea artık `placeholder={context.defaultPrompt}` kullanıyor ve boş başlıyor.
* Başarılı gönderimden sonra textarea temizleniyor.
* Floating intent router, güncel prompt açıkça agentic buyer/seller aksiyonuysa history/model kaynaklı yanlış route kararını eziyor.
* Validation bu davranışı koruyor.

Desteklenmeyen katalog testinden sonra eklenen ikinci guard:

* Floating panel yalnızca panel içi geçici `sessionTurns` tutuyor ve `/api/agent/floating` endpoint'ine `history: []` gönderiyor.
* Her panel açılışı prompt, result card'lar, apply state ve lokal chat turn'lerini sıfırlıyor.
* iPhone/telefon/konsol/TV/beyaz eşya/ayakkabı gibi açıkça desteklenmeyen ürün aileleri için buyer prompt'ları `buyer-agent` önerisi yerine katalog sınırı chat cevabı döndürüyor.
* LLM/model override stale bir `actionPrompt` döndürürse downstream Agent contract çalışmadan önce açık güncel buyer/seller aksiyon prompt'u kazanıyor.
* Validation `history: []`, `openFreshSession`, panelde kalıcı `appendFloatingAgentTurn` kullanılmaması, unsupported catalog boundary ve stale `actionPrompt` override kontrollerini içeriyor.

Manuel hallucination testinden sonra eklenen üçüncü guard:

* `src/lib/agents/buyer-catalog-guardrails.ts` desteklenmeyen buyer katalog tespitini merkezileştiriyor.
* `/api/buyer/agent`, smart-cart orchestration öncesinde desteklenmeyen katalog prompt'larını reddediyor.
* Floating Agent rol uyuşmazlığını engelliyor: buyer paneli seller operasyonu, seller paneli buyer sepet/hediye komutu çalıştırmıyor.
* Buyer Agent LLM anlatı alanları `iPhone` gibi desteklenmeyen katalog terimleri içerirse sanitize ediliyor.
* Smart-cart bütçe parser'ı `iki bin tl` gibi yazıyla ifade edilen Türkçe tutarları destekliyor.
* `src/lib/agents/buyer-profile-product-alerts.ts` profil tercihleri, önceki şikayet temaları ve ürün yorum/metrik risk sinyallerinden buyer ürün detay uyarıları hesaplıyor.

## 4) Bileşen Ayrıştırma Durumu ve Öncelik

Tamamlanan ilk extraction pass:

| Alan | Yeni dosya | Orchestration dosyasında kalan |
|---|---|---|
| Floating Agent result/apply UI | `src/components/commerce/floating-agent-result-panel.tsx` | `src/components/commerce/floating-agent-panel.tsx` route context, prompt submit, buyer/seller apply ve kontrolleri tutuyor. |
| Buyer Agent panelleri | `src/components/commerce/buyer-agent-panels.tsx` | `src/components/commerce/buyer-agent-workspace.tsx` prompt/API request, profile selection, cart count ve apply state'i tutuyor. |
| Seller listing approval UI | `src/components/commerce/seller-agent-listing-panels.tsx` | `src/components/commerce/seller-agent-workspace.tsx` prompt/API request, audit state, ürün bulguları, runtime ve trace proof'u tutuyor. |

İlk pass sonrası mevcut satır sayıları:

| Dosya | Satır |
|---|---:|
| `src/components/commerce/floating-agent-panel.tsx` | 452 |
| `src/components/commerce/floating-agent-result-panel.tsx` | 149 |
| `src/components/commerce/buyer-agent-workspace.tsx` | 377 |
| `src/components/commerce/buyer-agent-panels.tsx` | 341 |
| `src/components/commerce/seller-agent-workspace.tsx` | 740 |
| `src/components/commerce/seller-agent-listing-panels.tsx` | 231 |

Mevcut en büyük UI modülleri:

| Öncelik | Dosya | Satır | Neden ayrıştırılmalı? |
|---|---:|---:|---|
| P0 | `src/components/commerce/seller-profile-workspace.tsx` | 1010 | Form kontrolleri, permission kartları, bildirim kontrolleri, alert kuralları ve status panelleri tek dosyada fazla yoğun. |
| P0 | `src/components/commerce/seller-agent-workspace.tsx` | 740 | Product findings, conversation, evidence panelleri ve trace/sidebar hâlâ aynı dosyada; listing approval ayrıştırıldı. |
| P1 | `src/components/commerce/buyer-agent-workspace.tsx` | 377 | İlk pass tamamlandı; sonraki risk dedicated component/user-event testlerini artırmak. |
| P1 | `src/components/commerce/seller-actions-workspace.tsx` | 676 | Filter state, action card'lar, selected rail ve empty state birbirine bağlı. |
| P1 | `src/components/commerce/seller-products-workspace.tsx` | 668 | Filter/search/sort, ürün satırları ve selected rail ayrılmalı. |
| P1 | `src/components/commerce/demo-rehearsal-workspace.tsx` | 656 | Demo proof kartları ve runbook kartları statik render bileşenleri olarak ayrıştırılabilir. |
| P1 | `src/components/commerce/buyer-profile-workspace.tsx` | 605 | Profil formu, tercih chip'leri, renk editörü ve yorum sayfalama ayrılmalı. |
| P1 | `src/components/commerce/floating-agent-panel.tsx` | 452 | Result card'lar ayrıldı; kalan adaylar history, prompt form ve kontroller. |

Önerilen extraction sırası:

1. `SellerAgentWorkspace`: `SellerAgentConversation`, `SellerProductFindingCard`, `EvidenceSummaryPanel`, `NextStepsPanel` çıkar.
2. `FloatingAgentPanel`: `FloatingChatHistory`, `FloatingPromptForm`, `FloatingControls` çıkar.
3. `SellerProfileWorkspace`: önce tekrar kullanılabilir form kontrollerini, sonra permission/capability/audit bölümlerini çıkar.
4. `SellerProductsWorkspace` ve `SellerActionsWorkspace`: list item card'ları ve selected rail component'lerini çıkar.
5. Profile pagination/form'ları, seller filtreleri ve floating prompt submit akışları için daha geniş user-event testleri ekle.

## 5) Test Altyapısı Durumu

Dedicated component test stack artık `package.json` içinde mevcut.

Mevcut kapsam:

* `eslint`
* `tsc --noEmit`
* `scripts/validate-workflows.js`
* `vitest` + `jsdom`
* React Testing Library + User Event
* manuel/otomatik HTTP smoke
* Puppeteer smoke

Hâlâ eksik olanlar:

* Tam form, filtre ve sayfalama akışları için daha geniş user-event testleri.
* Canlı Next server gerektirmeden çalışan API route testleri.
* Commitlenmiş, tekrar çalıştırılabilir browser regression script'leri.

Önerilen sonraki test genişletmesi:

* Pure function'lar ve API contract builder'ları için Vitest.
* Seller profile, buyer profile ve product/action liste filtreleri için daha fazla React Testing Library kapsamı.
* Buyer/seller/floating kritik yolları için commitlenmiş Puppeteer smoke script'i.

## 6) Mock / Demo / Sadece Lokal Envanteri

Mock data kaynağı:

* `src/data/mock/*`: ürünler, yorumlar, siparişler, sepetler, envanter event'leri, ilişkiler, buyer'lar ve seller'lar.
* `prisma/schema.prisma`, migration SQL ve `prisma/seed.ts`: aynı curated dataset'i Supabase Postgres'e taşır; P1 migration ve seed gerçek DB üzerinde doğrulandı.
* `src/lib/data/*`: runtime'da hâlâ lokal mock data okur; DB read layer P2 işidir.

Mock commerce contract'ları:

* `src/lib/api/buyer-catalog.ts`: `source: "mock-commerce-catalog"`.
* `src/lib/api/seller.ts`: `source: "mock-workflow"` ve `demoSellerId = "seller-commercepilot"`.
* `src/lib/api/buyer-profile.ts`: `source: "buyer-profile-mock"`.
* `src/lib/api/seller-profile.ts`: `source: "seller-profile-mock"`.

Sadece lokal state:

* Buyer sepet: `commercepilot.buyerCart.v1`, `localStorage` içinde.
* Buyer profil taslağı: `commercepilot.buyerProfile.v1`, `localStorage` içinde.
* Seller profil taslağı: `commercepilot.sellerProfile.v1`, `localStorage` içinde.
* Seller listing mutation/audit store: `commercepilot.sellerListingMutations.v1`, `localStorage` içinde.
* Floating Agent control state: `commercepilot.floatingAgent.v1`, `localStorage` içinde. Eski `history` alanı store shape içinde bulunabilir ama mevcut panel yeni chat turn'lerini kalıcı yazmaz ve stored history'yi API'ye göndermez.

Mock mutation'lar:

* Buyer cart apply payload'u server-side doğrulanır; ardından client temiz payload'u `localStorage` içine yazar.
* Seller listing apply preview/apply server-side doğrulanır; ardından client override ve audit log'u `localStorage` içine yazar.
* Rollback, lokal audit store üzerinde client-side çalışır.

Mock görsel asset'ler:

* Ürün/kategori görselleri ortak sprite `public/catalog/buyer-product-sprite.png` kullanır.
* Demo için kabul edilebilir; final sunum polish'i için SKU bazlı ürün görsellerinden daha zayıftır.

LLM fallback/demo davranışı:

* İlk GET/default Agent data deterministiktir ve LLM çağırmaz.
* Canlı POST agent/explanation endpoint'leri yapılandırılmış provider'ı çağırır; provider/key/model output başarısız olursa deterministic fallback kullanır.
* Gemini final provider geçişi hâlâ planlıdır.

Henüz gerçek olmayanlar:

* Authentication/session/roles.
* Database persistence.
* Payment/checkout/order creation.
* Gerçek stok rezervasyonu.
* Gerçek kargo/fulfillment.
* Real seller account management.
* Server-side audit trail.
* Server-side cart/profile persistence.
* Product image generation per SKU.
* Production analytics/telemetry.

## 7) Önceliklendirilecek Teknik İyileştirmeler

1. Tekrar çalıştırılabilir test stack'ini genişlet.
   Mevcut validation data/workflow contract'ları için güçlü; ancak component davranışı için hâlâ sınırlı. Vitest + React Testing Library kapsamını büyüt ve yukarıdaki Puppeteer smoke case'lerini script haline getir.

2. Büyük workspace component'lerini ayrıştır.
   En büyük risk runtime failure değil; tek workspace dosyasında fazla concern kaldığı için sonraki UI değişikliklerinin davranış kırması.

3. `localStorage` persistence'ını server persistence sınırına taşı.
   Cart, profile, floating history, seller listing audit ve rollback ileride API/storage interface'lerinin arkasına alınmalı.

4. Auth/session abstraction ekle.
   `buyer-aylin` ve `seller-commercepilot` hardcoded demo identity'lerdir. Gerçek deployment anlatısından önce typed session/user context'e dönüşmelidir.

5. LLM latency ve observability'yi iyileştir.
   Smoke sırasında generated çağrıların birkaç saniye sürebildiği, seller agent'ın bir çalıştırmada yaklaşık 10 saniyeye çıktığı görüldü. Request timeout, latency metadata, UI loading threshold'ları ve sağlayıcı telemetry'si eklenmeli.

6. Intent router testlerini güçlendir.
   Denetim bir chat-to-action sorununu yakaladı. Adversarial multi-turn testler eklemeye devam et: yardım sorusu -> ürün görevi, ürün görevi -> güvenlik sorusu, seller aksiyonu -> rollback sorusu.

7. Teknik proof'u kullanıcı yüzeyinden uzak tut ama `/demo` proof'unu güçlü bırak.
   Buyer/Floating yüzeyleri ürün gibi kalmalı; jüri kanıtını `/demo`, validation ve API contract'ları taşımalı.

8. Teslimde neyin bilerek mock kaldığını netleştir.
   Gerçek operasyonlar kapsam dışı; sunum şu cümleyi açık taşımalı: "Supabase'e seed edilmiş curated data, gerçek LLM orchestration, typed guardrails, local approved mutations."

## 8) Güncel Değerlendirme

Teknik olarak proje hackathon ürünü için tutarlı:

* Uygulama yalnızca statik TSX değildir; typed API contract'ları, workflow validation, LLM provider abstraction, Agent guardrail'leri ve approval boundary'leri vardır.
* En büyük kalan zayıflık core Agent mimarisi değil; test isolation ve persistence katmanıdır.
* En net sonraki engineering adımı, yeni özellik eklemeden önce component extraction ve component test kapsamını artırmaktır.

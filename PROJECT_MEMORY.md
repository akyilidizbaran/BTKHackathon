# PROJECT_MEMORY

## 0) TL;DR (En güncel durum)

* Şu an ne yapıyoruz?
  * Milestone 8R tamamlandı: end-to-end demo rehearsal yüzeyi, typed runbook contract'ı ve QA checklist `/demo` altında çalışıyor.
* Son değişiklik neydi?
  * `src/lib/demo/rehearsal.ts`, `DemoRehearsalWorkspace` ve `/demo` route'u eklendi; ana gateway'den demo provasına geçiş var, runbook validation script'e bağlandı.
* Bir sonraki net adım ne?
  * Milestone 9A: Gemini/provider finalization; mevcut buyer/seller agent contract'larını bozmadan final provider swap.

## 1) Proje Amacı ve Kapsam

* Amaç:
  * CommercePilot, klasik marketplace alışveriş deneyimi ile alıcı/satıcı tarafında yaşayan agent pet'i birleştiren çift taraflı bir e-ticaret zekası platformudur. Amaç kullanıcıya tanıdık bir e-ticaret arayüzü sunarken, AI agent'ın sepet kurma, ürün uyarısı, satılmayan ürün analizi ve izinli listeleme düzenleme aksiyonlarını doğal şekilde yürütmesidir.
* Kapsam içi:
  * Buyer tarafı: marketplace homepage, kategori/search, ürün grid, ürün detay, yorumlar, sepet, sağ alt agent pet ve agent destekli sepet mutation'ları.
  * Seller tarafı: klasik satıcı paneli, ürün yönetimi, stok/satış/yorum sinyalleri, satılmayan ürün analizi, agent destekli listeleme mutation'ları.
  * İlk aşamada mock/kurgu veri kullanılacak; veriler rastgele değil, demo hikayesi taşıyacak şekilde tasarlanacak.
* Kapsam dışı:
  * İlk fazda gerçek ödeme, gerçek kimlik doğrulama, gerçek veritabanı, kargo/lojistik ve scraping yok.

## 2) Non-negotiables / Kırmızı Çizgiler

* Demo odaklı ilerle: 7 günlük hackathon için en güçlü ve anlaşılır akışlar seçilecek.
* Satıcı tarafı alıcı tarafına göre biraz daha öncelikli olacak.
* AI/LLM çıktıları kör şekilde kullanılmayacak; önce deterministik veri analizi yapılacak, LLM yalnızca açıklama, özetleme ve metin üretme katmanında kullanılacak.
* Mock data rastgele olmayacak; her ürün net bir demo problemine hizmet edecek.
* İlk kurulumda overengineering yapılmayacak; gerçek auth/database/payment ertelenecek.
* Dark dashboard dili artık ana yön değil; CommercePilot light, klasik e-ticaret düzeniyle ilerleyecek.
* UI açıklama dashboard'u gibi davranmayacak; ürün, sepet, profil ve satıcı yönetim yüzeyleri önce gelecek, derin açıklama agent'a bırakılacak.
* Buyer tarafında header ve sidebar aynı navigasyonu tekrar etmeyecek; buyer ana nav sadece `Ürünler`, `Sepet`, `Agent`, `Profil`.
* Buyer ürün kartı ana tıklamada ürün detay/satış penceresine gider; sepete ekleme `Sepete Ekle` aksiyonuyla yapılır.
* Katalogdaki her ürün dynamic `/buyer/products/[slug]` endpoint'inde satış detay penceresi açmalıdır.
* Buyer kategori seti ilk fazda `Kadın Giyim`, `Erkek Giyim`, `Elektronik`, `Ev & Yaşam`, `Kozmetik`, `Spor`, `Aksesuar`.
* Buyer cart boşken veya kullanıcı ürün eklemeden uzun açıklama blokları gösterilmeyecek.
* Buyer cart state ilk fazda `localStorage` ile korunacak.
* Buyer agent katalog dışı ürün uydurmayacak; yalnızca mevcut katalog ürünlerinden seçim yapacak.
* Seller overview tek uzun sayfa olmayacak; iade, negatif yorum, satılmayan ürün ve stok uyarıları kısa kartlardan ilgili endpoint'lere gidecek.
* Seller agent listing mutation'ı hemen uygulamayacak; önce/sonra preview gösterecek, satıcı onaylarsa mock state'e uygulayıp audit log'a yazacak.
* Agent pet proactive konuşabilir ama susturma/gizleme modları ve izin katmanları olmadan kullanıcı adına mutation yapmamalı.
* Floating Agent tüm buyer/seller sayfalarında görünebilir; ayrı bir müşteri temsilcisi widget'ı değil, `/buyer/agent` ve `/seller/agent` ekranlarıyla aynı runtime/history kullanan kompakt Agent UI'dır.
* Floating Agent mini paneli Agent sayfasına taşıma zorunluluğu olmadan ürün önerisi, sepet apply, seller analiz ve seller mutation preview gibi işleri kendi içinde yapabilir.
* Floating Agent context-aware çalışmalı; bulunduğu route, ürün, sepet veya seller alanı bağlamını bilmelidir.
* Floating Agent proactive uyarıları ilk fazda ses kullanmaz; badge/ünlem/kafa kaldırma gibi sessiz görsel mikro etkileşim kullanır.
* Floating Agent için `Gizle`, `Sessize al`, `Bu sayfada uyarma` kontrolleri zorunludur.
* Floating Agent ilk fazda web/desktop odaklıdır; mobil davranış bu adımda kapsam dışıdır.
* İlk floating avatar Codex pet benzeri teknik/sevimli avatar olabilir ve sonra değiştirilebilir.
* UI içinde Gemini çalışıyormuş gibi sahte davranılmayacak; OpenAI geçici provider olarak kalacak, Gemini final provider swap sonraya bırakılacak.

## 3) Mimari Özet

* Bileşenler:
  * Buyer tarafı: ürün keşfi, ürün detayı, sepet ve ileride akıllı sepet.
  * Seller tarafı: dashboard, ürünler, stok, satış, yorumlar, ürün sağlığı, büyüme aksiyonları.
  * Intelligence katmanı: stok, satış, yorum ve ürün ilişkilerinden aksiyon üretme.
* Veri akışı:
  * Mock commerce data -> deterministik skorlar/workflow'lar -> UI panelleri -> ileride Gemini açıklamaları/ajan çıktıları.
* Önemli dizinler/modüller:
  * `src/types/commerce.ts`: domain tipleri.
  * `src/data/mock/*`: curated mock commerce dataset.
  * `src/lib/data/*`: mock data access layer ve birleşik view helper'ları.
  * `src/lib/scoring/*`: açıklanabilir deterministic scoring layer.
  * `src/lib/workflows/*`: scoring çıktılarını use-case odaklı aksiyon ve insight çıktılarına çeviren workflow katmanı.
  * `src/lib/api/*`: UI ve route handler'ların ortak kullandığı API contract/data builder katmanı.
  * `src/lib/llm/*`: provider kontrollü OpenAI Responses API text generation wrapper'ı ve deterministic fallback davranışı.
  * `src/lib/api/seller-action-explanations.ts`: seller action detail context'ini runtime LLM açıklama contract'ına çevirir.
  * `src/lib/api/buyer-smart-cart-explanations.ts`: buyer smart cart context'ini runtime LLM sepet açıklama contract'ına çevirir.
  * `src/lib/api/buyer-catalog.ts`: buyer marketplace kategori, sıralama, görsel metadata ve ürün kartı contract'ını üretir.
  * `src/app/api/buyer/catalog/route.ts`: buyer katalog contract'ını `success/data/error` envelope ile döndürür.
  * `src/lib/api/buyer-agent.ts`: buyer Agent prompt contract'ını smart-cart workflow ve katalog ürün kartlarıyla birleştirir; apply contract'ı `append`/`replace` stratejilerini doğrular.
  * `src/lib/agents/buyer-cart-apply.ts`: buyer Agent cart apply validation, preview, shared mutation contract, route/floating surface metadata ve API data builder için tek kaynak.
  * `src/lib/agents/buyer-cart-apply-client.ts`: route Agent ve floating Agent tarafından kullanılan client-side cart mutation helper'ı; `localStorage` yazımı ve cart update event'i burada merkezileşir.
  * `src/lib/api/seller-agent.ts`: seller Agent prompt contract'ını seller products/actions contract'larıyla birleştirir; prompt'u risk focus'una ayırır, ürün kanıtı, action önerisi, next step ve onay gerektiren shared listing apply draft preview döndürür.
  * `src/lib/agents/seller-listing-apply.ts`: seller Agent listing apply validation, before/after preview, shared mutation contract, route/floating surface metadata, audit preview ve API data builder için tek kaynak.
  * `src/lib/agents/seller-listing-apply-client.ts`: route Agent ve floating Agent tarafından kullanılan client-side listing mutation helper'ı; `localStorage` listing override, audit log ve rollback event'i burada merkezileşir.
  * `src/lib/agents/runtime.ts`: buyer/seller Agent prompt template registry, typed tool registry, request contract, runtime snapshot, guardrail ve 8R handoff metadata için ortak kaynak.
  * `src/lib/agents/floating-agent.ts`: floating Agent route context, proactive mesaj, runtime snapshot, capability ve control contract'ları için tek kaynak.
  * `src/lib/agents/floating-agent-client.ts`: floating Agent `localStorage` history/control state okuma-yazma, route snooze ve sync event helper'ları.
  * `src/lib/demo/rehearsal.ts`: 8R demo runbook, proof card, QA checklist ve CTA route contract'ları için tek kaynak.
  * `src/lib/api/seller-profile.ts`: seller profile, Agent permission mode, capability matrix, notification channels, risk thresholds, quiet hours, proactive controls, audit trail ve PATCH validation contract'ını üretir.
  * `src/lib/api/seller.ts`: seller overview/actions/products/product health/buyer signal contract builder'larını üretir; 8K itibarıyla actions contract'ı kategori/focus segmentleri, action card ürün kanıtları, category route metadata ve seller product sprite image metadata taşır.
  * `src/app/api/buyer/agent/route.ts`: agent prompt'unu alır, katalogdaki mevcut ürünlerden görselli öneri ve onay mesajı döndürür.
  * `src/app/api/buyer/agent/apply/route.ts`: onaylanan agent sepet mutation payload'unu doğrular ve client'ın localStorage'a uygulayacağı temiz ürün/adet listesini döndürür.
  * `src/app/api/seller/agent/apply/route.ts`: onaylanan seller listing mutation payload'unu doğrular ve client'ın localStorage'a uygulayacağı before/after delta, shared mutation ve audit preview contract'ını döndürür.
  * `src/app/api/agent/runtime/route.ts`: shared Agent runtime registry'yi read-only `GET /api/agent/runtime` endpoint'iyle döndürür.
  * `src/lib/api/buyer-profile.ts`: buyer profile tercihleri, yorum geçmişi, öğrenilen sinyaller ve PATCH validation contract'ını üretir.
  * `src/app/api/buyer/profile/route.ts`: buyer profile `GET/PATCH` endpoint'ini `success/data/error` envelope ile döndürür.
  * `src/lib/profile/buyer-profile-storage.ts`: buyer profile taslağını client-side `localStorage` üzerinde okur/yazar ve güncelleme event'i yayınlar.
  * `src/app/api/seller/profile/route.ts`: seller profile `GET/PATCH` endpoint'ini `success/data/error` envelope ile döndürür.
  * `src/lib/profile/seller-profile-storage.ts`: seller profile taslağını client-side `localStorage` üzerinde okur/yazar ve güncelleme event'i yayınlar.
  * `src/components/commerce/buyer-catalog-grid.tsx`: fotoğraflı ürün kartları, puan/yorum/teslimat/indirim sinyalleri ve görünür `Sepete Ekle` aksiyonunu render eder.
  * `src/lib/cart/buyer-cart.ts`: buyer sepetini `localStorage` üzerinde okur/yazar; ekleme, adet güncelleme, silme ve clear helper'larını sağlar.
  * `src/components/commerce/buyer-product-purchase-panel.tsx`: ürün detayındaki adet, `Şimdi Al`, `Sepete Ekle` ve favori aksiyon yüzeyi.
  * `src/components/commerce/buyer-cart-workspace.tsx`: sepet satırları, adet/sil/temizle, toplam hesaplama, empty state ve checkout mock yüzeyi.
  * `src/components/commerce/buyer-agent-workspace.tsx`: `/buyer/agent` için prompt composer, chat cevabı, görselli ürün önerileri, onay paneli ve cart apply akışını render eder.
  * `src/components/commerce/seller-agent-workspace.tsx`: `/seller/agent` için prompt composer, ürün kanıt sırası, before/after listing preview, onaylı apply, audit log ve rollback akışını render eder.
  * `src/components/commerce/agent-runtime-panel.tsx`: buyer/seller Agent ekranlarında ortak runtime prompt/tool plan, guardrail ve registry linkini gösterir.
  * `src/components/commerce/floating-agent-panel.tsx`: tüm buyer/seller sayfalarında sağ alt Codex pet avatarı, context-aware mini panel, shared history, buyer cart apply, seller listing apply/rollback ve mute/snooze/gizle kontrollerini render eder.
  * `src/components/commerce/demo-rehearsal-workspace.tsx`: `/demo` için art-directed 8R demo command center; buyer/seller/floating Agent runbook, proof stack, QA checklist ve CTA yüzeyini render eder.
  * `src/components/commerce/buyer-profile-workspace.tsx`: `/buyer/profile` için profil notu, tercih checkbox'ları, bütçe/renk kontrolü, yorum geçmişi, öğrenilen sinyal paneli ve kaydetme akışını render eder.
  * `src/components/commerce/seller-profile-workspace.tsx`: `/seller/profile` için mağaza bilgisi, Agent permission mode, capability toggles, notification channels, risk thresholds, quiet hours, proactive controls, audit trail ve kaydetme akışını render eder.
  * `src/components/commerce/seller-overview-workspace.tsx`: `/seller` için seller karar başlığı, 4 risk endpoint kartı, öncelik sırası rail'i, kategori dağılımı ve düşük sağlık ürün listesi render eder.
  * `src/components/commerce/seller-products-workspace.tsx`: `/seller/products` için fotoğraflı ürün listesi, segment/search/sort filtreleri, seçili ürün evidence rail'i ve kategori yoğunluğu render eder.
  * `src/components/commerce/workspace-shell.tsx`: light marketplace header, search ve header-only yatay nav shell'i; buyer nav `Ürünler/Sepet/Agent/Profil`, seller nav `Ana Sayfa/Ürünler/Aksiyonlar/Agent/Profil`.
  * `src/components/commerce/role-gateway.tsx`: light rol giriş yüzeyi.
  * `src/app/buyer/products/[slug]/page.tsx`: katalogdaki her mock ürün için dynamic buyer ürün detay endpoint iskeleti.
  * `src/app/buyer/agent/page.tsx`: buyer Agent workspace'ini server-side initial agent contract ile açar.
  * `src/app/seller/agent/page.tsx`: seller Agent analiz workspace'ini server-side initial agent contract ile açar.
  * `src/app/buyer/profile/page.tsx`: server-side default buyer profile contract'ını `BuyerProfileWorkspace` client component'ine verir.
  * `src/app/seller/profile/page.tsx`: server-side default seller profile contract'ını `SellerProfileWorkspace` client component'ine verir.
  * `src/app/demo/page.tsx`: 8R demo rehearsal workspace'ini typed runbook contract ile açar.
  * `public/catalog/buyer-product-sprite.png`: 8E buyer katalog ve kategori görselleri için kontrollü mock ürün sprite'ı.
  * `src/app/globals.css`: light CommercePilot tokenları ve geçici `commerce-legacy-light` bridge'i.
  * `COMMERCEPILOT_AGENT_MARKETPLACE_ROADMAP.md`: marketplace + agent pet pivot kararları, endpoint haritası ve revize milestone yol haritası.
  * Planlanan sonraki yapı: buyer `products/cart/agent/profile`, seller `overview/products/actions/agent/profile`, `src/lib/agents/prompts/*`, `src/lib/agents/tools/*`, `src/lib/agents/runtime/*`, cart/listing mock mutation ve audit katmanı.

## 4) Konvansiyonlar ve Standartlar

* Kod stili / lint / format:
  * Next.js App Router + TypeScript + Tailwind CSS kullanılıyor.
  * UI motion için `gsap` + `@gsap/react`, ikonlar için `@phosphor-icons/react` kullanılıyor.
  * Lint komutu: `npm run lint`
  * Build komutu: `npm run build`
* Branch/commit yaklaşımı:
  * Her milestone ayrı commitlenecek ve private GitHub reposuna pushlanacak.
* İsimlendirme/klasör düzeni:
  * Agent mantığı doğrudan UI içine yazılmayacak; önce workflow katmanı kurulacak.
  * Deterministik iş akışları için `lib/workflows/` düşünülüyor.
  * LLM sağlayıcı ve prompt mantığı için ileride `lib/gemini/` düşünülüyor.

## 5) Kurulum & Çalıştırma

* Gereksinimler:
  * Node.js 22.22.1
  * npm 10.9.4
* Komutlar:
  * `npm install`
  * `npm run dev`
  * `npm run lint`
  * `npm run typecheck`
  * `npm run validate:workflows`
  * `npm run check`
  * `npm run build`
* Ortam değişkenleri (sadece İSİMLER):
  * LLM_PROVIDER
  * OPENAI_MODEL
  * OPENAI_API_KEY
  * GEMINI_API_KEY
* Lokal geliştirme notları:
  * İlk LLM geliştirme OpenAI ile yapılabilir; final hackathon hedefi Gemini'ye geçiştir.
  * `.env.local` commitlenmez; `.env.example` sadece değişken isimlerini tutar.

## 6) Decision Log (append-only)

* 2026-05-12 — Karar: Satıcı tarafı buyer tarafına göre biraz daha öncelikli olacak. | Gerekçe: Seller intelligence daha güçlü iş değeri ve hackathon demosu yaratıyor. | Etki: En güçlü demo noktası Seller Growth Actions olacak. | Alternatifler: Buyer-first akıllı alışveriş asistanı.
* 2026-05-12 — Karar: CommercePilot "buyer assistant + seller dashboard" olarak değil, çift taraflı commerce intelligence sistemi olarak konumlanacak. | Gerekçe: Alıcı ihtiyaçları, ürün ilişkileri, yorumlar, satış ve stok verileri aynı zekâ katmanında birleşince ürün farklılaşıyor. | Etki: Satıcı aksiyonları buyer verisiyle ileride beslenebilecek.
* 2026-05-12 — Karar: İlk AI sırası Seller Growth Action Agent -> Buyer Smart Cart Agent -> Review Intelligence Agent -> Listing Optimizer Agent olacak. | Gerekçe: Satıcı büyüme aksiyonları demo değerini en hızlı gösterir. | Etki: Phase 2 seller odaklı olacak.
* 2026-05-12 — Karar: Phase 1'de Gemini kullanılmayacak; AI-ready alanlar deterministik/mock insight olarak tasarlanacak. | Gerekçe: Temel ürün zemini oturmadan LLM eklemek kırılgan ve sahte hissettirebilir. | Etki: UI, ileride Gemini ile zenginleşecek şekilde hazırlanacak.
* 2026-05-12 — Karar: `lib/workflows/` veya benzeri bir use-case katmanı eklenecek. | Gerekçe: UI'ın ham veriye veya doğrudan agent/LLM çıktısına bağlanmasını önlemek. | Etki: Seller action, smart cart ve product health gibi akışlar daha sonra Gemini ile genişletilebilir.
* 2026-05-13 — Karar: Alıcı tarafı "chatbot ile alışveriş" olarak değil, karar güveni ve ihtiyaç bazlı sepet kurma deneyimi olarak konumlanacak. | Gerekçe: Alıcıların temel problemi sonsuz seçenek içinde doğru ürüne güvenle karar vermek. | Etki: Buyer Smart Cart, product confidence, alternatives, complements ve review warnings önceliklendirilecek.
* 2026-05-13 — Karar: İlk LLM geliştirme OpenAI ile yapılabilecek, mimari provider değiştirilebilir kurulacak ve final hedef Gemini olacak. | Gerekçe: Şu an Gemini API key yok; hackathon kuralına uyum için son sağlayıcı Gemini olmalı. | Etki: `LLM_PROVIDER`, `OPENAI_API_KEY`, `GEMINI_API_KEY` env isimleri ayrıldı.
* 2026-05-13 — Karar: Backend/web temeli milestone'lar halinde kurulacak. | Gerekçe: Tek seferde tüm agentic işleri yapmak yerine sağlam, commitlenebilir adımlar isteniyor. | Etki: Milestone 0 tamamlandıktan sonra Milestone 1 için kullanıcıdan tüm mock data/domain kararları alınacak.
* 2026-05-13 — Karar: Demo mağaza adı şimdilik CommercePilot olarak kalacak. | Gerekçe: Marka adı henüz kesin değil; geçici tutarlılık gerekli. | Etki: Mock seller/store isimleri daha sonra değiştirilebilir.
* 2026-05-13 — Karar: Milestone 1 veri seti zengin ama kontrollü olacak. | Gerekçe: Hackathon demosu için her ürünün net hikayesi olmalı; tamamen rastgele veya dış veri demosu zayıflatır. | Etki: Curated çekirdek mock data ana kaynak olacak, Kaggle/Hugging Face review datasetleri sadece zenginleştirme/referans için değerlendirilecek.
* 2026-05-13 — Karar: İlk ürün fiyat aralığı 250-5000 TL olacak ve tüm görünen içerik Türkçe yazılacak. | Gerekçe: Türkiye/TL odaklı demo ve doğal kullanıcı dili isteniyor. | Etki: Product, review, action ve buyer prompt örnekleri Türkçe olacak.
* 2026-05-13 — Karar: Seller Growth Actions ilk aşamada 5 öncelikli aksiyon gösterecek. | Gerekçe: Demo sırasında net, kısa ve güçlü görünmesi için. | Etki: Workflow çıktısı önceliklendirilmiş top 5 aksiyona odaklanacak.
* 2026-05-13 — Karar: Buyer tarafında çoklu senaryo ve kişisel tercih hafızası ileride desteklenecek. | Gerekçe: Kullanıcı hız, renk, kargo, önceki yorum/şikayet gibi kişisel sinyallere göre öneri bekliyor. | Etki: Milestone 1 veri modelinde buyer preference/review history için genişleme alanı bırakılacak.
* 2026-05-13 — Karar: Agentic işler için LangChain değerlendirilecek ancak Milestone 1'de agent implementasyonu yapılmayacak. | Gerekçe: Önce domain data/workflow temeli kurulmalı; LangChain daha sonra provider swap, structured output ve tool orchestration için anlamlı. | Etki: Agent katmanı sonraki milestone'larda `lib/workflows` üzerine oturacak.
* 2026-05-13 — Karar: Milestone 4 yalnızca seller workflow layer olacak; buyer workflow Milestone 5'e ayrılacak. | Gerekçe: Satıcı büyüme aksiyonları ana demo değeridir ve buyer akışını ayrı kurmak scope kontrolü sağlar. | Etki: `generateSellerActionsWorkflow` ve `analyzeProductHealthWorkflow` eklendi; buyer smart cart bu milestone'a dahil edilmedi.
* 2026-05-13 — Karar: Seller Growth Actions top 5 aksiyon dönecek ve ürün/aksiyon çeşitliliğini koruyacak. | Gerekçe: Demo sırasında az ama güçlü, farklı problem alanlarını gösteren bir aksiyon listesi daha anlaşılır. | Etki: Aksiyon seçimi öncelik skoruna göre yapılır; ilk seçim turunda aynı aksiyon tipi ve aynı ürün tekrarından kaçınılır.
* 2026-05-13 — Karar: Workflow çıktıları LLM-ready context taşıyacak ama LLM çağırmayacak. | Gerekçe: Şu aşamada agentic/LLM entegrasyonu yok; ileride Gemini/OpenAI açıklama katmanı eklenirken UI contract değişmemeli. | Etki: Aksiyon ve ürün sağlık çıktılarında `llmReadyContext` alanı bulunur.
* 2026-05-13 — Karar: Milestone 5 buyer workflow 5 ana senaryoyu destekleyecek. | Gerekçe: Hackathon demosunda farklı alıcı ihtiyaçlarını göstermek için ev ofis, kahve seti, hediye, spor kulaklık ve renk uyumlu masa seti yeterli kapsama sağlar. | Etki: `BuyerIntentType` beş özel intent ve `generic` fallback içerir.
* 2026-05-13 — Karar: Buyer bütçesi hard cap değil, %5 toleranslı soft cap olacak. | Gerekçe: Kullanıcı bütçe belirttiğinde gerçek alışverişte küçük aşım kabul edilebilir ama açıkça gösterilmelidir. | Etki: Workflow `budget`, `softBudgetLimit`, `isOverRequestedBudget` ve bütçe uyarısı döner.
* 2026-05-13 — Karar: Buyer personalization ilk versiyonda aktif olacak. | Gerekçe: Ürünün farklılaştırıcı noktası alıcının geçmiş şikayet ve tercihlerini karar desteğine katmasıdır. | Etki: Buyer sensitivities, preferred colors, previous complaint themes ve manuel preferences skorlamaya dahil edilir.
* 2026-05-13 — Karar: Buyer workflow satıcı tarafına sinyal adayı üretecek. | Gerekçe: CommercePilot'un çift taraflı intelligence iddiası için alıcı ihtiyaçları seller growth action tarafını beslemelidir. | Etki: Çıktıda `sellerSignalCandidates` alanı eklendi.
* 2026-05-13 — Karar: Brain hardening tek büyük değişiklik yerine alt adımlara bölünecek. | Gerekçe: Parser, sepet planlama, seller output ve validation farklı risk alanlarıdır; ayrı commitler kontrolü artırır. | Etki: Milestone 5.5A ile buyer parser/intent tarafı tamamlandı.
* 2026-05-13 — Karar: Buyer workflow'a `meeting_setup` intent'i eklenecek. | Gerekçe: "Toplantı için kamera/mikrofon/hub öner" gibi gerçek kullanıcı komutları ev-ofis genel sepetine düşmemeli. | Etki: Toplantı/kamera/mikrofon/hub/sunum/online ders komutları ayrı intent'e yönlenir.
* 2026-05-13 — Karar: Buyer bütçe parser Türkçe fiyat formatlarını destekleyecek. | Gerekçe: `3.000 TL`, `1.500 TL`, `₺3000`, `3 bin TL` gibi girişler demo sırasında çok olasıdır. | Etki: Budget extraction logic güncellendi.
* 2026-05-13 — Karar: `maxDeliveryDays` artık pasif tip alanı değil, workflow sinyali olacak. | Gerekçe: Alıcı "2 günde gelsin" dediğinde ürün seçimi ve uyarılar teslimat beklentisini dikkate almalı. | Etki: Parsed intent ve ürün uyarıları max delivery beklentisini taşır.
* 2026-05-13 — Karar: Buyer Smart Cart seçim mantığı slot/rol bazlı olacak. | Gerekçe: Sadece en yüksek skorlu ürünleri seçmek setup bütünlüğünü bozabiliyor; demo için her sepetin senaryoyu tamamlaması gerekir. | Etki: `cartRoleKey` ve `cartRole` çıktıları eklendi.
* 2026-05-13 — Karar: Slot bazlı seçim bütçe baskısını da hesaba katacak. | Gerekçe: Kahve senaryosunda tek pahalı ürün tüm sepeti kilitleyebiliyordu. | Etki: Slot adayları confidence, relevance, slot score ve price pressure ile sıralanır.
* 2026-05-13 — Karar: Renk belirtilen buyer komutlarında renk uyumu daha sıkı uygulanacak. | Gerekçe: "Siyah ve gri masa takımı" komutunda pastel/uyumsuz ürün seçilmemeli. | Etki: Explicit color request varsa ürünün renk eşleşmesi aranır; renk eşleşmesi fuzzy hale getirildi.
* 2026-05-14 — Karar: Seller Growth Action çıktıları UI-ready metadata taşıyacak. | Gerekçe: UI'ın action type/string parse etmeden kategori, aciliyet, etki, efor, metrik ve checklist gösterebilmesi gerekir. | Etki: `SellerGrowthAction` contract'ına category/urgency/impact/effort/timeHorizon/metricHighlights/todayChecklist/expectedOutcome alanları eklendi.
* 2026-05-14 — Karar: Büyüme fırsatları kritik kriz gibi etiketlenmeyecek. | Gerekçe: Bundle ve winner promotion aksiyonları değerli olabilir ama stok açığı, kârlılık baskısı veya acil yorum riskiyle aynı aciliyet dilinde görünmemeli. | Etki: `create_bundle` ve `promote_winner` aciliyeti en fazla yüksek seviyede tutulur; zaman ufku çoğunlukla "Bu hafta" olur.
* 2026-05-14 — Karar: Brain katmanı için paket kurmadan runtime validation script'i eklenecek. | Gerekçe: UI/API öncesi mock data referansları, scoring contract'ı ve workflow çıktıları düzenli kontrol edilmeli. | Etki: `scripts/validate-workflows.js`, `npm run validate:workflows`, `npm run typecheck` ve `npm run check` eklendi.
* 2026-05-14 — Karar: Validation script'i demo hikayelerini de koruyacak. | Gerekçe: Sadece tip kontrolü yeterli değil; top 5 seller action, buyer intent/rol seçimi ve required demo flags bozulursa demo zayıflar. | Etki: Script seller top 5 aksiyon tiplerini, buyer prompt senaryolarını, data referanslarını ve score/output contract'larını doğrular.
* 2026-05-14 — Karar: Milestone 6A rol seçimi gerçek gateway olacak. | Gerekçe: Buyer ve seller eş önem taşıyacak; kullanıcı demo başında rol seçip ilgili workspace'e geçmeli. | Etki: `/` role gateway, `/seller` ve `/buyer` app shell route'ları eklendi.
* 2026-05-14 — Karar: UI dili tamamen Türkçe ve premium dark intelligence dashboard olacak. | Gerekçe: Kullanıcı bu dili ve hissi net istedi; hackathon demosunda ürün ciddiyeti artar. | Etki: Deep zinc/charcoal palette, tek emerald accent, Geist/Geist Mono, glass/hairline panel dili kullanıldı.
* 2026-05-14 — Karar: Milestone 6A için motion/icon bağımlılıkları eklendi. | Gerekçe: Seçilen frontend taste skill'leri motion ve ikon standardı gerektiriyor; CSS-only ile hedef kalite düşük kalacaktı. | Etki: `gsap`, `@gsap/react`, `@phosphor-icons/react` bağımlılıkları eklendi.
* 2026-05-14 — Karar: Seller API envelope `success/data/error` olarak standardize edildi. | Gerekçe: UI, route handler ve ileride agent/LLM katmanı aynı hata/başarı contract'ını okumalı. | Etki: `src/lib/api/responses.ts` eklendi; seller endpoint'leri aynı envelope ile döner. | Alternatifler: Ham JSON veya farklı endpoint bazlı shape.
* 2026-05-14 — Karar: Seller ekranları doğrudan workflow çağrısı yerine ortak API contract builder'larını kullanacak. | Gerekçe: Server component içinde kendi route'unu HTTP ile fetch etmek build/runtime'da gereksiz kırılganlık yaratır; route ve UI aynı typed builder'ı paylaşınca contract tek kaynak olur. | Etki: `src/lib/api/seller.ts` eklendi; `/seller`, `/seller/actions`, `/seller/products` ve ürün detay UI aynı data shape'i kullanır.
* 2026-05-14 — Karar: Product detail UI slug ile, product health API id ile çalışacak. | Gerekçe: UI URL'leri okunabilir olmalı; API contract ise stable product id üzerinden netleşmeli. | Etki: `/seller/products/[slug]` ve `/api/seller/products/[id]/health` route'ları eklendi.
* 2026-05-14 — Karar: Buyer Smart Cart canlı etkileşimi tek API route üzerinden kurulacak: `GET/POST /api/buyer/smart-cart`. | Gerekçe: Demo için kullanıcı komutu canlı çalışmalı ama auth/DB/mutation/LLM kapsamı açılmamalı. | Etki: `src/lib/api/buyer.ts`, route handler ve client workspace eklendi; GET bootstrap örnekleri, POST sepet önerisi döner.
* 2026-05-14 — Karar: Buyer UI canlı API çağıracak, ilk render ise aynı typed builder ile hydrate edilecek. | Gerekçe: İlk ekran hızlı ve build-safe kalırken kullanıcı submit/preset aksiyonları gerçek route'a gitmeli. | Etki: `/buyer` server component initial contract üretir, `BuyerSmartCartWorkspace` client component POST `/api/buyer/smart-cart` çağırır.
* 2026-05-14 — Karar: Buyer-to-seller loop yeni seller-facing GET contract olarak kurulacak: `/api/seller/buyer-signals`. | Gerekçe: Buyer workflow zaten `sellerSignalCandidates` üretiyor; bunu seller dashboard'a deterministic, route-testable ve LLM-ready contract olarak taşımak çift taraflı commerce intelligence iddiasını güçlendirir. | Etki: `src/lib/api/seller.ts` buyer smart cart örneklerinden sinyal aggregate eder; `/seller` ekranı alıcı sinyal özetini ve ilgili ürün/action hint'lerini gösterir. | Alternatifler: Buyer UI içinde ayrı loop göstermek veya seller actions workflow'u doğrudan mutasyona uğratmak.
* 2026-05-14 — Karar: Seller action detayları stable action id ile açılacak: `/seller/actions/[id]` ve `GET /api/seller/actions/[id]`. | Gerekçe: Demo akışında satıcı öneriye tıkladığında kanıt, yapılacak iş ve LLM-ready context'i tek ekranda görmeli. | Etki: `src/lib/api/seller.ts` action detail contract ve deterministic execution preview üretir; seller overview/actions/product detail linkleri aksiyon detayına gider. | Alternatifler: Tek sayfalık action listesinde accordion veya gerçek mutation akışı.
* 2026-05-14 — Karar: Milestone 7'de LLM açıklama katmanı OpenAI `gpt-4o-mini` ile çalışacak, Gemini final provider swap olarak sonraya bırakılacak. | Gerekçe: Kullanıcının mevcut API key'i OpenAI için; ürün mimarisi provider değişimine hazır kalmalı. | Etki: `LLM_PROVIDER=openai`, `OPENAI_MODEL=gpt-4o-mini`, direct Responses API `fetch`, runtime-only endpoint ve deterministic fallback eklendi. | Alternatifler: Gemini'yi hemen bağlamak veya LLM'i tamamen mock bırakmak.
* 2026-05-14 — Karar: Milestone 8A buyer tarafında OpenAI explanation ve preview polish birlikte yapılacak. | Gerekçe: Seller action explanation tamamlandıktan sonra demo akışında buyer tarafı da karar güveni ve AI açıklaması göstermeli. | Etki: `POST /api/buyer/smart-cart/explanation`, buyer explanation client paneli, `/buyer/products` ürün karar ekranı ve `/buyer/cart` sepet karar özeti eklendi. | Alternatifler: Önce Gemini provider swap yapmak veya sadece ürün/sepet UI polish yapmak.
* 2026-05-14 — Karar: Buyer explanation no-budget senaryolarında LLM bütçe iddiası post-process guard ile temizlenecek. | Gerekçe: Runtime OpenAI çıktısı bazen kullanıcı bütçe belirtmediği halde `bütçeniz` veya `%5 tolerans` gibi ifadeler üretebilir. | Etki: `src/lib/api/buyer-smart-cart-explanations.ts` budget context'i açık hale getirir, no-budget claim'leri fallback alanlarıyla değiştirir; validation sentetik model çıktısıyla bu guard'ı doğrular. | Alternatifler: Yalnızca prompt sıkılaştırmak.
* 2026-05-14 — Karar: CommercePilot ana UI yönü light klasik marketplace düzenine dönecek. | Gerekçe: Kullanıcı premium siyah dashboard yerine Trendyol/Hepsiburada gibi tanıdık ama kendi markamıza ait e-ticaret görünümü istedi. | Etki: Dark theme ana deneyimden kalkacak; buyer homepage, ürün detay, sepet ve seller panel light commerce düzeniyle yeniden ele alınacak. | Alternatifler: Dark dashboard'u koruyup agent eklemek.
* 2026-05-14 — Karar: AI deneyimi ayrı bir chatbot sayfası olmaktan çok sağ altta yaşayan agent pet olarak kurulacak. | Gerekçe: Ürün değeri, agent'ın alışveriş ve satıcı iş akışlarının üstünde bağlama göre konuşması ve aksiyon almasıyla daha net görünecek. | Etki: Floating draggable pet, küçük chat paneli, büyük agent sayfası, proactive balonlar, sessiz/gizle modları ve agent permission modeli roadmap'e girdi. | Alternatifler: Sadece klasik chat widget.
* 2026-05-14 — Karar: Agent permission modeli `chat`, `suggest`, `assist`, `autopilot` katmanlarına ayrılacak. | Gerekçe: Buyer sepet mutation'ı ve seller listing mutation'ı gerçek davranmalı ama kullanıcı izni olmadan kontrolsüz aksiyon almamalı. | Etki: Mutation tool'ları audit log ve onay/autopilot ayrımıyla tasarlanacak. | Alternatifler: Her şeyi öneri olarak bırakmak veya baştan tam otomatik yapmak.
* 2026-05-14 — Karar: LangChain hemen bağlanmayacak; önce typed internal agent runtime ve tool registry kurulacak. | Gerekçe: Tool contract'ları, UI state ve mutation sınırları oturmadan LangChain eklemek karmaşıklığı artırır. | Etki: `src/lib/agents/prompts`, `src/lib/agents/tools`, `src/lib/agents/runtime` planlandı; LangChain adapter readiness Milestone 8P'ye bırakıldı. | Alternatifler: LangChain'i ilk agent milestone'unda doğrudan kullanmak.
* 2026-05-14 — Karar: Milestone 8C'de eski dark sayfalar tek tek rewrite edilmeden light marketplace shell + scoped `commerce-legacy-light` bridge ile taşınacak. | Gerekçe: Buyer/seller route yüzeyi geniş; 8C'nin amacı temel görsel yönü güvenli kilitlemek, sayfa içi tam marketplace rewrite'ları 8E/8G ve sonrasına bırakmak. | Etki: Bridge sadece workspace children içinde eski dark utility class'larını light panel, slate text ve orange accent diline çevirir; header/CTA gibi bilinçli koyu kontrast alanlarını etkilemez. | Alternatifler: Tüm buyer/seller sayfalarını aynı milestone'da tek tek yeniden yazmak.
* 2026-05-15 — Karar: Buyer ana navigasyonu header-only olacak ve `Ürünler`, `Sepet`, `Agent`, `Profil` dışına çıkmayacak. | Gerekçe: Hem header hem sidebar içinde aynı `Ana sayfa/Ürünler/Sepet` menülerinin tekrarı gerçek e-ticaret hissini bozuyor. | Etki: Buyer sidebar menüleri kaldırılacak; `/buyer` ürünler deneyimine yönlenecek veya aynı yüzeyi render edecek. | Alternatifler: Dashboard tipi sol menü.
* 2026-05-15 — Karar: Buyer ürünler ekranı açıklama/prompt paneli değil, çok ürünlü klasik katalog/grid olacak. | Gerekçe: Normal alıcı ürünü, fiyatı, görseli, puanı ve sepete ekleme aksiyonunu görmek ister. | Etki: `GET /api/buyer/catalog`, ürün kartları, kategori şeridi ve sepete ekleme flow'u Milestone 8E/8F kapsamına alındı. | Alternatifler: Smart-cart açıklama ekranını ana buyer landing olarak tutmak.
* 2026-05-15 — Karar: Buyer Agent ayrı ChatGPT benzeri `/buyer/agent` sayfasında ürün önerip onayla sepete ekleyecek. | Gerekçe: Agent'ın ürün değeri, uzun açıklama göstermekten çok kullanıcı komutunu ürün kartlarına ve sepet mutation'ına çevirmesidir. | Etki: Prompt -> görselli ürün önerisi -> `Sepete ekleyeyim mi?` -> onaylı cart mutation akışı roadmap'e girdi. | Alternatifler: Tüm AI çıktısını ürün/sepet sayfalarına gömmek.
* 2026-05-15 — Karar: Buyer Profil agent kişiselleştirme ve kullanıcı yorumları merkezi olacak. | Gerekçe: Kullanıcının istekleri, stil/kalite/kargo hassasiyetleri ve yorum geçmişi agent davranışını beslemeli. | Etki: `/buyer/profile`, `GET/PATCH /api/buyer/profile` milestone kapsamına eklendi. | Alternatifler: Profil alanını ertelemek.
* 2026-05-15 — Karar: Seller overview kısa uyarı kartlarından endpoint'lere giden bir kontrol paneli olacak, tek uzun açıklama sayfası olmayacak. | Gerekçe: Satıcı panelinde her bilgi tek sayfada kaydırılarak anlatılırsa ürün yönetim hissi kayboluyor. | Etki: İade, negatif yorum, satılmayan ürün, stok riski ve dağılım kartları ilgili route'lara bağlanacak. | Alternatifler: Tüm seller intelligence içeriğini overview'e yığmak.
* 2026-05-15 — Karar: Seller ürünleri fotoğraflı listelenecek; aksiyonlar kategori endpoint'lerine bölünecek; satıcıda da Agent ve Profil alanları olacak. | Gerekçe: Satıcı kendi ürünlerini ürün görseli ve ticari sinyallerle yönetmeli, derin açıklama ise agent'a bırakılmalı. | Etki: `/seller/products`, `/seller/actions/[category]`, `/seller/agent`, `/seller/profile` revize milestone planına eklendi. | Alternatifler: Mevcut aksiyon/detail ekranlarını tek açıklama akışı olarak sürdürmek.
* 2026-05-15 — Karar: Buyer ürün kartı ana tıklamada ürün detay/satış penceresine gider, sepete ekleme ayrı `Sepete Ekle` aksiyonuyla yapılır. | Gerekçe: Kullanıcı ürün görseli/açıklama/fiyat/kampanya alanlarını görüp klasik satış penceresinde karar vermeli. | Etki: `/buyer/products/[slug]` dynamic route'u katalogdaki her ürün için satış detay sayfası olarak tasarlanacak. | Alternatifler: Kartın tamamına tıklayınca direkt sepete eklemek.
* 2026-05-15 — Karar: Buyer kategori isimleri `Kadın Giyim`, `Erkek Giyim`, `Elektronik`, `Ev & Yaşam`, `Kozmetik`, `Spor`, `Aksesuar` olacak. | Gerekçe: `Kadın/Erkek` yerine giyim odaklı kategori adı daha net marketplace hissi verir. | Etki: 8E katalog/category şeridi bu isimlerle kurulacak. | Alternatifler: Genel `Kadın`, `Erkek` kategori adları.
* 2026-05-15 — Karar: Buyer agent yalnızca katalogdaki mevcut ürünlerden seçim yapacak. | Gerekçe: Agent'ın katalog dışı ürün uydurması e-ticaret gerçekliğini zayıflatır. | Etki: Eksik ürün ihtiyacı katalog büyütme ile çözülür; agent tool'ları catalog search/filter üzerine çalışır. | Alternatifler: Agent'ın dinamik mock ürün üretmesi.
* 2026-05-15 — Karar: Buyer cart state ilk fazda `localStorage` ile korunacak. | Gerekçe: DB/auth olmadan route değişimi ve reload sonrası sepetin kaybolmaması gerekir. | Etki: 8F cart state client persistence ile kurulacak. | Alternatifler: Server-side in-memory mock store.
* 2026-05-15 — Karar: Buyer agent onay sonrası mevcut sepete ekleyebilir veya kullanıcı seçerse sepeti öneriyle değiştirebilir. | Gerekçe: Kullanıcı mevcut seçimini korumak veya agent önerisiyle sıfırdan sepet kurmak isteyebilir. | Etki: Agent apply contract'ı `append` ve `replace` stratejilerini taşımalı. | Alternatifler: Sadece append davranışı.
* 2026-05-15 — Karar: Buyer profile serbest metin + chip/checkbox tercihleriyle tutulacak. | Gerekçe: Kullanıcı hem doğal dilde stil/istek yazabilmeli hem de hızlı hassasiyet seçebilmelidir. | Etki: Profil UI `Agent beni nasıl tanısın?` metni ve hızlı tercih chip'leri içerir. | Alternatifler: Sadece serbest metin veya sadece checkbox.
* 2026-05-15 — Karar: Seller overview ana uyarı kartları `Satılmayan ürünler`, `Negatif yorumlar`, `İade riski`, `Stok riski` olacak. | Gerekçe: Satıcıya hızlı ve eyleme dönük dört problem alanı verir. | Etki: 8I overview endpoint kartları bu dörtlüyle başlar. | Alternatifler: Daha geniş ve dağınık uyarı seti.
* 2026-05-15 — Karar: Seller mutation önce/sonra preview ve satıcı onayı olmadan uygulanmayacak. | Gerekçe: Satıcı listing değişikliklerinde kontrolü kaybetmemeli. | Etki: Agent önerisi draft/preview olarak görünür; onay sonrası mock state ve audit log güncellenir. | Alternatifler: Agent'ın tam yetkiyle anında uygulaması.
* 2026-05-15 — Karar: Ürün görselleri 8E veya sonrasında kontrollü mock/generated görsel setiyle üretilebilir. | Gerekçe: Marketplace hissi için ürün görselleri kritik; placeholder kalıcı çözüm olmaz. | Etki: 8E katalog veri/görsel metadata tasarımında görsel seti için alan açılır. | Alternatifler: Kalıcı placeholder kullanmak.
* 2026-05-15 — Karar: Floating Agent tüm buyer/seller sayfalarında görünecek ve route Agent sayfalarının tam yetkili mini hali olacak. | Gerekçe: Sağ alttaki ikon klasik müşteri temsilcisi değil, CommercePilot Agent'ın her yerde erişilebilir kompakt yüzeyi olmalı. | Etki: `/buyer/agent` ve `/seller/agent` ile aynı runtime/history kullanılır; ürün önerisi, sepet apply, seller analiz ve seller mutation preview panel içinde yapılabilir. | Alternatifler: Sadece Agent sayfasına yönlendiren pasif ikon.
* 2026-05-15 — Karar: Floating Agent context-aware ve proactive olacak ama ilk fazda ses kullanmayacak. | Gerekçe: Agent sayfa bağlamını yorumlamalı fakat kullanıcıyı agresif popup/ses ile rahatsız etmemeli. | Etki: Route/ürün/sepet/seller bağlamı runtime'a taşınır; uyarı halinde badge, ünlem, kafa kaldırma veya benzeri sessiz görsel mikro etkileşim kullanılır. | Alternatifler: Sesli bildirim veya otomatik açılan chat.
* 2026-05-15 — Karar: Floating Agent kullanıcı kontrolleri zorunlu olacak: `Gizle`, `Sessize al`, `Bu sayfada uyarma`. | Gerekçe: Her sayfada görünen agent kullanıcı kontrolü olmadan rahatsız edici olabilir. | Etki: 8Q kapsamında state ve UI kontrolleri tasarlanacak. | Alternatifler: Sadece kapatma ikonu.
* 2026-05-15 — Karar: Floating Agent ilk fazda web/desktop odaklı olacak ve Codex pet benzeri avatarla başlayacak. | Gerekçe: Kullanıcı bu adımda mobil davranışı önceliklendirmedi; görsel karakter daha sonra değiştirilebilir. | Etki: Mobil bottom sheet veya responsive özel davranış ilk 8Q kapsamına alınmaz. | Alternatifler: Mobil-first widget davranışı veya marka avatarını hemen üretmek.
* 2026-05-15 — Karar: Milestone 8D yalnızca nav reset ile kalmayıp endpoint iskeletlerini de açacak. | Gerekçe: Kullanıcı siteyi inceleyeceği için header-only IA yanında `/buyer/agent`, `/buyer/profile`, `/seller/agent`, `/seller/profile` ve buyer dynamic product route boş kalmamalı. | Etki: `/buyer` `/buyer/products`'a yönlenir; buyer/seller shell sidebar tekrarını kaldırır; seller overview kısa uyarı kartlarına iner; gerçek cart persistence, fotoğraflı katalog ve agent runtime 8E+ kapsamındadır. | Alternatifler: Sadece shell nav metinlerini değiştirmek.
* 2026-05-15 — Karar: Milestone 8E buyer katalog contract'ı `src/lib/api/buyer-catalog.ts` üzerinden typed builder olarak kurulacak ve tüm ürün/kategori görselleri tek kontrollü sprite üzerinden beslenecek. | Gerekçe: Yeni ürün eklendiğinde kategori, ürün kartı, API ve dynamic detail route aynı veri kaynağından otomatik yürümeli; marketplace hissi için placeholder yerine görsel metadata gerekli. | Etki: `GET /api/buyer/catalog`, `BuyerCatalogGrid`, `public/catalog/buyer-product-sprite.png`, kategori filtre/sıralama validation ve 48 ürünlü katalog oluştu. | Alternatifler: Sayfa içinde ad hoc ürün map'i veya harici fotoğraf URL'leri.
* 2026-05-16 — Karar: Buyer cart ilk fazda client-only `localStorage` helper'ı ile yönetilecek; grid, ürün detay ve sepet aynı helper üzerinden konuşacak. | Gerekçe: DB/auth olmadan reload ve route geçişinde sepet davranışı gerçek görünmeli; 8G Agent apply bu helper'a bağlanabilmeli. | Etki: `src/lib/cart/buyer-cart.ts`, `BuyerProductPurchasePanel`, `BuyerCartWorkspace` eklendi; `Sepete Ekle`, `Şimdi Al`, adet artır/azalt, sil, temizle, toplam ve checkout mock çalışır. | Alternatifler: Server memory store veya cart state'i sadece sepet sayfasında tutmak.
* 2026-05-16 — Karar: Buyer Agent route'u smart-cart workflow'u doğrudan UI'a gömmek yerine typed `buyer-agent` API contract'ı üzerinden çalışacak. | Gerekçe: Route Agent sayfası ve ileride floating Agent aynı prompt -> öneri -> onay -> apply contract'ını paylaşabilmeli; cart mutation kullanıcı onayından önce yapılmamalı. | Etki: `src/lib/api/buyer-agent.ts`, `/api/buyer/agent`, `/api/buyer/agent/apply` ve `BuyerAgentWorkspace` eklendi; öneriler katalog ürün kartlarıyla görselleşir, `append` veya `replace` stratejisi client-side `localStorage` sepet helper'ına uygulanır. | Alternatifler: `/buyer/agent` içinde doğrudan `/api/buyer/smart-cart` çağırıp route contract'ı oluşturmamak.
* 2026-05-16 — Karar: Buyer profile ilk fazda typed API contract + client `localStorage` taslağıyla yönetilecek. | Gerekçe: Auth/DB olmadan kullanıcı profil notu ve tercihleri reload sonrası kaybolmamalı; route Agent ve ileride floating Agent aynı profil sinyallerini okuyabilmeli. | Etki: `src/lib/api/buyer-profile.ts`, `/api/buyer/profile`, `BuyerProfileWorkspace`, `src/lib/profile/buyer-profile-storage.ts` ve workflow validation kontrolleri eklendi. | Alternatifler: Profil state'ini yalnızca sayfa içinde tutmak veya server memory mock store kullanmak.
* 2026-05-16 — Karar: Seller overview ana ekranı artık dört risk endpoint kartını typed contract üzerinden alacak. | Gerekçe: Satıcı ana sayfası uzun açıklama veya statik KPI değil, hızlı karar ve route geçiş yüzeyi olmalı. | Etki: `SellerOverviewApiData.alertCards`, `priorityQueue`, seller product image metadata ve `SellerOverviewWorkspace` eklendi; kartlar `/seller/actions` ve `/seller/products` query hedeflerine bağlandı. | Alternatifler: Kartları sayfa içinde ad hoc hesaplamak veya tüm seller aksiyonlarını ana ekrana yığmak.
* 2026-05-16 — Karar: Seller products ekranı query focus değerlerini typed product segment contract'ına bağlayacak. | Gerekçe: Overview'deki stok/iade yönlendirmeleri gerçek ürün listesi filtresine dönüşmeli; satıcı aynı ekranda fotoğraf, ticari metrik ve aksiyon bağını görebilmeli. | Etki: `SellerProductsApiData.activeFocus/segments/categoryBreakdown/spotlightProduct`, product `riskSignals/focusTags/linkedAction`, `/api/seller/products?focus=...` filtreleme ve `SellerProductsWorkspace` eklendi. | Alternatifler: Query değerlerini sadece client state'te tutmak veya ürün risklerini sayfa içinde ad hoc hesaplamak.
* 2026-05-16 — Karar: Seller actions ekranı query focus ve kategori slug değerlerini typed action segment contract'ına bağlayacak. | Gerekçe: Overview'deki `/seller/actions?focus=...` hedefleri ve `/seller/actions/[category]` listeleri aynı deterministic action kuyruğunu okumalı; action detail route'ları kırılmamalı. | Etki: `SellerActionsApiData.activeFocus/actionCards/segments/categoryRoutes/summary`, `/api/seller/actions?focus=...`, `/api/seller/actions/[focus]`, `/seller/actions/[category]` ve `SellerActionsWorkspace` eklendi. | Alternatifler: Kategorileri sadece client state'te tutmak veya action/detail route'unu ayrı path'e taşımak.
* 2026-05-16 — Karar: Seller Agent route'u products/actions contract'larını doğrudan UI'a gömmek yerine typed `seller-agent` API contract'ı üzerinden çalışacak. | Gerekçe: Route Agent sayfası ve ileride floating Agent aynı prompt -> analiz -> ürün kanıtı -> action önerisi contract'ını paylaşabilmeli; seller mutation kullanıcı onayından önce yapılmamalı. | Etki: `src/lib/api/seller-agent.ts`, `/api/seller/agent`, `SellerAgentWorkspace`, prompt validation ve workflow validation kontrolleri eklendi. | Alternatifler: `/seller/agent` içinde doğrudan products/actions builder'larını çağırmak veya hemen mutation uygulamak.
* 2026-05-16 — Karar: Seller profile ilk fazda typed API contract + client `localStorage` taslağıyla yönetilecek. | Gerekçe: Auth/DB olmadan mağaza ayarı ve Agent permission tercihleri reload sonrası kaybolmamalı; route Agent ve ileride floating Agent aynı izin/onay sınırını okuyabilmeli. | Etki: `src/lib/api/seller-profile.ts`, `/api/seller/profile`, `SellerProfileWorkspace`, `src/lib/profile/seller-profile-storage.ts`, loading state ve workflow validation kontrolleri eklendi. | Alternatifler: Permission state'ini yalnızca sayfa içinde tutmak veya 8P mutation/audit store ile birlikte bekletmek.
* 2026-05-16 — Karar: Buyer/Seller route Agent cevapları ortak `AgentRuntimeSnapshot` taşıyacak ve prompt/tool registry tek kaynak `src/lib/agents/runtime.ts` olacak. | Gerekçe: 8O/8P/8Q route ve floating apply davranışlarını aynı request, tool plan ve onay sınırıyla birleştirmek. | Etki: `/api/agent/runtime`, buyer/seller agent API `runtime` alanları, `AgentRuntimePanel` ve workflow validation kontrolleri eklendi. | Alternatifler: Her agent route içinde ayrı prompt/tool metadata tutmak.
* 2026-05-16 — Karar: Buyer cart apply validation/API contract ve client-side sepet yazımı route component içinde kalmayacak; shared Agent apply modüllerine taşınacak. | Gerekçe: 8Q floating Agent aynı append/replace contract'ını ve aynı `localStorage` mutation helper'ını kullanmalı. | Etki: `src/lib/agents/buyer-cart-apply.ts`, `src/lib/agents/buyer-cart-apply-client.ts`, `BuyerAgentApiData.applyPreview`, `BuyerAgentApplyApiData.sharedMutation`, `/api/buyer/agent/apply` ve `BuyerAgentWorkspace` güncellendi. | Alternatifler: Route Agent component içinde doğrudan `clearBuyerCartItems`/`addBuyerCartItem` çağırmaya devam etmek.
* 2026-05-16 — Karar: Seller listing apply validation/API contract, audit yazımı ve rollback route component içinde kalmayacak; shared Agent apply modüllerine taşınacak. | Gerekçe: 8Q floating Agent aynı before/after contract'ını, aynı `localStorage` audit store'unu ve aynı rollback helper'ını kullanmalı. | Etki: `src/lib/agents/seller-listing-apply.ts`, `src/lib/agents/seller-listing-apply-client.ts`, `SellerAgentDraftPreview` shared apply metadata, `/api/seller/agent/apply`, seller runtime apply tool'u ve `SellerAgentWorkspace` güncellendi. | Alternatifler: `/seller/agent` içinde doğrudan audit localStorage yazmak veya mutation'ı yalnızca görsel preview olarak bırakmak.
* 2026-05-16 — Karar: Floating Agent mini panel route Agent'lardan ayrı widget runtime'ı oluşturmayacak; aynı `AgentRuntimeSnapshot`, buyer/seller API route'ları ve shared apply helper'larını kullanacak. | Gerekçe: Her sayfada görünen Agent ile `/buyer/agent` ve `/seller/agent` arasında yetki, audit ve ürün seçimi ayrışmamalı. | Etki: `FloatingAgentPanel`, `createFloatingAgentContext`, `commercepilot.floatingAgent.v1` history/control store'u, buyer cart apply ve seller listing apply/rollback mini panelde çalışır; runtime template versiyonları `8Q.1`, handoff `8R` oldu. | Alternatifler: Floating paneli yalnızca link veren pasif ikon yapmak veya ayrı localStorage/audit yazımı oluşturmak.
* 2026-05-16 — Karar: 8R demo hardening ayrı bir `/demo` rehearsal route'u ve typed runbook contract'ı olarak tutulacak. | Gerekçe: Jüri demosunda buyer, seller, floating Agent ve QA kanıtları tek yerden başlatılmalı; sunum akışı uygulama içinde izlenebilir olmalı. | Etki: `src/lib/demo/rehearsal.ts`, `src/components/commerce/demo-rehearsal-workspace.tsx`, `/demo`, gateway demo link'i ve validation kontrolleri eklendi. | Alternatifler: Demo script'i sadece dokümanda tutmak veya mevcut root gateway'i daha fazla sıkıştırmak.

## 7) Milestones / Dönüm Noktaları (append-only)

* 2026-05-12 — Milestone: Ürün yönü netleşti. | Sonuç: Satıcı öncelikli, demo odaklı, AI-ready çift taraflı commerce intelligence yaklaşımı benimsendi.
* 2026-05-13 — Milestone: Milestone 0 proje zemini kuruldu. | Sonuç: Next.js + TypeScript + Tailwind scaffold, README, `.env.example`, lint/build doğrulaması ve GitHub push hazırlığı tamamlandı.
* 2026-05-13 — Milestone: Milestone 1 curated commerce dataset kuruldu. | Sonuç: Türkçe domain tipleri ve curated mock data eklendi; referans bütünlüğü, lint, TypeScript ve build doğrulandı.
* 2026-05-13 — Milestone: Milestone 2 data access layer kuruldu. | Sonuç: UI/API/workflow katmanlarının mock dataya kontrollü erişmesi için read/query helper'ları eklendi; lint, TypeScript ve build doğrulandı.
* 2026-05-13 — Milestone: Milestone 3 açıklanabilir scoring layer kuruldu. | Sonuç: Ürün bazlı skorlar yalnızca sayı değil, drivers/evidence/summary/recommendedFocus içeren LLM-ready açıklanabilir karar sinyalleri olarak üretildi.
* 2026-05-13 — Milestone: Milestone 4 seller workflow layer kuruldu. | Sonuç: Seller Growth Actions ve Product Health workflow'ları eklendi; lint, TypeScript, build ve runtime workflow doğrulaması geçti.
* 2026-05-13 — Milestone: Milestone 5 buyer smart cart workflow layer kuruldu. | Sonuç: 5 buyer demo senaryosu, %5 bütçe toleransı, buyer personalization, alternatif/tamamlayıcı öneri ve seller signal adayları eklendi; lint, TypeScript, build ve runtime workflow doğrulaması geçti.
* 2026-05-13 — Milestone: Milestone 5.5A Buyer Parser + Intent Hardening tamamlandı. | Sonuç: `3.000 TL`, `1.500 TL`, `₺3000`, `3 bin TL` bütçe formatları doğrulandı; `meeting_setup` ve `maxDeliveryDays` workflow'a bağlandı; lint, TypeScript, build ve runtime prompt doğrulaması geçti.
* 2026-05-13 — Milestone: Milestone 5.5B Buyer Cart Planning Hardening tamamlandı. | Sonuç: Buyer sepetleri ev-ofis, kahve, hediye, masa stili, spor ve toplantı senaryolarında slot/rol bazlı planlanır hale getirildi; lint, TypeScript, build ve runtime prompt doğrulaması geçti.
* 2026-05-14 — Milestone: Milestone 5.5C Seller Workflow Output Hardening tamamlandı. | Sonuç: Seller Growth Action çıktıları kategori, aciliyet, etki, efor, zaman ufku, metrik highlight, expected outcome ve checklist alanlarıyla UI/LLM-ready hale getirildi; TypeScript ve runtime workflow doğrulaması geçti.
* 2026-05-14 — Milestone: Milestone 5.5D Validation/Test Hardening tamamlandı. | Sonuç: Mock data integrity, scoring layer, seller workflow ve buyer workflow runtime validation script'i eklendi; lint, typecheck, validation ve production build doğrulaması geçti.
* 2026-05-14 — Milestone: Milestone 6A UI Foundation başlatıldı. | Sonuç: Görsel referanslar üretildi; rol seçimi, buyer/seller workspace shell, seller action/product preview ve buyer smart cart/product/cart preview route'ları eklendi.
* 2026-05-14 — Milestone: Milestone 6B Seller API Contract tamamlandı. | Sonuç: Seller overview/actions/products/product health API endpoint'leri, ortak seller API contract builder'ları, ürün sağlık detay sayfası, loading/error/empty state temelleri ve API validation kontrolleri eklendi.
* 2026-05-14 — Milestone: Milestone 6C Buyer Smart Cart API + Live Interaction tamamlandı. | Sonuç: `/api/buyer/smart-cart` route'u, buyer API contract builder'ı, canlı `/buyer` komut formu, preset prompt çalıştırma, loading/error/empty state ve buyer API validation kontrolleri eklendi.
* 2026-05-14 — Milestone: Milestone 6D Buyer-to-Seller Signal Loop tamamlandı. | Sonuç: `/api/seller/buyer-signals` route'u, buyer smart cart örneklerinden seller sinyal aggregation contract'ı, seller dashboard buyer loop bölümü, validation kontrolleri ve runtime UI/API doğrulaması eklendi.
* 2026-05-14 — Milestone: Milestone 6E Seller Action Detail + Execution Preview tamamlandı. | Sonuç: `/api/seller/actions/[id]` route'u, `/seller/actions/[id]` detay sayfası, action execution preview, evidence snapshot, generated drafts, LLM-ready context görünümü, loading/not-found state ve validation kontrolleri eklendi.
* 2026-05-14 — Milestone: Milestone 7 OpenAI Seller Action Explanation tamamlandı. | Sonuç: `/api/seller/actions/[id]/explanation` route'u, `gpt-4o-mini` OpenAI Responses API wrapper'ı, JSON parse/fallback contract'ı, seller action detail UI paneli ve validation kontrolleri eklendi; check/build/runtime/UI doğrulandı.
* 2026-05-14 — Milestone: Milestone 8A Buyer Smart Cart Explanation + Product/Cart Preview Polish tamamlandı. | Sonuç: `/api/buyer/smart-cart/explanation` route'u, `gpt-4o-mini` buyer explanation contract'ı, `/buyer` explanation paneli, `/buyer/products` ürün karar ekranı ve `/buyer/cart` sepet karar özeti eklendi; check/build/runtime/UI doğrulandı.
* 2026-05-14 — Milestone: Milestone 8A QA hardening tamamlandı. | Sonuç: Buyer explanation no-budget guard eklendi; 5 buyer örneği live OpenAI ile generated döndü, invalid prompt 400 verdi, mobil browser QA ve build/check tekrar geçti.
* 2026-05-14 — Milestone: Milestone 8B Marketplace + Agent Pet Roadmap tamamlandı. | Sonuç: `COMMERCEPILOT_AGENT_MARKETPLACE_ROADMAP.md` ile light marketplace pivotu, agent pet deneyimi, permission modeli ve 17 milestone planı yazıldı.
* 2026-05-14 — Milestone: Milestone 8C Light Marketplace Design System tamamlandı. | Sonuç: Dark ana tema kaldırıldı; root gateway ve buyer/seller workspace shell klasik light e-ticaret düzenine döndü; scoped legacy theme bridge ile mevcut içerikler okunur hale getirildi; check/build ve Puppeteer desktop/mobil QA geçti.
* 2026-05-15 — Milestone: Milestone 8D IA ve Navigasyon Reset tamamlandı. | Sonuç: Buyer nav `Ürünler/Sepet/Agent/Profil`, seller nav `Ana Sayfa/Ürünler/Aksiyonlar/Agent/Profil` oldu; sidebar nav tekrarı kaldırıldı; `/buyer` `/buyer/products`'a yönleniyor; `/buyer/products/[slug]`, buyer/seller Agent ve Profil route iskeletleri eklendi; seller overview dört uyarı kartlı kısa panele indi; `npm run check`, `npm run build` ve Puppeteer QA geçti.
* 2026-05-15 — Milestone: Milestone 8E Buyer Catalog Data + Ürün Grid tamamlandı. | Sonuç: 48 ürünlü buyer catalog contract'ı, 7 görselli marketplace kategorisi, kampanya/Agent üst alanı, fotoğraflı ürün grid'i, görünür `Sepete Ekle` aksiyonu, `GET /api/buyer/catalog` route'u, sprite görselleri ve validation kontrolleri eklendi; `npm run check`, `npm run build` ve Puppeteer QA geçti.
* 2026-05-16 — Milestone: Milestone 8F Buyer Product Detail + Cart State tamamlandı. | Sonuç: Ürün detay satış penceresinde adet, `Şimdi Al`, `Sepete Ekle`, kampanya/satıcı/Agent alanları çalışır hale geldi; `/buyer/cart` localStorage sepet satırları, adet/sil/temizle/toplam/checkout mock ve empty state içeriyor; `npm run check`, `npm run build` ve Puppeteer QA geçti.
* 2026-05-16 — Milestone: Milestone 8G Buyer Agent Page tamamlandı. | Sonuç: `/buyer/agent` prompt alır, `/api/buyer/agent` üzerinden katalogdaki mevcut ürünlerden görselli öneri üretir, onay sorar ve `/api/buyer/agent/apply` + `localStorage` cart helper ile seçkiyi sepete ekler veya sepeti değiştirir; `npm run check`, `npm run build` ve Puppeteer QA geçti.
* 2026-05-16 — Milestone: Milestone 8H Buyer Profile tamamlandı. | Sonuç: `/buyer/profile` profil notu, hızlı tercih checkbox'ları, bütçe/renk kontrolleri, yorum geçmişi, öğrenilen Agent sinyalleri ve localStorage taslak persistence ile çalışır; `GET/PATCH /api/buyer/profile`, workflow validation, `npm run check`, `npm run build` ve Puppeteer desktop/mobil QA geçti.
* 2026-05-16 — Milestone: Milestone 8I Seller Overview Endpoint Cards tamamlandı. | Sonuç: `/seller` seller decision workspace'e dönüştü; dört alert card (`slow_movers`, `negative_reviews`, `return_risk`, `stock_risk`), priority queue, ürün görselleri, route/API endpoint hedefleri ve validation kontrolleri eklendi; `npm run check`, `npm run build` ve Puppeteer desktop/mobil QA geçti.
* 2026-05-16 — Milestone: Milestone 8J Seller Products tamamlandı. | Sonuç: `/seller/products` fotoğraflı ürün yönetimi yüzeyine dönüştü; segment/search/sort filtreleri, `focus` query desteği, ürün risk sinyalleri, linked action, seçili ürün evidence rail'i, category breakdown, route loading state ve validation kontrolleri eklendi; `npm run check`, `npm run build` ve Puppeteer desktop/mobil QA geçti.
* 2026-05-16 — Milestone: Milestone 8K Seller Actions by Category tamamlandı. | Sonuç: `/seller/actions` kategori/focus action queue yüzeyine dönüştü; `/seller/actions?focus=negative-reviews`, `/seller/actions/customer-voice`, `/api/seller/actions?focus=...` ve `/api/seller/actions/[focus]` çalışır; mevcut action detail id route'ları korundu; validation, `npm run check`, `npm run build`, HTTP ve Puppeteer desktop/mobil QA geçti.
* 2026-05-16 — Milestone: Milestone 8L Seller Agent Page tamamlandı. | Sonuç: `/seller/agent` prompt composer, preset seller komutları, ürün kanıt sırası, pinned Agent cevabı, action önerileri, onay gerektiren draft preview ve `/api/seller/agent` GET/POST contract'ı ile çalışır; mutation uygulanmaz; validation, `npm run check`, `npm run build`, HTTP ve Puppeteer desktop/mobil QA geçti.
* 2026-05-16 — Milestone: Milestone 8M Seller Profile + Permissions tamamlandı. | Sonuç: `/seller/profile` mağaza bilgisi, Agent permission mode, capability matrix, notification channels, risk thresholds, quiet hours, proactive controls ve audit/policy preview ile çalışır; `GET/PATCH /api/seller/profile`, localStorage taslak persistence, validation, `npm run check`, `npm run build`, HTTP ve Puppeteer desktop/mobil QA geçti.
* 2026-05-16 — Milestone: Milestone 8N Shared Agent Runtime tamamlandı. | Sonuç: `/api/agent/runtime` read-only registry, `src/lib/agents/runtime.ts` prompt/tool source of truth, buyer/seller Agent `runtime` snapshot'ları ve Agent runtime paneli eklendi; validation, `npm run check`, `npm run build`, HTTP ve Puppeteer desktop/mobil QA geçti.
* 2026-05-16 — Milestone: Milestone 8O Shared Buyer Agent Cart Mutations tamamlandı. | Sonuç: Buyer Agent apply preview ve apply API shared route/floating mutation contract'ı taşıyor; route UI aynı `applyBuyerAgentCartMutation` helper'ı ile localStorage cart state'ini güncelliyor; validation, `npm run check`, `npm run build`, HTTP ve Puppeteer desktop/mobil QA geçti.
* 2026-05-16 — Milestone: Milestone 8P Seller Mock Mutations + Audit tamamlandı. | Sonuç: Seller Agent draft preview başlık/açıklama/fiyat/kampanya before-after contract'ı taşıyor; `/api/seller/agent/apply` shared listing mutation ve audit preview döndürüyor; route UI aynı `applySellerListingMutation`/`rollbackSellerListingMutation` helper'ları ile localStorage listing override, audit log ve rollback akışını çalıştırıyor; validation, `npm run check`, `npm run build`, HTTP ve Puppeteer desktop/mobil QA geçti.
* 2026-05-16 — Milestone: Milestone 8Q Floating Agent Mini Panel tamamlandı. | Sonuç: `WorkspaceShell` tüm buyer/seller sayfalarında Codex pet avatarlı floating panel render eder; panel route context'e göre prompt/proactive mesaj seçer, ortak runtime/history taşır, buyer cart apply ve seller listing apply/rollback shared helper'larını kullanır, `Gizle`/`Sessize al`/`Bu sayfada uyarma` kontrollerini localStorage'da korur; hydration-safe state, deterministic seller compact currency, validation, `npm run check`, `npm run build`, HTTP ve Puppeteer desktop/mobil QA geçti.
* 2026-05-16 — Milestone: Milestone 8R End-to-End Demo Hardening tamamlandı. | Sonuç: `/demo` demo rehearsal command center eklendi; buyer/seller/floating Agent runbook, proof stack, QA checklist, gateway demo link'i ve workflow validation contract'ı çalışır; `npm run check`, `npm run build`, HTTP ve Puppeteer desktop/mobil QA geçti.

## 8) Yapılanlar

* [x] CommercePilot'un genel ürün hikayesi çıkarıldı.
* [x] Satıcı tarafının demo için daha güçlü öncelik olduğu belirlendi.
* [x] Agent yol haritası ilk sıraya Seller Growth Action Agent gelecek şekilde güncellendi.
* [x] Kalıcı proje hafızası dosyası oluşturuldu.
* [x] Alıcı tarafının ana problem alanları ve Phase yaklaşımı belirlendi.
* [x] Milestone 0 proje zemini oluşturuldu.
* [x] Lint ve production build doğrulandı.
* [x] Milestone 1 domain model ve curated mock data oluşturuldu.
* [x] Mock data referans bütünlüğü doğrulandı.
* [x] Milestone 2 data access layer oluşturuldu.
* [x] Milestone 3 deterministic scoring layer oluşturuldu.
* [x] Milestone 4 seller workflow layer oluşturuldu.
* [x] Milestone 5 buyer smart cart workflow layer oluşturuldu.
* [x] Milestone 5.5A buyer parser ve intent hardening tamamlandı.
* [x] Milestone 5.5B buyer cart planning hardening tamamlandı.
* [x] Milestone 5.5C seller workflow output hardening tamamlandı.
* [x] Milestone 5.5D validation/test hardening tamamlandı.
* [x] Milestone 6A rol seçimi ve buyer/seller app shell omurgası eklendi.
* [x] Milestone 6B seller API contract ve ürün sağlık detay akışı tamamlandı.
* [x] Milestone 6C buyer smart cart API ve canlı komut etkileşimi tamamlandı.
* [x] Milestone 6D buyer-to-seller signal loop eklendi.
* [x] Milestone 6E seller action detail ve execution preview eklendi.
* [x] Milestone 7 OpenAI `gpt-4o-mini` seller action explanation katmanı eklendi.
* [x] Milestone 8A buyer smart cart explanation ve product/cart preview polish eklendi.
* [x] Milestone 8A QA sırasında buyer explanation no-budget LLM guard eklendi.
* [x] Milestone 8B marketplace + agent pet roadmap dosyası oluşturuldu.
* [x] Milestone 8C light marketplace design system ve shell uygulandı.
* [x] 2026-05-15 ürün geri bildirimiyle roadmap gerçek e-ticaret endpoint akışına göre revize edildi.
* [x] 2026-05-15 ürün detay, kategori, cart, agent ve seller mutation kararları netleştirildi.
* [x] 2026-05-15 floating Agent mini panel kapsamı netleştirildi.
* [x] Milestone 8D IA ve navigasyon reset uygulandı.
* [x] Milestone 8E buyer catalog data, görselli kategori şeridi ve fotoğraflı ürün grid'i uygulandı.
* [x] Milestone 8F ürün detay satın alma paneli ve `localStorage` sepet state'i uygulandı.
* [x] Milestone 8G buyer Agent prompt, görselli öneri ve onaylı sepete ekleme/değiştirme akışı uygulandı.
* [x] Milestone 8H buyer profile tercihleri, yorum geçmişi ve Agent sinyal paneli uygulandı.
* [x] Milestone 8I seller overview endpoint kartları ve öncelik sırası uygulandı.
* [x] Milestone 8J seller products fotoğraflı ürün yönetimi ve focus filtreleri uygulandı.
* [x] Milestone 8K seller actions kategori/focus endpoint'leri ve light action queue uygulandı.
* [x] Milestone 8L seller agent prompt, ürün kanıt sırası ve onay sınırı uygulandı.
* [x] Milestone 8M seller profile permission, bildirim ve audit ayar yüzeyi uygulandı.
* [x] Milestone 8N shared Agent runtime, prompt/tool registry ve route snapshot panelleri uygulandı.
* [x] Milestone 8O shared buyer Agent cart mutation contract ve client apply helper uygulandı.
* [x] Milestone 8P seller listing apply, audit log ve rollback helper uygulandı.
* [x] Milestone 8Q floating Agent mini panel, shared history/runtime, context-aware uyarı ve mute/snooze kontrolleri uygulandı.
* [x] Milestone 8R demo rehearsal route, typed runbook ve QA checklist uygulandı.

## 9) Yapılacaklar (Next)

* [x] Satıcı panelinde çözülecek ana problemleri kesinleştir.
* [x] Milestone 1 için domain model ve curated mock data kararlarını kullanıcıyla netleştir.
* [ ] Her satıcı problemi için hangi veri sinyallerinin kullanılacağını netleştir.
* [x] Seller Growth Actions panelinde gösterilecek aksiyon türlerini belirle.
* [ ] Satıcı tarafına kârlılık/maliyet baskısı, iade/şikayet riski ve operasyonel dağınıklık problemlerini eklemeyi değerlendir.
* [ ] Mock product/review/sales/inventory hikayelerini ürün ürün tasarla.
* [ ] Satıcı tarafı oturduktan sonra buyer tarafı için aynı kapsam çalışmasını yap.
* [x] Buyer Smart Cart akışı için 5 demo senaryosu seç.
* [x] Alıcı tarafındaki ürün karar güveni sinyallerini mock data ile eşleştir.
* [ ] Alıcı tarafı için yapılacak/yapılmayacak listesini uygulama fazına çevirmeden önce son kez onayla.
* [x] Milestone 1'de curated çekirdek veri seti mi, Kaggle destekli hibrit veri seti mi kullanılacağını son karara bağla.
* [x] Buyer preference/persona alanlarının ilk veri modelinde pasif mi aktif mi tutulacağını netleştir.
* [x] Milestone 2 data access helper'larını oluştur.
* [x] Milestone 3 deterministic scoring layer tasarımını netleştir ve uygula.
* [x] Milestone 4 workflow layer tasarımını netleştir ve uygula.
* [x] Milestone 5 buyer smart cart workflow layer tasarımını netleştir ve uygula.
* [x] Milestone 5.5A buyer parser, meeting intent ve maxDeliveryDays hardening uygula.
* [x] Milestone 5.5B buyer cart planning hardening uygula.
* [x] Milestone 5.5C seller workflow output hardening uygula.
* [x] Milestone 5.5D validation/test hardening uygula.
* [x] Brain hardening bittikten sonra UI/API kapsamını netleştir.
* [x] Milestone 6A app shell ve rol seçimi oluştur.
* [x] Milestone 6B seller API route'ları ve seller ekran veri contract'larını oluştur.
* [x] Milestone 6C buyer API route'u ve buyer smart cart etkileşimini canlı hale getir.
* [x] 6C review sonrası buyer ürün keşfi/sepet sayfası derinleştirme veya LLM/Gemini entegrasyon fazının kapsamını netleştir.
* [x] 6D review sonrası ürün detay/aksiyon drill-down veya LLM/Gemini entegrasyon fazının kapsamını netleştir.
* [x] 6E review sonrası LLM/Gemini açıklama katmanı veya buyer product/cart preview derinleştirmesinin kapsamını netleştir.
* [x] Milestone 7 review sonrası Gemini provider swap için route/prompt contract'ının korunup korunmayacağını netleştir.
* [x] Buyer product/cart preview derinleştirmesinin demo değerini OpenAI/Gemini açıklama katmanıyla karşılaştır.
* [x] Milestone 8A review sonrası end-to-end demo script/presentation readiness kapsamını netleştir.
* [ ] Gemini provider swap için mevcut seller/buyer/agent contract'larını koruyacak adapter tasarımını netleştir.
* [x] Milestone 8C light marketplace design system ve shell'i uygula.
* [x] Milestone 8D IA ve navigasyon reset uygula: buyer header-only, seller sade header, sidebar menü tekrarı yok.
* [x] Milestone 8E buyer catalog data ve ürün grid kapsamını `Kadın Giyim/Erkek Giyim/Elektronik/Ev & Yaşam/Kozmetik/Spor/Aksesuar` kategori setiyle uygula.
* [x] Milestone 8F buyer product detail + cart state kur: `/buyer/products/[slug]`, satış penceresi, `localStorage` cart, sepete ekle/sil/adet/toplam.
* [x] Milestone 8G buyer Agent sayfasında prompt -> görselli ürün önerisi -> sepete ekleme onayı akışını kur.
* [x] Milestone 8H buyer profile tercihleri ve yorumları ekranını kur.
* [x] Milestone 8I seller overview endpoint kartlarını kur: iade, negatif yorum, satılmayan ürün, stok riski.
* [x] Milestone 8J seller products ekranını fotoğraflı ürün yönetimi yüzeyine dönüştür.
* [x] Milestone 8K seller actions ekranını kategori/focus endpoint'lerine böl.
* [x] Milestone 8L seller agent sohbet ve analiz yüzeyini kur: satıcı prompt'u, satılmayan ürün sıralama, sebep analizi ve öneri akışı.
* [x] Milestone 8M seller profile + permissions ekranını gerçek ayar yüzeyine dönüştür: mağaza profili, agent yetki modu, bildirim tercihleri.
* [x] Milestone 8N shared agent runtime: buyer/seller prompt registry, typed tool registry ve ortak request/apply sınırlarını kur.
* [x] Milestone 8O shared buyer agent cart mutations: 8G onaylı cart apply davranışını shared runtime/floating panel ile ortaklaştır.
* [x] Milestone 8P için seller before/after preview, onay, audit log ve rollback davranışını netleştir.
* [x] Milestone 8Q floating Agent mini panelini kur: tüm buyer/seller sayfalarında Codex pet ikonu, ortak agent history/runtime, context-aware uyarı, gizle/sessize al/bu sayfada uyarma kontrolleri.
* [x] Milestone 8R end-to-end demo hardening yap: buyer/seller kritik akışlarını demo script'e bağla, görsel polish ve smoke QA tekrarını tamamla.
* [ ] Milestone 9A Gemini/provider finalization yap: OpenAI fallback korunarak Gemini adapter ve contract uyumu doğrula.
* [ ] Tüm Agent/LLM/model tahmin fikirleri bittikten sonra faz faz implementasyona geç.

## 10) Bilinen Sorunlar / Teknik Borç / Riskler

* Scope creep:
  * Çok fazla agent ve özellik aynı anda yapılırsa demo zayıflar.
* Fake-looking AI:
  * LLM çıktısı veriyle desteklenmezse öneriler inandırıcı olmaz.
* Mock data riski:
  * Veri rastgele olursa Seller Growth Actions anlamsız görünür.
* Zaman riski:
  * Auth, database, payment, scraping gibi işler ilk fazda ertelenmezse MVP yetişmeyebilir.
* Mesaj netliği:
  * Ürün yalnızca chatbot gibi anlatılırsa çift taraflı commerce intelligence farkı kaybolur.
* Dependency audit:
  * `npm audit --omit=dev`, Next 16.2.6 içindeki PostCSS bağımlılığı için 2 moderate uyarı veriyor. `npm view next version` mevcut latest sürümün 16.2.6 olduğunu gösteriyor; `npm audit fix --force` kırıcı downgrade önerdiği için uygulanmadı.
* LLM network/runtime:
  * OpenAI çağrısı sadece runtime endpointte yapılır; API key eksikse, provider desteklenmiyorsa veya ağ/API hatası olursa UI deterministic fallback görmelidir.
* 8C geçici tema köprüsü:
  * `commerce-legacy-light` mevcut dark utility class'larını light yüzeye çevirir; uzun vadede buyer/seller sayfa içerikleri gerçek marketplace komponentlerine tek tek taşınmalı.
  * Yeni light sayfalarda koyu buton üstünde beyaz metin gerekiyorsa `text-white` yerine köprüden etkilenmeyen `text-[#fff]` kullanılmalı veya sayfa bridge dışına taşınmalı.
* 8E katalog görselleri:
  * Ürün/kategori görselleri tek sprite üzerinden geliyor; yeni ürün eklenirse `productSpriteIndexOverrides` veya kategori sprite index'i görsel uyum için kontrol edilmeli.
* 8F cart state:
  * Sepet client-only `localStorage` ile çalışır; server route veya build sırasında `window` erişimi yapılmamalı. Yeni cart mutation'ları `src/lib/cart/buyer-cart.ts` helper'larını kullanmalı.
* 8G agent apply:
  * `/api/buyer/agent/apply` tarayıcı sepetini doğrudan değiştirmez; sadece doğrulanmış ürün/adet/strateji payload'u döndürür. Gerçek `localStorage` yazımı client component içinde `src/lib/cart/buyer-cart.ts` ile yapılır.
* 8H buyer profile state:
  * `/api/buyer/profile` PATCH profile verisini server'da kalıcı saklamaz; ilk fazda doğrulanmış contract döndürür. Reload persistence client `src/lib/profile/buyer-profile-storage.ts` içindeki `localStorage` taslağıyla sağlanır.
* 8I seller overview:
  * Alert card query hedeflerinden `/seller/products?focus=...` 8J itibarıyla ürün listesi filtresine, `/seller/actions?focus=...` hedefleri 8K itibarıyla action queue filtresine bağlandı.
* 8J seller products:
  * `/api/seller/products?focus=stock-risk|return-risk|negative-reviews|slow-movers|at-risk` filtrelenmiş product contract döndürür; sayfa route'u tüm ürünleri alıp initial URL focus değerini client filtre state'ine uygular.
* 8K seller actions:
  * `/api/seller/actions?focus=negative-reviews|return-risk|slow-movers|stock-risk|inventory|customer-voice` filtrelenmiş action contract döndürür.
  * `/seller/actions/[id]` route'u parametre focus/category slug ise `SellerActionsWorkspace`, gerçek action id ise mevcut action detail ekranını render eder.
* 8L seller agent:
  * `/api/seller/agent` GET default seller agent contract, POST ise `{ prompt, sellerId? }` ile deterministic prompt analysis döndürür.
  * Seller Agent doğrudan mutation yapmaz; draft preview shared apply metadata taşır ve gerçek localStorage yazımı 8P apply helper'ı ile satıcı onayı sonrası yapılır.
* 8M seller profile:
  * `/api/seller/profile` GET default seller profile contract, PATCH ise mağaza bilgisi, permission mode, capability ids, notification channels, alert rules, quiet hours ve proactive controls alanlarını doğrular.
  * `auto-apply` capability kilitlidir ve PATCH sırasında filtrelenir; seller mutation hâlâ açık satıcı onayı ve 8P audit/apply helper'ı olmadan uygulanmaz.
  * `SellerProfileWorkspace` localStorage taslağı kullanır; gerçek kalıcı DB/auth store yoktur.
* 8N shared runtime:
  * `/api/agent/runtime` read-only registry snapshot'tır; buyer cart apply ve seller listing apply hâlâ kendi route/client akışlarında yürür.
  * `runtime.toolPlan` contract-level metadata'dır; gerçek tool execution deterministik buyer/seller agent builder'larında korunur.
* 8O buyer cart apply:
  * `/api/buyer/agent/apply` tarayıcı sepetini doğrudan değiştirmez; `sharedMutation.clientAction.helper` route/floating UI'a hangi client helper'ı çalıştıracağını söyler.
  * Gerçek cart yazımı `src/lib/agents/buyer-cart-apply-client.ts` içindeki `applyBuyerAgentCartMutation` ile yapılır; yeni floating panel kendi `clear/add` mantığını yazmamalı.
* 8P seller listing apply:
  * `/api/seller/agent/apply` tarayıcı listing state'ini doğrudan değiştirmez; `sharedMutation.clientAction.helper` route/floating UI'a hangi client helper'ı çalıştıracağını söyler.
  * Gerçek listing override, audit log ve rollback yazımı `src/lib/agents/seller-listing-apply-client.ts` içindeki `applySellerListingMutation` ve `rollbackSellerListingMutation` ile yapılır; yeni floating panel kendi audit/localStorage mantığını yazmamalı.
* 8Q floating Agent:
  * Floating Agent state key'i `commercepilot.floatingAgent.v1`; history ve control state shape'i `{ version, control: { muted, disabledRoutes }, history }` olarak kalmalı.
  * `createFloatingAgentContext` route label, default prompt, proactive message ve capability listesi için tek kaynaktır; yeni route context'leri burada eklenmeli.
  * Panel SSR/hydration sırasında `localStorage` okumamalı; başlangıç store'u default olmalı, gerçek state mount sonrası `readFloatingAgentStore()` ile senkronlanmalı.
  * Buyer apply için `applyBuyerAgentCartMutation`, seller apply/rollback için `applySellerListingMutation` ve `rollbackSellerListingMutation` kullanılmalı; panel kendi cart/listing/audit yazımını icat etmemeli.
  * Buyer ve seller runtime template versiyonları `8Q.1`, handoff `8R`; `/api/agent/runtime` ve validation bu geçişi doğrular.
  * Seller products compact currency formatı SSR/client locale farkı yaratmamak için deterministik `₺90 B` biçiminde tutulur.
* 8R demo rehearsal:
  * `/demo` route'u sunum provası içindir; gerçek buyer/seller akışlarını değiştirmez, sadece doğru route'lara götürür.
  * Demo runbook ve QA checklist `src/lib/demo/rehearsal.ts` içinden gelir; yeni demo adımı eklenirse `scripts/validate-workflows.js` içindeki `validateDemoRehearsalContracts` güncellenmeli.
  * `/demo` görsel yüzeyi client component ve GSAP kullanır; browser-only davranışlar server component'e taşınmamalı.
  * Gateway'deki `/demo` link'i jüri/sunum girişidir; buyer/seller role kartlarının yerine geçmez.

## 11) Notlar ve Tuzaklar (Pitfalls)

* Satıcı panelinin ana vaadi "veri göstermek" değil, "veriden aksiyon çıkarmak" olmalı.
* Seller Growth Actions mümkün olduğunca az ama güçlü aksiyon göstermeli; uzun ve dağınık liste olmamalı.
* Her aksiyonun arkasında görünür bir sebep olmalı: stok, satış, yorum, listeleme kalitesi veya ürün ilişkisi.
* Buyer tarafı ilk MVP'de daha sade kalabilir ama sistemin çift taraflı olduğunu gösterecek kadar var olmalı.
* LLM sadece son karar verici gibi konumlanmamalı; karar sinyalleri önce sistem tarafından hesaplanmalı.
* Seller UI artık route handler ile aynı `src/lib/api/seller.ts` builder'larını kullanır; seller workflow alanı değişirse API validation da güncellenmeli.
* Buyer canlı akışı `src/lib/api/buyer.ts` ve `/api/buyer/smart-cart` üzerinden ilerler; prompt parser veya workflow rol mantığı değişirse API validation da güncellenmeli.
* Buyer-to-seller loop `src/lib/api/seller.ts` içindeki `getSellerBuyerSignalsApiData` ile buyer smart cart örneklerini çalıştırır; `sellerSignalCandidates` shape'i değişirse seller API validation ve `/seller` loop bölümü birlikte güncellenmeli.
* Seller action detail `src/lib/api/seller.ts` içindeki `getSellerActionDetailApiData` ile action id üzerinden çalışır; `SellerGrowthAction` id/type/checklist alanları değişirse dynamic route, validation ve `/seller/actions/[id]` birlikte güncellenmeli.
* Seller action explanation `src/lib/api/seller-action-explanations.ts` ile çalışır; validation canlı OpenAI çağırmaz, `forceFallback: true` ile contract'ı doğrular.
* Buyer smart cart explanation `src/lib/api/buyer-smart-cart-explanations.ts` ile çalışır; validation canlı OpenAI çağırmaz, `forceFallback: true` ile contract'ı doğrular.
* Buyer katalog UI/API `src/lib/api/buyer-catalog.ts` üzerinden çalışır; kategori seti, sıralama, ürün href'i veya görsel contract'ı değişirse `scripts/validate-workflows.js` içindeki buyer catalog kontrolleri birlikte güncellenmeli.
* Buyer sepet UI `src/components/commerce/buyer-cart-workspace.tsx` ve `src/lib/cart/buyer-cart.ts` üzerinden çalışır; 8G Agent apply akışı append/replace stratejisini bu helper'lara bağlar.
* Buyer Agent UI/API `src/lib/api/buyer-agent.ts`, `/api/buyer/agent`, `/api/buyer/agent/apply` ve `src/components/commerce/buyer-agent-workspace.tsx` üzerinden çalışır; agent contract'ı değişirse `scripts/validate-workflows.js` içindeki buyer agent kontrolleri birlikte güncellenmeli.
* Buyer Agent cart mutation contract `src/lib/agents/buyer-cart-apply.ts` üzerinden çalışır; append/replace stratejisi, `sharedMutation`, storage key, cart event veya surface listesi değişirse route handler, client helper, runtime registry ve validation birlikte güncellenmeli.
* Seller Agent listing mutation contract `src/lib/agents/seller-listing-apply.ts` üzerinden çalışır; before/after alanları, `sharedMutation`, audit id, storage key, event veya surface listesi değişirse route handler, client helper, runtime registry ve validation birlikte güncellenmeli.
* Seller Agent audit store `src/lib/agents/seller-listing-apply-client.ts` içindedir; floating Agent seller mutation uygularsa aynı `applySellerListingMutation` ve `rollbackSellerListingMutation` helper'larını kullanmalı.
* Shared Agent runtime `src/lib/agents/runtime.ts` üzerinden çalışır; prompt id, tool id, approval boundary veya handoff değişirse buyer/seller agent API'leri, `AgentRuntimePanel` ve `scripts/validate-workflows.js` birlikte güncellenmeli.
* Buyer Profile UI/API `src/lib/api/buyer-profile.ts`, `/api/buyer/profile`, `src/lib/profile/buyer-profile-storage.ts` ve `src/components/commerce/buyer-profile-workspace.tsx` üzerinden çalışır; profil tercih id'leri, yorum görsel contract'ı veya learned signal shape'i değişirse `scripts/validate-workflows.js` içindeki buyer profile kontrolleri birlikte güncellenmeli.
* Seller overview kartları `src/lib/api/seller.ts` içindeki `alertCards` ve `priorityQueue` üzerinden gelir; risk kartı id'leri, href/apiEndpoint veya evidence shape'i değişirse `scripts/validate-workflows.js` içindeki overview kontrolleri birlikte güncellenmeli.
* Seller products UI/API `src/lib/api/seller.ts`, `/api/seller/products` ve `src/components/commerce/seller-products-workspace.tsx` üzerinden çalışır; product `focusTags`, `riskSignals`, `linkedAction`, segment id'leri veya product image contract'ı değişirse `scripts/validate-workflows.js` içindeki seller products kontrolleri birlikte güncellenmeli.
* Buyer explanation no-budget guard: kullanıcı bütçe belirtmediyse model `bütçeniz`, `%5 tolerans`, `bütçe içinde/altında` gibi iddiaları UI contract'ına geçirmemeli; bu kontrol `scripts/validate-workflows.js` içinde sentetik model çıktısıyla korunur.
* 8B sonrası roadmap tek kaynak: `COMMERCEPILOT_AGENT_MARKETPLACE_ROADMAP.md`. Milestone sırası değişirse bu dosya ve `PROJECT_MEMORY.md` birlikte güncellenmeli.
* 8C theme bridge sadece `WorkspaceShell` içindeki children wrapper'ında çalışmalı; body seviyesine taşınırsa header/nav/CTA gibi bilinçli koyu kontrast alanları bozulur.
* Seller tarafında "gerçek mutation" ilk aşamada dış marketplace entegrasyonu değil, mock app state üzerinde uygulanmış ve audit log'a yazılmış değişiklik anlamına gelir.
* Agent proactive balonları bağlama özel ve susturulabilir olmalı; her sayfada sürekli konuşan bir widget demo değerini düşürür.
* OpenAI API key sadece `.env.local` içinde tutulur; `.env*` gitignore kapsamındadır ve secret commitlenmemelidir.

## 12) Satıcı Paneli Stratejisi

### Ana ürün iddiası

* Satıcı paneli klasik raporlama ekranı olmayacak.
* Satıcıya "ne oluyor?" sorusundan çok "bugün ne yapmalısın?" sorusunun cevabını verecek.
* En güçlü demo alanı: Seller Growth Actions / Satıcı Büyüme Aksiyonları.

### Üzerine gidilecek satıcı problemleri

* Stok problemi:
  * Hangi ürünler yakında tükenecek?
  * Hangi ürünlerde satış hızı stoğa göre riskli?
  * Önerilen aksiyon: yeniden stok al, stoğu koru, kampanyayı durdur veya ürünü öne çıkarma.

* Satmayan ürün problemi:
  * Hangi ürünler görüntüleniyor ama satmıyor?
  * Hangi ürünler stokta bekliyor?
  * Önerilen aksiyon: fiyat/kampanya düşün, açıklamayı iyileştir, ürün görselini veya başlığı güçlendir.

* Negatif yorum problemi:
  * Hangi ürünlerde tekrar eden şikayetler var?
  * Hangi negatif yorumlar acil aksiyon gerektiriyor?
  * Önerilen aksiyon: ürün açıklamasını netleştir, müşteri mesajı hazırla, kalite/ölçü/uyumluluk notu ekle.

* Listeleme kalitesi problemi:
  * Hangi ürünün açıklaması zayıf, eksik veya ikna edici değil?
  * Önerilen aksiyon: başlık/açıklama/spec alanlarını iyileştir.

* Bundle/kampanya fırsatı:
  * Hangi ürünler birlikte anlamlı satılabilir?
  * Hangi yavaş ürün güçlü ürünle paketlenebilir?
  * Önerilen aksiyon: bundle önerisi veya kampanya fikri üret.

* Güçlü ürünü büyütme problemi:
  * Hangi ürün zaten iyi satıyor ve iyi yorum alıyor?
  * Önerilen aksiyon: ürünü vitrinde öne çıkar, stok güvenceye al, tamamlayıcı ürünlerle sepet büyüt.

### Phase 1 yaklaşımı

* Phase 1'de gerçek LLM/Gemini entegrasyonu yapılmayacak.
* Satıcı aksiyonları deterministik kurallarla üretilecek.
* UI'da "AI-ready" alanlar olabilir ama bunlar canlı Gemini çıktısı gibi sunulmayacak.
* Her insight için dayanak sinyaller gösterilecek.

### Daha sonraki Agent/LLM yaklaşımı

* Seller Growth Action Agent:
  * Önce deterministik workflow aksiyon adaylarını çıkaracak.
  * Gemini bu aksiyonları daha anlaşılır, öncelikli ve ikna edici dile çevirecek.

* Review Intelligence Agent:
  * Yorumları temalara ayıracak, tekrar eden şikayetleri ve acil yorumları özetleyecek.

* Listing Optimizer Agent:
  * Ürün açıklamasını yorumlardan ve ürün verisinden yararlanarak iyileştirecek.

* Campaign & Bundle Agent:
  * Ürün ilişkileri, satış durumu ve stok verisinden bundle/kampanya fikirleri çıkaracak.

* Customer Message Agent:
  * Negatif yorum veya şikayet için satıcıya cevap taslağı üretecek.

### Demo için önerilen ürün hikayeleri

* Düşük stoklu ürün:
  * İyi satıyor ama stok kritik seviyeye inmiş.
* Yavaş hareket eden ürün:
  * Stokta bekliyor, satış düşük.
* Negatif yorum temalı ürün:
  * Yorumlarda tekrar eden kalite, ölçü veya kullanım problemi var.
* Bundle'a uygun ürün:
  * Başka ürünlerle birlikte satılması mantıklı.
* Güçlü ürün:
  * Satışı, yorumu ve puanı iyi; büyütme fırsatı var.
* Listeleme problemi olan ürün:
  * Ürün iyi olabilir ama açıklama/spec eksikliği dönüşümü düşürüyor.

### Başarı kriteri

* Satıcı paneline giren biri 30 saniye içinde mağazada neyin önemli olduğunu anlayabilmeli.
* Seller Growth Actions ekranı demo sırasında "bu sistem gerçekten satıcıya karar aldırıyor" hissi vermeli.
* Her aksiyonun nedeni görünür ve anlaşılır olmalı.
* Satıcı tarafı oturduktan sonra buyer tarafına geçilecek.

## 13) Satıcı Problemleri Araştırma Notları

* 2026-05-12 — İnternet araştırmasına göre mevcut satıcı problem listesi doğru; eklenmesi gereken önemli başlıklar:
  * Kârlılık/maliyet baskısı: komisyon, reklam, kargo, iade, ürün maliyeti ve platform kesintileri satıcının net kârını belirsizleştiriyor.
  * Operasyonel dağınıklık: satıcılar manuel işler, spreadsheet kullanımı, çoklu pazaryeri yönetimi ve veri doğruluğu sorunlarıyla zaman kaybediyor.
  * İade/return ve fraud riski: iadeler hem maliyet hem müşteri memnuniyeti hem de satıcı koruması açısından büyük baskı yaratıyor.
  * Reklam verimliliği ve görünürlük: artan reklam maliyetleri ve yoğun rekabet satıcıların kârlı büyümesini zorlaştırıyor.
  * Müşteri tutundurma: birçok mağaza yeni müşteri kazanmaya odaklanırken mevcut müşteriyi elde tutma araçları zayıf kalıyor.
  * Platform bağımlılığı ve kanal karmaşası: marketplace kuralları, komisyonlar, buybox/görünürlük ve farklı kanallarda stok/fiyat yönetimi satıcıyı zorluyor.
* CommercePilot için çıkarım:
  * Seller Growth Actions yalnızca stok/satış/yorum değil, mümkünse "kârı koru", "operasyonu sadeleştir", "iadeyi azalt", "reklamı verimli kullan" gibi aksiyonları da kapsamalı.

## 14) Alıcı Tarafı Stratejisi

### Ana ürün iddiası

* Alıcı tarafı basit bir chatbot olmayacak.
* Alıcının asıl problemi "ürün bulmak" değil, çok seçenek arasında doğru ürüne güvenle karar vermek.
* CommercePilot alıcıya ihtiyaç, bütçe, senaryo, yorumlar ve ürün ilişkilerine göre karar desteği verecek.
* Alıcı tarafı aynı zamanda satıcı tarafını besleyen sinyal kaynağı olacak: talep senaryoları, birlikte düşünülen ürünler, fiyat hassasiyeti ve yorum kaynaklı tereddütler ileride satıcı aksiyonlarına dönüşecek.

### Üzerine gidilecek alıcı problemleri

* Karar yorgunluğu:
  * Alıcı çok fazla ürün arasında kalıyor.
  * Hangi ürünün kendi ihtiyacına daha uygun olduğunu anlamakta zorlanıyor.
  * Önerilen çözüm: doğal dil ihtiyacı -> kısa ürün listesi veya sepet önerisi.

* Bütçeye uygun sepet kurma:
  * Alıcı tek ürün değil, senaryoya uygun ürün seti arayabiliyor.
  * Önerilen çözüm: bütçe, kategori ve ihtiyaç sinyallerine göre smart cart.

* Güven problemi:
  * Alıcı yorumlara, ürün açıklamasına, iade/kargo bilgisine ve satıcı güvenilirliğine ihtiyaç duyuyor.
  * Önerilen çözüm: "neden bu ürün?", "nelere dikkat etmelisin?", review-based warnings.

* Alternatif arama:
  * Alıcı daha ucuz, daha kaliteli veya farklı amaç için daha uygun alternatif arıyor.
  * Önerilen çözüm: ürün detayında alternatif ürün önerileri.

* Tamamlayıcı ürün ihtiyacı:
  * Alıcı bir ürün alırken yanında ne alması gerektiğini bilmiyor.
  * Önerilen çözüm: complementary product ve bundle önerileri.

* Hediye/senaryo bazlı alışveriş:
  * Alıcı belirli kişi, durum veya kullanım amacına göre ürün arıyor.
  * Önerilen çözüm: gift finder veya scenario basket akışı.

* Yorumları okuyup anlamlandırma zorluğu:
  * Alıcı yüzlerce yorumu okumak istemiyor.
  * Önerilen çözüm: pozitif/negatif tema özeti ve satın almadan önce bilinmesi gerekenler.

* Sepet terk etme sebepleri:
  * Ek maliyet, belirsiz iade/kargo, güven eksikliği ve karar kararsızlığı alışverişi durdurabiliyor.
  * Önerilen çözüm: ürün ve sepet ekranında erken güven sinyalleri, toplam maliyet ve açık uyarılar.

### Phase yaklaşımı

* Phase 1:
  * Buyer catalog, product detail, cart shell ve AI-ready smart cart alanı.
  * Gemini yok; deterministic/mock öneriler ve açık placeholder mantığı.

* Phase 3:
  * Buyer Smart Cart Agent eklenecek.
  * Kullanıcı komutundan bütçe, amaç, kategori ve tercih çıkarılacak.
  * Ürün seçimi deterministik yapılacak; Gemini açıklama ve karar gerekçesi üretecek.

* Sonraki fazlar:
  * Alternative Product Agent.
  * Complementary Product Agent.
  * Buyer Explanation Agent.
  * Gift Finder Agent.
  * Review-based Buyer Advice Agent.

### Demo için önerilen alıcı senaryoları

* "3000 TL altında ev ofis setup kur."
  * Birden fazla ürün ve bütçe optimizasyonu gösterir.
* "1500 TL altında başlangıç kahve seti oluştur."
  * Tamamlayıcı ürün mantığını gösterir.
* "Annem için 1000 TL altında hediye öner."
  * Hediye/senaryo bazlı alışverişi gösterir.
* "Spor için kablosuz kulaklık öner."
  * İhtiyaç bazlı ürün seçimi ve review warning gösterir.

### Başarı kriteri

* Alıcı doğal dille ihtiyacını söylediğinde sistem kısa, anlaşılır ve bütçeye uygun öneri sunmalı.
* Ürün önerileri "neden bu ürün?" sorusuna cevap vermeli.
* Alıcıya sadece ürün değil, karar güveni verilmeli.
* Buyer tarafı satıcı tarafını besleyen veri kaynağı olarak tasarlanmalı.

## 15) Alıcı Problemleri Araştırma Notları

* 2026-05-13 — İnternet araştırmasına göre alıcı tarafındaki ana problemler:
  * Karar yorgunluğu ve ürün keşfi: kullanıcı çok seçenek arasında karar vermekte zorlanıyor.
  * Sepet terk etme: beklenmeyen ek maliyetler, güven eksikliği, uzun/karmaşık checkout ve belirsiz iade/kargo bilgisi önemli sebepler.
  * Güven ve şeffaflık: iade, kargo, ürün açıklaması, yorumlar ve satıcı güveni satın alma kararını etkiliyor.
  * AI alışveriş asistanlarına ilgi artıyor ama kullanıcılar tam otomatik satın alma konusunda temkinli; bu nedenle ilk aşamada AI "karar destekçisi" olarak konumlanmalı.
* CommercePilot için çıkarım:
  * Alıcı tarafında ilk hedef otomatik checkout değil, ihtiyaç anlama, akıllı sepet, alternatif/tamamlayıcı öneri ve yorum bazlı güven desteği olmalı.

## 16) Alıcı Tarafı Yapılacak / Yapılmayacak Listesi

### Yapılacaklar

* Buyer Smart Cart:
  * Kullanıcı ihtiyacını doğal dille yazacak; sistem bütçe, senaryo ve ürün kategorilerini anlayıp açıklamalı sepet önerecek.
  * İlk demo komutu: "3000 TL altında ev ofis setup kur."

* Product Confidence / Karar Güveni:
  * Ürün detayında "Bu ürün kimler için uygun?", "Neden seçildi?", "Satın almadan önce bil" alanları olacak.
  * Amaç kullanıcıya yalnızca ürün değil, karar gerekçesi vermek.

* Review-Based Buyer Advice:
  * Yorumlardan olumlu temalar, olumsuz temalar ve satın almadan önce dikkat edilmesi gerekenler çıkarılacak.
  * Bu aynı zamanda satıcı tarafındaki Review Intelligence ve Listing Optimizer için veri olacak.

* Alternative Product Suggestions:
  * Kullanıcıya daha ucuz, daha yüksek puanlı veya farklı kullanım amacına uygun alternatifler gösterilecek.

* Complementary Product Suggestions:
  * Bir ürünün yanında ne alınabileceği gösterilecek.
  * Bu veri satıcı tarafında bundle/kampanya önerilerine bağlanacak.

* Budget Awareness:
  * Sepet toplamı, bütçe limiti ve bütçe dışına taşma açıkça gösterilecek.
  * Sistem bütçe aşılırsa daha uygun alternatif önermeli.

* Trust Signals:
  * Teslimat, iade, satıcı güveni, yorum kalitesi ve ürün açıklaması gibi karar güveni sinyalleri görünür olacak.

* Buyer-to-Seller Signal Bridge:
  * Alıcıların aradığı senaryolar, takıldığı yorum temaları, alternatif aramaları ve tamamlayıcı ürün talepleri ileride satıcı aksiyonlarına çevrilecek.

### Şimdilik Yapılmayacaklar

* Gerçek ödeme/checkout yapılmayacak.
* Gerçek kullanıcı hesabı ve kişiselleştirilmiş geçmiş kullanılmayacak.
* AI'ın otomatik satın alma yapması yok.
* Gerçek zamanlı rakip fiyat karşılaştırması yok.
* Scraping yok.
* Görsel deneme/AR gibi ağır özellikler yok.
* Alıcı tarafı satıcı panelinden daha büyük hale getirilmeyecek; seller intelligence ana demo odağı olarak kalacak.

### Araştırma kaynaklarından çıkarımlar

* Baymard:
  * Sepet terk etme oranı hâlâ çok yüksek; checkout karmaşıklığı, güven, maliyet ve karar belirsizliği önemli.
* Adobe:
  * Generative AI alışveriş araştırması, ürün önerisi, fırsat bulma, hediye fikri ve alışveriş listesi üretme için kullanılmaya başlanıyor.
* Google Shopping AI Mode:
  * AI alışverişte görsel keşif, kriter daraltma, ürün karşılaştırma, fiyat takibi ve agentic checkout yönüne gidiyor.
* Amazon Rufus:
  * Alışveriş asistanı ürün kataloğu, yorumlar, Q&A ve web bilgisini kullanarak ihtiyaç, karşılaştırma ve ürün sorularına cevap veriyor.
* Salsify:
  * Ürün içeriğinin tutarlılığı ve doğruluğu güven ve iade kararlarında kritik.
* Bazaarvoice:
  * Yorumlar ve kullanıcı üretimi içerik hem alıcı güvenini hem de AI önerilerinde ürün görünürlüğünü etkiliyor.
* Türkiye kaynakları:
  * E-ticaret büyüyor; teslimat hızı, yanlış/hasarlı ürün, iade süreci, kargo belirsizliği ve marka güveni alıcı tarafında kritik.

## 17) Milestone 1 Veri ve Agentic Karar Notları

* Demo mağaza:
  * Şimdilik CommercePilot adı kullanılacak.
* Veri dili:
  * Tüm ürün, yorum, aksiyon ve demo metinleri Türkçe olacak.
* Fiyat aralığı:
  * İlk mock ürün fiyatları 250-5000 TL aralığında olacak.
* Veri seti yaklaşımı:
  * Küçük veri seti istenmiyor; katalog zengin hissettirmeli.
  * Ana veri seti yine curated olmalı çünkü satıcı aksiyonları için her ürünün bilinçli demo hikayesi gerekir.
  * Kaggle/Hugging Face veri setleri review dili, kategori çeşitliliği ve davranış örnekleri için zenginleştirme olarak değerlendirilebilir.
* Satıcı hikayeleri onaylandı:
  * düşük stoklu ürün,
  * yavaş satan ürün,
  * negatif yorumlu ürün,
  * bundle'a uygun ürün,
  * güçlü ürün,
  * listeleme kalitesi zayıf ürün,
  * kârlılık baskısı olan ürün,
  * iade riski olan ürün.
* Buyer senaryoları:
  * Tek komutla sınırlı olmayacak.
  * Örnekler: "kargo hızı yüksek olan 3000 TL altında ev ofis setup kur", "şu renk paletinde masa takımı diz", "önceki hız şikayetlerimi dikkate alarak öner".
* Buyer personalization:
  * Her alıcının geçmiş yorum/şikayet sinyallerine göre kendi AI destekli alışveriş yardımcısı olması hedefleniyor.
  * İlk implementasyonda aktif olmayabilir; veri modelinde buyer preferences/review history için alan bırakılmalı.
* Future companion:
  * İleride yardımcı pilot gibi davranan bir pet/karakter eklenecek.
  * Bu Phase 1/Milestone 1 kapsamı değil; marka deneyimi katmanı olarak sonra ele alınacak.
* LangChain:
  * Agentic işler için aday teknoloji.
  * İlk aşamada doğrudan kullanılmayacak; önce deterministic workflow katmanı kurulacak.
  * Sonra LangChain structured output, tool calling, provider swap ve stateful workflow ihtiyaçlarında devreye alınabilir.
* Milestone 1 sonucu:
  * 1 seller: CommercePilot Demo Store.
  * 40 ürün: ev ofis, elektronik aksesuar, kahve ekipmanları, masa/çalışma alanı, küçük ev/yaşam, hediye/yaşam tarzı.
  * 55 Türkçe yorum: kargo hızı, paketleme, kurulum, kalite, fiyat/performans, renk uyumu, ses, konfor, uyumluluk, iade riski gibi temalar.
  * 24 sipariş, 25 stok hareketi, 30 ürün ilişkisi, 8 buyer persona, 5 smart cart taslağı.
  * Satıcı demo hikayeleri veri içinde `demoStoryFlags` ile işaretlendi.
  * Kargo vaadi ile yorum/kargo deneyimi çeliştiğinde alıcı uyarısı üretebilmek için fulfillment ve review delivery fields eklendi.
  * Buyer personalization için previous complaint themes, sensitivities ve preferred colors alanları eklendi.

## 18) Milestone 2 Data Access Layer Notları

* Amaç:
  * UI, API route, scoring ve workflow katmanlarının mock data dosyalarına doğrudan dağınık şekilde erişmesini önlemek.
* Eklenen helper kapsamı:
  * Products: tüm ürünler, id/slug, kategori, seller, demo story flag, use-case, renk, fiyat aralığı, arama.
  * Reviews: ürün, buyer, tema, sentiment, seller attention ve negatif yorum filtreleri.
  * Sellers: tüm seller'lar, id ve default seller.
  * Buyers: buyer profili, hassasiyet, geçmiş şikayet teması ve tercih edilen renk.
  * Orders: seller, buyer, status, ürün içeren sipariş ve ürün bazlı iade.
  * Inventory: event, ürün, event type ve çoklu product id filtreleri.
  * Relations: ürün ilişkileri, outgoing/incoming, relation type ve product+type filtreleri.
  * Carts: tüm cart'lar, id, buyer ve recommended cart filtreleri.
* Birleşik commerce view helper'ları:
  * `getProductDetail`: ürün + yorum + ilişki + ilişkili ürün + stok hareketleri + siparişler.
  * `getSellerOverview`: seller + ürünler + yorumlar + siparişler + stok hareketleri + ürün ilişkileri.
  * `getBuyerProfile`: buyer + yorumlar + siparişler + cart'lar.
  * `getCartDetail`: cart + buyer + ürün detayları + toplam.
  * `getRelatedProducts`: alternatif/tamamlayıcı/bundle/upgrade ürünleri.
* Sınırlar:
  * Bu milestone scoring, workflow, API route, UI, LLM veya LangChain içermez.
  * Helper'lar şimdilik sync çalışır; gerçek database gelirse aynı fonksiyon isimleri korunarak iç kaynak değiştirilebilir.

## 19) Milestone 3 Açıklanabilir Scoring Layer Notları

* Amaç:
  * Mock commerce verisini deterministic, açıklanabilir ve ileride LLM tarafından yorumlanabilir karar sinyallerine çevirmek.
* Skor formatı:
  * Her skor `0-100` arasıdır.
  * Çıktılar yalnızca sayı dönmez; `label`, `summary`, `drivers`, `evidence`, `recommendedFocus` alanlarını taşır.
  * Sabit warning/critical seviyesi kullanılmadı; UI veya LLM daha sonra skoru yorumlayabilir.
* Eklenen skorlar:
  * Inventory Coverage: kullanılabilir stok, son 30 gün satış hızı, 7 günlük tahmini talep, stok açığı ve stok kapsama günü.
  * Listing Confidence: kalite skoru, attribute completeness, image score, issue tags ve beklenti/uyumluluk yorumları.
  * Review Confidence: negatif yorum, satıcı aksiyonu gerektiren yorum ve tekrar eden temalar.
  * Shipping Confidence: teslimat vaadi, ortalama teslimat, geç teslim şikayet oranı ve kargo yorumları.
  * Return Confidence: return rate, iade siparişleri ve iade riski taşıyan yorum temaları.
  * Profit Confidence: fiyat, maliyet, brüt marj, reklam harcaması, dönüşüm ve iade oranı.
  * Promotion Readiness: stok, yorum, listeleme, kargo, iade ve kârlılık skorlarının kampanya hazırlığına birleşmesi.
  * Product Health: tüm sinyallerin genel ürün sağlığına birleşmesi.
* Örnek doğrulama:
  * FlowMate mouse: stok kapsaması düşük, kargo güveni yüksek.
  * AirBeat kulaklık: kargo güveni ve yorum/iade sinyalleri zayıf.
  * KeyPro klavye: listeleme güveni düşük; switch/ses/uyumluluk açıklaması aksiyon gerektiriyor.
* Sınırlar:
  * Bu milestone workflow, Seller Growth Actions üretimi, API route, UI, LLM veya LangChain içermez.
  * Tahmin modeli yok; 7 günlük talep son 30 gün satış hızından deterministik hesaplanır.

## 20) Milestone 4 Seller Workflow Layer Notları

* Amaç:
  * Açıklanabilir scoring çıktılarını satıcının anlayacağı yapılacak işlere çevirmek.
  * UI/API/agent katmanlarının ham skor detayına doğrudan bağlanmasını önlemek.
* Eklenen workflow'lar:
  * `generateSellerActionsWorkflow`: seller bazında ürünleri analiz eder ve önceliklendirilmiş 5 Seller Growth Action üretir.
  * `analyzeProductHealthWorkflow`: tek ürün için skor kartı ve en zayıf 3 sağlık içgörüsünü üretir.
* Seller action tipleri:
  * `restock`: stok yenileme.
  * `pause_promotion`: stok/kargo riski varken kampanya temposunu kontrol etme.
  * `fix_listing`: başlık, açıklama, özellik ve görsel kalitesini iyileştirme.
  * `review_attention`: negatif/aksiyon gerektiren yorumları ele alma.
  * `reduce_return_risk`: iade riskini düşürme.
  * `create_bundle`: ilişkili ürünlerle bundle/kampanya önerme.
  * `promote_winner`: güçlü ürünü büyütme.
  * `protect_margin`: kârlılık baskısını azaltma.
* Çıktı yaklaşımı:
  * Her aksiyon `priorityScore`, `reasoning`, `evidence`, `recommendedNextStep` ve `llmReadyContext` taşır.
  * Metinler satıcıya gösterilebilir Türkçe içerik olacak şekilde hazırlandı.
  * `llmReadyContext` şu an sadece structured context sağlar; OpenAI/Gemini/LangChain çağrısı yoktur.
* Doğrulama:
  * `seller-commercepilot` için 40 ürün analiz edildi.
  * Top 5 aksiyon: stok yenile, bundle oluştur, güçlü ürünü öne çıkar, kârlılığı koru, yorumları acil incele.
  * KeyPro ürün sağlık örneğinde en zayıf alanlar listeleme güveni, yorum güveni ve kârlılık baskısı olarak üretildi.
* Sınırlar:
  * Bu milestone buyer workflow, API route, UI, LLM veya LangChain içermez.
  * Tahminler deterministic scoring katmanından gelir; gerçek forecast modeli yoktur.

## 21) Milestone 5 Buyer Smart Cart Workflow Notları

* Amaç:
  * Alıcı doğal dil komutunu deterministic şekilde ihtiyaç, bütçe, renk, kategori ve hassasiyet sinyallerine çevirmek.
  * Mock katalogdan açıklamalı, bütçe farkındalığı olan ve kişiselleştirilmiş sepet önerisi üretmek.
* Eklenen workflow:
  * `buildSmartCartWorkflow`: prompt + buyerId + opsiyonel manuel tercihler alır; akıllı sepet çıktısı üretir.
* Desteklenen ilk senaryolar:
  * `home_office_setup`: ev ofis setup.
  * `coffee_starter`: başlangıç kahve seti.
  * `gift_finder`: hediye önerisi.
  * `sports_audio`: spor/kablosuz kulaklık önerisi.
  * `desk_style_set`: renk uyumlu masa takımı.
  * `generic`: fallback.
* Bütçe yaklaşımı:
  * Kullanıcı bütçe verdiyse `budget` korunur ve `softBudgetLimit = budget * 1.05` olarak hesaplanır.
  * Sepet bütçeyi aşarsa ama %5 tolerans içinde kalırsa uyarı döner.
  * Hard cap yoktur; ancak mevcut seçim algoritması soft limit üstüne çıkmamaya çalışır.
* Buyer personalization:
  * Buyer sensitivities, preferred colors ve previous complaint themes skorlamaya dahil edilir.
  * Manuel tercih desteği var: sensitivities, preferredColors, avoidReviewThemes, preferredUseCases ve maxDeliveryDays alanları kabul edilir.
  * Geçmiş şikayet temaları ürün yorum temalarıyla çakışırsa alıcıya uyarı üretilir.
* Çıktı yaklaşımı:
  * `intent`, `selectedItems`, `warnings`, `alternatives`, `complementarySuggestions`, `buyerPersonalizationNotes`, `sellerSignalCandidates` ve `llmReadyContext` döner.
  * `sellerSignalCandidates`, buyer talebini ileride seller tarafında bundle, renk talebi, kargo sürtünmesi veya review friction sinyaline çevirmek için hazırlandı.
* Doğrulanan demo komutları:
  * Aylin: "Kargo hızı yüksek olan 3000 TL altında ev ofis setup kur."
  * Deniz: "1500 TL altında başlangıç kahve seti oluştur."
  * Selin: "Annem için 1000 TL altında hediye öner."
  * Emre: "Siyah ve gri renklerde masa takımı diz."
  * Burak: "Spor için kulağı yormayan kablosuz kulaklık öner."
* Sınırlar:
  * Bu milestone UI, API route, LLM, Gemini/OpenAI veya LangChain içermez.
  * Doğal dil parser keyword/rule-based çalışır; LLM geldiğinde aynı workflow contract üstüne açıklama veya intent extraction eklenebilir.

## 22) Milestone 5.5 Brain Hardening Notları

### 5.5A Buyer Parser + Intent Hardening

* Amaç:
  * Demo sırasında gerçek kullanıcı diliyle gelebilecek buyer komutlarını daha güvenilir yakalamak.
* Yapılanlar:
  * `3.000 TL`, `1.500 TL`, `₺3000`, `3 bin TL` gibi bütçe formatları doğru parse edilir hale getirildi.
  * `meeting_setup` intent'i eklendi.
  * Toplantı, kamera, webcam, mikrofon, hub, sunum, online ders ve video görüşme sinyalleri bu intent'e yönlenir.
  * `maxDeliveryDays` parsed intent içine alındı.
  * `2 günde gelsin` gibi komutlar teslimat beklentisi olarak işleniyor.
  * Teslimat beklentisini aşabilecek ürünler buyer warning ve seller shipping friction sinyali üretebilir.
* Doğrulanan komutlar:
  * "3.000 TL altında hızlı kargolu ev ofis setup kur."
  * "1.500 TL altında kahve seti kur."
  * "3 bin TL altında kompakt çalışma masası setup öner."
  * "Toplantı için uyumlu kamera mikrofon hub öner."
  * "2 günde gelsin, 2500 TL altında ev ofis ürünleri öner."
  * "₺3000 altında ev ofis setup kur."
* Bilinen kalan nokta:
  * Toplantı intent'i artık doğru yakalanıyor; ancak kamera/mikrofon/hub kompozisyonunun daha iyi kurulması Milestone 5.5B slot-based cart planning kapsamına bırakıldı.

### 5.5B Buyer Cart Planning Hardening

* Amaç:
  * Buyer Smart Cart önerilerini yalnızca skor sıralamasıyla değil, senaryoyu tamamlayan ürün rolleriyle kurmak.
* Yapılanlar:
  * `BuyerSmartCartItem` çıktısına `cartRoleKey` ve `cartRole` eklendi.
  * Intent config'lerine slot listeleri eklendi.
  * Ev-ofis sepeti: ergonomi, kontrol cihazı, aydınlatma, masa düzeni, konfor.
  * Kahve sepeti: demleme, hazırlık, servis/taşıma, kahve aksesuarı.
  * Hediye sepeti: ana hediye, hediye sunumu, tamamlayıcı hediye.
  * Spor sepeti: spor ses ürünü.
  * Meeting sepeti: görüntü, ses, bağlantı, konumlandırma.
  * Masa stili sepeti: masa yüzeyi, düzen, yazım/planlama, masa teknolojisi, dekor.
  * Slot adayları artık slot score, confidence, relevance ve price pressure ile seçilir.
  * Renk istenen komutlarda ürün rengi fuzzy match ile kontrol edilir.
  * Eksik zorunlu sepet rolleri varsa workflow warning döner.
* Doğrulanan davranış:
  * Ev-ofis komutu artık ergonomi + kontrol cihazı + aydınlatma + masa düzeni rolleriyle ürün seçer.
  * Kahve komutu pahalı tek ürün yerine demleme + hazırlık rolleriyle daha dengeli sepet kurar.
  * Meeting komutu kamera + mikrofon + hub + stand rolleriyle tam toplantı setup'ı kurar.
  * Siyah/gri masa komutu renk uyumu olmayan pastel ürünleri seçmez.
* Bilinen kalan nokta:
  * Bazı sepetlerde güven skorları uyarı yoğunluğuna bağlı olarak düşük görünebilir; bu bilinçli olarak riskleri saklamamak için bırakıldı.

### 5.5C Seller Workflow Output Hardening

* Amaç:
  * Seller Growth Actions çıktısını UI, API ve ileride LLM açıklama katmanı için daha kullanışlı ve parse gerektirmeyen bir contract'a çevirmek.
* Yapılanlar:
  * `SellerGrowthAction` içine kategori, aciliyet, etki seviyesi, efor seviyesi ve zaman ufku alanları eklendi.
  * Her aksiyon artık Türkçe label'lar taşır: `categoryLabel`, `urgencyLabel`, `impactLabel`, `effortLabel`, `timeHorizonLabel`.
  * Her aksiyona `expectedOutcome` eklendi; bu alan satıcıya aksiyonun beklenen iş sonucunu anlatır.
  * Her aksiyona `metricHighlights` eklendi; UI kartlarında gösterilebilecek 3-4 ana metrik ve tone bilgisi üretir.
  * Her aksiyona `todayChecklist` eklendi; satıcının bugün veya bu hafta yapacağı işi owner bilgisiyle parçalar.
  * `llmReadyContext.facts` yeni UI-ready alanlarla zenginleştirildi.
* Aciliyet yaklaşımı:
  * Stok açığı, kampanya riski, kârlılık baskısı ve acil yorum gibi risk aksiyonları kritik olabilir.
  * Bundle ve güçlü ürünü büyütme aksiyonları değerli olsa da kriz diliyle gösterilmez; en fazla yüksek aciliyet alır.
* Doğrulanan davranış:
  * `seller-commercepilot` için top 5 aksiyon yine üretiliyor.
  * Her aksiyon kategori, aciliyet, etki, efor, zaman ufku, metrik highlight, checklist ve LLM facts alanlarını eksiksiz taşıyor.
  * Örnek top 5: stok yenile, bundle oluştur, güçlü ürünü öne çıkar, kârlılığı koru, yorumları acil incele.
* Sınırlar:
  * Bu milestone UI, API route, LLM, Gemini/OpenAI veya LangChain içermez.
  * Checklist ve expected outcome deterministik metinlerdir; ileride LLM bu structured context üzerinden daha doğal açıklama üretebilir.

### 5.5D Validation/Test Hardening

* Amaç:
  * UI/API'ye geçmeden önce brain katmanındaki veri, scoring ve workflow contract kırılmalarını tek komutla görünür yapmak.
* Eklenen komutlar:
  * `npm run typecheck`: TypeScript no-emit kontrolü.
  * `npm run validate:workflows`: runtime workflow ve mock data validation.
  * `npm run check`: lint + typecheck + workflow validation.
* Validation kapsamı:
  * Mock data referans bütünlüğü: seller/product/buyer/review/order/cart/inventory/relation id bağlantıları.
  * Demo story flags: low stock, slow mover, negative review, bundle, strong product, listing issue, margin pressure ve return risk hikayelerinin veri içinde kalması.
  * Scoring layer: tüm ürünlerde 0-100 score, label, summary, drivers, evidence ve recommendedFocus contract'ı.
  * Product health workflow: KeyPro örneğinde top 3 insight ve LLM-ready context.
  * Seller workflow: `seller-commercepilot` top 5 aksiyon, priority sırası, UI-ready alanlar, metrik highlight, checklist, LLM facts ve büyüme aksiyonlarının kritik kriz gibi etiketlenmemesi.
  * Buyer workflow: 7 gerçekçi Türkçe prompt için intent, budget parser, delivery parser, required cart roles, color match, selected item evidence ve LLM-ready context.
* Sınırlar:
  * Yeni test framework veya paket kurulmadı.
  * Script Node üzerinden TypeScript dosyalarını runtime transpile ederek çalışır; gerçek unit test framework'ü ileride ihtiyaç olursa eklenebilir.

## 23) Milestone 6 UI Foundation Notları

### 6A Role Gateway + App Shell

* Amaç:
  * Brain katmanını gerçek demo uygulaması gibi gezilebilir bir UI omurgasına taşımak.
  * Buyer ve seller tarafını eş önemde, aynı ürün zekasının iki yüzü gibi göstermek.
* Tasarım yönü:
  * Tam Türkçe arayüz.
  * Premium dark intelligence dashboard: deep zinc/charcoal zemin, tek emerald accent, hairline divider, refraction glass panel.
  * Geist + Geist Mono font ailesi.
  * Mor/neon AI görünümü, emoji, fake KPI ve generic landing-page dili kullanılmadı.
* Eklenen route'lar:
  * `/`: rol seçimi gateway.
  * `/seller`: satıcı genel bakış.
  * `/seller/actions`: seller growth actions liste görünümü.
  * `/seller/products`: ürün radar listesi.
  * `/buyer`: buyer smart cart çalışma alanı.
  * `/buyer/products`: ürün keşfi omurga ekranı.
  * `/buyer/cart`: sepet taslağı omurga ekranı.
* Eklenen UI bileşenleri:
  * `RoleGateway`: rol seçimi ve ilk giriş ekranı.
  * `WorkspaceShell`: buyer/seller ortak navigasyon, role switch ve app shell.
* Eklenen bağımlılıklar:
  * `gsap`
  * `@gsap/react`
  * `@phosphor-icons/react`
* Sınırlar:
  * Bu milestone API route, gerçek form submit, LLM, LangChain veya auth içermez.
  * Buyer komut input'u şimdilik pasif demo yüzeyidir; Milestone 6C'de API ile canlı çalışacak.
  * Seller ekranları mevcut workflow çıktısını server component içinde okur; Milestone 6B'de API contract'a taşınacak.

### 6B Seller API Contract + Product Health Detail

* Amaç:
  * Seller ekranlarını UI içi doğrudan workflow bağımlılığından çıkarıp API contract odaklı hale getirmek.
  * Satıcı demo akışında ürün listesinden ürün sağlık detayına inilebilir bir drill-down kurmak.
* Eklenen API route'ları:
  * `GET /api/seller/overview`
  * `GET /api/seller/actions`
  * `GET /api/seller/products`
  * `GET /api/seller/products/[id]/health`
* Contract:
  * Tüm seller endpoint'leri `{ success, data, error }` envelope yapısını kullanır.
  * Demo seller sabit: `seller-commercepilot`.
  * UI ve route handler'lar `src/lib/api/seller.ts` içindeki typed builder'ları paylaşır.
* Eklenen UI:
  * `/seller`, `/seller/actions`, `/seller/products` seller API contract shape'ine taşındı.
  * `/seller/products/[slug]` ürün sağlık detay sayfası eklendi.
  * Ürün satırları okunabilir slug URL'lerine, detay ekranı stable product id endpoint'ine bağlanır.
  * Seller segment için loading/error state, ürün detay için loading/not-found state eklendi.
* Validation:
  * `scripts/validate-workflows.js` seller API contract shape, endpoint href, KeyPro product health ve evidence snapshot kontrolleriyle genişletildi.
  * Doğrulanan komutlar: `npm run check`, `npm run build`.
  * Runtime HTTP doğrulaması: overview/actions/products/product health endpoint'leri `success: true` döndü.
  * Browser doğrulaması: `/seller/products` ve `/seller/products/keypro-mekanik-klavye` yatay overflow olmadan açıldı; Playwright Chrome binary olmadığı için Puppeteer kullanıldı.
* Sınırlar:
  * Auth, DB, LLM, LangChain, mutation ve ürün düzenleme yok.
  * Server component'ler kendi route'larını HTTP ile fetch etmiyor; build güvenliği için route ve UI ortak builder contract'ını paylaşıyor.

### 6C Buyer Smart Cart API + Live Interaction

* Amaç:
  * Alıcı komutunu pasif demo metninden çıkarıp gerçek API route üzerinden çalışan smart cart deneyimine çevirmek.
  * Buyer tarafında doğal dil komut -> intent parse -> rol bazlı sepet -> uyarı/alternatif/tamamlayıcı/satıcı sinyali akışını UI'da canlı göstermek.
* Eklenen API route:
  * `GET /api/buyer/smart-cart`: örnek prompt'lar ve default sepet contract'ı döner.
  * `POST /api/buyer/smart-cart`: `{ prompt, buyerId, manualPreferences? }` alır ve `{ success, data, error }` envelope ile smart cart sonucu döner.
* Contract:
  * `src/lib/api/buyer.ts` içinde `BuyerSmartCartApiData`, request validation, örnek prompt'lar ve summary alanları eklendi.
  * Boş prompt `PROMPT_REQUIRED`, fazla uzun prompt `PROMPT_TOO_LONG`, invalid JSON `INVALID_JSON` error envelope döndürür.
* Eklenen UI:
  * `/buyer` artık `BuyerSmartCartWorkspace` client component'iyle canlı çalışır.
  * Komut textarea, buyer profile selector, preset prompt butonları, loading/error state ve API contract rail'i eklendi.
  * Sonuç bölümünde toplam fiyat, güven skoru, uyarı sayısı, satıcı sinyali, rol bazlı ürün satırları, uyarılar, alternatif/tamamlayıcı öneriler ve satıcıya dönen sinyaller gösterilir.
  * Buyer segment için loading/error state eklendi.
* Validation:
  * `scripts/validate-workflows.js` buyer API contract, default result, meeting setup, örnek prompt sayısı ve prompt validation kontrolleriyle genişletildi.
  * Doğrulanan komutlar: `npm run check`, `npm run build`.
  * Runtime HTTP doğrulaması: GET bootstrap, POST meeting setup ve boş prompt error envelope geçti.
  * Browser doğrulaması: `/buyer` açıldı; preset "Toplantı" gerçek API çağrısıyla camera/audio/connectivity rollerini döndürdü; mobilde yatay overflow yok.
* Sınırlar:
  * Auth, DB, LLM, LangChain, checkout, kalıcı sepet ve ürün satın alma mutation yok.
  * Buyer products ve cart route'ları hâlâ preview/omurga seviyesinde; canlı komut akışı `/buyer` üstünde kuruldu.

### 6D Buyer-to-Seller Signal Loop

* Amaç:
  * Buyer Smart Cart çıktısındaki `sellerSignalCandidates` alanını satıcı dashboard'unda görünür ve API-testable hale getirmek.
  * CommercePilot'un çift taraflı zekâ iddiasını demo akışında net göstermek: alıcı komutu -> sepet sonucu -> satıcı sinyali -> önerilen hamle.
* Eklenen API route:
  * `GET /api/seller/buyer-signals`: buyer örnek prompt'larını çalıştırır, seller'a ait ürünlerle eşleşen sinyalleri `{ success, data, error }` envelope içinde döner.
* Contract:
  * `src/lib/api/seller.ts` içinde `SellerBuyerSignalsApiData`, prompt snapshot, signal row, type coverage, affected product summary ve matched seller action alanları eklendi.
  * Contract kaynağı `buyer-smart-cart-workflow`; endpoint metadata'sı `GET /api/seller/buyer-signals`.
* Eklenen UI:
  * `/seller` genel bakışta buyer signal metriği ve API contract rail'inde buyer loop durumu eklendi.
  * Yeni buyer-to-seller loop bölümü prompt kaynakları, sinyal tipi coverage, öncelik skoru, etkilenmiş ürünler ve seller action hint'lerini gösterir.
  * Çok ürünlü sinyal satırlarında UI taşmasını önlemek için ilk 3 ürün gösterilir, kalan ürün sayısı özetlenir.
* Validation:
  * `scripts/validate-workflows.js` seller buyer signals contract, endpoint, prompt count, signal count, type coverage ve action hint kontrolleriyle genişletildi.
  * Doğrulanan komutlar: `npm run check`, `npm run build`.
  * Runtime HTTP doğrulaması: `/api/seller/buyer-signals` `success: true`, 15 sinyal, 5 prompt ve 18 etkilenmiş ürün döndürdü.
  * Browser doğrulaması: `/seller` desktop ve mobilde açıldı; buyer loop title/endpoint/sinyal listesi görünür, yatay overflow yok. Playwright Chrome binary olmadığı için Puppeteer kullanıldı.
* Sınırlar:
  * Auth, DB, LLM, LangChain, mutation veya gerçek buyer event persistence yok.
  * Seller actions workflow'u doğrudan buyer sinyalleriyle mutate edilmedi; 6D yalnızca deterministic aggregate/read contract ve dashboard görünürlüğü sağlar.

### 6E Seller Action Detail + Execution Preview

* Amaç:
  * Seller Growth Action listesindeki her aksiyonu detay sayfasına açıp "neden üretildi / ne yapılacak / hangi kanıta dayanıyor" sorularını tek ekranda cevaplamak.
  * Demo akışını tamamlamak: seller action -> action detail -> deterministic execution preview -> LLM-ready context.
* Eklenen API route:
  * `GET /api/seller/actions/[id]`: stable action id alır, action detail contract'ını `{ success, data, error }` envelope ile döner.
  * Geçersiz action id `SELLER_ACTION_DETAIL_NOT_FOUND` ile 404 döner.
* Contract:
  * `src/lib/api/seller.ts` içinde `SellerActionDetailApiData`, `SellerActionExecutionPreview`, generated drafts, evidence snapshot ve action detail endpoint metadata'sı eklendi.
  * Execution preview action type'a göre deterministik üretilir: restock, create_bundle, promote_winner, protect_margin, review_attention.
  * Related buyer signals, action product ids ve matched seller action bağlantılarıyla eşleşir.
* Eklenen UI:
  * `/seller/actions/[id]` detay sayfası eklendi.
  * Üst bölüm action title, contract rail, affected product ve metrik şeridini gösterir.
  * Orta bölüm execution preview adımları ve kanıt çizgisini gösterir.
  * Alt bölüm generated drafts, LLM-ready context, buyer bağlamı ve checklist gösterir.
  * `/seller`, `/seller/actions` ve `/seller/products/[slug]` içindeki related action linkleri action detail route'una bağlandı.
  * Action detail için loading ve not-found state eklendi.
* Validation:
  * `scripts/validate-workflows.js` action detail endpoint, action href, affected products, execution steps, generated drafts, evidence snapshot, missing id ve review action buyer signal eşleşmesi kontrolleriyle genişletildi.
  * Doğrulanan komutlar: `npm run check`, `npm run build`.
  * Runtime HTTP doğrulaması: `/api/seller/actions/restock-ergoflex-calisma-sandalyesi` `success: true`, 3 execution step ve 1 affected product döndürdü; missing action 404 döndü.
  * Browser doğrulaması: `/seller/actions/restock-ergoflex-calisma-sandalyesi` desktop ve mobilde açıldı; title, execution preview, endpoint ve LLM-ready context görünür, yatay overflow yok. `/seller/actions` içinde 5 detail link doğrulandı.
* Sınırlar:
  * Auth, DB, LLM, LangChain, mutation ve gerçek aksiyon tamamlama state'i yok.
  * Generated drafts deterministik taslaktır; model çağrısı veya gerçek kampanya/stok emri oluşturmaz.

### 7 OpenAI Seller Action Explanation

* Amaç:
  * Seller action detail ekranındaki deterministic context'i canlı LLM açıklamasına çevirmek.
  * Kullanıcının kararı gereği ilk aşamada Gemini yerine kesin olarak OpenAI `gpt-4o-mini` kullanmak.
* Eklenen API route:
  * `GET /api/seller/actions/[id]/explanation`: stable action id alır, runtime OpenAI explanation contract'ını `{ success, data, error }` envelope ile döner.
  * Geçersiz action id `SELLER_ACTION_EXPLANATION_NOT_FOUND` ile 404 döner.
* Contract:
  * `src/lib/llm/*` direct OpenAI Responses API `fetch` wrapper'ını ve deterministic fallback'i içerir.
  * `src/lib/api/seller-action-explanations.ts` model prompt/input, JSON parse, fallback body, source metadata ve `runtime-only` model call contract'ını üretir.
  * Model çıktısı `headline`, `summary`, `evidenceBullets`, `nextBestAction`, `sellerMessageDraft` alanlarına normalize edilir.
* Eklenen UI:
  * `/seller/actions/[id]` içinde client-side `SellerActionExplanationPanel` eklendi.
  * Panel loading, error/retry, generated/fallback state, model adı ve evidence summary gösterir.
* Validation:
  * `scripts/validate-workflows.js` explanation endpoint, default model, forced fallback, evidence bullets ve source endpoint kontrolleriyle genişletildi.
  * Doğrulanan komutlar: `npm run check`, `npm run build`.
  * Runtime HTTP doğrulaması: `/api/seller/actions/restock-ergoflex-calisma-sandalyesi/explanation` `provider: openai`, `model: gpt-4o-mini`, `status: generated` döndürdü.
  * Browser doğrulaması: `/seller/actions/restock-ergoflex-calisma-sandalyesi` desktop ve mobilde OpenAI paneli görünür, loading kapanır, `openai · gpt-4o-mini` etiketi görünür ve yatay overflow yok. Playwright Chrome binary olmadığı için Puppeteer kullanıldı.
* Sınırlar:
  * LLM şu anda yalnızca açıklama üretir; stok emri, kampanya, DB mutation veya gerçek agent tool call yapmaz.
  * Gemini provider implementasyonu sonraki adımdadır; mevcut contract provider swap için korunmalı.

### 8A Buyer Smart Cart Explanation + Product/Cart Preview Polish

* Amaç:
  * Buyer tarafında seller action explanation kadar net bir karar güveni katmanı göstermek.
  * Demo akışını buyer prompt -> sepet açıklaması -> ürün karar ekranı -> sepet karar özeti -> seller signal loop çizgisine bağlamak.
* Eklenen API route:
  * `POST /api/buyer/smart-cart/explanation`: smart cart request alır, aynı deterministic workflow'u kurar ve runtime OpenAI explanation contract'ını `{ success, data, error }` envelope ile döner.
  * Geçersiz prompt `PROMPT_REQUIRED` gibi mevcut buyer validation kodlarıyla 400 döner.
* Contract:
  * `src/lib/api/buyer-smart-cart-explanations.ts` model prompt/input, JSON parse, fallback body, source metadata ve `runtime-only` model call contract'ını üretir.
  * Model çıktısı `headline`, `summary`, `evidenceBullets`, `buyerDecision`, `riskNote`, `sellerSignalBridge`, `cartAdjustment` alanlarına normalize edilir.
  * No-budget guard: `hasRequestedBudget: false` context'i modele açık gönderilir; buna rağmen model olmayan bütçe iddiası yazarsa ilgili açıklama alanı deterministik fallback ile değiştirilir.
  * Validation canlı OpenAI çağırmaz; `forceFallback: true` ile deterministic fallback contract'ını doğrular.
* Eklenen UI:
  * `/buyer` içinde client-side OpenAI sepet açıklaması paneli eklendi; prompt değişince smart cart ve explanation birlikte yenilenir.
  * `/buyer/products` artık ürün karar ekranı: seçili ürün rolü, karar gerekçesi, teslimat, yorum, güven, satın alma uyarısı ve seller signal bölümleri gösterir.
  * `/buyer/cart` artık sepet karar özeti: rol bazlı ürün satırları, bütçe/güven metrikleri, alternatifler ve satıcı sinyalleri gösterir.
* Validation:
  * `scripts/validate-workflows.js` buyer explanation endpoint, forced fallback, default model, evidence bullets, seller signal source ve no-budget hallucination guard kontrolleriyle genişletildi.
  * Doğrulanan komutlar: `npm run check`, `npm run build`.
  * Runtime HTTP doğrulaması: 5 buyer örneğinin tamamında `/api/buyer/smart-cart/explanation` `provider: openai`, `model: gpt-4o-mini`, `status: generated` döndürdü; no-budget örneklerde yasaklı bütçe iddiası görülmedi, invalid prompt `PROMPT_REQUIRED` ile 400 döndü.
  * Browser doğrulaması: `/buyer`, `/buyer/products`, `/buyer/cart` mobilde açıldı; buyer explanation, product decision ve cart decision içerikleri görünür, temiz no-budget prompt submit sonrası explanation yenilenir ve yatay overflow yok. Playwright Chrome binary olmadığı için Puppeteer kullanıldı.
* Sınırlar:
  * Buyer explanation yalnızca açıklama üretir; gerçek ödeme, sepet persistence, kullanıcı auth veya agent tool call yapmaz.
  * Gemini provider implementasyonu sonraki adımdadır; buyer/seller explanation contract'ları provider swap sırasında korunmalı.

### 8B Marketplace + Agent Pet Roadmap

* Amaç:
  * CommercePilot'u premium dark dashboard hissinden çıkarıp light, klasik marketplace düzenine taşımak.
  * AI deneyimini sağ altta yaşayan, sürüklenebilir ve proactive konuşabilen agent pet etrafında ürünleştirmek.
* Roadmap dosyası:
  * `COMMERCEPILOT_AGENT_MARKETPLACE_ROADMAP.md`.
* Kilit kararlar:
  * Site adı `CommercePilot` kalır.
  * Dark theme ana deneyimden kalkar.
  * Buyer tarafı marketplace homepage, ürün detay, yorumlar ve cart mutation'larıyla ilerler.
  * Seller tarafı ayrı `/seller` alanında klasik satıcı paneli olarak kalır.
  * Agent pet küçük sağ alt chat paneli, büyütülmüş agent sayfası, proactive balonlar ve sürüklenebilir avatar davranışıyla tasarlanır.
  * Permission modeli `chat`, `suggest`, `assist`, `autopilot` olarak ayrılır.
  * OpenAI geçici kalır; LangChain doğrudan ilk adımda değil, typed internal tool registry oturduktan sonra adapter olarak değerlendirilir.
* Milestone sayısı:
  * 2026-05-15 revizyonuyla 8D sonrası milestone sırası endpoint bazlı yeniden düzenlendi.
  * 8D-8R: buyer/seller IA reset, ürün/sepet/agent/profil route'ları, seller endpoint'leri, permission ve demo hardening.
  * 9A: Gemini/provider finalization.
* Sonraki net adım:
  * 8D IA ve navigasyon reset: buyer header `Ürünler/Sepet/Agent/Profil`, seller sade header, sidebar menü tekrarı yok.

### 8C Light Marketplace Design System

* Amaç:
  * Dark dashboard ana deneyimini kaldırıp CommercePilot'u Trendyol/Hepsiburada gibi tanıdık ama kendi markasına ait light e-ticaret düzenine taşımak.
  * Agent pet ve sonraki marketplace sayfaları için header, search, nav, sidebar ve role switch omurgasını kurmak.
* Değişen UI:
  * Root gateway light role selection yüzeyine çevrildi; hero metni, search mock'u ve satıcı/alıcı kartları klasik marketplace tonuna alındı.
  * Buyer/seller shell light topbar, büyük search input, turuncu aksiyon rengi, yatay nav, desktop sidebar ve role toggle ile yeniden kuruldu.
  * Body artık `commerce-light` açık tema zeminini kullanır; ana accent orange, AI/agent accent ise yeşil destek rengi olarak ayrıldı.
* Geçici bridge:
  * `commerce-legacy-light` sadece workspace children wrapper'ında uygulanır.
  * Eski dark utility class'ları light panel, slate text, border ve orange accent diline çevrilir.
  * Bu bridge kalıcı design system değil; 8D/8E/8G sonrası sayfa içerikleri gerçek marketplace komponentlerine taşındıkça azaltılmalı.
* Validation:
  * Doğrulanan komutlar: `npm run check`, `npm run build`.
  * Puppeteer QA: `/`, `/buyer`, `/seller` desktop; `/` ve `/buyer` mobil screenshot alındı.
  * QA sonuçları: Eski `text-white` içerikler workspace içinde `rgb(17, 24, 39)` olarak render edildi; desktop ve 390px mobilde yatay page overflow görülmedi.
* Sınırlar:
  * 8C tam homepage/product card redesign değildir; IA/navigasyon reset 8D, buyer catalog 8E, buyer product detail + cart state 8F, buyer agent 8G ile devam edecek.

### 2026-05-15 Roadmap IA Revizyonu

* Amaç:
  * CommercePilot'u açıklama yoğun demo panelinden çıkarıp gerçek e-ticaret endpoint akışına oturtmak.
* Buyer kararları:
  * Header-only nav: `Ürünler`, `Sepet`, `Agent`, `Profil`.
  * `Ana sayfa` buyer menüsünden kalkar; `/buyer` ürünler deneyimine yönlenir veya aynı yüzeyi render eder.
  * Ürünler ekranı çok ürünlü katalog/grid olur; ürün kartları fotoğraf, fiyat, puan, teslimat/indirim sinyali ve sepete ekle aksiyonu taşır.
  * Ürün kartının görsel/başlık alanı `/buyer/products/[slug]` satış detayına gider; sepete ekleme yalnızca `Sepete Ekle` ile yapılır.
  * İlk kategori seti: `Kadın Giyim`, `Erkek Giyim`, `Elektronik`, `Ev & Yaşam`, `Kozmetik`, `Spor`, `Aksesuar`.
  * Ürün detay ekranı referans görseldeki gibi ürün görsel galerisi, puan, fiyat, kampanya, satıcı, teslimat ve özellik alanlarıyla satış penceresi olmalıdır.
  * Cart boşken uzun açıklama göstermez; doluyken ürün satırları, adet, toplam ve checkout mock gösterir.
  * Cart state ilk fazda `localStorage` ile korunur.
  * `/buyer/agent` ChatGPT benzeri çalışır; kullanıcı prompt'unu yalnızca mevcut katalog ürünlerinden görselli ürün önerisine çevirir.
  * Agent onay sonrası mevcut sepete ekleyebilir veya kullanıcı seçerse sepeti öneriyle değiştirebilir.
  * `/buyer/profile` serbest metin + chip/checkbox agent kişiselleştirme tercihlerini ve kullanıcı yorumlarını taşır.
* Seller kararları:
  * Seller nav sadeleşir: `Ana Sayfa`, `Ürünler`, `Aksiyonlar`, `Agent`, `Profil`.
  * Overview tek uzun sayfa olmaz; `Satılmayan ürünler`, `Negatif yorumlar`, `İade riski`, `Stok riski` uyarıları kısa kartlardan route'lara gider.
  * Ürünler fotoğraflı listelenir.
  * Aksiyonlar alt kategori endpoint'lerine bölünür.
  * `/seller/agent` derin açıklama/analiz/mutation önerisi katmanı olur; mutation önce/sonra preview ve satıcı onayı olmadan uygulanmaz.
  * `/seller/profile` mağaza profili ve agent yetki ayarlarını taşır.
* Görsel kararı:
  * Ürün görselleri 8E veya sonrasında kontrollü mock/generated görsel setiyle üretilebilir.
* Floating Agent kararı:
  * Sağ alttaki ikon ayrı müşteri temsilcisi değildir; `/buyer/agent` ve `/seller/agent` ile aynı runtime/history kullanan kompakt Agent UI'dır.
  * Tüm buyer/seller sayfalarında görünebilir.
  * Mini panel Agent sayfasına taşımadan ürün önerisi, sepet apply, seller analiz ve seller mutation preview yapabilir.
  * Bulunduğu sayfa bağlamını bilir ve gerektiğinde ses kullanmadan badge/ünlem/kafa kaldırma gibi mikro etkileşimle dikkat çeker.
  * Kullanıcı kontrolleri: `Gizle`, `Sessize al`, `Bu sayfada uyarma`.
  * İlk faz web/desktop odaklıdır; ilk avatar Codex pet benzeri teknik/sevimli avatar olabilir.
* Güncellenen roadmap dosyası:
  * `COMMERCEPILOT_AGENT_MARKETPLACE_ROADMAP.md`.

### Güncelleme Kaydı

* Son güncelleme: 2026-05-16

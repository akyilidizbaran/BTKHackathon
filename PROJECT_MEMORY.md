# PROJECT_MEMORY

## 0) TL;DR (En güncel durum)

* Şu an ne yapıyoruz?
  * CommercePilot için Milestone 8A Buyer Smart Cart Explanation + Product/Cart Preview Polish tamamlandı.
* Son değişiklik neydi?
  * `POST /api/buyer/smart-cart/explanation`, buyer explanation UI paneli, ürün karar ekranı ve sepet karar özeti güçlendirildi; 8A QA sırasında no-budget LLM guard eklendi.
* Bir sonraki net adım ne?
  * Milestone 8A review sonrası end-to-end demo script/presentation readiness veya Gemini provider swap kapsamını netleştirmek.

## 1) Proje Amacı ve Kapsam

* Amaç:
  * CommercePilot, alıcı ihtiyaçlarını ve satıcı verilerini birleştiren çift taraflı bir e-ticaret zekası platformudur. İlk MVP'de satıcı tarafı daha güçlü konumlanacak; amaç satıcıya yalnızca veri göstermek değil, stok, satış, yorum ve ürün kalitesi sinyallerinden aksiyon önermektir.
* Kapsam içi:
  * Satıcı paneli, ürün yönetimi, stok takibi, satış performansı, yorum içgörüleri, ürün sağlık skoru, listeleme kalitesi ve büyüme aksiyonları.
  * Alıcı tarafı daha sonra ürün keşfi, akıllı sepet ve doğal dil alışveriş akışlarıyla ele alınacak.
  * İlk aşamada mock/kurgu veri kullanılacak; veriler rastgele değil, demo hikayesi taşıyacak şekilde tasarlanacak.
* Kapsam dışı:
  * İlk fazda gerçek ödeme, gerçek kimlik doğrulama, gerçek veritabanı, kargo/lojistik ve scraping yok.

## 2) Non-negotiables / Kırmızı Çizgiler

* Demo odaklı ilerle: 7 günlük hackathon için en güçlü ve anlaşılır akışlar seçilecek.
* Satıcı tarafı alıcı tarafına göre biraz daha öncelikli olacak.
* AI/LLM çıktıları kör şekilde kullanılmayacak; önce deterministik veri analizi yapılacak, LLM yalnızca açıklama, özetleme ve metin üretme katmanında kullanılacak.
* Mock data rastgele olmayacak; her ürün net bir demo problemine hizmet edecek.
* İlk kurulumda overengineering yapılmayacak; gerçek auth/database/payment ertelenecek.
* UI içinde Gemini çalışıyormuş gibi sahte davranılmayacak; Phase 1'de AI-ready alanlar açıkça deterministik/mock insight olarak gösterilecek.

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
  * Planlanan sonraki yapı: lib/agents, lib/gemini, app, components.

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
* [ ] Milestone 8A review sonrası end-to-end demo script/presentation readiness kapsamını netleştir.
* [ ] Gemini provider swap için mevcut seller/buyer explanation contract'ını koruyacak adapter tasarımını netleştir.
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
* Buyer explanation no-budget guard: kullanıcı bütçe belirtmediyse model `bütçeniz`, `%5 tolerans`, `bütçe içinde/altında` gibi iddiaları UI contract'ına geçirmemeli; bu kontrol `scripts/validate-workflows.js` içinde sentetik model çıktısıyla korunur.
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

### Güncelleme Kaydı

* Son güncelleme: 2026-05-14

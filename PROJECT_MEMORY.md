# PROJECT_MEMORY

## 0) TL;DR (En güncel durum)

* Şu an ne yapıyoruz?
  * CommercePilot için Milestone 5.5A Buyer Parser + Intent Hardening tamamlandı.
* Son değişiklik neydi?
  * Buyer bütçe parser'ı Türkçe fiyat formatlarına dayanıklı hale getirildi; `meeting_setup` intent'i ve `maxDeliveryDays` desteği eklendi.
* Bir sonraki net adım ne?
  * Milestone 5.5B ile buyer sepet planlamasını slot bazlı hale getirip sepet kompozisyonunu güçlendirmek.

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
  * Planlanan sonraki yapı: lib/agents, lib/gemini, app, components.

## 4) Konvansiyonlar ve Standartlar

* Kod stili / lint / format:
  * Next.js App Router + TypeScript + Tailwind CSS kullanılıyor.
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
  * `npm run build`
* Ortam değişkenleri (sadece İSİMLER):
  * LLM_PROVIDER
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

## 7) Milestones / Dönüm Noktaları (append-only)

* 2026-05-12 — Milestone: Ürün yönü netleşti. | Sonuç: Satıcı öncelikli, demo odaklı, AI-ready çift taraflı commerce intelligence yaklaşımı benimsendi.
* 2026-05-13 — Milestone: Milestone 0 proje zemini kuruldu. | Sonuç: Next.js + TypeScript + Tailwind scaffold, README, `.env.example`, lint/build doğrulaması ve GitHub push hazırlığı tamamlandı.
* 2026-05-13 — Milestone: Milestone 1 curated commerce dataset kuruldu. | Sonuç: Türkçe domain tipleri ve curated mock data eklendi; referans bütünlüğü, lint, TypeScript ve build doğrulandı.
* 2026-05-13 — Milestone: Milestone 2 data access layer kuruldu. | Sonuç: UI/API/workflow katmanlarının mock dataya kontrollü erişmesi için read/query helper'ları eklendi; lint, TypeScript ve build doğrulandı.
* 2026-05-13 — Milestone: Milestone 3 açıklanabilir scoring layer kuruldu. | Sonuç: Ürün bazlı skorlar yalnızca sayı değil, drivers/evidence/summary/recommendedFocus içeren LLM-ready açıklanabilir karar sinyalleri olarak üretildi.
* 2026-05-13 — Milestone: Milestone 4 seller workflow layer kuruldu. | Sonuç: Seller Growth Actions ve Product Health workflow'ları eklendi; lint, TypeScript, build ve runtime workflow doğrulaması geçti.
* 2026-05-13 — Milestone: Milestone 5 buyer smart cart workflow layer kuruldu. | Sonuç: 5 buyer demo senaryosu, %5 bütçe toleransı, buyer personalization, alternatif/tamamlayıcı öneri ve seller signal adayları eklendi; lint, TypeScript, build ve runtime workflow doğrulaması geçti.
* 2026-05-13 — Milestone: Milestone 5.5A Buyer Parser + Intent Hardening tamamlandı. | Sonuç: `3.000 TL`, `1.500 TL`, `₺3000`, `3 bin TL` bütçe formatları doğrulandı; `meeting_setup` ve `maxDeliveryDays` workflow'a bağlandı; lint, TypeScript, build ve runtime prompt doğrulaması geçti.

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
* [ ] Milestone 5.5B buyer cart planning hardening uygula.
* [ ] Milestone 5.5C seller workflow output hardening uygula.
* [ ] Milestone 5.5D validation/test hardening uygula.
* [ ] Brain hardening bittikten sonra UI/API kapsamını netleştir.
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

## 11) Notlar ve Tuzaklar (Pitfalls)

* Satıcı panelinin ana vaadi "veri göstermek" değil, "veriden aksiyon çıkarmak" olmalı.
* Seller Growth Actions mümkün olduğunca az ama güçlü aksiyon göstermeli; uzun ve dağınık liste olmamalı.
* Her aksiyonun arkasında görünür bir sebep olmalı: stok, satış, yorum, listeleme kalitesi veya ürün ilişkisi.
* Buyer tarafı ilk MVP'de daha sade kalabilir ama sistemin çift taraflı olduğunu gösterecek kadar var olmalı.
* LLM sadece son karar verici gibi konumlanmamalı; karar sinyalleri önce sistem tarafından hesaplanmalı.

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

### Güncelleme Kaydı

* Son güncelleme: 2026-05-13

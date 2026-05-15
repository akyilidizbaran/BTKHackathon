# COMMERCEPILOT_AGENT_MARKETPLACE_ROADMAP

## 0) Durum

* Son güncelleme: 2026-05-15
* Roadmap kararı:
  * CommercePilot önce gerçek bir e-ticaret ürünü gibi davranacak.
  * Agent deneyimi açıklama dashboard'u değil, alışveriş ve satıcı paneli üzerinde aksiyon alan sohbet/yardımcı katmanı olacak.
  * Uygulama artık endpoint endpoint ilerleyecek; her route kendi net işlevine sahip olacak.
* Planlanan kapsam:
  * 8B, 8C, 8D ve 8E tamamlandı.
  * Sıradaki net adım 8F: ürün detay/satış penceresini derinleştirmek ve `localStorage` sepet state'ini çalışır hale getirmek.
  * 8F sonrası milestone sırası revize edilebilir; milestone sayısı uygulama sırasında azaltılıp artırılabilir.

## 1) Kilit Ürün Kararları

* Site adı `CommercePilot` kalacak.
* Dark theme ana deneyimden kalktı; light klasik e-ticaret dili ana yön.
* Trendyol/Hepsiburada birebir kopyalanmayacak; kullanıcıya tanıdık gelen şu kalıplar kullanılacak:
  * Üst header.
  * Search.
  * Kategori sekmeleri veya kategori şeritleri.
  * Ürün grid/list.
  * Sepet.
  * Profil.
  * Satıcı merkezi.
* Alıcı tarafında header ve sol sidebar aynı navigasyonu tekrar etmeyecek.
* Alıcı ana navigasyonu yalnızca header'da olacak:
  * `Ürünler`
  * `Sepet`
  * `Agent`
  * `Profil`
* Alıcı tarafında `Ana sayfa` ayrı bir menü olmayacak.
  * `/buyer` route'u ürünler endpoint'ine yönlenebilir veya ürünler yüzeyini render edebilir.
* Satıcı tarafında da header/sidebar tekrarından kaçınılacak.
  * Satıcıda `Ana Sayfa` olabilir; çünkü overview satıcı panelinde anlamlı.
  * Satıcı ana navigasyonu sade kalacak: `Ana Sayfa`, `Ürünler`, `Aksiyonlar`, `Agent`, `Profil`.
* Uzun açıklama blokları ana ekranlara doldurulmayacak.
  * UI önce ürün, fiyat, stok, sepet, iade, yorum, uyarı ve aksiyon kartlarını gösterecek.
  * Derin açıklamayı agent verecek.
* Buyer sepet ekranı boşken veya kullanıcı ürün eklememişken jüri sunumu gibi uzun açıklama göstermeyecek.
  * Boş sepet: kısa empty state + Agent ile sepet oluştur CTA.
  * Dolu sepet: ürün satırları, adet, fiyat, toplam, sil/artır/azalt, checkout mock.
* Buyer ürün kartları gerçek e-ticaret kartı gibi davranacak.
  * Ürün görseli, ad, fiyat, puan, yorum sayısı, satıcı, teslimat/indirim badge'i.
  * Ana aksiyon: sepete ekle.
  * Kart görseli/başlığı/tıklanabilir alanı ürün satış detay penceresine gider.
  * Her ürünün kendi dynamic endpoint'i olacak: `/buyer/products/[slug]`.
  * Kataloğa yeni ürün eklendiğinde slug üzerinden otomatik ürün detay route'u açılır.
* Buyer ürün detay sayfası ekteki referans gibi ürün satış penceresi olacak.
  * Sol tarafta büyük ürün görsel alanı ve thumbnail şeridi.
  * Orta alanda kategori badge'i, ürün adı, puan, yorum/soru sayısı, fiyat, `Şimdi Al`, `Sepete Ekle`, favori, teslimat ve öne çıkan özellikler.
  * Sağ alanda kampanyalar, satıcı kartı, mağazaya git ve koleksiyona ekle alanları.
  * Aşağıda açıklama, yorumlar, soru-cevap ve benzer ürünler daha sonra eklenebilir.
* Buyer kategori seti ilk fazda:
  * `Kadın Giyim`
  * `Erkek Giyim`
  * `Elektronik`
  * `Ev & Yaşam`
  * `Kozmetik`
  * `Spor`
  * `Aksesuar`
* Buyer Agent ChatGPT benzeri bir sohbet alanı olacak.
  * Kullanıcı örnek komut: `3000 TL altı limitli old-money kazak ve pantolon getir`.
  * Agent yalnızca katalogdaki mevcut ürünlerden seçim yapacak; katalogda yoksa ürün uydurmayacak.
  * Eksik kategori/ürün ihtiyacı varsa katalog Milestone 8E veya sonrasında büyütülecek.
  * Agent ürünleri görselleştirip chat içinde listeleyecek.
  * Sonra izin soracak: `Bunları sepete ekleyeyim mi?`
  * Kullanıcı onaylarsa sepet state'i değişecek.
  * Varsayılan davranış mevcut sepete eklemek olacak; agent ayrıca `mevcut sepeti bununla değiştir` seçeneği sunabilir.
* Floating Agent mini paneli ayrı bir müşteri temsilcisi widget'ı olmayacak.
  * `/buyer/agent` ve `/seller/agent` ekranındaki aynı Agent runtime'ın kompakt hali olacak.
  * Buyer ve seller tarafındaki her sayfada görünebilir.
  * Kullanıcı sağ alttaki ikona basınca sohbet baloncuğu/panel açılır ve Agent ekranında yapılabilen işleri aynı panelde yapabilir.
  * Agent ekranına taşıma zorunlu olmayacak; mini panel ürün önerisi, sepet mutation, seller analiz ve seller before/after preview gibi işleri panel içinde yapabilir.
  * Konuşma geçmişi route Agent sayfası ile floating panel arasında ortak kalacak.
  * Agent bulunduğu sayfanın bağlamını bilecek: buyer ürün, ürün detay, sepet, profil; seller overview, ürünler, aksiyonlar, profil.
  * Agent uyarı vermek isterse ikon pasif kalmayacak; ses olmadan küçük badge, ünlem, kafa kaldırma veya benzeri dikkat animasyonu gösterecek.
  * Kullanıcı ikona bastığında Agent o anki bağlamı yorumlayabilir.
  * `Gizle`, `Sessize al`, `Bu sayfada uyarma` kontrolleri olacak.
  * Mini panelde yapılan tüm mutation'lar aynı permission/onay kurallarına tabi olacak.
  * İlk uygulama web/desktop odaklı olacak; mobil davranış bu adımda öncelik değil.
  * İlk avatar Codex pet benzeri teknik/sevimli avatar olacak, sonra değiştirilebilir.
* Buyer cart state ilk fazda `localStorage` ile korunacak.
  * Sayfa değişiminde veya reload sonrası sepet kaybolmayacak.
* Buyer Profil, agent kişiselleştirme merkezi olacak.
  * Kullanıcı kendi isteklerini, stil tercihlerini, hassasiyetlerini ve beklentilerini yazabilecek.
  * Profil serbest metin ve chip/checkbox tercihleriyle tutulacak.
  * Örnek chip'ler: hızlı kargo, kolay iade, old-money stil, premium kalite, sentetik kumaş istemem, bütçe hassasiyeti.
  * Kullanıcının ürün yorumları burada sergilenecek.
  * Bu veriler agent önerilerini/fine-tune hissini besleyen profil sinyalleri olarak kullanılacak.
* Seller overview tek uzun sayfa olmayacak.
  * Genel bakışta dağılımlar ve 4 ana uyarı kartı olacak: `Satılmayan ürünler`, `Negatif yorumlar`, `İade riski`, `Stok riski`.
  * Her uyarı kendi endpoint'ine götürecek.
* Seller aksiyonları alt başlıklara ayrılacak.
  * Satılmayan ürünler.
  * İade/şikayet riski.
  * Negatif yorumlar.
  * Stok riski.
  * Listeleme iyileştirme.
  * Bundle/kampanya fırsatları.
* Seller ürünleri fotoğraflı ürün listesi/grid'i olarak görünecek.
* Seller Agent, satıcıya açıklama ve aksiyon önerisi veren ana derinleşme katmanı olacak.
* Seller mutation hemen ürüne yansımayacak.
  * Agent önce satıcıya `önce/sonra` preview gösterecek.
  * Satıcı onaylarsa değişiklik mock ürün state'ine uygulanacak.
  * Uygulanan değişiklik audit log'a yazılacak.
* Seller Profil, mağaza ayarları, agent yetki tercihleri ve satıcı profil bilgilerini tutacak.
* Ürün görselleri 8E veya sonrasında kontrollü mock/generated görsel setiyle üretilebilir.

## 2) Endpoint Haritası

### Buyer Routes

* `/buyer`
  * Varsayılan olarak `/buyer/products` deneyimine yönlenir veya aynı ürünler ekranını render eder.
* `/buyer/products`
  * Normal alıcıların gezeceği ana ürün/kategori yüzeyi.
  * Header search, kategori şeridi, kampanya/öneri bölümü, ürün grid/list içerir.
* `/buyer/products/[slug]`
  * Ürün satış detay penceresi.
  * Görsel galeri, ürün adı, puan, yorum/soru sayısı, fiyat, kampanya, satıcı, teslimat, özellikler, `Şimdi Al`, `Sepete Ekle` ve favori aksiyonlarını içerir.
  * Katalogdaki her ürün slug ile bu route'ta açılır; yeni ürün eklendiğinde dynamic endpoint otomatik oluşur.
* `/buyer/cart`
  * Gerçek sepet state'i.
  * Ürün yoksa kısa empty state.
  * Ürün varsa satır satır ürünler, toplam, adet kontrolleri ve checkout mock.
* `/buyer/agent`
  * ChatGPT benzeri alıcı agent sohbeti.
  * Ürün kartları chat içinde görselleşir.
  * Onay sonrası sepet mutation yapar.
* `/buyer/profile`
  * Alıcı tercihleri, stil/kalite/kargo hassasiyetleri, agent kişiselleştirme metni ve kullanıcının yorumları.

### Buyer API / State

* `GET /api/buyer/catalog`
  * Ürün listesi, kategori, fiyat, görsel, puan, yorum sayısı, satıcı, teslimat ve badge metadata.
* `GET /api/buyer/products/[id]`
  * Ürün satış detay contract'ı: galeri, kampanya, satıcı, özellik, açıklama, yorum ve soru-cevap metadata.
* `GET /api/buyer/cart`
  * Mevcut sepet; ilk fazda client `localStorage` ile korunur.
* `POST /api/buyer/cart/items`
  * Ürün sepete ekler.
* `PATCH /api/buyer/cart/items/[id]`
  * Adet günceller.
* `DELETE /api/buyer/cart/items/[id]`
  * Ürünü sepetten çıkarır.
* `POST /api/buyer/agent`
  * Chat mesajı alır, yalnızca katalogdaki mevcut ürünlerden öneri/cevap/sepete ekleme isteği döner.
* `POST /api/buyer/agent/apply`
  * Kullanıcı onayından sonra agent'ın önerdiği sepet mutation'ını uygular.
  * Desteklenen stratejiler: mevcut sepete ekle, mevcut sepeti öneriyle değiştir.
* `GET /api/buyer/profile`
  * Tercih ve yorumları döner.
* `PATCH /api/buyer/profile`
  * Agent kişiselleştirme tercihlerini günceller.

### Seller Routes

* `/seller`
  * Satıcı ana sayfa/genel bakış.
  * Uzun açıklama değil; kısa KPI, dağılım, uyarı ve endpoint linkleri.
* `/seller/products`
  * Fotoğraflı ürün listesi/grid'i.
  * Stok, satış, fiyat, puan, iade/yorum sinyali.
* `/seller/products/[slug]`
  * Ürün yönetim detayı.
  * Kısa ürün bilgisi, performans, yorum/iade uyarısı, agent ile analiz et CTA.
* `/seller/actions`
  * Aksiyon merkezi.
  * Alt başlıklar: satılmayan ürünler, negatif yorumlar, iade riski, stok, listeleme, kampanya.
* `/seller/actions/[category]`
  * Seçilen aksiyon kategorisinin listesi.
* `/seller/returns`
  * İade edilen veya iade riski yüksek ürünler.
* `/seller/reviews/negative`
  * Negatif yorum ve tekrar eden şikayet temaları.
* `/seller/agent`
  * Satıcı agent sohbeti.
  * `Satılmayan ürünlerimi sırala`, `Neden satılmadı`, `Düzenlemeyi uygula` akışları.
* `/seller/profile`
  * Mağaza profili, agent yetki seviyesi, satıcı ayarları.

### Seller API / State

* `GET /api/seller/overview`
  * Kısa overview KPI ve uyarı kartları.
* `GET /api/seller/products`
  * Fotoğraflı ürün yönetim listesi.
* `GET /api/seller/products/[id]`
  * Ürün yönetim detayı.
* `PATCH /api/seller/products/[id]`
  * Satıcı onayından sonra mock listing mutation uygular.
* `GET /api/seller/actions`
  * Aksiyon kategorileri ve kısa listeler.
* `GET /api/seller/actions/[category]`
  * Kategori bazlı aksiyon listesi.
* `GET /api/seller/returns`
  * İade analizi.
* `GET /api/seller/reviews/negative`
  * Negatif yorum analizi.
* `POST /api/seller/agent`
  * Satıcı agent mesaj/analiz/tool önerisi.
  * Listing değişikliği gerekiyorsa doğrudan uygulamaz; önce `before/after` preview döner.
* `POST /api/seller/agent/apply`
  * Kullanıcı onayıyla preview edilen mock ürün/listing mutation'ını uygular.
* `GET /api/seller/profile`
  * Mağaza ve agent permission ayarları.
* `PATCH /api/seller/profile`
  * Profil/permission ayarlarını günceller.

## 3) Buyer Deneyim Kuralları

* Buyer ekranı jüriye açıklama anlatan dashboard gibi olmayacak.
* Ürünler sayfası normal alışveriş yapan kullanıcının ana alanı olacak.
* Ürünleri listele:
  * Kategori şeridi: `Kadın Giyim`, `Erkek Giyim`, `Elektronik`, `Ev & Yaşam`, `Kozmetik`, `Spor`, `Aksesuar`.
  * Kampanya/öneri chip'leri.
  * Çok ürünlü grid.
  * Sepete ekle butonu.
  * Favori ikonu opsiyonel.
  * Kısa teslimat/indirim/puan sinyali.
  * Kartın ürün görseli/başlık alanı ürün detayına gider; sepete ekleme yalnızca `Sepete Ekle` aksiyonuyla yapılır.
* Ürün detay:
  * Referans alınan satış penceresi yapısı kullanılacak.
  * Ürün görsel galerisi, fiyat, puan, kampanya, satıcı, teslimat, özellik kartları ve satın alma aksiyonları aynı ekranda okunur olmalı.
* Sepet:
  * Boşken kısa ve sakin.
  * Doluyken ürün odaklı.
  * Agent yalnızca sepet iyileştirme veya kullanıcı komutu sonrası görünür şekilde devreye girer.
  * İlk fazda `localStorage` ile route değişimlerinde ve reload sonrasında korunur.
* Agent:
  * Ayrı `/buyer/agent` sayfasında büyük chat deneyimi.
  * Sağ alt pet/chat sonra eklenebilir ama core akış önce endpoint sayfasında kurulacak.
  * Agent önerdiği ürünleri küçük ürün kartlarıyla gösterir.
  * Agent yalnızca katalogdaki ürünleri önerebilir; ürün uydurmaz.
  * Sepete ekleme için açık onay ister.
  * Onay ekranında `sepete ekle` ve gerektiğinde `sepeti değiştir` stratejileri desteklenir.
* Profil:
  * `Agent beni nasıl tanısın?` alanı.
  * Serbest metin + chip/checkbox tercihleri.
  * Stil/kalite/bütçe/kargo/iade hassasiyetleri.
  * Kullanıcı yorumları.

## 4) Seller Deneyim Kuralları

* Seller ekranı tek uzun açıklama sayfası olmayacak.
* Overview:
  * Kısa KPI.
  * Ürün dağılımları.
  * 4 ana uyarı kartı: `Satılmayan ürünler`, `Negatif yorumlar`, `İade riski`, `Stok riski`.
  * Her uyarı kendi route'una gider.
* Ürünler:
  * Ürün fotoğrafı şart.
  * Stok, fiyat, satış, yorum puanı, iade sinyali gibi ticari alanlar gösterilir.
* Aksiyonlar:
  * Alt başlıklar halinde gezilir.
  * Her aksiyon kartı kısa olur.
  * Derin sebep/açıklama agent tarafından verilir.
* Agent:
  * Satıcı agent sohbeti ayrı sayfada çalışır.
  * Ürünleri satılmama oranı ve sebebine göre sıralayabilir.
  * Ürün detail bağlamında değişiklik önerir.
  * Değişiklikleri önce/sonra preview olarak gösterir.
  * Satıcı onaylarsa mock mutation yapar ve audit log'a yazar.
* Profil:
  * Mağaza bilgileri.
  * Agent yetki modu.
  * Bildirim/öncelik tercihleri.

## 5) Agent Permission Model

* `chat`
  * Sadece konuşur, state değiştirmez.
* `suggest`
  * Ürün/sepet/listing önerisi üretir, değişiklik yapmaz.
* `assist`
  * Sepet veya ürün düzenleme taslağı hazırlar, kullanıcı onayı bekler.
* `autopilot`
  * Kullanıcı tam yetki verirse mock state üzerinde gerçek değişiklik uygular ve ne yaptığını raporlar.

## 6) Teknik Yön

* Agent UI:
  * Önce route tabanlı agent sayfaları kurulacak: `/buyer/agent`, `/seller/agent`.
  * Sonra sağ alt floating Agent mini paneli eklenecek.
  * Floating Agent ayrı bir widget runtime'ı değil, route Agent ekranlarının kompakt UI varyantı olacak.
  * Floating panel tüm buyer/seller sayfalarında görünebilir ve aynı konuşma geçmişini kullanır.
  * Floating panel agent'ın tüm temel işlerini yapabilir: ürün önerisi, sepet apply, seller analiz, seller before/after mutation preview.
  * Floating Agent bulunduğu sayfanın context'ini runtime'a taşır.
  * Proactive uyarı sinyali ses kullanmaz; badge/ünlem/kafa kaldırma gibi görsel mikro etkileşim kullanır.
  * Kullanıcı kontrolleri: `Gizle`, `Sessize al`, `Bu sayfada uyarma`.
  * İlk sürüm web/desktop odaklıdır; mobil bottom sheet davranışı bu fazın kapsamı değildir.
  * Floating pet eklendiğinde header navigasyonunu veya ürün/sepet akışını gölgelemeyecek.
* Agent runtime:
  * Promptlar merkezi tutulacak: `src/lib/agents/prompts/*`.
  * Tool contract'ları merkezi tutulacak: `src/lib/agents/tools/*`.
  * Runtime orchestration merkezi tutulacak: `src/lib/agents/runtime/*`.
  * İlk aşamada typed internal tool runner kullanılacak.
  * LangChain daha sonra tool orchestration adapter olarak bağlanacak.
* Cart/listing state:
  * İlk fazda gerçek DB yok.
  * Buyer cart state `localStorage` ile korunacak.
  * Seller mutation önce preview/draft olarak üretilecek; satıcı onayından sonra app içi mock state ve audit log üzerinde uygulanacak.
* Görseller:
  * 8E'de kontrollü mock/generated ürün görsel seti tek sprite olarak başlatıldı.
  * Ürün görselleri marketplace hissi için kritik kabul edilir; sprite yeterli kalmazsa ürün bazlı görsel seti sonraki milestone'larda genişletilebilir.
* Provider:
  * Şimdilik OpenAI kalacak.
  * `LLM_PROVIDER` provider seçim noktası olarak korunacak.
  * Gemini final provider swap Milestone 9A kapsamına alınacak.

## 7) Revize Milestone Planı

| Milestone | Ad | Amaç | Çıkış Kriteri |
| --- | --- | --- | --- |
| 8B | Roadmap ve ürün pivot kilidi | Light marketplace + agent pet yönünü sabitlemek | Kararlar ve ilk milestone planı yazılı |
| 8C | Light marketplace shell | Dark tema yerine light e-ticaret shell'i kurmak | Root, buyer/seller shell light çalışır |
| 8D | IA ve navigasyon reset | Buyer/seller header/sidebar tekrarını kaldırmak, endpoint haritasını uygulamaya hazırlamak | Buyer header `Ürünler/Sepet/Agent/Profil`; seller header sade; sidebar tekrarı yok |
| 8E | Buyer catalog data + ürün grid | Çok ürünlü klasik e-ticaret ürünler ekranı kurmak | Tamamlandı: 7 görselli kategori, kampanya chip'leri, `GET /api/buyer/catalog`, 48 fotoğraflı ürün kartı ve görünür sepete ekle aksiyonu |
| 8F | Buyer product detail + cart state | Ürün satış detay penceresi ve sepeti gerçek etkileşimli hale getirmek | `/buyer/products/[slug]` dynamic detail, ürün ekle/sil/adet/toplam ve `localStorage` sepet state'i çalışır |
| 8G | Buyer agent page | ChatGPT benzeri alıcı agent sayfasını kurmak | Prompt -> görselli ürün önerisi -> onay sorusu akışı çalışır |
| 8H | Buyer profile | Agent kişiselleştirme ve kullanıcı yorumları sayfasını kurmak | Tercihler ve yorumlar profil ekranında görünür/güncellenir |
| 8I | Seller IA + overview endpoints | Satıcı ana sayfayı kısa uyarı kartları ve endpoint linkleriyle kurmak | Dağılım, iade, negatif yorum, stok ve satılmayan ürün uyarıları route'lara bağlanır |
| 8J | Seller products | Fotoğraflı satıcı ürün yönetimi ekranı | Ürünler fotoğraf, stok, satış, fiyat, yorum ve risk sinyaliyle listelenir |
| 8K | Seller actions by category | Aksiyonları alt başlık endpoint'lerine bölmek | `/seller/actions/[category]` listeleri çalışır |
| 8L | Seller agent page | Satıcı agent sohbet ve analiz yüzeyini kurmak | Satılmayan ürün sıralama, sebep analizi ve öneri akışı çalışır |
| 8M | Seller profile + permissions | Mağaza profili ve agent yetki ayarları | Profil, yetki modu ve bildirim tercihleri görünür/güncellenir |
| 8N | Shared agent runtime | Buyer/seller agent prompt ve tool registry ortaklaştırmak | Agent request contract, prompt registry ve typed tool registry oluşur |
| 8O | Buyer agent cart mutations | Agent'ın onaylı şekilde sepeti doldurmasını sağlamak | `/buyer/agent` önerisi kullanıcı onayıyla cart state'ine eklenir veya sepeti değiştirir |
| 8P | Seller mock mutations + audit | Satıcı agent'ın onaylı listing mutation yapması | Önce/sonra preview görünür; satıcı onaylarsa başlık/açıklama/fiyat/kampanya mock state değişir ve audit log görünür |
| 8Q | Floating Agent mini panel + proactive signals | Route agent oturduktan sonra sağ alt Agent deneyimini eklemek | Tüm buyer/seller sayfalarında Codex pet benzeri ikon görünür; panel aynı agent history/runtime ile çalışır; ürün/sepet/seller mutation işleri panel içinde yapılır; context-aware badge/ünlem uyarıları, gizle/sessize al/bu sayfada uyarma kontrolleri çalışır |
| 8R | End-to-end demo hardening | Buyer ve seller demo akışlarını parlatmak | Browser QA, check/build, demo script ve kritik akışlar temiz geçer |
| 9A | Gemini/provider finalization | OpenAI geçici provider'dan final Gemini/provider yapısına geçmek | Buyer/seller/agent contract'ları Gemini ile generated döner |

## 8) Demo Senaryoları

### Buyer Demo

* Kullanıcı `/buyer/products` ekranına gelir.
* Sağ altta Codex pet benzeri floating Agent ikonu görünür.
* Kategori veya search ile ürünleri gezer.
* Ürün kartına tıklar ve `/buyer/products/[slug]` satış detay sayfasına gider.
* Agent bağlamda uyarı görürse ikon ses çıkarmadan badge/ünlem/kafa kaldırma animasyonu yapar.
* Kullanıcı ikona basar; mini panel ürün bağlamını yorumlar.
* Ürün detayında `Sepete Ekle` ile sepete ürün ekler.
* `/buyer/cart` ekranında sade sepeti görür.
* Kullanıcı floating Agent paneline veya `/buyer/agent` ekranına yazar.
* Şunu yazar: `3000 TL altı limitli old-money kazak ve pantolon getir`.
* Agent katalogdaki mevcut ürünlerden ürün kartlarını chat içinde gösterir.
* Agent sorar: `Bunları sepete ekleyeyim mi?`
* Kullanıcı onaylar.
* Sepet güncellenir.
* `/buyer/profile` ekranında kullanıcı stil/kargo/kalite tercihlerini ve yorumlarını görür.

### Seller Demo

* Satıcı `/seller` ana sayfasına gelir.
* Sağ altta aynı floating Agent ikonu görünür.
* Overview'de kısa uyarı kartları görür:
  * İade artışı.
  * Negatif yorum kümeleri.
  * Satılmayan ürünler.
  * Stok riski.
* Agent bir seller uyarısı varsa ikon üzerinden sessiz görsel dikkat sinyali verir.
* Bir uyarıya tıklar ve ilgili endpoint'e gider.
* `/seller/products` içinde ürünleri fotoğraflı şekilde inceler.
* `/seller/actions` veya `/seller/actions/[category]` içinde aksiyon kategorilerine bakar.
* Floating Agent panelinde veya `/seller/agent` ekranında `Satılmayan ürünlerimi sırala` der.
* Agent ürünleri sebep ve oranla sıralar.
* Satıcı bir ürün için düzenleme ister.
* Agent önce/sonra preview gösterir.
* Satıcı onaylarsa agent mock mutation uygular ve audit log'a yazar.

## 9) Öncelikli Riskler

* UI tekrar açıklama dashboard'una dönerse ürün hissi zayıflar; ürün/sepet/profil önce gelmeli.
* Buyer cart boşken fazla açıklama göstermek kullanıcıyı yorar.
* Agent her sayfada konuşursa rahatsız edici olur; önce route agent, sonra kontrollü pet/proactive balon.
* Floating Agent mini paneli tam agent yetkisine sahip olacağı için permission/onay kuralları panel içinde de eksiksiz korunmalı.
* Proactive ikon davranışı sesli veya agresif popup'a dönmemeli; sessiz, kısa ve kapatılabilir olmalı.
* Konuşma geçmişi route Agent ve floating panel arasında ayrışırsa kullanıcı deneyimi kırılır.
* Seller overview tek uzun sayfa olursa yönetim paneli hissi kaybolur; uyarı kartları endpoint'lere dağıtılmalı.
* Mock ürün görselleri zayıf kalırsa marketplace hissi düşer; 8E sprite seti gerekirse ürün bazlı görsellerle büyütülmeli.
* Cart/listing mutation gerçek görünmeli ama kontrolsüz olmamalı; buyer cart onayı, seller before/after preview ve audit zorunlu.

## 10) Netleşen Kararlar

* Ürün kartı ana tıklama davranışı ürün detayına gider; sepete ekleme `Sepete Ekle` aksiyonuyla yapılır.
* Her ürün için dynamic `/buyer/products/[slug]` satış detay sayfası açılır.
* Buyer kategori seti: `Kadın Giyim`, `Erkek Giyim`, `Elektronik`, `Ev & Yaşam`, `Kozmetik`, `Spor`, `Aksesuar`.
* Buyer agent yalnızca katalogdaki mevcut ürünlerden seçim yapar; katalog dışı ürün uydurmaz.
* Buyer cart state ilk fazda `localStorage` ile korunur.
* Buyer agent onay sonrası mevcut sepete ekleyebilir veya kullanıcı seçerse sepeti öneriyle değiştirebilir.
* Buyer profil serbest metin + chip/checkbox tercihleriyle tutulur.
* Seller overview ana uyarı kartları: `Satılmayan ürünler`, `Negatif yorumlar`, `İade riski`, `Stok riski`.
* Seller mutation hemen uygulanmaz; önce/sonra preview gösterilir, satıcı onaylarsa uygulanır.
* Ürün görselleri 8E veya sonrasında kontrollü mock/generated görsel setiyle üretilebilir.
* 8E katalog contract'ı `src/lib/api/buyer-catalog.ts` üzerinden yürür; kategori, ürün kartı, görsel metadata ve `/api/buyer/catalog` aynı typed builder'dan beslenir.
* Floating Agent tüm buyer/seller sayfalarında görünebilir.
* Floating Agent paneli ayrı müşteri temsilcisi değil, `/buyer/agent` ve `/seller/agent` ekranlarıyla aynı runtime ve konuşma geçmişini kullanan kompakt Agent UI'dır.
* Floating Agent paneli Agent sayfasına taşımadan ürün önerisi, sepet apply, seller analiz ve seller mutation preview gibi işleri kendi içinde yapabilir.
* Floating Agent context-aware çalışır; bulunduğu route ve seçili ürün/sepet/seller alanını runtime'a taşır.
* Proactive uyarı ilk fazda ses kullanmaz; badge, ünlem, kafa kaldırma veya benzeri görsel mikro etkileşimle dikkat çeker.
* Floating Agent kontrolleri: `Gizle`, `Sessize al`, `Bu sayfada uyarma`.
* Floating Agent ilk fazda web/desktop odaklıdır; mobil davranış bu adımda kapsam dışıdır.
* İlk floating avatar Codex pet benzeri teknik/sevimli avatar olabilir ve daha sonra değiştirilebilir.

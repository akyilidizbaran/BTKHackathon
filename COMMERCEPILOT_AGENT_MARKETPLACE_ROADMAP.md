# COMMERCEPILOT_AGENT_MARKETPLACE_ROADMAP

## 0) Durum

* Son güncelleme: 2026-05-15
* Roadmap kararı:
  * CommercePilot önce gerçek bir e-ticaret ürünü gibi davranacak.
  * Agent deneyimi açıklama dashboard'u değil, alışveriş ve satıcı paneli üzerinde aksiyon alan sohbet/yardımcı katmanı olacak.
  * Uygulama artık endpoint endpoint ilerleyecek; her route kendi net işlevine sahip olacak.
* Planlanan kapsam:
  * 8B ve 8C tamamlandı.
  * 8D sonrası milestone sırası revize edildi; milestone sayısı uygulama sırasında azaltılıp artırılabilir.

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
  * Detay sayfası varsa ikincil aksiyon olarak kalabilir.
* Buyer Agent ChatGPT benzeri bir sohbet alanı olacak.
  * Kullanıcı örnek komut: `3000 TL altı limitli old-money kazak ve pantolon getir`.
  * Agent ürünleri görselleştirip chat içinde listeleyecek.
  * Sonra izin soracak: `Bunları sepete ekleyeyim mi?`
  * Kullanıcı onaylarsa sepet state'i değişecek.
* Buyer Profil, agent kişiselleştirme merkezi olacak.
  * Kullanıcı kendi isteklerini, stil tercihlerini, hassasiyetlerini ve beklentilerini yazabilecek.
  * Kullanıcının ürün yorumları burada sergilenecek.
  * Bu veriler agent önerilerini/fine-tune hissini besleyen profil sinyalleri olarak kullanılacak.
* Seller overview tek uzun sayfa olmayacak.
  * Genel bakışta dağılımlar, iade uyarıları, negatif yorum uyarıları, düşük stok ve satılmayan ürün uyarıları kısa kartlar halinde olacak.
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
* Seller Profil, mağaza ayarları, agent yetki tercihleri ve satıcı profil bilgilerini tutacak.

## 2) Endpoint Haritası

### Buyer Routes

* `/buyer`
  * Varsayılan olarak `/buyer/products` deneyimine yönlenir veya aynı ürünler ekranını render eder.
* `/buyer/products`
  * Normal alıcıların gezeceği ana ürün/kategori yüzeyi.
  * Header search, kategori şeridi, kampanya/öneri bölümü, ürün grid/list içerir.
* `/buyer/products/[slug]`
  * Opsiyonel ürün detay.
  * Çok açıklama değil; görsel, fiyat, yorumlar, sepete ekle ve kısa agent uyarısı.
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
  * Ürün listesi, kategori, fiyat, görsel ve badge metadata.
* `GET /api/buyer/products/[id]`
  * Ürün detay contract'ı.
* `GET /api/buyer/cart`
  * Mevcut sepet.
* `POST /api/buyer/cart/items`
  * Ürün sepete ekler.
* `PATCH /api/buyer/cart/items/[id]`
  * Adet günceller.
* `DELETE /api/buyer/cart/items/[id]`
  * Ürünü sepetten çıkarır.
* `POST /api/buyer/agent`
  * Chat mesajı alır, ürün önerisi/cevap/sepete ekleme isteği döner.
* `POST /api/buyer/agent/apply`
  * Kullanıcı onayından sonra agent'ın önerdiği sepet mutation'ını uygular.
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
  * Mock listing mutation.
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
* `POST /api/seller/agent/apply`
  * Kullanıcı izniyle mock ürün/listing mutation uygular.
* `GET /api/seller/profile`
  * Mağaza ve agent permission ayarları.
* `PATCH /api/seller/profile`
  * Profil/permission ayarlarını günceller.

## 3) Buyer Deneyim Kuralları

* Buyer ekranı jüriye açıklama anlatan dashboard gibi olmayacak.
* Ürünler sayfası normal alışveriş yapan kullanıcının ana alanı olacak.
* Ürünleri listele:
  * Kategori şeridi.
  * Kampanya/öneri chip'leri.
  * Çok ürünlü grid.
  * Sepete ekle butonu.
  * Favori ikonu opsiyonel.
  * Kısa teslimat/indirim/puan sinyali.
* Sepet:
  * Boşken kısa ve sakin.
  * Doluyken ürün odaklı.
  * Agent yalnızca sepet iyileştirme veya kullanıcı komutu sonrası görünür şekilde devreye girer.
* Agent:
  * Ayrı `/buyer/agent` sayfasında büyük chat deneyimi.
  * Sağ alt pet/chat sonra eklenebilir ama core akış önce endpoint sayfasında kurulacak.
  * Agent önerdiği ürünleri küçük ürün kartlarıyla gösterir.
  * Sepete ekleme için açık onay ister.
* Profil:
  * `Agent beni nasıl tanısın?` alanı.
  * Stil/kalite/bütçe/kargo/iade hassasiyetleri.
  * Kullanıcı yorumları.

## 4) Seller Deneyim Kuralları

* Seller ekranı tek uzun açıklama sayfası olmayacak.
* Overview:
  * Kısa KPI.
  * Ürün dağılımları.
  * İade uyarıları.
  * Negatif yorum uyarıları.
  * Satılmayan ürün uyarısı.
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
  * Yetki verilirse mock mutation yapar ve ne yaptığını raporlar.
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
  * Sonra sağ alt pet/chat paneli eklenecek.
  * Floating pet eklendiğinde header navigasyonunu veya ürün/sepet akışını gölgelemeyecek.
* Agent runtime:
  * Promptlar merkezi tutulacak: `src/lib/agents/prompts/*`.
  * Tool contract'ları merkezi tutulacak: `src/lib/agents/tools/*`.
  * Runtime orchestration merkezi tutulacak: `src/lib/agents/runtime/*`.
  * İlk aşamada typed internal tool runner kullanılacak.
  * LangChain daha sonra tool orchestration adapter olarak bağlanacak.
* Cart/listing state:
  * İlk fazda gerçek DB yok.
  * Buyer cart state local mock store/local storage veya server-side mock contract ile korunacak.
  * Seller mutation app içi mock state ve audit log üzerinde çalışacak.
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
| 8E | Buyer catalog data + ürün grid | Çok ürünlü klasik e-ticaret ürünler ekranı kurmak | Kategori şeridi, kampanya chip'leri, fotoğraflı ürün grid'i ve sepete ekle aksiyonu görünür |
| 8F | Buyer cart state | Sepeti gerçek etkileşimli hale getirmek | Ürün ekle/sil/adet/toplam ve boş/dolu sepet state'i çalışır |
| 8G | Buyer agent page | ChatGPT benzeri alıcı agent sayfasını kurmak | Prompt -> görselli ürün önerisi -> onay sorusu akışı çalışır |
| 8H | Buyer profile | Agent kişiselleştirme ve kullanıcı yorumları sayfasını kurmak | Tercihler ve yorumlar profil ekranında görünür/güncellenir |
| 8I | Seller IA + overview endpoints | Satıcı ana sayfayı kısa uyarı kartları ve endpoint linkleriyle kurmak | Dağılım, iade, negatif yorum, stok ve satılmayan ürün uyarıları route'lara bağlanır |
| 8J | Seller products | Fotoğraflı satıcı ürün yönetimi ekranı | Ürünler fotoğraf, stok, satış, fiyat, yorum ve risk sinyaliyle listelenir |
| 8K | Seller actions by category | Aksiyonları alt başlık endpoint'lerine bölmek | `/seller/actions/[category]` listeleri çalışır |
| 8L | Seller agent page | Satıcı agent sohbet ve analiz yüzeyini kurmak | Satılmayan ürün sıralama, sebep analizi ve öneri akışı çalışır |
| 8M | Seller profile + permissions | Mağaza profili ve agent yetki ayarları | Profil, yetki modu ve bildirim tercihleri görünür/güncellenir |
| 8N | Shared agent runtime | Buyer/seller agent prompt ve tool registry ortaklaştırmak | Agent request contract, prompt registry ve typed tool registry oluşur |
| 8O | Buyer agent cart mutations | Agent'ın onaylı şekilde sepeti doldurmasını sağlamak | `/buyer/agent` önerisi kullanıcı onayıyla cart state'ine uygulanır |
| 8P | Seller mock mutations + audit | Satıcı agent'ın izinli listing mutation yapması | Başlık/açıklama/fiyat/kampanya mock state değişir, audit log görünür |
| 8Q | Floating pet + proactive bubbles | Route agent oturduktan sonra sağ alt pet deneyimini eklemek | Pet görünür/gizlenir/sürüklenir; kısa proactive balonlar bağlama göre çıkar |
| 8R | End-to-end demo hardening | Buyer ve seller demo akışlarını parlatmak | Browser QA, check/build, demo script ve kritik akışlar temiz geçer |
| 9A | Gemini/provider finalization | OpenAI geçici provider'dan final Gemini/provider yapısına geçmek | Buyer/seller/agent contract'ları Gemini ile generated döner |

## 8) Demo Senaryoları

### Buyer Demo

* Kullanıcı `/buyer/products` ekranına gelir.
* Kategori veya search ile ürünleri gezer.
* Ürün kartından sepete ürün ekler.
* `/buyer/cart` ekranında sade sepeti görür.
* Kullanıcı `/buyer/agent` ekranına geçer.
* Şunu yazar: `3000 TL altı limitli old-money kazak ve pantolon getir`.
* Agent ürün kartlarını chat içinde gösterir.
* Agent sorar: `Bunları sepete ekleyeyim mi?`
* Kullanıcı onaylar.
* Sepet güncellenir.
* `/buyer/profile` ekranında kullanıcı stil/kargo/kalite tercihlerini ve yorumlarını görür.

### Seller Demo

* Satıcı `/seller` ana sayfasına gelir.
* Overview'de kısa uyarı kartları görür:
  * İade artışı.
  * Negatif yorum kümeleri.
  * Satılmayan ürünler.
  * Stok riski.
* Bir uyarıya tıklar ve ilgili endpoint'e gider.
* `/seller/products` içinde ürünleri fotoğraflı şekilde inceler.
* `/seller/actions` veya `/seller/actions/[category]` içinde aksiyon kategorilerine bakar.
* `/seller/agent` ekranında `Satılmayan ürünlerimi sırala` der.
* Agent ürünleri sebep ve oranla sıralar.
* Satıcı bir ürün için düzenleme ister.
* Yetki verirse agent mock mutation uygular ve audit log'a yazar.

## 9) Öncelikli Riskler

* UI tekrar açıklama dashboard'una dönerse ürün hissi zayıflar; ürün/sepet/profil önce gelmeli.
* Buyer cart boşken fazla açıklama göstermek kullanıcıyı yorar.
* Agent her sayfada konuşursa rahatsız edici olur; önce route agent, sonra kontrollü pet/proactive balon.
* Seller overview tek uzun sayfa olursa yönetim paneli hissi kaybolur; uyarı kartları endpoint'lere dağıtılmalı.
* Mock ürün görselleri zayıf olursa marketplace hissi oluşmaz.
* Cart/listing mutation gerçek görünmeli ama kontrolsüz olmamalı; onay ve audit zorunlu.

## 10) Varsayımlar ve Açık Sorular

* Varsayım: Buyer ürün kartında ana aksiyon `Sepete ekle`; ürün detay ayrı tıklama alanı olarak kalabilir.
* Varsayım: `/buyer` route'u ürünler ekranına yönlenecek veya aynı içeriği gösterecek.
* Varsayım: Satıcı tarafında tek navigasyon kaynağı header olacak; ihtiyaç olursa sol alan yalnızca filtre/özet için kullanılacak, menü tekrarı olmayacak.
* Açık soru: Ürün görselleri ilk fazda AI generated asset mi, kontrollü placeholder/mock görsel mi olacak?
* Açık soru: Buyer cart state local storage ile mi, server-side in-memory mock store ile mi korunacak?
* Açık soru: Ürün kartının herhangi bir yerine tıklamak direkt sepete mi eklemeli, yoksa yalnızca `Sepete ekle` butonu mu bunu yapmalı?

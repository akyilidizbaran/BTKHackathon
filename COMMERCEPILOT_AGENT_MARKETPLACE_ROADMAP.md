# COMMERCEPILOT_AGENT_MARKETPLACE_ROADMAP

## 0) Durum

* Son güncelleme: 2026-05-14
* Roadmap kararı: CommercePilot klasik e-ticaret görünümüne dönecek; yapay zeka deneyimi sağ altta yaşayan, konuşan ve gerektiğinde aksiyon alan agent pet üzerinden taşınacak.
* Planlanan kapsam: 17 milestone.
  * Ürün pivot ve implementasyon zinciri: Milestone 8B - 8Q.
  * Final provider/agent framework kapanışı: Milestone 9A.

## 1) Kilit Kararlar

* Site adı `CommercePilot` kalacak.
* Görsel dil kendi markamız olacak ama kullanıcıya tanıdık gelen klasik marketplace düzeni kullanılacak.
* Dark theme tamamen kalkacak; light, temiz, alışveriş odaklı bir arayüz kurulacak.
* Trendyol/Hepsiburada hissi taklit edilmeyecek; sadece alışılmış e-ticaret kalıpları kullanılacak: header, search, kategori, banner, ürün grid, ürün detay, sepet.
* Agent figürü ilk aşamada Codex pet benzeri teknik/sevimli bir avatar olabilir; ileride değiştirilebilir.
* Agent her sayfada sağ altta durabilecek, sürüklenerek yuvasından ayrılabilecek, sayfa değişimlerinde küçük animasyonlarla dikkat çekebilecek.
* Agent hem proactive konuşacak hem de kullanıcı çağırırsa normal chatbot gibi kullanılacak.
* Ayrı bir agent sayfası olacak; sağ alttaki chat panelinin büyütülmüş versiyonu gibi davranacak.
* Buyer tarafında agent gerçek sepet state'ini değiştirebilecek.
* Seller tarafında agent gerçek mock mutation yapabilecek: ürün başlığı, açıklama, fiyat önerisi, kampanya/etiket ve listeleme iyileştirme aksiyonları.
* Mutation'lar ilk aşamada dış sisteme gitmeyecek; app içi mock state ve audit log üzerinde gerçek değişiklik olarak uygulanacak.
* OpenAI geçici provider olarak kalacak.
* LangChain kullanımı, tool contract'ları stabil hale geldikten sonra adapter olarak değerlendirilecek. İlk implementasyon kendi typed agent runtime katmanımızla yapılacak.
* Mock data genişletilecek; ürün, yorum, satıcı, kategori ve görsel alanları marketplace hissini taşıyacak kadar büyütülecek.

## 2) Ana Deneyim

### Buyer

* Marketplace homepage: header, arama, kategori navigasyonu, kampanya/banner alanı, ürün grid, önerilen sepetler.
* Ürün detay: ürün görseli, fiyat, satıcı, teslimat, yorumlar, AI yorum özeti, kişisel tercih uyarısı.
* Cart: agent tarafından oluşturulan veya değiştirilen sepet state'i, bütçe ve teslimat uyarıları, alternatif ürünler.
* Agent örnekleri:
  * "3000 TL altında hızlı kargolu sepet oluştur."
  * "Önceki yorumlarıma göre bu ürün bana uygun mu?"
  * "Hızlı kargo benim için önemliydi, buna dikkat et."
  * "Bunu sepete ekle."
  * "Daha ucuz alternatif göster."

### Seller

* Ayrı `/seller` alanı kalacak.
* Klasik seller panel düzeni: ürünler, siparişler, stok, satış performansı, yorumlar, agent aksiyon merkezi.
* Agent örnekleri:
  * "Satılmayan ürünlerimi sırala."
  * "Neden satılmadığını açıkla."
  * "Bu ürünün başlığını ve açıklamasını iyileştir."
  * "Tam yetki veriyorum, önerdiğin düzenlemeleri uygula."
* Seller mutation örnekleri:
  * Ürün başlığı güncelleme.
  * Ürün açıklaması güncelleme.
  * Fiyat/kampanya önerisini uygulama.
  * Etiket, kategori veya listeleme kalite alanı düzeltme.
  * Yapılan değişiklikleri audit log olarak gösterme.

## 3) Agent Permission Model

* `chat`: Sadece konuşur, state değiştirmez.
* `suggest`: Öneri üretir, değişiklik yapmaz.
* `assist`: Sepet veya ürün düzenleme taslağı hazırlar, kullanıcı onayı bekler.
* `autopilot`: Kullanıcı tam yetki verirse mock state üzerinde gerçek değişiklik uygular ve ne yaptığını raporlar.

## 4) Teknik Yön

* Agent UI:
  * `FloatingAgentPet`: sağ alt avatar, sürüklenebilir hareket, dikkat çekme animasyonları.
  * `AgentChatPanel`: küçük sağ alt sohbet paneli.
  * `AgentPage`: chat panelinin büyütülmüş, tam sayfa versiyonu.
  * `ProactiveBubble`: ürün veya seller detay sayfasında agent figüründen çıkan konuşma balonu.
* Agent runtime:
  * Promptlar merkezi tutulacak: `src/lib/agents/prompts/*`.
  * Tool contract'ları merkezi tutulacak: `src/lib/agents/tools/*`.
  * Runtime orchestration merkezi tutulacak: `src/lib/agents/runtime/*`.
  * İlk aşamada typed internal tool runner kullanılacak.
  * LangChain daha sonra tool orchestration adapter olarak bağlanacak.
* Provider:
  * Şimdilik OpenAI kalacak.
  * `LLM_PROVIDER` provider seçim noktası olarak korunacak.
  * Gemini final provider swap Milestone 9A kapsamına alınacak.

## 5) Milestone Planı

| Milestone | Ad | Amaç | Çıkış Kriteri |
| --- | --- | --- | --- |
| 8B | Roadmap ve ürün pivot kilidi | Bu dosya ve `PROJECT_MEMORY.md` ile yeni yönü sabitlemek | Kararlar, permission modeli ve milestone sayısı yazılı |
| 8C | Light marketplace design system | Dark theme'i kaldırmak, light e-ticaret tokenlarını ve layout shell'i kurmak | Global arka plan, header, spacing, ürün kartı dili light tema ile çalışır |
| 8D | Mock catalog expansion | Marketplace hissi için ürün, kategori, yorum ve görsel metadata'sını büyütmek | Ürün grid ve detay sayfaları için yeterli katalog verisi var |
| 8E | Buyer marketplace homepage | Klasik e-ticaret ana sayfasını kurmak | Header, search, kategori, banner, ürün grid ve sepet girişi çalışır |
| 8F | Buyer product detail + cart mutations | Ürün detay ve sepet state'ini gerçek etkileşimli hale getirmek | Ürün detayı, yorumlar, teslimat, sepete ekleme ve sepet güncelleme çalışır |
| 8G | Seller classic panel shell | Seller alanını klasik satıcı paneline çevirmek | Ürünler, sipariş/stok/satış kartları ve ürün tablo/listesi light panel olarak görünür |
| 8H | Agent pet visual shell | Sağ alt pet avatarını, sürüklenebilir davranışı ve temel animasyonları eklemek | Pet tüm buyer/seller sayfalarında konumlanır, gizlenir, sürüklenir |
| 8I | Chat panel, agent page ve modlar | Küçük chat paneli, büyük agent sayfası ve mod kontrollerini kurmak | Chat/suggest/assist/autopilot/sessiz/gizle modları UI'da seçilir |
| 8J | Agent runtime ve prompt registry | Promptları ve tool çağrılarını merkezi runtime'a almak | Agent request contract'ı, prompt registry ve typed tool registry oluşur |
| 8K | Buyer agent tools | Buyer agent'ın sepet oluşturma ve ürün uygunluk araçlarını bağlamak | "3000 TL altında sepet oluştur" gerçek sepet state'ini değiştirir |
| 8L | Buyer proactive bubbles | Ürün detay ve sepet sayfalarında kişisel tercih uyarılarını proactive balona çevirmek | Hız, iade, kargo, renk ve bütçe uyarıları agent balonu olarak görünür |
| 8M | Seller unsold analysis tools | Satılmayan ürünleri oran/sebep/aksiyon sıralamasıyla analiz etmek | "Satılmayan ürünlerimi sırala" agent cevabı ve tablo sıralaması üretir |
| 8N | Seller product agent + real mutations | Seller ürün detayında açıklama ve düzenleme mutation'larını uygulamak | Tam yetkiyle başlık/açıklama/fiyat/kampanya mock state'i değişir |
| 8O | Permission, audit ve rollback | Agent aksiyonlarını güvenli hale getirmek | Her mutation audit log'a düşer, kullanıcı ne değiştiğini görür, rollback yolu vardır |
| 8P | LangChain adapter readiness | Internal runtime'ı LangChain'e bağlanabilir hale getirmek | Tool contract'ları LangChain adapter ile çalışmaya hazırdır |
| 8Q | End-to-end demo hardening | Buyer ve seller demo akışını baştan sona parlatmak | Demo script, browser QA, check/build ve kritik akışlar temiz geçer |
| 9A | Gemini provider finalization | OpenAI geçici provider'dan final Gemini/provider yapısına geçmek | Seller/buyer/agent explanation contract'ları Gemini ile generated döner |

## 6) Demo Senaryoları

* Buyer:
  * Kullanıcı homepage'de gezer.
  * Agent pet dikkat çeker.
  * Kullanıcı "3000 TL altında hızlı kargolu sepet oluştur" der.
  * Agent sepeti oluşturur ve ürünleri sepete uygular.
  * Kullanıcı bir ürün detayına girer.
  * Agent, önceki yorum/tercih sinyalinden "hıza önem veriyordun, teslimat sinyaline dikkat et" balonu gösterir.
* Seller:
  * Satıcı panele girer.
  * "Satılmayan ürünlerimi sırala" der.
  * Agent ürünleri satılmama oranına ve sebebe göre sıralar.
  * Satıcı bir ürüne girer.
  * Agent neden satılmadığını ve ne değişebileceğini balonla açıklar.
  * Satıcı tam yetki verir.
  * Agent mock listing mutation uygular ve yapılan değişiklikleri raporlar.

## 7) Öncelikli Riskler

* Büyük UI pivot dark dashboard kodunu gereksiz yere korumaya çalışırsa ilerleme yavaşlar; light marketplace shell'i temiz kurulmalı.
* Agent her yerde konuşursa rahatsız edici olur; proactive balonlar kısa, bağlama özel ve susturulabilir olmalı.
* Mutation gerçek görünmeli ama kontrolsüz olmamalı; permission ve audit log Milestone 8O'dan önce production hissi verilmemeli.
* Mock data rastgele büyütülmemeli; her ürün demo senaryosuna veya marketplace atmosferine hizmet etmeli.
* LangChain erken bağlanırsa UI ve tool contract'ları oturmadan karmaşıklık artar; önce internal runtime daha güvenli.

## 8) Açık Sorular

* Pet karakterinin ilk görseli kodla mı üretilecek, image asset olarak mı eklenecek?
* Ürün görselleri ilk aşamada generated/mock asset mi, kontrollü placeholder mı olacak?
* Seller mutation'ları local storage ile mi kalıcılaşacak, yoksa server-side in-memory mock store mu kullanılacak?
* Buyer sepet state'i route değişimlerinde local storage ile korunacak mı?
* Agent proactive konuşma sıklığı için default eşik ne olacak?


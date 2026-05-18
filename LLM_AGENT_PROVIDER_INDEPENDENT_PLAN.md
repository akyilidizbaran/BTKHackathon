# LLM_AGENT_PROVIDER_INDEPENDENT_PLAN

## 0) Amac

CommercePilot Agent katmani, once OpenAI API key ile calisacak sekilde LLM destekli hale getirilecek; teslimden hemen once ayni contract'lar bozulmadan Gemini provider'ina kaydirilabilecek.

Hedef mimari:

```text
deterministic commerce data + scoring
  -> LLM intent / ranking / explanation / draft generation
  -> typed validation + guardrails
  -> user approval
  -> deterministic apply function
```

Bu mimaride LLM karar, yorum ve taslak uretir; katalog disi urun uyduramaz, izinsiz mutation yapamaz. Sepet, listing, fiyat, kampanya ve audit gibi kalici davranislar typed internal contract'lar uzerinden uygulanir.

## 1) Kaynak Durum

* Mevcut LLM wrapper `src/lib/llm/*` altinda ve yalnizca `openai` provider'ini aktif destekliyor.
* OpenAI entegrasyonu direct `fetch` ile `https://api.openai.com/v1/responses` endpoint'ine gidiyor.
* Buyer Agent su anda deterministic smart-cart sonucunu agent cevabina ceviriyor.
* Seller Agent su anda deterministic seller product/action workflow sonucunu agent cevabina ceviriyor.
* Runtime LLM kullanimi agirlikla aciklama katmaninda:
  * `src/lib/api/seller-action-explanations.ts`
  * `src/lib/api/buyer-smart-cart-explanations.ts`
* Gemini final provider swap icin bekletiliyor; UI icinde Gemini calisiyormus gibi sahte davranilmayacak.

## 2) Non-negotiables

* Agent, buyer tarafinda yalnizca mevcut CommercePilot katalog urunlerinden secim yapabilir.
* Agent, seller tarafinda kullanici onayi olmadan listing, fiyat, kampanya, stok veya aciklama mutation'i uygulayamaz.
* LLM ciktisi ham sekilde UI veya mutation katmanina gecemez; her sonuc typed parse + validation + guardrail'den gecmelidir.
* Fallback davranisi korunur; API key yoksa veya provider hata verirse demo tamamen kirilmaz.
* Provider secimi sadece environment/config seviyesinde degisebilmelidir.
* Gemini gecisi sirasinda Agent route contract'lari, UI component prop'lari ve apply endpoint payload'lari bozulmamalidir.

## 3) 7 Asamali Uygulama Plani

### 1. Provider Katmanini Genellestir

Hedef:

* `LlmProvider` tipini `openai | gemini | deterministic` olacak sekilde genislet.
* `generateLlmText()` fonksiyonunu provider adapter secen tek giris noktasi olarak koru.
* OpenAI, Gemini ve deterministic fallback dosyalarini ayir.

Planlanan dosyalar:

* `src/lib/llm/types.ts`
* `src/lib/llm/index.ts`
* `src/lib/llm/openai.ts`
* `src/lib/llm/gemini.ts`
* `.env.example`

Basari kriterleri:

* `LLM_PROVIDER=openai` mevcut davranisi bozmadan calisir.
* `LLM_PROVIDER=gemini` kod seviyesinde desteklenir; API key yoksa anlamli fallback doner.
* Provider hatasi tek tip `LlmTextGenerationResult` ile raporlanir.

Durum:

* 2026-05-16 tamamlandi.
* `src/lib/llm/common.ts` eklendi; provider normalize, model secimi, default token/temperature ve ortak fallback result tek kaynak oldu.
* `src/lib/llm/gemini.ts` eklendi; Gemini OpenAI-compatible `chat/completions` adapter'i ve missing-key fallback contract'i kuruldu.
* `src/lib/llm/index.ts` artik `openai`, `gemini`, `deterministic` ve unsupported provider davranisini tek giris noktasinda yonetiyor.
* `.env.example` `GEMINI_MODEL=gemini-3-flash-preview` ile genisletildi.
* Validation: `npm run typecheck`, `npm run validate:workflows`, `npm run check`, `npm run build` gecti.

### 2. Structured JSON Uretim Katmani Ekle

Hedef:

* Serbest text yerine Agent icin schema odakli JSON uretim helper'i kur.
* LLM JSON bozarsa veya eksik alan dondururse deterministic fallback devreye girsin.

Planlanan yetenekler:

* `generateLlmJson<T>()`
* JSON extraction helper
* schema/validator callback modeli
* parse failure telemetry: `fallbackReason`, `provider`, `model`, `generatedAt`

Basari kriterleri:

* Existing seller/buyer explanation JSON parsing ortak helper'a tasinir.
* Bozuk markdown/code fence/partial JSON durumlari kontrollu parse edilir.
* Validation gecmeyen cikti mutation veya UI contract'ina gecmez.

Durum:

* 2026-05-16 tamamlandi.
* `generateLlmJson<T>()` `src/lib/llm/index.ts` altinda eklendi.
* `src/lib/llm/json.ts` fenced/partial JSON extraction, `normalizeLlmString` ve `normalizeLlmStringArray` helper'larini tek kaynak yapti.
* Seller action explanation ve buyer smart-cart explanation icindeki kopya JSON parser/normalizer fonksiyonlari kaldirildi; iki modul de shared helper ile calisiyor.
* Validation script shared JSON parse, forced fallback ve schema validation fallback davranislarini dogruluyor.
* Validation: `npm run typecheck`, `npm run validate:workflows`, `npm run check`, `npm run build` ve `git diff --check` gecti.

### 3. Buyer Agent'i LLM Destekli Hale Getir

Hedef:

* Deterministic smart-cart adaylari korunur.
* LLM, bu adaylar uzerinden intent aciklama, secim gerekcesi, yeniden siralama ve cevap metni uretir.
* Agent katalog disi product id dondururse sonuc reddedilir.

Beklenen LLM contract:

* `message.content`
* `confirmationQuestion`
* `rankedProductIds`
* `recommendationReasons`
* `riskNotes`
* `cartStrategySuggestion`

Basari kriterleri:

* `/api/buyer/agent` response contract'i UI'i kirmadan LLM metadata tasir.
* Apply akisi yine `POST /api/buyer/agent/apply` uzerinden calisir.
* OpenAI key varken `status=generated`, key yokken `status=fallback` gorunur.

Durum:

* 2026-05-16 tamamlandi.
* `/api/buyer/agent` POST artik deterministic smart-cart adaylari ustunde `generateLlmJson` ile message, confirmation, rankedProductIds, recommendationReasons, riskNotes ve cartStrategySuggestion uretir.
* Initial `/buyer/agent` render'i build-time LLM cagrisi yapmaz; deterministic preview contract'i kullanir.
* LLM katalog disi productId dondururse validator bu id'yi atar ve eksik adaylari deterministic sirayla tamamlar.
* Recommendation card gerekceleri LLM reason map ile zenginlesir; apply yine `/api/buyer/agent/apply` ve shared cart mutation helper ile calisir.
* Validation script forced fallback ve model override senaryolarinda LLM orchestration metadata, katalog whitelist, reason mapping ve strategy normalize davranisini dogrular.
* Validation: `npm run typecheck`, `npm run validate:workflows`, `npm run check`, `npm run build` ve `git diff --check` gecti.

### 4. Seller Agent'i LLM Destekli Hale Getir

Hedef:

* Deterministic seller products/actions workflow kaynak veri olarak kalir.
* LLM, prompt focus'u, urun onceligi, aksiyon gerekcesi ve listing draft metnini uretir.
* Listing mutation onay olmadan uygulanmaz.

Beklenen LLM contract:

* `activeFocus`
* `headline`
* `content`
* `productFindingReasons`
* `actionPriorities`
* `draftTitle`
* `draftDescription`
* `draftCampaignLabel`
* `safetyNote`

Basari kriterleri:

* `/api/seller/agent` LLM destekli aciklama ve draft uretebilir.
* LLM tarafindan uretilen draft, mevcut `SellerListingMutationPreview` ve apply contract'ina normalize edilir.
* Onayli apply disinda state degismez.

Durum:

* 2026-05-16 tamamlandi.
* `/api/seller/agent` POST artik deterministic seller products/actions adaylari ustunde `generateLlmJson` ile activeFocus, headline/content, product ranking, action ranking/reasons, next step detail ve listing draft uretir.
* Initial `/seller/agent` render'i build-time LLM cagrisi yapmaz; deterministic preview contract'i kullanir.
* LLM katalog disi productId/actionId dondururse validator bu id'leri atar ve eksik adaylari deterministic sirayla tamamlar.
* LLM draft ciktilari `SellerListingMutationPreview` icindeki `afterListing`, `delta`, `summary` ve `applyRequest.mutation` alanlarina normalize edilir; apply yine kullanici onayi ve `/api/seller/agent/apply` contract'i olmadan state degistirmez.
* Validation script forced fallback ve model override senaryolarinda Seller Agent orchestration metadata, focus/action/product whitelist, reason mapping ve draft mutation uyumunu dogrular.
* Validation: `npm run typecheck`, `npm run validate:workflows` gecti; full check/build bu adim sonunda tekrar calistirilacak.

### 5. Review Intelligence'i Gercek LLM Katmanina Tasi

Hedef:

* Mevcut deterministic review scoring korunur.
* LLM, mevcut yorum text/theme/sentiment verisinden cluster, tekrar eden sikayet, iade riski ve satici cevap taslagi uretir.

Beklenen LLM contract:

* `reviewClusters`
* `repeatedComplaintThemes`
* `riskSummary`
* `listingFixSuggestions`
* `sellerReplyDrafts`
* `buyerFacingWarning`

Basari kriterleri:

* LLM yeni yorum, yeni metrik veya olmayan urun uyduramaz.
* Negative review seller action ve buyer warning metinleri review intelligence ciktisiyla zenginlesir.
* Fallback durumunda mevcut scoring davranisi korunur.

Durum:

* 2026-05-17 tamamlandi.
* `src/lib/api/review-intelligence.ts` eklendi; productId tabanli review intelligence contract'i mevcut yorum text/theme/sentiment, product listing bilgisi ve scorecard kanitlari ustunde `generateLlmJson` calistirir.
* `POST /api/review-intelligence` eklendi; route yalnizca runtime'da LLM cagrisi yapar ve API key/provider hatasinda deterministic fallback'e iner.
* LLM ciktilari `reviewClusters`, `repeatedComplaintThemes`, `riskSummary`, `listingFixSuggestions`, `sellerReplyDrafts`, `buyerFacingWarning` alanlarina normalize edilir.
* Validator source review id ve allowedThemes whitelist'i uygular; modelin uydurdugu reviewId/theme UI veya downstream contract'a gecmez.
* Negative review seller action explanation, `review_attention` aksiyonlarinda review intelligence risk summary, cluster ve seller reply draft'lariyla zenginlesir.
* Buyer smart-cart explanation, review kaynakli warning gordugunde ilgili urunlerin buyer-facing review warning ve risk summary ciktisini model input'una ve fallback riskNote'a tasir.
* Validation script forced fallback ve model override senaryolarinda review id/theme filtreleme, seller action enrichment ve buyer explanation enrichment davranislarini dogrular.
* Validation: `npm run typecheck`, `npm run validate:workflows` gecti; full check/build bu adim sonunda tekrar calistirilacak.

### 6. UI'da Provider Durumunu Gorunur Hale Getir

Hedef:

* Agent ve explanation yuzeyleri provider/model/status bilgisini net gostersin.
* Demo oncesi LLM gercekten calisiyor mu sorusu UI ve API contract uzerinden cevaplanabilsin.

Planlanan yuzeyler:

* `/buyer/agent`
* `/seller/agent`
* Floating Agent panel
* Buyer smart-cart explanation
* Seller action explanation
* `/demo` rehearsal checklist

Basari kriterleri:

* Her kritik LLM sonucunda `provider`, `model`, `status`, `fallbackReason?` gorunur veya API'da izlenebilir.
* `generated` ve `fallback` halleri UI'da birbirinden ayrilir.

Durum:

* 2026-05-17 tamamlandi.
* `src/components/commerce/llm-status-badge.tsx` eklendi; provider/model/status/generatedAt/fallbackReason metadata'si Agent ve explanation yuzeylerinde ortak gorsel dille render edilir.
* `/buyer/agent`, `/seller/agent` ve floating Agent sonucunda LLM orchestration trace'i gorunur.
* Buyer smart-cart explanation ve seller action explanation panelleri OpenAI'ye ozel basliklardan provider bagimsiz `LLM` diline tasindi.
* `/demo` rehearsal verisine LLM proof listesi eklendi; Agent, explanation ve review intelligence yuzeylerinin visible/API trace kapsami QA yuzeyinde gorunur.
* Validation script demo LLM proof contract'ini `status`, `provider`, `model`, `fallbackReason` alanlariyla dogrular.
* Validation: `npm run typecheck`, `npm run validate:workflows`, `npm run check`, `npm run build`, `git diff --check` ve Puppeteer smoke gecti.

### 7. Gemini Gecisine Hazir Final Adapter

Hedef:

* OpenAI ile gelistirilen LLM/Agent contract'lari Gemini'ye tasinabilir olsun.
* Teslim oncesi sadece env/config degisimiyle provider kaydirilabilsin.

Planlanan env:

```env
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_API_KEY=
```

Gemini stratejisi:

* Google'in OpenAI-compatible endpoint'i uzerinden `chat/completions` adapter kullan.
* Agent contract'lari provider'dan bagimsiz kalsin.
* Gemini ciktisi de ayni JSON validation/guardrail hattindan gecsin.

Basari kriterleri:

* `LLM_PROVIDER=gemini` ile buyer/seller Agent endpoint'leri ayni response shape'i doner.
* Provider swap sonrasi `npm run check`, `npm run build` ve demo akislari gecilir.
* UI icinde Gemini calisiyorsa gercek provider metadata'si `gemini` olarak gorunur.

## 4) Uygulama Sirasi

1. Provider-neutral LLM adapter ve env contract.
2. Shared structured JSON helper ve parser guardrail.
3. Buyer Agent LLM orchestration. Tamamlandi.
4. Seller Agent LLM orchestration. Tamamlandi.
5. Review Intelligence LLM orchestration. Tamamlandi.
6. UI provider/status visibility. Tamamlandi.
7. Gemini adapter smoke test ve final provider swap hazirligi.

## 5) Test ve Dogrulama Stratejisi

Her asamada en azindan:

* `npm run typecheck`
* `npm run validate:workflows`
* `npm run check`

Provider/Agent asamalarinda ek olarak:

* API route smoke test:
  * `POST /api/buyer/agent`
  * `POST /api/seller/agent`
  * `POST /api/buyer/smart-cart/explanation`
  * `GET /api/seller/actions/[id]/explanation`
* Fallback smoke test:
  * API key olmadan deterministic response.
  * Unsupported provider durumunda controlled fallback.
* UI smoke test:
  * `/buyer/agent`
  * `/seller/agent`
  * floating panel buyer/seller context.

## 6) Acik Riskler

* OpenAI Responses API ve Gemini OpenAI-compatible Chat Completions response shape'leri ayni degil; adapter farki LLM katmaninda izole edilmeli.
* LLM JSON ciktisi her zaman guvenilir degil; parse/validation/fallback zorunlu.
* LLM urun id uydurabilir; katalog whitelist kontrolu zorunlu.
* Seller draft metinleri ticari olarak yaniltici iddia uretebilir; mevcut product/review/action context disina cikan cumleler guardrail ile temizlenmeli.
* Provider swap'ta model davranisi degisebilir; prompt'lar provider-neutral ve kisa tutulmali.

## 7) Harici Referanslar

* OpenAI Responses API: https://platform.openai.com/docs/api-reference/responses
* Gemini OpenAI compatibility: https://ai.google.dev/gemini-api/docs/openai

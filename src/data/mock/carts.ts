import type { Cart } from "@/types/commerce";

export const carts: Cart[] = [
  {
    id: "cart-home-office-fast-shipping",
    buyerId: "buyer-aylin",
    prompt: "Kargo hızı yüksek olan 3.400 TL altında ev ofis setup kur.",
    budget: 3400,
    items: [
      { productId: "prod-riseup-laptop-standi", quantity: 1 },
      { productId: "prod-flowmate-kablosuz-mouse", quantity: 1 },
      { productId: "prod-graphite-desk-mat", quantity: 1 },
      { productId: "prod-tidy-kablo-duzenleyici", quantity: 1 },
    ],
    status: "recommended",
    rationale: "Aylin'in hızlı kargo hassasiyeti nedeniyle hızlı teslimat oranı yüksek ve yorumları olumlu ürünler seçildi.",
  },
  {
    id: "cart-blue-desk-set",
    buyerId: "buyer-zeynep",
    prompt: "Pastel mavi renk paletinde masa takımı diz.",
    budget: 2500,
    items: [
      { productId: "prod-bluecore-masa-seti", quantity: 1 },
      { productId: "prod-flowmate-kablosuz-mouse", quantity: 1 },
      { productId: "prod-focus-not-defteri-seti", quantity: 1 },
    ],
    status: "recommended",
    rationale: "Renk uyumu ve masa estetiği sinyalleri yüksek ürünler bir araya getirildi.",
  },
  {
    id: "cart-coffee-starter",
    buyerId: "buyer-deniz",
    prompt: "1500 TL civarında başlangıç kahve seti oluştur.",
    budget: 1500,
    items: [
      { productId: "prod-brewday-french-press", quantity: 1 },
      { productId: "prod-foamgo-sut-kopurtucu", quantity: 1 },
      { productId: "prod-thermogo-termos-mug", quantity: 1 },
    ],
    status: "recommended",
    rationale: "Bütçe korunarak başlangıç seviyesi kahve deneyimi için temel ve tamamlayıcı ürünler seçildi.",
  },
  {
    id: "cart-sports-headphone",
    buyerId: "buyer-burak",
    prompt: "Spor için kulağı yormayan kablosuz kulaklık öner.",
    budget: 2000,
    items: [{ productId: "prod-runbuds-spor-kulakici", quantity: 1 }],
    status: "recommended",
    rationale: "AirBeat ürünündeki konfor şikayetleri nedeniyle RunBuds daha güvenli alternatif olarak seçildi.",
  },
  {
    id: "cart-meeting-quality",
    buyerId: "buyer-mert",
    prompt: "Toplantı kalitemi artıracak ev ofis ekipmanları öner.",
    budget: 4500,
    items: [
      { productId: "prod-clearcam-webcam", quantity: 1 },
      { productId: "prod-podcast-mini-mikrofon", quantity: 1 },
      { productId: "prod-riseup-laptop-standi", quantity: 1 },
    ],
    status: "recommended",
    rationale: "Görüntü, ses ve kamera açısını birlikte iyileştiren ürünler seçildi; mikrofon için arka plan sesi uyarısı gösterilmeli.",
  },
];

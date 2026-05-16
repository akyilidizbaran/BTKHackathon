export const demoRehearsalRoute = "/demo";

export type DemoRehearsalLaneId = "buyer" | "floating" | "seller";
export type DemoQualityStatus = "ready" | "watch" | "manual";

export interface DemoRehearsalData {
  ctas: {
    buyer: string;
    qa: string;
    seller: string;
  };
  headline: string;
  marquee: string[];
  milestone: "8R";
  nextMilestone: "9A";
  proofCards: DemoProofCard[];
  qaChecks: DemoQualityCheck[];
  runbook: DemoRunbookLane[];
  subheadline: string;
}

export interface DemoProofCard {
  id: string;
  label: string;
  result: string;
  tone: "dark" | "light" | "orange";
}

export interface DemoQualityCheck {
  command?: string;
  evidence: string;
  id: string;
  label: string;
  status: DemoQualityStatus;
}

export interface DemoRunbookLane {
  accent: "emerald" | "orange" | "slate";
  id: DemoRehearsalLaneId;
  steps: DemoRunbookStep[];
  summary: string;
  title: string;
}

export interface DemoRunbookStep {
  command: string;
  expected: string;
  href: string;
  id: string;
  title: string;
}

export function getDemoRehearsalData(): DemoRehearsalData {
  return {
    ctas: {
      buyer: "/buyer/products",
      qa: "/demo#qa",
      seller: "/seller",
    },
    headline: "Demo akışı tek nefeste.",
    marquee: [
      "Buyer products",
      "Buyer cart apply",
      "Floating Agent",
      "Seller products",
      "Seller audit rollback",
      "Runtime 8Q.1",
      "Handoff 8R",
    ],
    milestone: "8R",
    nextMilestone: "9A",
    proofCards: [
      {
        id: "buyer-cart-proof",
        label: "Buyer proof",
        result: "Agent 3 katalog ürününü onay sonrası sepete yazar.",
        tone: "light",
      },
      {
        id: "seller-audit-proof",
        label: "Seller proof",
        result: "Listing mutation audit log'a düşer ve geri alınır.",
        tone: "dark",
      },
      {
        id: "floating-proof",
        label: "Floating proof",
        result: "Mini panel aynı apply helper'larıyla çalışır.",
        tone: "orange",
      },
    ],
    qaChecks: [
      {
        command: "npm run check",
        evidence: "Lint, typecheck ve workflow validation tek komutta geçmeli.",
        id: "qa-check",
        label: "Static check",
        status: "ready",
      },
      {
        command: "npm run build",
        evidence: "Next production build tüm app route'larını üretmeli.",
        id: "qa-build",
        label: "Production build",
        status: "ready",
      },
      {
        command: "GET /api/agent/runtime",
        evidence: "Buyer ve seller runtime template version 8Q.1, handoff 8R döner.",
        id: "qa-runtime",
        label: "Runtime smoke",
        status: "ready",
      },
      {
        evidence: "Buyer cart apply, seller rollback ve floating mute/snooze Puppeteer ile doğrulanır.",
        id: "qa-browser",
        label: "Browser rehearsal",
        status: "manual",
      },
    ],
    runbook: [
      {
        accent: "orange",
        id: "buyer",
        summary: "Katalogdan başlayıp sepet apply kanıtına gider.",
        title: "Buyer demo",
        steps: [
          {
            command: "Kategoriler ve ürün kartlarını aç",
            expected: "Fotoğraflı marketplace, ürün detay ve sepete ekle CTA görünür.",
            href: "/buyer/products",
            id: "buyer-products",
            title: "Ürün keşfi",
          },
          {
            command: "ClearCam ürün detayını göster",
            expected: "Satış penceresi, fiyat, teslimat ve satın alma kontrolleri okunur.",
            href: "/buyer/products/clearcam-webcam",
            id: "buyer-detail",
            title: "Ürün detayı",
          },
          {
            command: "Floating Agent ile sepeti tamamla",
            expected: "Onay sonrası cart state 3 ürünle güncellenir.",
            href: "/buyer/cart",
            id: "buyer-floating",
            title: "Sepet apply",
          },
        ],
      },
      {
        accent: "slate",
        id: "seller",
        summary: "Riskli üründen listing mutation audit kanıtına gider.",
        title: "Seller demo",
        steps: [
          {
            command: "Satıcı overview uyarılarını aç",
            expected: "Dört risk kartı endpoint hedefleriyle görünür.",
            href: "/seller",
            id: "seller-overview",
            title: "Overview",
          },
          {
            command: "Stok riski focus ile ürünleri sırala",
            expected: "Fotoğraflı ürün listesinde risk sinyali ve linked action görünür.",
            href: "/seller/products?focus=stock-risk",
            id: "seller-products",
            title: "Ürün yönetimi",
          },
          {
            command: "Taslağı uygula ve geri al",
            expected: "Audit entry önce applied, sonra rolled-back olur.",
            href: "/seller/agent",
            id: "seller-agent",
            title: "Agent audit",
          },
        ],
      },
      {
        accent: "emerald",
        id: "floating",
        summary: "Her role sayfasında aynı mini Agent davranışını gösterir.",
        title: "Floating Agent",
        steps: [
          {
            command: "Mini paneli buyer sepetinde aç",
            expected: "Buyer cart apply capability ve shared history görünür.",
            href: "/buyer/cart",
            id: "floating-buyer",
            title: "Buyer context",
          },
          {
            command: "Mini paneli seller products üzerinde aç",
            expected: "Seller listing apply capability ve audit helper görünür.",
            href: "/seller/products",
            id: "floating-seller",
            title: "Seller context",
          },
          {
            command: "Sessize al ve bu sayfada uyarma",
            expected: "commercepilot.floatingAgent.v1 control state kalıcıdır.",
            href: "/seller/products",
            id: "floating-controls",
            title: "Kontroller",
          },
        ],
      },
    ],
    subheadline:
      "Jüri sunumu için buyer, seller ve floating Agent yollarını tek bir prova yüzeyinden başlat; her adım expected result ve QA kanıtıyla kapanır.",
  };
}

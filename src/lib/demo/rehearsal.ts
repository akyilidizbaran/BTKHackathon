import type { AgentTraceLayer } from "@/lib/agents/runtime";

export const demoRehearsalRoute = "/demo";

export type DemoRehearsalLaneId = "buyer" | "floating" | "seller";
export type DemoAgentTraceProofStatus = "contracted";
export type DemoLlmProofStatus = "traceable" | "visible";
export type DemoQualityStatus = "ready" | "watch" | "manual";

export interface DemoRehearsalData {
  agentTraceProofs: DemoAgentTraceProof[];
  ctas: {
    buyer: string;
    qa: string;
    seller: string;
  };
  headline: string;
  llmProofs: DemoLlmProof[];
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

export interface DemoAgentTraceProof {
  endpoint: string;
  evidence: string;
  expectedToolIds: string[];
  id: string;
  requiredLayers: AgentTraceLayer[];
  route: string;
  status: DemoAgentTraceProofStatus;
  surface: string;
}

export interface DemoLlmProof {
  endpoint: string;
  evidence: string;
  fields: string[];
  id: string;
  route: string;
  status: DemoLlmProofStatus;
  surface: string;
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
    agentTraceProofs: [
      {
        endpoint: "POST /api/buyer/agent",
        evidence: "Buyer Agent response top-level `agentTrace` içinde context, workflow, LLM, guardrail, approval ve cart apply tool boundary taşır.",
        expectedToolIds: ["buyer.agent.cart.apply.preview"],
        id: "buyer-agent-execution-trace",
        requiredLayers: ["context", "workflow", "llm", "guardrail", "approval", "tool"],
        route: "/buyer/agent",
        status: "contracted",
        surface: "Buyer Agent",
      },
      {
        endpoint: "POST /api/seller/agent",
        evidence: "Seller Agent response top-level `agentTrace` içinde seller context, risk workflow, LLM draft, guardrail, approval ve listing apply/audit tool boundary taşır.",
        expectedToolIds: ["seller.agent.listing.apply"],
        id: "seller-agent-execution-trace",
        requiredLayers: ["context", "workflow", "llm", "guardrail", "approval", "tool"],
        route: "/seller/agent",
        status: "contracted",
        surface: "Seller Agent",
      },
      {
        endpoint: "Floating Agent context",
        evidence: "Floating Agent context route Agent endpoint'leriyle aynı runtime, guardrail ve onaylı apply tool contract'ını plan trace olarak taşır.",
        expectedToolIds: ["buyer.agent.cart.apply.preview", "seller.agent.listing.apply"],
        id: "floating-agent-execution-trace",
        requiredLayers: ["context", "workflow", "llm", "guardrail", "approval", "tool"],
        route: "/buyer/cart",
        status: "contracted",
        surface: "Floating Agent",
      },
    ],
    ctas: {
      buyer: "/buyer/products",
      qa: "/demo#qa",
      seller: "/seller",
    },
    headline: "Demo akışı tek nefeste.",
    llmProofs: [
      {
        endpoint: "POST /api/buyer/agent",
        evidence: "Buyer Agent cevabı ve floating buyer sonucu `LlmStatusBadge` ile runtime kaynağını gösterir.",
        fields: ["orchestration.status", "orchestration.provider", "orchestration.model", "orchestration.fallbackReason"],
        id: "buyer-agent-llm",
        route: "/buyer/agent",
        status: "visible",
        surface: "Buyer Agent",
      },
      {
        endpoint: "POST /api/seller/agent",
        evidence: "Seller Agent analiz, ürün sırası ve listing draft yüzeyi aynı orchestration trace'ini taşır.",
        fields: ["orchestration.status", "orchestration.provider", "orchestration.model", "orchestration.fallbackReason"],
        id: "seller-agent-llm",
        route: "/seller/agent",
        status: "visible",
        surface: "Seller Agent",
      },
      {
        endpoint: "POST /api/buyer/smart-cart/explanation",
        evidence: "Smart-cart explanation paneli provider bağımsız status satırıyla generated/fallback ayrımını verir.",
        fields: ["explanation.status", "explanation.provider", "explanation.model", "explanation.fallbackReason"],
        id: "buyer-explanation-llm",
        route: "/buyer/cart",
        status: "visible",
        surface: "Buyer explanation",
      },
      {
        endpoint: "GET /api/seller/actions/[id]/explanation",
        evidence: "Seller action explanation paneli model açıklamasını fallback reason ile birlikte izlenebilir yapar.",
        fields: ["explanation.status", "explanation.provider", "explanation.model", "explanation.fallbackReason"],
        id: "seller-explanation-llm",
        route: "/seller/actions",
        status: "visible",
        surface: "Seller explanation",
      },
      {
        endpoint: "POST /api/review-intelligence",
        evidence: "Review intelligence endpoint'i UI açıklamalarını besler; model/fallback izi API contract'ında kalır.",
        fields: ["intelligence.status", "intelligence.provider", "intelligence.model", "intelligence.fallbackReason"],
        id: "review-intelligence-llm",
        route: "/api/review-intelligence",
        status: "traceable",
        surface: "Review Intelligence",
      },
    ],
    marquee: [
      "Buyer products",
      "Buyer cart apply",
      "Floating Agent",
      "Seller products",
      "Seller audit rollback",
      "Runtime 8Q.1",
      "LLM trace visible",
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
        command: "POST /api/buyer/agent + POST /api/seller/agent",
        evidence: "Agent UI, floating panel ve explanation panellerinde provider/model/status/fallbackReason görünür veya API trace edilebilir.",
        id: "qa-llm-trace",
        label: "LLM trace UI",
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

import { buyerCatalogEndpoint } from "@/lib/api/buyer-catalog";
import { buyerAgentApplyEndpoint } from "@/lib/agents/buyer-cart-apply";
import {
  sellerAgentApplyEndpoint,
  sellerAgentListingApplyToolId,
} from "@/lib/agents/seller-listing-apply";
import {
  sellerActionsEndpoint,
  sellerBuyerSignalsEndpoint,
} from "@/lib/api/seller";
import { sellerProfileEndpoint } from "@/lib/api/seller-profile";

export const sharedAgentRuntimeEndpoint = "/api/agent/runtime";
const buyerAgentEndpoint = "/api/buyer/agent";
const sellerAgentEndpoint = "/api/seller/agent";
const sellerProductsEndpoint = "/api/seller/products";

export type AgentRole = "buyer" | "seller";
export type AgentSurface = "floating" | "route";
export type AgentRiskLevel = "calm" | "safe" | "warning";

export type AgentPromptTemplateId =
  | "buyer-smart-cart-route"
  | "seller-growth-route";

export type AgentToolId =
  | "buyer.agent.cart.apply.preview"
  | "buyer.catalog.search"
  | "buyer.profile.read"
  | "seller.actions.suggest"
  | "seller.agent.listing.apply"
  | "seller.agent.listing.preview"
  | "seller.buyer-signals.read"
  | "seller.products.rank"
  | "seller.profile.permissions";

export interface AgentPromptTemplate {
  id: AgentPromptTemplateId;
  role: AgentRole;
  label: string;
  version: string;
  endpoint: string;
  maxPromptLength: number;
  systemInstruction: string;
  responseContract: string;
  examplePrompts: string[];
}

export interface AgentToolDefinition {
  id: AgentToolId;
  role: AgentRole;
  label: string;
  description: string;
  endpoint: string;
  method: "GET" | "PATCH" | "POST";
  inputContract: string;
  outputContract: string;
  requiresApproval: boolean;
  mutationKind: "apply" | "none" | "preview";
  scope: "cart" | "catalog" | "profile" | "seller-actions" | "seller-products";
}

export interface AgentRuntimeRequestContract {
  actorId: string;
  prompt: string;
  role: AgentRole;
  routeContext: string;
  surface: AgentSurface;
}

export interface AgentToolPlanItem {
  id: AgentToolId;
  label: string;
  endpoint: string;
  method: AgentToolDefinition["method"];
  requiresApproval: boolean;
  mutationKind: AgentToolDefinition["mutationKind"];
}

export type AgentTraceLayer = "approval" | "context" | "guardrail" | "llm" | "tool" | "workflow";
export type AgentTraceStatus = "completed" | "guarded" | "pending" | "ready";

export interface AgentTraceItem {
  detail: string;
  endpoint?: string;
  id: string;
  label: string;
  layer: AgentTraceLayer;
  order: number;
  requiresApproval?: boolean;
  status: AgentTraceStatus;
  toolId?: AgentToolId;
}

export interface AgentExecutionTrace {
  coverage: Record<AgentTraceLayer, boolean>;
  generatedAt: string;
  id: string;
  items: AgentTraceItem[];
  role: AgentRole;
  summary: string;
  surface: AgentSurface;
}

export interface AgentRuntimeSnapshot {
  runtimeId: string;
  role: AgentRole;
  surface: AgentSurface;
  request: AgentRuntimeRequestContract;
  promptTemplate: Pick<
    AgentPromptTemplate,
    "id" | "label" | "maxPromptLength" | "responseContract" | "version"
  >;
  toolPlan: AgentToolPlanItem[];
  guardrails: string[];
  registry: {
    promptTemplateCount: number;
    toolCount: number;
    approvalRequiredToolCount: number;
    readOnlyToolCount: number;
  };
  handoff: {
    nextMilestone: "8O" | "8P" | "8Q" | "8R";
    summary: string;
  };
}

export interface SharedAgentRuntimeApiData {
  contract: {
    envelope: "success/data/error";
    source: "shared-agent-runtime-registry";
    generatedAt: string;
    endpoint: typeof sharedAgentRuntimeEndpoint;
    method: "GET";
  };
  promptTemplates: AgentPromptTemplate[];
  tools: AgentToolDefinition[];
  routeSnapshots: AgentRuntimeSnapshot[];
  summary: {
    promptTemplateCount: number;
    toolCount: number;
    roleCount: number;
    approvalRequiredToolCount: number;
  };
}

export const agentPromptTemplates: AgentPromptTemplate[] = [
  {
    endpoint: buyerAgentEndpoint,
    examplePrompts: [
      "Toplantı için uyumlu kamera mikrofon hub öner.",
      "3000 TL altı old-money kazak ve pantolon getir.",
      "Spor kulaklıkta ter ve iade riski düşük ürün seç.",
    ],
    id: "buyer-smart-cart-route",
    label: "Buyer smart cart",
    maxPromptLength: 280,
    responseContract: "recommendations + confirmationQuestion + shared apply preview boundary",
    role: "buyer",
    systemInstruction: "Sadece CommercePilot katalog ürünlerinden seç; kullanıcı onayı olmadan sepete ürün ekleme.",
    version: "8Q.1",
  },
  {
    endpoint: sellerAgentEndpoint,
    examplePrompts: [
      "Satılmayan ürünlerimi sırala ve ilk 3 sebebi açıkla.",
      "Negatif yorum gelen ürünleri grupla.",
      "Stok riski olan ürünleri göster ve bugün ne yapacağımı sırala.",
    ],
    id: "seller-growth-route",
    label: "Seller growth analysis",
    maxPromptLength: 360,
    responseContract: "productFindings + actionSuggestions + draftPreview + shared apply/audit boundary",
    role: "seller",
    systemInstruction: "Ürün ve action contract'larını kanıt olarak oku; satıcı onayı olmadan mutation uygulama.",
    version: "8Q.1",
  },
];

export const agentToolRegistry: AgentToolDefinition[] = [
  {
    description: "Katalog ürünlerini kategori, fiyat, teslimat ve görsel metadata ile okur.",
    endpoint: buyerCatalogEndpoint,
    id: "buyer.catalog.search",
    inputContract: "{ category?, query?, sort? }",
    label: "Catalog search",
    method: "GET",
    mutationKind: "none",
    outputContract: "BuyerCatalogApiData",
    requiresApproval: false,
    role: "buyer",
    scope: "catalog",
  },
  {
    description: "Buyer profil tercihlerini ve learned signals bilgisini okur.",
    endpoint: "/api/buyer/profile",
    id: "buyer.profile.read",
    inputContract: "{ buyerId? }",
    label: "Buyer profile read",
    method: "GET",
    mutationKind: "none",
    outputContract: "BuyerProfileApiData",
    requiresApproval: false,
    role: "buyer",
    scope: "profile",
  },
  {
    description: "Cart mutation payload'unu ortak contract'a çevirir; route Agent ve Pet Panel aynı client helper ile uygular.",
    endpoint: buyerAgentApplyEndpoint,
    id: "buyer.agent.cart.apply.preview",
    inputContract: "{ strategy: append|replace, items: { productId, quantity? }[] }",
    label: "Cart apply preview",
    method: "POST",
    mutationKind: "apply",
    outputContract: "BuyerAgentApplyApiData + BuyerAgentCartMutationContract",
    requiresApproval: true,
    role: "buyer",
    scope: "cart",
  },
  {
    description: "Satıcı ürünlerini risk focus, health score ve linked action bilgisiyle sıralar.",
    endpoint: sellerProductsEndpoint,
    id: "seller.products.rank",
    inputContract: "{ sellerId?, focus? }",
    label: "Seller products rank",
    method: "GET",
    mutationKind: "none",
    outputContract: "SellerProductsApiData",
    requiresApproval: false,
    role: "seller",
    scope: "seller-products",
  },
  {
    description: "Seller action kuyruğunu focus/category bazında öneriye çevirir.",
    endpoint: sellerActionsEndpoint,
    id: "seller.actions.suggest",
    inputContract: "{ sellerId?, focus? }",
    label: "Seller actions suggest",
    method: "GET",
    mutationKind: "none",
    outputContract: "SellerActionsApiData",
    requiresApproval: false,
    role: "seller",
    scope: "seller-actions",
  },
  {
    description: "Alıcı ihtiyaçlarından satıcı tarafına gelen sinyalleri okur.",
    endpoint: sellerBuyerSignalsEndpoint,
    id: "seller.buyer-signals.read",
    inputContract: "{ sellerId? }",
    label: "Buyer signals read",
    method: "GET",
    mutationKind: "none",
    outputContract: "SellerBuyerSignalsApiData",
    requiresApproval: false,
    role: "seller",
    scope: "seller-actions",
  },
  {
    description: "Seller permission mode ve capability sınırlarını okur.",
    endpoint: sellerProfileEndpoint,
    id: "seller.profile.permissions",
    inputContract: "{ sellerId? }",
    label: "Seller permissions",
    method: "GET",
    mutationKind: "none",
    outputContract: "SellerProfileApiData",
    requiresApproval: false,
    role: "seller",
    scope: "profile",
  },
  {
    description: "Listeleme/fiyat/kampanya için before/after mutation önizlemesi temsil eder; uygulamaz.",
    endpoint: sellerAgentEndpoint,
    id: "seller.agent.listing.preview",
    inputContract: "{ sellerId?, prompt }",
    label: "Listing preview",
    method: "POST",
    mutationKind: "preview",
    outputContract: "SellerAgentDraftPreview",
    requiresApproval: true,
    role: "seller",
    scope: "seller-products",
  },
  {
    description: "Onaylanan seller listing mutation payload'unu audit log'a yazılabilir ortak apply contract'ına çevirir.",
    endpoint: sellerAgentApplyEndpoint,
    id: sellerAgentListingApplyToolId,
    inputContract: "{ productId, mutation: { title, description, price, campaignLabel }, before? }",
    label: "Listing apply",
    method: "POST",
    mutationKind: "apply",
    outputContract: "SellerListingMutationApplyApiData + SellerListingMutationContract",
    requiresApproval: true,
    role: "seller",
    scope: "seller-products",
  },
];

const defaultToolIdsByRole: Record<AgentRole, AgentToolId[]> = {
  buyer: [
    "buyer.catalog.search",
    "buyer.profile.read",
    "buyer.agent.cart.apply.preview",
  ],
  seller: [
    "seller.products.rank",
    "seller.actions.suggest",
    "seller.buyer-signals.read",
    "seller.profile.permissions",
    "seller.agent.listing.preview",
    "seller.agent.listing.apply",
  ],
};

export function getAgentPromptTemplate(role: AgentRole): AgentPromptTemplate {
  const promptTemplate = agentPromptTemplates.find((template) => template.role === role);

  if (!promptTemplate) {
    throw new Error(`Agent prompt template not found for role: ${role}`);
  }

  return promptTemplate;
}

export function getAgentTools(role: AgentRole, toolIds = defaultToolIdsByRole[role]): AgentToolDefinition[] {
  const toolSet = new Set(toolIds);

  return agentToolRegistry.filter((tool) => tool.role === role && toolSet.has(tool.id));
}

export function createAgentRuntimeSnapshot(input: {
  actorId: string;
  prompt: string;
  role: AgentRole;
  routeContext?: string;
  surface?: AgentSurface;
  toolIds?: AgentToolId[];
}): AgentRuntimeSnapshot {
  const promptTemplate = getAgentPromptTemplate(input.role);
  const tools = getAgentTools(input.role, input.toolIds);
  const toolPlan = tools.map((tool) => ({
    endpoint: tool.endpoint,
    id: tool.id,
    label: tool.label,
    method: tool.method,
    mutationKind: tool.mutationKind,
    requiresApproval: tool.requiresApproval,
  }));
  const approvalRequiredToolCount = tools.filter((tool) => tool.requiresApproval).length;

  return {
    guardrails: createGuardrails(input.role),
    handoff: createHandoff(input.role),
    promptTemplate: {
      id: promptTemplate.id,
      label: promptTemplate.label,
      maxPromptLength: promptTemplate.maxPromptLength,
      responseContract: promptTemplate.responseContract,
      version: promptTemplate.version,
    },
    registry: {
      approvalRequiredToolCount,
      promptTemplateCount: agentPromptTemplates.length,
      readOnlyToolCount: tools.filter((tool) => tool.mutationKind === "none").length,
      toolCount: tools.length,
    },
    request: {
      actorId: input.actorId,
      prompt: input.prompt.trim(),
      role: input.role,
      routeContext: input.routeContext ?? (input.role === "buyer" ? "/buyer/agent" : "/seller/agent"),
      surface: input.surface ?? "route",
    },
    role: input.role,
    runtimeId: `${input.role}-${input.surface ?? "route"}-8q`,
    surface: input.surface ?? "route",
    toolPlan,
  };
}

export function createAgentExecutionTrace(input: {
  generatedAt: string;
  items: Array<Omit<AgentTraceItem, "order">>;
  runtime: AgentRuntimeSnapshot;
  summary: string;
}): AgentExecutionTrace {
  const items = input.items.map((item, index) => ({
    ...item,
    order: index + 1,
  }));

  return {
    coverage: createTraceCoverage(items),
    generatedAt: input.generatedAt,
    id: `${input.runtime.runtimeId}-execution-trace`,
    items,
    role: input.runtime.role,
    summary: input.summary,
    surface: input.runtime.surface,
  };
}

export function getSharedAgentRuntimeApiData(): SharedAgentRuntimeApiData {
  const routeSnapshots = [
    createAgentRuntimeSnapshot({
      actorId: "buyer-aylin",
      prompt: agentPromptTemplates[0].examplePrompts[0],
      role: "buyer",
    }),
    createAgentRuntimeSnapshot({
      actorId: "seller-commercepilot",
      prompt: agentPromptTemplates[1].examplePrompts[0],
      role: "seller",
    }),
  ];

  return {
    contract: {
      endpoint: sharedAgentRuntimeEndpoint,
      envelope: "success/data/error",
      generatedAt: "2026-05-16",
      method: "GET",
      source: "shared-agent-runtime-registry",
    },
    promptTemplates: agentPromptTemplates,
    routeSnapshots,
    summary: {
      approvalRequiredToolCount: agentToolRegistry.filter((tool) => tool.requiresApproval).length,
      promptTemplateCount: agentPromptTemplates.length,
      roleCount: 2,
      toolCount: agentToolRegistry.length,
    },
    tools: agentToolRegistry,
  };
}

function createTraceCoverage(items: AgentTraceItem[]): Record<AgentTraceLayer, boolean> {
  const layers: AgentTraceLayer[] = ["context", "workflow", "llm", "guardrail", "approval", "tool"];

  return layers.reduce<Record<AgentTraceLayer, boolean>>(
    (coverage, layer) => ({
      ...coverage,
      [layer]: items.some((item) => item.layer === layer),
    }),
    {
      approval: false,
      context: false,
      guardrail: false,
      llm: false,
      tool: false,
      workflow: false,
    },
  );
}

function createGuardrails(role: AgentRole): string[] {
  if (role === "buyer") {
    return [
      "Katalog dışı ürün önerme.",
      "Sepete uygulama için kullanıcı onayı bekle.",
      "Buyer profile sinyallerini gerekçede görünür tut.",
    ];
  }

  return [
    "Ürün/action contract kanıtı olmadan öneri üretme.",
    "Listeleme/fiyat/kampanya mutation'ını onaysız uygulama.",
    "Seller profile permission sınırını her response içinde taşı.",
  ];
}

function createHandoff(role: AgentRole): AgentRuntimeSnapshot["handoff"] {
  if (role === "buyer") {
    return {
      nextMilestone: "8R",
      summary: "Floating panel buyer cart apply yolunu kullanır; sıradaki adım end-to-end demo hardening.",
    };
  }

  return {
    nextMilestone: "8R",
    summary: "Floating panel seller listing apply/audit yolunu kullanır; sıradaki adım end-to-end demo hardening.",
  };
}

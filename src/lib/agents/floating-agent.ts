import {
  createAgentRuntimeSnapshot,
  type AgentRole,
  type AgentRuntimeSnapshot,
} from "@/lib/agents/runtime";

export const floatingAgentStorageKey = "commercepilot.floatingAgent.v1";
export const floatingAgentUpdatedEvent = "commercepilot:floating-agent-updated";

export type FloatingAgentControlId = "hide-panel" | "mute" | "snooze-page";
export type FloatingAgentCapabilityKind = "apply" | "chat" | "read" | "suggest";
export type FloatingAgentTurnRole = "assistant" | "system" | "user";

export interface FloatingAgentControlState {
  disabledRoutes: string[];
  muted: boolean;
}

export interface FloatingAgentHistoryTurn {
  content: string;
  createdAt: string;
  id: string;
  role: FloatingAgentTurnRole;
  roleScope: AgentRole;
  routeContext: string;
}

export interface FloatingAgentStore {
  control: FloatingAgentControlState;
  history: FloatingAgentHistoryTurn[];
  version: 1;
}

export interface FloatingAgentContext {
  actorId: string;
  capabilities: FloatingAgentCapability[];
  controls: FloatingAgentControl[];
  defaultPrompt: string;
  panelTitle: string;
  pathname: string;
  proactiveMessage: string;
  role: AgentRole;
  routeAgentHref: "/buyer/agent" | "/seller/agent";
  routeLabel: string;
  runtime: AgentRuntimeSnapshot;
  sharedMutationNotes: string[];
}

export interface FloatingAgentCapability {
  helper: string;
  href: string;
  id: string;
  kind: FloatingAgentCapabilityKind;
  label: string;
  requiresApproval: boolean;
}

export interface FloatingAgentControl {
  description: string;
  id: FloatingAgentControlId;
  label: string;
}

export function createFloatingAgentContext(input: {
  pathname: string;
  role: AgentRole;
}): FloatingAgentContext {
  const route = resolveFloatingAgentRoute(input.role, input.pathname);
  const runtime = createAgentRuntimeSnapshot({
    actorId: route.actorId,
    prompt: route.defaultPrompt,
    role: input.role,
    routeContext: input.pathname,
    surface: "floating",
  });

  return {
    actorId: route.actorId,
    capabilities: createCapabilities(input.role),
    controls: createControls(),
    defaultPrompt: route.defaultPrompt,
    panelTitle: route.panelTitle,
    pathname: input.pathname,
    proactiveMessage: route.proactiveMessage,
    role: input.role,
    routeAgentHref: input.role === "buyer" ? "/buyer/agent" : "/seller/agent",
    routeLabel: route.routeLabel,
    runtime,
    sharedMutationNotes: input.role === "buyer"
      ? [
          "Buyer cart apply shared endpoint ve client helper ile çalışır.",
          "Floating Agent sadece kullanıcı onayı sonrası cart state yazar.",
        ]
      : [
          "Seller listing apply shared endpoint ve audit helper ile çalışır.",
          "Floating Agent sadece kullanıcı onayı sonrası listing override yazar.",
        ],
  };
}

export function createDefaultFloatingAgentStore(): FloatingAgentStore {
  return {
    control: {
      disabledRoutes: [],
      muted: false,
    },
    history: [],
    version: 1,
  };
}

export function normalizeFloatingAgentPathname(pathname: string): string {
  const normalized = pathname.trim() || "/";

  if (normalized.length > 1 && normalized.endsWith("/")) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

function resolveFloatingAgentRoute(role: AgentRole, pathname: string) {
  const normalizedPathname = normalizeFloatingAgentPathname(pathname);

  if (role === "buyer") {
    if (normalizedPathname.startsWith("/buyer/cart")) {
      return {
        actorId: "buyer-aylin",
        defaultPrompt: "Sepetimi toplantı ve teslimat beklentime göre tamamla.",
        panelTitle: "Sepet agent",
        proactiveMessage: "Sepetteki seçkiyi onaylı Agent önerisine çevirebilirim.",
        routeLabel: "Buyer sepet",
      };
    }

    if (normalizedPathname.startsWith("/buyer/profile")) {
      return {
        actorId: "buyer-aylin",
        defaultPrompt: "Profilimdeki tercihlerle 3000 TL altı ürün öner.",
        panelTitle: "Profil agent",
        proactiveMessage: "Profil sinyallerini kullanarak daha net ürün seçebilirim.",
        routeLabel: "Buyer profil",
      };
    }

    if (normalizedPathname.startsWith("/buyer/agent")) {
      return {
        actorId: "buyer-aylin",
        defaultPrompt: "Toplantı için uyumlu kamera mikrofon hub öner.",
        panelTitle: "Buyer agent",
        proactiveMessage: "Route Agent ile aynı cart apply yolunu kullanıyorum.",
        routeLabel: "Buyer agent",
      };
    }

    if (normalizedPathname.startsWith("/buyer/products/")) {
      return {
        actorId: "buyer-aylin",
        defaultPrompt: "Bu ürüne uyumlu tamamlayıcıları öner ve sepete eklemeye hazırla.",
        panelTitle: "Ürün agent",
        proactiveMessage: "Bu ürün için tamamlayıcı sepet önerisi hazırlayabilirim.",
        routeLabel: "Buyer ürün detayı",
      };
    }

    return {
      actorId: "buyer-aylin",
      defaultPrompt: "3000 TL altı kaliteli ve hızlı teslim ürün öner.",
      panelTitle: "Marketplace agent",
      proactiveMessage: "Katalogdaki ürünlerden onaylı sepet seçkisi oluşturabilirim.",
      routeLabel: "Buyer ürünler",
    };
  }

  if (normalizedPathname.startsWith("/seller/products")) {
    return {
      actorId: "seller-commercepilot",
      defaultPrompt: "Stok riski olan ürünleri göster ve bugün ne yapacağımı sırala.",
      panelTitle: "Ürün yönetimi agent",
      proactiveMessage: "Bu ürün listesinden riskli adayları agent sırasına alabilirim.",
      routeLabel: "Seller ürünler",
    };
  }

  if (normalizedPathname.startsWith("/seller/actions")) {
    return {
      actorId: "seller-commercepilot",
      defaultPrompt: "Negatif yorum gelen ürünleri grupla ve ilk aksiyonu seç.",
      panelTitle: "Aksiyon agent",
      proactiveMessage: "Aksiyon kuyruğunu ürün kanıtıyla özetleyebilirim.",
      routeLabel: "Seller aksiyonlar",
    };
  }

  if (normalizedPathname.startsWith("/seller/profile")) {
    return {
      actorId: "seller-commercepilot",
      defaultPrompt: "Agent yetkilerimi onaylı apply sınırına göre özetle.",
      panelTitle: "Yetki agent",
      proactiveMessage: "Onay ve audit sınırlarını bu sayfadan okuyabilirim.",
      routeLabel: "Seller profil",
    };
  }

  if (normalizedPathname.startsWith("/seller/agent")) {
    return {
      actorId: "seller-commercepilot",
      defaultPrompt: "Satılmayan ürünlerimi sırala ve ilk 3 sebebi açıkla.",
      panelTitle: "Seller agent",
      proactiveMessage: "Route Agent ile aynı listing apply ve audit yolunu kullanıyorum.",
      routeLabel: "Seller agent",
    };
  }

  return {
    actorId: "seller-commercepilot",
    defaultPrompt: "Satılmayan ürünlerimi sırala ve ilk 3 sebebi açıkla.",
    panelTitle: "Satıcı merkezi agent",
    proactiveMessage: "Bu paneldeki seller sinyallerini mini analiz olarak açabilirim.",
    routeLabel: "Seller ana sayfa",
  };
}

function createCapabilities(role: AgentRole): FloatingAgentCapability[] {
  if (role === "buyer") {
    return [
      {
        helper: "createAgentRuntimeSnapshot(surface=floating)",
        href: "/api/agent/runtime",
        id: "runtime",
        kind: "read",
        label: "Ortak runtime",
        requiresApproval: false,
      },
      {
        helper: "POST /api/buyer/agent",
        href: "/buyer/agent",
        id: "buyer-suggest",
        kind: "suggest",
        label: "Ürün öner",
        requiresApproval: false,
      },
      {
        helper: "applyBuyerAgentCartMutation",
        href: "/api/buyer/agent/apply",
        id: "buyer-cart-apply",
        kind: "apply",
        label: "Sepete uygula",
        requiresApproval: true,
      },
    ];
  }

  return [
    {
      helper: "createAgentRuntimeSnapshot(surface=floating)",
      href: "/api/agent/runtime",
      id: "runtime",
      kind: "read",
      label: "Ortak runtime",
      requiresApproval: false,
    },
    {
      helper: "POST /api/seller/agent",
      href: "/seller/agent",
      id: "seller-analysis",
      kind: "suggest",
      label: "Ürün analiz et",
      requiresApproval: false,
    },
    {
      helper: "applySellerListingMutation",
      href: "/api/seller/agent/apply",
      id: "seller-listing-apply",
      kind: "apply",
      label: "Listing uygula",
      requiresApproval: true,
    },
  ];
}

function createControls(): FloatingAgentControl[] {
  return [
    {
      description: "Paneli kapatır, avatar erişilebilir kalır.",
      id: "hide-panel",
      label: "Gizle",
    },
    {
      description: "Proactive badge ve öneri balonunu susturur.",
      id: "mute",
      label: "Sessize al",
    },
    {
      description: "Sadece mevcut route için uyarı göstermeyi durdurur.",
      id: "snooze-page",
      label: "Bu sayfada uyarma",
    },
  ];
}

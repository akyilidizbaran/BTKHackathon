"use client";

import {
  createDefaultFloatingAgentStore,
  floatingAgentStorageKey,
  floatingAgentUpdatedEvent,
  normalizeFloatingAgentPathname,
  type FloatingAgentControlState,
  type FloatingAgentHistoryTurn,
  type FloatingAgentStore,
} from "@/lib/agents/floating-agent";

export function readFloatingAgentStore(): FloatingAgentStore {
  if (typeof window === "undefined") {
    return createDefaultFloatingAgentStore();
  }

  const rawValue = window.localStorage.getItem(floatingAgentStorageKey);

  if (!rawValue) {
    return createDefaultFloatingAgentStore();
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<FloatingAgentStore>;

    if (!parsedValue || typeof parsedValue !== "object") {
      return createDefaultFloatingAgentStore();
    }

    return {
      control: normalizeControlState(parsedValue.control),
      history: Array.isArray(parsedValue.history)
        ? parsedValue.history.filter(isHistoryTurn).slice(0, 24)
        : [],
      version: 1,
    };
  } catch {
    return createDefaultFloatingAgentStore();
  }
}

export function writeFloatingAgentStore(store: FloatingAgentStore): FloatingAgentStore {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(floatingAgentStorageKey, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(floatingAgentUpdatedEvent, { detail: store }));
  }

  return store;
}

export function updateFloatingAgentControl(
  updater: (control: FloatingAgentControlState) => FloatingAgentControlState,
): FloatingAgentStore {
  const currentStore = readFloatingAgentStore();

  return writeFloatingAgentStore({
    ...currentStore,
    control: updater(currentStore.control),
  });
}

export function appendFloatingAgentTurn(turn: Omit<FloatingAgentHistoryTurn, "createdAt" | "id">): FloatingAgentStore {
  const currentStore = readFloatingAgentStore();
  const nextTurn: FloatingAgentHistoryTurn = {
    ...turn,
    createdAt: new Date().toISOString(),
    id: `floating.turn.${Date.now()}.${Math.round(Math.random() * 1000)}`,
  };

  return writeFloatingAgentStore({
    ...currentStore,
    history: [nextTurn, ...currentStore.history].slice(0, 24),
  });
}

export function toggleFloatingAgentRouteDisabled(pathname: string): FloatingAgentStore {
  const normalizedPathname = normalizeFloatingAgentPathname(pathname);

  return updateFloatingAgentControl((control) => {
    const disabledRoutes = control.disabledRoutes.includes(normalizedPathname)
      ? control.disabledRoutes.filter((route) => route !== normalizedPathname)
      : [normalizedPathname, ...control.disabledRoutes].slice(0, 24);

    return {
      ...control,
      disabledRoutes,
    };
  });
}

function normalizeControlState(value: unknown): FloatingAgentControlState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return createDefaultFloatingAgentStore().control;
  }

  const control = value as Partial<FloatingAgentControlState>;

  return {
    disabledRoutes: Array.isArray(control.disabledRoutes)
      ? control.disabledRoutes
          .filter((route): route is string => typeof route === "string")
          .map(normalizeFloatingAgentPathname)
          .slice(0, 24)
      : [],
    muted: Boolean(control.muted),
  };
}

function isHistoryTurn(value: unknown): value is FloatingAgentHistoryTurn {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof (value as FloatingAgentHistoryTurn).content === "string" &&
      typeof (value as FloatingAgentHistoryTurn).createdAt === "string" &&
      typeof (value as FloatingAgentHistoryTurn).id === "string" &&
      ((value as FloatingAgentHistoryTurn).role === "assistant" ||
        (value as FloatingAgentHistoryTurn).role === "system" ||
        (value as FloatingAgentHistoryTurn).role === "user") &&
      ((value as FloatingAgentHistoryTurn).roleScope === "buyer" ||
        (value as FloatingAgentHistoryTurn).roleScope === "seller") &&
      typeof (value as FloatingAgentHistoryTurn).routeContext === "string",
  );
}

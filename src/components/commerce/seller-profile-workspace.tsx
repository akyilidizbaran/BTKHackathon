"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BellRinging,
  CheckCircle,
  Clock,
  EyeSlash,
  FloppyDisk,
  LockKey,
  Megaphone,
  Package,
  PaperPlaneTilt,
  Robot,
  ShieldCheck,
  SlidersHorizontal,
  Storefront,
  WarningCircle,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { ApiEnvelope } from "@/lib/api/responses";
import {
  sellerProfileEndpoint,
  type SellerAgentCapability,
  type SellerAgentCapabilityId,
  type SellerAgentPermissionMode,
  type SellerAlertRuleId,
  type SellerAlertThreshold,
  type SellerNotificationChannelId,
  type SellerProfileApiData,
  type SellerProfileAlertRule,
  type SellerProfileEditableState,
} from "@/lib/api/seller-profile";
import {
  readSellerProfileDraft,
  writeSellerProfileDraft,
} from "@/lib/profile/seller-profile-storage";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface SellerProfileWorkspaceProps {
  initialData: SellerProfileApiData;
}

type SaveStatus =
  | { state: "idle"; message?: undefined }
  | { state: "saving"; message?: undefined }
  | { state: "saved"; message: string }
  | { state: "error"; message: string };

const thresholdOptions: Array<{ id: SellerAlertThreshold; label: string; helper: string }> = [
  { helper: "Her sinyalde göster", id: "low", label: "Düşük" },
  { helper: "Tekrarlayan işaretlerde", id: "medium", label: "Orta" },
  { helper: "Öncelik kuyruğuna girince", id: "high", label: "Yüksek" },
  { helper: "Bugün aksiyon gerektirince", id: "critical", label: "Kritik" },
];

const capabilityIconMap: Partial<Record<SellerAgentCapabilityId, typeof Package>> = {
  "auto-apply": LockKey,
  "campaign-draft": Megaphone,
  "listing-draft": PaperPlaneTilt,
  "price-suggestion": SlidersHorizontal,
  "product-analysis": Package,
  "review-reply-draft": BellRinging,
  "stock-alert": WarningCircle,
};

export function SellerProfileWorkspace({ initialData }: SellerProfileWorkspaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState(initialData);
  const [editable, setEditable] = useState(initialData.editable);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: "idle" });

  const selectedCapabilitySet = useMemo(
    () => new Set(editable.enabledCapabilityIds),
    [editable.enabledCapabilityIds],
  );
  const selectedChannelSet = useMemo(
    () => new Set(editable.notificationChannelIds),
    [editable.notificationChannelIds],
  );
  const activeMode = data.permissionModes.find((mode) => mode.id === editable.permissionMode) ?? data.permissionModes[1];
  const railChips = useMemo(
    () => [
      data.summary.permissionLabel,
      `${data.summary.selectedCapabilityCount} yetki`,
      `${data.summary.enabledNotificationCount} kanal`,
      data.summary.autoApplyAllowed ? "Otomatik uygulama açık" : "Otomatik uygulama kapalı",
      data.summary.quietHoursLabel,
      "Onay olmadan işlem yok",
    ],
    [data.summary],
  );

  useEffect(() => {
    const draft = readSellerProfileDraft(initialData.editable.sellerId);

    if (!draft) {
      return;
    }

    const storedDraft = draft;
    let isActive = true;

    async function syncDraft() {
      await Promise.resolve();

      if (!isActive) {
        return;
      }

      setEditable(storedDraft);

      try {
        const response = await fetch(sellerProfileEndpoint, {
          body: JSON.stringify(storedDraft),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        });
        const envelope = (await response.json()) as ApiEnvelope<SellerProfileApiData>;

        if (isActive && response.ok && envelope.success) {
          setData(envelope.data);
          setEditable(envelope.data.editable);
        }
      } catch {
        // Local seller profile draft remains usable if the mock route is temporarily unavailable.
      }
    }

    void syncDraft();

    return () => {
      isActive = false;
    };
  }, [initialData.editable.sellerId]);

  useEffect(() => {
    if (saveStatus.state !== "saved") {
      return;
    }

    const timeoutId = window.setTimeout(() => setSaveStatus({ state: "idle" }), 2600);

    return () => window.clearTimeout(timeoutId);
  }, [saveStatus.state]);

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-seller-profile-reveal]",
        {
          opacity: 0,
          y: 18,
        },
        {
          clearProps: "opacity,transform",
          duration: 0.56,
          ease: "power3.out",
          opacity: 1,
          stagger: 0.055,
          y: 0,
        },
      );

      gsap.utils.toArray<HTMLElement>("[data-seller-profile-stack]").forEach((element, index) => {
        gsap.fromTo(
          element,
          {
            opacity: 0.72,
            y: 30 + index * 8,
          },
          {
            ease: "power2.out",
            opacity: 1,
            scrollTrigger: {
              end: "top 25%",
              scrub: true,
              start: "top 88%",
              trigger: element,
            },
            y: 0,
          },
        );
      });

      const pinned = rootRef.current?.querySelector<HTMLElement>("[data-seller-profile-pin]");
      const pinWrap = pinned?.parentElement;

      if (pinned && pinWrap && window.innerWidth >= 1024) {
        ScrollTrigger.create({
          end: "bottom bottom",
          pin: pinned,
          pinSpacing: false,
          start: "top 96px",
          trigger: pinWrap,
        });
      }
    },
    { dependencies: [data.editable.updatedAt], scope: rootRef },
  );

  function updateEditable(nextPartial: Partial<SellerProfileEditableState>) {
    setEditable((current) => ({
      ...current,
      ...nextPartial,
      updatedAt: new Date().toISOString(),
    }));
    setSaveStatus({ state: "idle" });
  }

  function selectPermissionMode(permissionMode: SellerAgentPermissionMode) {
    const mode = data.permissionModes.find((item) => item.id === permissionMode);

    updateEditable({
      enabledCapabilityIds: mode?.recommendedCapabilityIds ?? editable.enabledCapabilityIds,
      permissionMode,
    });
  }

  function toggleCapability(capability: SellerAgentCapability) {
    if (capability.locked) {
      return;
    }

    const nextCapabilities = selectedCapabilitySet.has(capability.id)
      ? editable.enabledCapabilityIds.filter((id) => id !== capability.id)
      : [...editable.enabledCapabilityIds, capability.id];

    updateEditable({ enabledCapabilityIds: nextCapabilities });
  }

  function toggleChannel(channelId: SellerNotificationChannelId) {
    const nextChannels = selectedChannelSet.has(channelId)
      ? editable.notificationChannelIds.filter((id) => id !== channelId)
      : [...editable.notificationChannelIds, channelId];

    updateEditable({ notificationChannelIds: nextChannels.length > 0 ? nextChannels : ["panel"] });
  }

  function updateAlertRule(ruleId: SellerAlertRuleId, nextPartial: Partial<SellerProfileAlertRule>) {
    updateEditable({
      alertRules: editable.alertRules.map((rule) => (
        rule.id === ruleId ? { ...rule, ...nextPartial } : rule
      )),
    });
  }

  function updateProactiveControl(
    key: keyof SellerProfileEditableState["proactiveControls"],
    value: boolean,
  ) {
    updateEditable({
      proactiveControls: {
        ...editable.proactiveControls,
        [key]: value,
      },
    });
  }

  async function saveProfile(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setSaveStatus({ state: "saving" });

    try {
      const response = await fetch(sellerProfileEndpoint, {
        body: JSON.stringify(editable),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const envelope = (await response.json()) as ApiEnvelope<SellerProfileApiData>;

      if (!response.ok || !envelope.success) {
        throw new Error(envelope.error?.message ?? "Satıcı profili kaydedilemedi.");
      }

      setData(envelope.data);
      setEditable(envelope.data.editable);
      writeSellerProfileDraft(envelope.data.editable);
      setSaveStatus({ message: "Satıcı profili ve Agent izinleri kaydedildi.", state: "saved" });
    } catch (error) {
      setSaveStatus({
        message: error instanceof Error ? error.message : "Satıcı profili kaydedilemedi.",
        state: "error",
      });
    }
  }

  return (
    <div ref={rootRef} className="overflow-x-hidden">
      <form className="space-y-8" onSubmit={(event) => void saveProfile(event)}>
        <section className="grid grid-flow-dense items-start gap-5 xl:grid-cols-12">
          <div
            data-seller-profile-reveal
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] xl:col-span-8 md:p-6"
          >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div>
                <h2 className="max-w-5xl text-[clamp(2.1rem,3.8vw,4rem)] font-semibold leading-[1] tracking-[-0.055em] text-slate-950">
                  Mağaza ayarı agent yetkisini belirler.
                </h2>
                <p className="mt-4 max-w-[68ch] text-sm leading-6 text-slate-600">
                  Mağaza bilgisi, Agent izin modu, bildirim eşiği ve sessiz çalışma sınırları tek profilden yönetilir.
                  Agent yalnızca bu izinlerin açık olduğu alanlarda öneri üretir.
                </p>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-orange-500 text-[#fff]">
                    <Storefront size={22} weight="duotone" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{data.seller.displayName}</p>
                    <p className="text-xs text-slate-500">Puan {data.seller.rating.toFixed(1)}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-700">{data.agentPreview.summary}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <TextField
                helper="Satıcı paneli ve Agent cevaplarında görünen mağaza adı."
                id="seller-store-name"
                label="Mağaza adı"
                value={editable.storeDisplayName}
                onChange={(value) => updateEditable({ storeDisplayName: value })}
              />
              <NumberField
                helper="Destek ve yorum action'larında SLA sinyali olarak kullanılır."
                id="seller-support-response"
                label="Destek yanıt süresi"
                max={72}
                min={1}
                suffix="saat"
                value={editable.supportResponseHours}
                onChange={(value) => updateEditable({ supportResponseHours: value })}
              />
              <NumberField
                helper="Ürün kartı teslimat güveni ve agent uyarılarını etkiler."
                id="seller-delivery-days"
                label="Varsayılan teslimat"
                max={14}
                min={1}
                suffix="gün"
                value={editable.defaultDeliveryPromiseDays}
                onChange={(value) => updateEditable({ defaultDeliveryPromiseDays: value })}
              />
              <NumberField
                helper="İade riski ve açıklama taslaklarında görünür."
                id="seller-return-window"
                label="İade penceresi"
                max={60}
                min={0}
                suffix="gün"
                value={editable.returnWindowDays}
                onChange={(value) => updateEditable({ returnWindowDays: value })}
              />
            </div>
          </div>

          <aside
            data-seller-profile-reveal
            className="overflow-hidden rounded-lg bg-slate-950 text-[#fff] shadow-[0_22px_56px_-36px_rgba(15,23,42,0.95)] xl:col-span-4"
          >
            <div className="p-5 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#fff]">Agent yetkisi</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{activeMode.summary}</p>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/10 text-orange-200">
                  <Robot size={21} weight="duotone" />
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/10">
                <HeroMetric label="Mod" value={data.summary.permissionLabel} />
                <HeroMetric label="Yetki" value={String(editable.enabledCapabilityIds.length)} />
                <HeroMetric label="Kanal" value={String(editable.notificationChannelIds.length)} />
                <HeroMetric label="Sessiz" value={data.summary.quietHoursLabel} />
              </div>
            </div>

            <div className="border-y border-white/10 px-5 py-4 md:px-7">
              <div className="flex flex-wrap gap-2">
                {railChips.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 p-5 md:p-7">
              <button
                type="submit"
                disabled={saveStatus.state === "saving"}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-semibold text-[#fff] transition hover:bg-orange-600 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveStatus.state === "saving" ? (
                  <span className="commerce-skeleton h-4 w-4 rounded-full bg-white/40" />
                ) : (
                  <FloppyDisk size={18} weight="bold" />
                )}
                {saveStatus.state === "saving" ? "Kaydediliyor" : "Ayarları Kaydet"}
              </button>
              <Link
                href="/seller/agent"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-orange-100 active:translate-y-px"
              >
                Agent ile dene
                <ArrowRight size={15} weight="bold" />
              </Link>
              {saveStatus.state === "saved" ? (
                <StatusPanel message={saveStatus.message} tone="success" />
              ) : null}
              {saveStatus.state === "error" ? (
                <StatusPanel message={saveStatus.message} tone="error" />
              ) : null}
            </div>
          </aside>
        </section>

        <section className="grid grid-flow-dense gap-5 xl:grid-cols-12">
          <div data-seller-profile-reveal className="xl:col-span-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-6">
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.05em] text-slate-950">
                Yetki modu net.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Bu seçim Agent&apos;ın hangi aralıkta konuşacağını, taslak üreteceğini ve ne zaman onay bekleyeceğini belirler.
              </p>

              <div className="mt-6 grid gap-3">
                {data.permissionModes.map((mode) => {
                  const isSelected = editable.permissionMode === mode.id;

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      data-seller-profile-stack
                      onClick={() => selectPermissionMode(mode.id)}
                      className={`group rounded-lg border p-4 text-left transition active:scale-[0.99] ${
                        isSelected
                          ? "border-orange-300 bg-orange-50 text-slate-950"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-orange-200 hover:bg-white"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-4">
                        <span>
                          <span className="block text-base font-semibold text-slate-950">{mode.label}</span>
                          <span className="mt-1 block text-sm leading-6 text-slate-500">{mode.helper}</span>
                        </span>
                        <span className={`mt-1 grid h-6 w-6 place-items-center rounded-full border ${
                          isSelected ? "border-orange-500 bg-orange-500 text-[#fff]" : "border-slate-300 bg-white text-transparent"
                        }`}>
                          <CheckCircle size={14} weight="bold" />
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div data-seller-profile-reveal className="xl:col-span-7">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h2 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">Agent görevleri</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Kilitli görevler onay verilmeden değişiklik yapmaz.
                  </p>
                </div>
                <Link
                  href="/seller/agent"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
                >
                  Agent ekranı
                  <ArrowRight size={15} weight="bold" />
                </Link>
              </div>

              <div className="mt-5 grid grid-flow-dense gap-3 md:grid-cols-2">
                {data.capabilities.map((capability) => (
                  <CapabilityToggle
                    key={capability.id}
                    capability={capability}
                    isSelected={selectedCapabilitySet.has(capability.id)}
                    onToggle={() => toggleCapability(capability)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-flow-dense gap-5 xl:grid-cols-12">
          <aside data-seller-profile-pin className="xl:col-span-4">
            <div
              data-seller-profile-reveal
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-6"
            >
              <h2 className="text-4xl font-semibold leading-[0.98] tracking-[-0.06em] text-slate-950">
                Uyarılar sessiz, kontrol sende.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Proactive Agent yalnızca izinli kanallarda ve sessiz saatlerin dışında görünür. Ses yok; panel badge ve görsel uyarı var.
              </p>
              <div className="mt-6 rounded-lg bg-slate-950 p-4 text-[#fff]">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-orange-500 text-[#fff]">
                    <BellRinging size={19} weight="duotone" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#fff]">Proactive preview</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {editable.proactiveControls.muteAll ? "Sessizde" : "Badge uyarısı açık"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-5 xl:col-span-8">
            <div
              data-seller-profile-reveal
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-6"
            >
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">Bildirim kanalları</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {data.notificationChannels.map((channel) => {
                  const isSelected = selectedChannelSet.has(channel.id);

                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => toggleChannel(channel.id)}
                      className={`rounded-lg border p-4 text-left transition active:scale-[0.99] ${
                        isSelected
                          ? "border-orange-300 bg-orange-50"
                          : "border-slate-200 bg-slate-50 hover:border-orange-200 hover:bg-white"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span>
                          <span className="block text-sm font-semibold text-slate-950">{channel.label}</span>
                          <span className="mt-1 block text-xs leading-5 text-slate-500">{channel.helper}</span>
                        </span>
                        <span className={`h-5 w-9 rounded-full p-0.5 transition ${
                          isSelected ? "bg-orange-500" : "bg-slate-300"
                        }`}>
                          <span className={`block h-4 w-4 rounded-full bg-white transition ${
                            isSelected ? "translate-x-4" : "translate-x-0"
                          }`} />
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              data-seller-profile-reveal
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-6"
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div>
                  <h2 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">Risk eşikleri</h2>
                  <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                    {editable.alertRules.map((rule) => (
                      <AlertRuleRow
                        key={rule.id}
                        rule={rule}
                        onEnabledChange={(enabled) => updateAlertRule(rule.id, { enabled })}
                        onThresholdChange={(threshold) => updateAlertRule(rule.id, { threshold })}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2">
                    <Clock size={18} weight="duotone" className="text-orange-600" />
                    <p className="text-sm font-semibold text-slate-950">Sessiz saat</p>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <TimeField
                      id="seller-quiet-start"
                      label="Başlangıç"
                      value={editable.quietHours.start}
                      onChange={(value) => updateEditable({
                        quietHours: { ...editable.quietHours, start: value },
                      })}
                    />
                    <TimeField
                      id="seller-quiet-end"
                      label="Bitiş"
                      value={editable.quietHours.end}
                      onChange={(value) => updateEditable({
                        quietHours: { ...editable.quietHours, end: value },
                      })}
                    />
                  </div>

                  <div className="mt-5 grid gap-2">
                    <BinaryControl
                      checked={editable.proactiveControls.floatingBadgeEnabled}
                      label="Badge uyarısı"
                      onChange={(value) => updateProactiveControl("floatingBadgeEnabled", value)}
                    />
                    <BinaryControl
                      checked={editable.proactiveControls.muteAll}
                      label="Sessize al"
                      onChange={(value) => updateProactiveControl("muteAll", value)}
                    />
                    <BinaryControl
                      checked={editable.proactiveControls.disableOnProductPages}
                      label="Ürün sayfasında uyarma"
                      onChange={(value) => updateProactiveControl("disableOnProductPages", value)}
                    />
                    <BinaryControl
                      checked={editable.proactiveControls.hideFloatingAgent}
                      label="Floating Agent gizle"
                      onChange={(value) => updateProactiveControl("hideFloatingAgent", value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-flow-dense gap-5 xl:grid-cols-12">
          <div
            data-seller-profile-reveal
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] xl:col-span-8 md:p-6"
          >
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
              <div>
                <h2 className="text-4xl font-semibold tracking-[-0.06em] text-slate-950">Her değişiklik iz bırakır.</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Profil ve izin değişiklikleri kayıt altında tutulur; Agent işlem öncesi onay sınırını korur.
                </p>
              </div>
              <Link
                href="/seller/actions"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
              >
                Aksiyon kuyruğu
                <ArrowRight size={15} weight="bold" />
              </Link>
            </div>

            <div className="mt-2 divide-y divide-slate-200">
              {data.auditTrail.map((item) => (
                <article key={item.id} className="grid gap-4 py-5 md:grid-cols-[160px_minmax(0,1fr)_140px] md:items-start">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.actorName}</p>
                    <p className="mt-1 font-mono text-xs text-slate-400">{item.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-950">{item.action}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                  </div>
                  <span className={`inline-flex min-h-8 items-center justify-center rounded-full px-3 text-xs font-semibold ${
                    item.tone === "warning"
                      ? "bg-orange-50 text-orange-700"
                      : item.tone === "good"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                  }`}>
                    {item.tone === "warning" ? "Onay sınırı" : item.tone === "good" ? "Kaydedildi" : "Kayıt"}
                  </span>
                </article>
              ))}
            </div>
          </div>

          <aside
            data-seller-profile-reveal
            className="rounded-lg bg-slate-950 p-5 text-[#fff] shadow-[0_22px_56px_-36px_rgba(15,23,42,0.95)] xl:col-span-4 md:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-orange-500 text-[#fff]">
                <ShieldCheck size={21} weight="duotone" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#fff]">{data.policyPreview.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{data.policyPreview.summary}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {data.policyPreview.rules.map((rule) => (
                <div key={rule} className="flex items-start gap-3 rounded-lg bg-white/5 p-3 text-sm leading-6 text-slate-200 ring-1 ring-white/10">
                  <LockKey size={17} weight="duotone" className="mt-1 shrink-0 text-orange-200" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="submit"
                disabled={saveStatus.state === "saving"}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-orange-100 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FloppyDisk size={18} weight="bold" />
                Ayarları kaydet ve Agent ile dene
              </button>
              <Link
                href="/seller/agent"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 text-sm font-semibold text-[#fff] transition hover:bg-white/10 active:translate-y-px"
              >
                Seller Agent&apos;ı aç
                <ArrowRight size={15} weight="bold" />
              </Link>
            </div>
          </aside>
        </section>
      </form>
    </div>
  );
}

function TextField({
  helper,
  id,
  label,
  onChange,
  value,
}: {
  helper: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
      />
      <span className="text-xs leading-5 text-slate-500">{helper}</span>
    </label>
  );
}

function NumberField({
  helper,
  id,
  label,
  max,
  min,
  onChange,
  suffix,
  value,
}: {
  helper: string;
  id: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  suffix: string;
  value: number;
}) {
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="flex min-h-12 items-center rounded-lg border border-slate-200 bg-slate-50 px-4 transition focus-within:border-orange-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none"
        />
        <span className="text-xs font-semibold text-slate-500">{suffix}</span>
      </span>
      <span className="text-xs leading-5 text-slate-500">{helper}</span>
    </label>
  );
}

function TimeField({
  id,
  label,
  onChange,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
      />
    </label>
  );
}

function CapabilityToggle({
  capability,
  isSelected,
  onToggle,
}: {
  capability: SellerAgentCapability;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const Icon = capabilityIconMap[capability.id] ?? Package;

  return (
    <button
      type="button"
      disabled={capability.locked}
      onClick={onToggle}
      className={`group min-h-[136px] rounded-lg border p-4 text-left transition active:scale-[0.99] disabled:cursor-not-allowed ${
        capability.locked
          ? "border-slate-200 bg-slate-100 text-slate-400"
          : isSelected
            ? "border-orange-300 bg-orange-50 text-slate-950"
            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-orange-200 hover:bg-white"
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-lg ring-1 transition group-hover:scale-105 ${
          isSelected && !capability.locked
            ? "bg-orange-500 text-[#fff] ring-orange-500"
            : "bg-white text-orange-600 ring-slate-200"
        }`}>
          <Icon size={18} weight="duotone" />
        </span>
        <span className={`h-5 w-9 rounded-full p-0.5 transition ${
          isSelected && !capability.locked ? "bg-orange-500" : "bg-slate-300"
        }`}>
          <span className={`block h-4 w-4 rounded-full bg-white transition ${
            isSelected && !capability.locked ? "translate-x-4" : "translate-x-0"
          }`} />
        </span>
      </span>
      <span className="mt-4 block text-sm font-semibold text-slate-950">{capability.label}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-500">{capability.helper}</span>
      <span className="mt-3 inline-flex min-h-7 items-center rounded-full bg-white px-2.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
        {capability.locked ? "Kilitli" : capability.requiresApproval ? "Onay gerekir" : "Onaysız analiz"}
      </span>
    </button>
  );
}

function AlertRuleRow({
  onEnabledChange,
  onThresholdChange,
  rule,
}: {
  onEnabledChange: (enabled: boolean) => void;
  onThresholdChange: (threshold: SellerAlertThreshold) => void;
  rule: SellerProfileAlertRule;
}) {
  return (
    <div className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">{rule.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{rule.helper}</p>
          </div>
          <button
            type="button"
            onClick={() => onEnabledChange(!rule.enabled)}
            className={`h-8 w-12 shrink-0 rounded-full p-1 transition active:translate-y-px ${
              rule.enabled ? "bg-orange-500" : "bg-slate-300"
            }`}
            aria-label={`${rule.label} kuralını değiştir`}
          >
            <span className={`block h-6 w-6 rounded-full bg-white transition ${
              rule.enabled ? "translate-x-4" : "translate-x-0"
            }`} />
          </button>
        </div>
        <Link
          href={rule.href}
          className="mt-2 inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold text-orange-700 transition hover:bg-orange-50 hover:text-orange-800 active:translate-y-px"
        >
          {rule.affectedProductCount} ürün etkileniyor
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {thresholdOptions.map((option) => {
          const isSelected = rule.threshold === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onThresholdChange(option.id)}
              className={`rounded-lg border px-3 py-2 text-left transition active:translate-y-px ${
                isSelected
                  ? "border-slate-950 bg-slate-950 text-[#fff]"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-orange-200 hover:bg-orange-50"
              }`}
            >
              <span className={isSelected ? "block text-xs font-semibold text-[#fff]" : "block text-xs font-semibold text-slate-950"}>
                {option.label}
              </span>
              <span className={isSelected ? "mt-1 block text-[11px] text-slate-300" : "mt-1 block text-[11px] text-slate-500"}>
                {option.helper}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BinaryControl({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex min-h-10 items-center justify-between gap-3 rounded-lg bg-white px-3 text-left text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:ring-orange-200 active:translate-y-px"
    >
      <span className="inline-flex items-center gap-2">
        {label.includes("gizle") ? <EyeSlash size={16} weight="duotone" /> : <BellRinging size={16} weight="duotone" />}
        {label}
      </span>
      <span className={`h-5 w-9 rounded-full p-0.5 transition ${checked ? "bg-orange-500" : "bg-slate-300"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-semibold text-[#fff]">{value}</p>
    </div>
  );
}

function StatusPanel({ message, tone }: { message: string; tone: "error" | "success" }) {
  const isSuccess = tone === "success";

  return (
    <div
      className={
        isSuccess
          ? "flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
          : "flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4"
      }
    >
      {isSuccess ? (
        <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-emerald-700" />
      ) : (
        <WarningCircle size={20} weight="duotone" className="mt-0.5 shrink-0 text-amber-700" />
      )}
      <p className={isSuccess ? "text-sm leading-6 text-emerald-800" : "text-sm leading-6 text-amber-800"}>
        {message}
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle,
  Palette,
  Plus,
  SealCheck,
  Sparkle,
  Star,
  Truck,
  UserCircle,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { ApiEnvelope } from "@/lib/api/responses";
import {
  buyerProfileEndpoint,
  type BuyerProfileApiData,
  type BuyerProfileEditableState,
  type BuyerProfilePreferenceId,
} from "@/lib/api/buyer-profile";
import {
  readBuyerProfileDraft,
  writeBuyerProfileDraft,
} from "@/lib/profile/buyer-profile-storage";

gsap.registerPlugin(useGSAP);

interface BuyerProfileWorkspaceProps {
  initialData: BuyerProfileApiData;
}

type SaveStatus =
  | { state: "idle"; message?: undefined }
  | { state: "saving"; message?: undefined }
  | { state: "saved"; message: string }
  | { state: "error"; message: string };

const budgetOptions: Array<{ id: BuyerProfileEditableState["budgetBand"]; label: string; helper: string }> = [
  { id: "ekonomik", label: "Ekonomik", helper: "Fiyat ve alternatif öncelikli" },
  { id: "orta", label: "Orta", helper: "Denge ve güven sinyali" },
  { id: "premium", label: "Premium", helper: "Kalite ve uzun kullanım" },
];

const preferenceIconMap: Partial<Record<BuyerProfilePreferenceId, typeof Truck>> = {
  easy_return: SealCheck,
  fast_shipping: Truck,
  premium_quality: Sparkle,
  color_match: Palette,
};

const reviewsPerPage = 5;

export function BuyerProfileWorkspace({ initialData }: BuyerProfileWorkspaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState(initialData);
  const [editable, setEditable] = useState(initialData.editable);
  const [colorInput, setColorInput] = useState("");
  const [reviewPage, setReviewPage] = useState(1);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: "idle" });

  const selectedPreferenceSet = useMemo(
    () => new Set(editable.selectedPreferenceIds),
    [editable.selectedPreferenceIds],
  );
  const selectedPreferenceLabels = data.preferences
    .filter((preference) => selectedPreferenceSet.has(preference.id))
    .map((preference) => preference.label);
  const reviewPageCount = Math.max(1, Math.ceil(data.reviews.length / reviewsPerPage));
  const safeReviewPage = Math.min(reviewPage, reviewPageCount);
  const visibleReviews = data.reviews.slice(
    (safeReviewPage - 1) * reviewsPerPage,
    safeReviewPage * reviewsPerPage,
  );

  useEffect(() => {
    const draft = readBuyerProfileDraft(initialData.editable.buyerId);

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
        const response = await fetch(buyerProfileEndpoint, {
          body: JSON.stringify(storedDraft),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        });
        const envelope = (await response.json()) as ApiEnvelope<BuyerProfileApiData>;

        if (isActive && response.ok && envelope.success) {
          setData(envelope.data);
          setEditable(envelope.data.editable);
        }
      } catch {
        // Local draft remains usable even if the mock validation route is unavailable.
      }
    }

    void syncDraft();

    return () => {
      isActive = false;
    };
  }, [initialData.editable.buyerId]);

  useEffect(() => {
    if (saveStatus.state !== "saved") {
      return;
    }

    const timeoutId = window.setTimeout(() => setSaveStatus({ state: "idle" }), 2400);

    return () => window.clearTimeout(timeoutId);
  }, [saveStatus.state]);

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-profile-reveal]",
        {
          y: 16,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          clearProps: "transform,opacity",
          duration: 0.52,
          ease: "power3.out",
          stagger: 0.055,
        },
      );
    },
    { scope: rootRef, dependencies: [data.editable.updatedAt] },
  );

  function updateEditable(nextPartial: Partial<BuyerProfileEditableState>) {
    setEditable((current) => ({
      ...current,
      ...nextPartial,
      updatedAt: new Date().toISOString(),
    }));
    setSaveStatus({ state: "idle" });
  }

  function togglePreference(preferenceId: BuyerProfilePreferenceId) {
    const nextPreferenceIds = selectedPreferenceSet.has(preferenceId)
      ? editable.selectedPreferenceIds.filter((id) => id !== preferenceId)
      : [...editable.selectedPreferenceIds, preferenceId];

    updateEditable({ selectedPreferenceIds: nextPreferenceIds });
  }

  function addColor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextColor = colorInput.trim().toLocaleLowerCase("tr-TR");

    if (!nextColor || editable.preferredColors.includes(nextColor) || editable.preferredColors.length >= 6) {
      setColorInput("");
      return;
    }

    updateEditable({ preferredColors: [...editable.preferredColors, nextColor] });
    setColorInput("");
  }

  function removeColor(color: string) {
    updateEditable({
      preferredColors: editable.preferredColors.filter((item) => item !== color),
    });
  }

  async function saveProfile() {
    setSaveStatus({ state: "saving" });

    try {
      const response = await fetch(buyerProfileEndpoint, {
        body: JSON.stringify(editable),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const envelope = (await response.json()) as ApiEnvelope<BuyerProfileApiData>;

      if (!response.ok || !envelope.success) {
        throw new Error(envelope.error?.message ?? "Profil kaydedilemedi.");
      }

      setData(envelope.data);
      setEditable(envelope.data.editable);
      writeBuyerProfileDraft(envelope.data.editable);
      setSaveStatus({ message: "Profil kaydedildi. Agent yeni sinyalleri kullanabilir.", state: "saved" });
    } catch (error) {
      setSaveStatus({
        message: error instanceof Error ? error.message : "Profil kaydedilemedi.",
        state: "error",
      });
    }
  }

  return (
    <div ref={rootRef} className="space-y-5">
      <section className="grid grid-flow-dense gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div
          data-profile-reveal
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-7"
        >
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div>
              <h2 className="max-w-4xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] text-slate-950 md:text-5xl">
                Agent beni nasıl tanısın?
              </h2>
              <p className="mt-4 max-w-[62ch] text-sm leading-6 text-slate-600">
                Stilini, bütçe toleransını ve yorum hassasiyetlerini kaydet. Agent ürün önerirken bu sinyalleri görünür gerekçeye çevirir.
              </p>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-orange-500 text-[#fff]">
                  <UserCircle size={22} weight="duotone" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{data.buyer.name}</p>
                  <p className="text-xs text-slate-500">{data.buyer.city}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">{data.buyer.persona}</p>
            </div>
          </div>

          <div className="mt-7 grid gap-5">
            <label className="grid gap-2" htmlFor="buyer-profile-note">
              <span className="text-sm font-semibold text-slate-800">Agent kişiselleştirme metni</span>
              <textarea
                id="buyer-profile-note"
                value={editable.personalNote}
                maxLength={520}
                onChange={(event) => updateEditable({ personalNote: event.target.value })}
                className="min-h-40 resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                placeholder="Sade, kaliteli, hızlı kargolu ve yorumlarda malzeme kalitesi net görünen ürünleri tercih ederim."
              />
              <span className="text-xs text-slate-500">
                {editable.personalNote.length}/520 karakter. Agent bu metni öneri gerekçelerine bağlar.
              </span>
            </label>

            <div className="grid gap-3">
              <p className="text-sm font-semibold text-slate-800">Hızlı tercih kontrolleri</p>
              <div className="grid grid-flow-dense gap-3 md:grid-cols-3">
                {data.preferences.map((preference) => {
                  const isSelected = selectedPreferenceSet.has(preference.id);
                  const Icon = preferenceIconMap[preference.id] ?? CheckCircle;

                  return (
                    <label
                      key={preference.id}
                      className={`group flex min-h-[116px] cursor-pointer flex-col justify-between rounded-lg border p-4 transition active:scale-[0.99] ${
                        isSelected
                          ? "border-orange-300 bg-orange-50 text-slate-950"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-orange-200 hover:bg-white"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-orange-600 ring-1 ring-slate-200 transition group-hover:scale-105">
                          <Icon size={18} weight="duotone" />
                        </span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePreference(preference.id)}
                          className="h-9 w-9 accent-orange-500"
                          aria-label={preference.label}
                        />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-950">{preference.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">{preference.helper}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <aside
          data-profile-reveal
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]"
        >
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Agent hafızası</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Bu alan buyer Agent ve ilerideki floating Agent için aynı profil sinyallerini temsil eder.
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <p className="text-sm font-semibold text-slate-800">Bütçe bandı</p>
              <div className="mt-3 grid gap-2">
                {budgetOptions.map((option) => {
                  const isSelected = editable.budgetBand === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => updateEditable({ budgetBand: option.id })}
                      className={`rounded-lg border p-3 text-left transition active:translate-y-px ${
                        isSelected
                          ? "border-slate-950 bg-slate-950 text-[#fff]"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-orange-200 hover:bg-orange-50"
                      }`}
                    >
                      <span className={isSelected ? "block text-sm font-semibold text-[#fff]" : "block text-sm font-semibold text-slate-950"}>
                        {option.label}
                      </span>
                      <span className={isSelected ? "mt-1 block text-xs text-slate-300" : "mt-1 block text-xs text-slate-500"}>
                        {option.helper}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">Renk paleti</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {editable.preferredColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => removeColor(color)}
                    className="inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:border-red-200 hover:text-red-600 active:translate-y-px"
                  >
                    <span className="h-3 w-3 rounded-full border border-slate-300 bg-orange-100" />
                    {color}
                    <X size={13} weight="bold" />
                  </button>
                ))}
              </div>
              <form className="mt-3 flex gap-2" onSubmit={addColor}>
                <label className="sr-only" htmlFor="buyer-profile-color">Renk ekle</label>
                <input
                  id="buyer-profile-color"
                  aria-label="Renk ekle"
                  value={colorInput}
                  onChange={(event) => setColorInput(event.target.value)}
                  className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="renk ekle"
                />
                <button
                  type="submit"
                  className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
                  aria-label="Renk ekle"
                >
                  <Plus size={17} weight="bold" />
                </button>
              </form>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">{data.agentPreview.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{data.agentPreview.summary}</p>
              <div className="mt-4 rounded-lg bg-white p-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
                {data.agentPreview.promptExample}
              </div>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                disabled={saveStatus.state === "saving"}
                onClick={() => void saveProfile()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-semibold text-[#fff] transition hover:bg-orange-600 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveStatus.state === "saving" ? (
                  <span className="commerce-skeleton h-4 w-4 rounded-full bg-white/40" />
                ) : (
                  <CheckCircle size={18} weight="bold" />
                )}
                {saveStatus.state === "saving" ? "Kaydediliyor" : "Profili Kaydet"}
              </button>
              <Link
                href="/buyer/agent"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
              >
                Agent ile dene
                <ArrowRight size={15} weight="bold" />
              </Link>
            </div>

            {saveStatus.state === "saved" ? (
              <StatusPanel tone="success" message={saveStatus.message} />
            ) : null}
            {saveStatus.state === "error" ? (
              <StatusPanel tone="error" message={saveStatus.message} />
            ) : null}
          </div>
        </aside>
      </section>

      <section className="grid grid-flow-dense gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div
          data-profile-reveal
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-6"
        >
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">Yorum geçmişi</h2>
              <p className="mt-2 text-sm text-slate-500">
                {data.summary.reviewCount} yorum Agent&apos;ın hassasiyet sinyallerine bağlanıyor.
              </p>
            </div>
            <Link
              href="/buyer/products"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-orange-200 bg-orange-50 px-4 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 hover:text-orange-800 active:translate-y-px"
            >
              Ürünlere dön
            </Link>
          </div>

          {data.reviews.length > 0 ? (
            <div className="mt-2 divide-y divide-slate-200">
              {visibleReviews.map((review) => (
                <article key={review.id} className="grid gap-4 py-5 md:grid-cols-[96px_1fr]">
                  <Link
                    href={review.productHref}
                    aria-label={`${review.productName} ürün detayını aç`}
                    className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <div
                      aria-label={review.image.alt}
                      className="aspect-square bg-[length:500%_400%] bg-no-repeat transition duration-700 hover:scale-105"
                      role="img"
                      style={{
                        backgroundImage: `url(${review.image.src})`,
                        backgroundPosition: review.image.position,
                      }}
                    />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                      <div>
                        <p className="text-xs font-semibold text-orange-600">{review.productBrand}</p>
                        <Link
                          href={review.productHref}
                          className="mt-1 inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-50 hover:text-orange-700 active:translate-y-px"
                        >
                          {review.productName}
                        </Link>
                      </div>
                      <RatingStars rating={review.rating} />
                    </div>
                    <h3 className="mt-3 text-base font-semibold leading-6 text-slate-950">{review.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{review.body}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      {review.themes.slice(0, 4).map((theme) => (
                        <span key={theme} className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                          {theme}
                        </span>
                      ))}
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                        {review.deliveryDays} gün teslimat
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-950">Henüz yorum yok</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Ürün yorumları geldikçe Agent burada karar sinyali çıkaracak.
              </p>
            </div>
          )}

          {data.reviews.length > reviewsPerPage ? (
            <div className="mt-5 flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
              <p className="text-sm text-slate-500">
                Sayfa {safeReviewPage}/{reviewPageCount} · {data.reviews.length} yorum
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={safeReviewPage === 1}
                  onClick={() => setReviewPage((current) => Math.max(1, current - 1))}
                  className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Önceki
                </button>
                <button
                  type="button"
                  disabled={safeReviewPage === reviewPageCount}
                  onClick={() => setReviewPage((current) => Math.min(reviewPageCount, current + 1))}
                  className="inline-flex min-h-10 items-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Sonraki
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <aside
          data-profile-reveal
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]"
        >
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Agent bu yorumlardan ne öğrendi?
          </h2>
          <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
            {data.learnedSignals.map((signal) => (
              <div key={signal.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">{signal.title}</p>
                  <span className="font-mono text-xs font-semibold text-orange-700">{signal.priorityScore}/100</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{signal.summary}</p>
                <p className="mt-2 text-xs text-slate-400">{signal.sourceLabel}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg bg-slate-950 p-4 text-[#fff]">
            <p className="text-sm font-semibold text-[#fff]">Aktif tercih özeti</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {selectedPreferenceLabels.length > 0
                ? selectedPreferenceLabels.join(", ")
                : "Henüz tercih seçilmedi."}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-white/10">
              <MiniMetric label="Chip" value={String(editable.selectedPreferenceIds.length)} />
              <MiniMetric label="Renk" value={String(editable.preferredColors.length)} />
              <MiniMetric label="Yorum" value={String(data.summary.reviewCount)} />
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-orange-500" aria-label={`${rating} yıldız`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={15}
          weight={index < rating ? "fill" : "regular"}
          className={index < rating ? "text-orange-500" : "text-slate-300"}
        />
      ))}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 p-3 text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-[#fff]">{value}</p>
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

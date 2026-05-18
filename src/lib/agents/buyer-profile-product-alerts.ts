import { defaultBuyerId } from "@/lib/api/buyer";
import {
  getBuyerProfileApiData,
  type BuyerProfileEditableState,
  type BuyerProfilePreferenceId,
} from "@/lib/api/buyer-profile";
import { getBuyerProfile, getProductBySlug, getProductDetail } from "@/lib/data";
import type { Product, ReviewTheme } from "@/types/commerce";

export interface BuyerProductProfileAlert {
  buyerId: string;
  evidence: {
    negativeThemes: ReviewTheme[];
    preferenceIds: BuyerProfilePreferenceId[];
    previousComplaintThemes: ReviewTheme[];
    productColors: string[];
  };
  message: string;
  priorityScore: number;
  productId: string;
  productName: string;
  prompt: string;
  severity: "info" | "warning";
  title: string;
}

interface BuyerProductProfileAlertInput {
  buyerId?: string;
  editableOverride?: BuyerProfileEditableState;
  pathname: string;
}

export function getBuyerProductProfileAlert(
  input: BuyerProductProfileAlertInput,
): BuyerProductProfileAlert | undefined {
  const slug = getBuyerProductSlugFromPathname(input.pathname);

  if (!slug) {
    return undefined;
  }

  const product = getProductBySlug(slug);

  if (!product) {
    return undefined;
  }

  return createBuyerProductProfileAlert({
    buyerId: input.buyerId ?? defaultBuyerId,
    editableOverride: input.editableOverride,
    product,
  });
}

export function createBuyerProductProfileAlert(input: {
  buyerId?: string;
  editableOverride?: BuyerProfileEditableState;
  product: Product;
}): BuyerProductProfileAlert | undefined {
  const buyerId = input.buyerId ?? defaultBuyerId;
  const profile = getBuyerProfile(buyerId);
  const defaultProfileData = getBuyerProfileApiData({ buyerId });
  const editable = input.editableOverride ?? defaultProfileData?.editable;
  const detail = getProductDetail(input.product.id);

  if (!profile || !editable || !detail) {
    return undefined;
  }

  const preferenceIds = new Set(editable.selectedPreferenceIds);
  const previousComplaintThemes = profile.buyer.previousComplaintThemes;
  const negativeThemes = getProductRiskThemes(detail.reviews);
  const commonEvidence = {
    negativeThemes,
    preferenceIds: Array.from(preferenceIds),
    previousComplaintThemes,
    productColors: input.product.catalog.colors,
  };
  const alerts: BuyerProductProfileAlert[] = [];

  if (
    (preferenceIds.has("fast_shipping") || previousComplaintThemes.includes("kargo-hizi")) &&
    (input.product.fulfillment.deliveryPromiseDays > 2 ||
      input.product.fulfillment.averageDeliveryDays > 2.4 ||
      input.product.fulfillment.lateDeliveryComplaintRate >= 0.1 ||
      negativeThemes.includes("kargo-hizi"))
  ) {
    alerts.push({
      buyerId,
      evidence: commonEvidence,
      message: `${input.product.name}, hızlı teslimat hassasiyetinle çakışıyor; ürün ${input.product.fulfillment.deliveryPromiseDays} gün teslimat vaadi ve kargo yorumu riski taşıyor.`,
      priorityScore: 96,
      productId: input.product.id,
      productName: input.product.name,
      prompt: "Bu ürün profilime neden ters düşüyor? Daha güvenli alternatif öner.",
      severity: "warning",
      title: "Profiline göre kargo uyarısı",
    });
  }

  if (
    (preferenceIds.has("easy_return") ||
      previousComplaintThemes.includes("paketleme") ||
      previousComplaintThemes.includes("iade-riski")) &&
    (input.product.metrics.returnRate >= 0.08 ||
      negativeThemes.includes("iade-riski") ||
      negativeThemes.includes("paketleme") ||
      input.product.demoStoryFlags.includes("return_risk"))
  ) {
    alerts.push({
      buyerId,
      evidence: commonEvidence,
      message: `${input.product.name}, iade/paketleme hassasiyetinle çakışabilecek yorum sinyalleri taşıyor.`,
      priorityScore: 88,
      productId: input.product.id,
      productName: input.product.name,
      prompt: "Bu ürünün iade veya paketleme riski nedir? Daha risksiz alternatif öner.",
      severity: "warning",
      title: "İade güveni uyarısı",
    });
  }

  if (
    preferenceIds.has("premium_quality") &&
    (negativeThemes.includes("malzeme-kalitesi") ||
      negativeThemes.includes("dayaniklilik") ||
      includesAny(input.product.listing.issueTags.join(" "), ["malzeme", "kalite", "dayan"]))
  ) {
    alerts.push({
      buyerId,
      evidence: commonEvidence,
      message: `${input.product.name}, premium kalite beklentin için malzeme veya dayanıklılık tarafında kontrol gerektiriyor.`,
      priorityScore: 82,
      productId: input.product.id,
      productName: input.product.name,
      prompt: "Bu ürün kalite beklentime uyuyor mu? Riskleri ve alternatifleri göster.",
      severity: "warning",
      title: "Kalite beklentisi uyarısı",
    });
  }

  if (
    (preferenceIds.has("quiet_product") || previousComplaintThemes.includes("ses-seviyesi")) &&
    (negativeThemes.includes("ses-seviyesi") ||
      getNumericSpec(input.product, "sesDb") >= 55 ||
      includesAny(input.product.listing.issueTags.join(" "), ["ses", "gürültü", "gurultu"]))
  ) {
    alerts.push({
      buyerId,
      evidence: commonEvidence,
      message: `${input.product.name}, sessiz kullanım beklentisi olan profil için ses seviyesi riski taşıyor.`,
      priorityScore: 80,
      productId: input.product.id,
      productName: input.product.name,
      prompt: "Bu ürün ses hassasiyetime ters mi? Sessiz alternatif öner.",
      severity: "warning",
      title: "Ses seviyesi uyarısı",
    });
  }

  if (preferenceIds.has("avoid_synthetic") && hasSyntheticFabricSignal(input.product)) {
    alerts.push({
      buyerId,
      evidence: commonEvidence,
      message: `${input.product.name}, sentetik kumaş istemeyen profil tercihinle çakışabilecek materyal bilgisi içeriyor.`,
      priorityScore: 78,
      productId: input.product.id,
      productName: input.product.name,
      prompt: "Bu ürünün materyali profilime uyuyor mu? Daha doğal içerikli alternatif göster.",
      severity: "warning",
      title: "Materyal tercihi uyarısı",
    });
  }

  if (
    preferenceIds.has("color_match") &&
    editable.preferredColors.length > 0 &&
    input.product.catalog.colors.length > 0 &&
    !input.product.catalog.colors.some((color) => editable.preferredColors.includes(color.toLocaleLowerCase("tr-TR")))
  ) {
    alerts.push({
      buyerId,
      evidence: commonEvidence,
      message: `${input.product.name}, kayıtlı renk paletinle birebir eşleşmiyor; satın almadan önce kombin uyumunu kontrol et.`,
      priorityScore: 56,
      productId: input.product.id,
      productName: input.product.name,
      prompt: "Bu ürün renk paletime uyuyor mu? Daha uyumlu alternatif göster.",
      severity: "info",
      title: "Renk uyumu notu",
    });
  }

  return alerts.sort((first, second) => second.priorityScore - first.priorityScore)[0];
}

function getBuyerProductSlugFromPathname(pathname: string): string | undefined {
  const match = pathname.match(/^\/buyer\/products\/([^/?#]+)/);

  return match?.[1];
}

function getProductRiskThemes(reviews: Array<{ needsSellerAttention: boolean; sentiment: string; themes: ReviewTheme[] }>): ReviewTheme[] {
  return Array.from(
    new Set(
      reviews
        .filter((review) => review.needsSellerAttention || review.sentiment === "negative")
        .flatMap((review) => review.themes),
    ),
  );
}

function getNumericSpec(product: Product, key: string): number {
  const value = product.specs[key];

  return typeof value === "number" ? value : 0;
}

function hasSyntheticFabricSignal(product: Product): boolean {
  const fabricText = String(product.specs.kumas ?? product.specs.kumaş ?? "").toLocaleLowerCase("tr-TR");

  return includesAny(fabricText, ["akrilik", "polyester", "sentetik"]);
}

function includesAny(value: string, keywords: string[]): boolean {
  const normalizedValue = value.toLocaleLowerCase("tr-TR");

  return keywords.some((keyword) => normalizedValue.includes(keyword));
}

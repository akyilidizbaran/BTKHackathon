import {
  getBuyerProfile,
  getProductDetail,
  getProducts,
  getRelatedProducts,
  type BuyerProfile,
  type ProductDetail,
} from "@/lib/data";
import { scoreProduct, type ProductScorecard } from "@/lib/scoring";
import type {
  Buyer,
  BuyerSensitivity,
  Product,
  ProductCategory,
  Review,
  ReviewTheme,
} from "@/types/commerce";
import { clampPriority, formatTry } from "./common";
import type {
  BuyerCartWarning,
  BuyerIntentType,
  BuyerManualPreferences,
  BuyerProductSuggestion,
  BuyerSellerSignalCandidate,
  BuyerSmartCartItem,
  BuyerSmartCartWorkflowInput,
  BuyerSmartCartWorkflowResult,
  ParsedBuyerIntent,
} from "./types";

interface IntentConfig {
  categories: ProductCategory[];
  useCases: string[];
  minimumItems: number;
  maximumItems: number;
  defaultBudget: number;
}

interface ProductCandidate {
  product: Product;
  detail: ProductDetail;
  scorecard: ProductScorecard;
  relevanceScore: number;
  confidenceScore: number;
  reasons: string[];
  warnings: BuyerCartWarning[];
  matchedColors: string[];
  matchedUseCases: string[];
  negativeThemes: ReviewTheme[];
}

const budgetToleranceRate = 0.05;
const generatedAt = "2026-05-13";

const knownColors = [
  "siyah",
  "gri",
  "koyu gri",
  "beyaz",
  "krem",
  "pastel mavi",
  "lavanta",
  "pudra",
  "adaçayı yeşili",
  "lacivert",
  "gümüş",
  "uzay grisi",
  "inox",
  "cam",
  "bej",
  "meşe",
  "ceviz",
  "neon yeşil",
];

const intentConfigs: Record<BuyerIntentType, IntentConfig> = {
  home_office_setup: {
    categories: ["ev-ofis", "elektronik-aksesuar", "masa-calisma-alani"],
    useCases: ["ev ofis", "laptop setup", "masa düzeni", "uzun çalışma", "toplantı"],
    minimumItems: 3,
    maximumItems: 5,
    defaultBudget: 3000,
  },
  coffee_starter: {
    categories: ["kahve-ekipmanlari", "kucuk-ev-yasam"],
    useCases: ["başlangıç kahve seti", "kahve seti", "ofis mutfağı"],
    minimumItems: 3,
    maximumItems: 4,
    defaultBudget: 1500,
  },
  gift_finder: {
    categories: ["hediye-yasam-tarzi", "kucuk-ev-yasam", "kahve-ekipmanlari"],
    useCases: ["hediye", "ev dekor", "rahatlama", "ofis"],
    minimumItems: 1,
    maximumItems: 3,
    defaultBudget: 1000,
  },
  sports_audio: {
    categories: ["elektronik-aksesuar"],
    useCases: ["spor", "koşu", "fitness", "kulaklık"],
    minimumItems: 1,
    maximumItems: 1,
    defaultBudget: 2000,
  },
  meeting_setup: {
    categories: ["elektronik-aksesuar", "ev-ofis"],
    useCases: [
      "toplantı",
      "webcam",
      "kamera",
      "mikrofon",
      "sunum",
      "online ders",
      "laptop setup",
      "ev ofis",
    ],
    minimumItems: 3,
    maximumItems: 4,
    defaultBudget: 4500,
  },
  desk_style_set: {
    categories: ["masa-calisma-alani", "hediye-yasam-tarzi", "elektronik-aksesuar"],
    useCases: ["masa takımı", "masa düzeni", "ev ofis", "öğrenci"],
    minimumItems: 3,
    maximumItems: 5,
    defaultBudget: 2500,
  },
  generic: {
    categories: [
      "ev-ofis",
      "elektronik-aksesuar",
      "kahve-ekipmanlari",
      "masa-calisma-alani",
      "kucuk-ev-yasam",
      "hediye-yasam-tarzi",
    ],
    useCases: [],
    minimumItems: 1,
    maximumItems: 4,
    defaultBudget: 2500,
  },
};

export function buildSmartCartWorkflow(
  input: BuyerSmartCartWorkflowInput,
): BuyerSmartCartWorkflowResult {
  const buyerProfile = input.buyerId ? getBuyerProfile(input.buyerId) : undefined;
  const buyer = buyerProfile?.buyer;
  const intent = parseBuyerIntent(input.prompt, buyer, input.manualPreferences);
  const config = intentConfigs[intent.type];
  const selectionBudgetLimit = intent.softBudgetLimit ?? getFallbackBudgetLimit(config, buyer);
  const candidates = getProductCandidates(intent, buyerProfile, input.manualPreferences);
  const selectedCandidates = selectCartCandidates(candidates, intent, config, selectionBudgetLimit);
  const selectedItems = selectedCandidates.map((candidate) => createCartItem(candidate));
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const warnings = createWorkflowWarnings({
    intent,
    config,
    selectedItems,
    selectedCandidates,
    totalPrice,
  });
  const alternatives = createAlternativeSuggestions(selectedCandidates, candidates, selectionBudgetLimit);
  const complementarySuggestions = createComplementarySuggestions(selectedCandidates, selectionBudgetLimit);
  const buyerPersonalizationNotes = createPersonalizationNotes(buyer, input.manualPreferences, intent);
  const sellerSignalCandidates = createSellerSignalCandidates({
    intent,
    selectedItems,
    warnings,
    complementarySuggestions,
  });
  const confidenceScore = calculateCartConfidence(selectedItems, warnings);

  return {
    buyerId: buyer?.id,
    buyerName: buyer?.name,
    generatedAt,
    prompt: input.prompt,
    intent,
    budget: intent.budget,
    softBudgetLimit: intent.softBudgetLimit,
    totalPrice,
    remainingBudget: intent.softBudgetLimit ? intent.softBudgetLimit - totalPrice : undefined,
    isOverRequestedBudget: Boolean(intent.budget && totalPrice > intent.budget),
    isOverSoftBudget: Boolean(intent.softBudgetLimit && totalPrice > intent.softBudgetLimit),
    confidenceScore,
    selectedItems,
    warnings,
    alternatives,
    complementarySuggestions,
    buyerPersonalizationNotes,
    sellerSignalCandidates,
    llmReadyContext: {
      task: "buyer_smart_cart_explanation",
      locale: "tr-TR",
      audience: "buyer",
      facts: {
        prompt: input.prompt,
        buyer: buyer
          ? {
              id: buyer.id,
              name: buyer.name,
              sensitivities: buyer.sensitivities,
              preferredColors: buyer.preferredColors,
              previousComplaintThemes: buyer.previousComplaintThemes,
            }
          : undefined,
        manualPreferences: input.manualPreferences,
        intent,
        selectedItems,
        totalPrice,
        warnings,
        alternatives,
        complementarySuggestions,
        sellerSignalCandidates,
      },
      instruction:
        "Bu akıllı sepet önerisini alıcıya kısa, güven veren ve kanıta dayalı Türkçe ile açıkla. Bütçe, kişisel hassasiyet ve uyarıları saklama.",
    },
  };
}

function parseBuyerIntent(
  prompt: string,
  buyer: Buyer | undefined,
  manualPreferences: BuyerManualPreferences | undefined,
): ParsedBuyerIntent {
  const normalizedPrompt = normalizeText(prompt);
  const type = detectIntentType(normalizedPrompt);
  const config = intentConfigs[type];
  const budget = extractBudget(normalizedPrompt);
  const promptSensitivities = detectSensitivities(normalizedPrompt);
  const promptColors = detectColors(normalizedPrompt);
  const promptMaxDeliveryDays = extractMaxDeliveryDays(normalizedPrompt);
  const manualColors = manualPreferences?.preferredColors ?? [];
  const manualUseCases = manualPreferences?.preferredUseCases ?? [];
  const manualSensitivities = manualPreferences?.sensitivities ?? [];
  const buyerSensitivities = buyer?.sensitivities ?? [];
  const keywords = createKeywords(normalizedPrompt, type);
  const maxDeliveryDays = manualPreferences?.maxDeliveryDays ?? promptMaxDeliveryDays;

  return {
    type,
    prompt,
    budget,
    softBudgetLimit: budget ? Math.round(budget * (1 + budgetToleranceRate)) : undefined,
    budgetToleranceRate,
    categories: config.categories,
    useCases: unique([...config.useCases, ...manualUseCases]),
    requestedColors: unique([...promptColors, ...manualColors]),
    sensitivities: unique([...promptSensitivities, ...manualSensitivities, ...buyerSensitivities]),
    maxDeliveryDays,
    keywords,
  };
}

function detectIntentType(normalizedPrompt: string): BuyerIntentType {
  if (includesAny(normalizedPrompt, ["kahve", "french press", "moka", "barista"])) {
    return "coffee_starter";
  }

  if (includesAny(normalizedPrompt, ["spor", "koşu", "fitness", "kulaklık"])) {
    return "sports_audio";
  }

  if (includesAny(normalizedPrompt, ["hediye", "annem", "anne", "öğretmen", "doğum günü"])) {
    return "gift_finder";
  }

  if (
    includesAny(normalizedPrompt, [
      "toplantı",
      "kamera",
      "webcam",
      "mikrofon",
      "hub",
      "sunum",
      "görüntü",
      "ses kalitesi",
      "online ders",
      "video görüşme",
    ])
  ) {
    return "meeting_setup";
  }

  if (includesAny(normalizedPrompt, ["masa takımı", "renk paleti", "renklerde", "paletinde"])) {
    return "desk_style_set";
  }

  if (includesAny(normalizedPrompt, ["ev ofis", "home office", "setup", "toplantı", "çalışma"])) {
    return "home_office_setup";
  }

  return "generic";
}

function extractBudget(normalizedPrompt: string): number | undefined {
  const amountPattern = String.raw`(\d{1,3}(?:[.\s]\d{3})+|\d{3,6})`;
  const currencyMatches = [
    normalizedPrompt.match(new RegExp(`${amountPattern}\\s*(?:tl|₺|lira)`)),
    normalizedPrompt.match(new RegExp(`(?:tl|₺|lira)\\s*${amountPattern}`)),
    normalizedPrompt.match(new RegExp(`₺\\s*${amountPattern}`)),
  ];
  const currencyMatch = currencyMatches.find((match) => match?.[1]);

  if (currencyMatch?.[1]) {
    return parseAmount(currencyMatch[1]);
  }

  const thousandMatch = normalizedPrompt.match(/(\d{1,2})(?:[,.](\d))?\s*(?:bin|k)/);

  if (thousandMatch?.[1]) {
    const base = Number(thousandMatch[1]) * 1000;
    const decimal = thousandMatch[2] ? Number(thousandMatch[2]) * 100 : 0;

    return base + decimal;
  }

  const contextualMatches = [
    normalizedPrompt.match(new RegExp(`${amountPattern}\\s*(?:altında|civarında|kadar|bütçe)`)),
    normalizedPrompt.match(new RegExp(`(?:altında|civarında|kadar|bütçe)\\s*${amountPattern}`)),
  ];
  const contextualMatch = contextualMatches.find((match) => match?.[1]);

  if (contextualMatch?.[1]) {
    return parseAmount(contextualMatch[1]);
  }

  return undefined;
}

function parseAmount(rawAmount: string): number | undefined {
  const normalizedAmount = rawAmount.replace(/[.\s]/g, "");
  const parsedAmount = Number(normalizedAmount);

  return Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : undefined;
}

function extractMaxDeliveryDays(normalizedPrompt: string): number | undefined {
  const explicitMatch = normalizedPrompt.match(
    /(?:en geç|maksimum|max)?\s*(\d{1,2})\s*(?:günde|gün içinde|gün)\s*(?:gelsin|teslim|kargo|ulaşsın|olsun)?/,
  );

  if (explicitMatch?.[1]) {
    return Number(explicitMatch[1]);
  }

  if (includesAny(normalizedPrompt, ["yarın gelsin", "yarına gelsin", "ertesi gün teslim"])) {
    return 1;
  }

  return undefined;
}

function detectSensitivities(normalizedPrompt: string): BuyerSensitivity[] {
  const sensitivities: BuyerSensitivity[] = [];

  if (includesAny(normalizedPrompt, ["hızlı kargo", "kargo hızı", "teslimat", "çabuk", "gelsin", "günde"])) {
    sensitivities.push("fast_shipping");
  }

  if (includesAny(normalizedPrompt, ["ucuz", "uygun", "bütçe", "fiyat", "altında"])) {
    sensitivities.push("low_price");
  }

  if (includesAny(normalizedPrompt, ["renk", "palet", "uyum"])) {
    sensitivities.push("color_match");
  }

  if (includesAny(normalizedPrompt, ["sessiz", "ses", "gürültü"])) {
    sensitivities.push("quiet_product");
  }

  if (includesAny(normalizedPrompt, ["iade", "değişim"])) {
    sensitivities.push("easy_return");
  }

  if (includesAny(normalizedPrompt, ["kaliteli", "premium", "dayanıklı"])) {
    sensitivities.push("premium_quality");
  }

  if (includesAny(normalizedPrompt, ["kompakt", "küçük", "taşınabilir"])) {
    sensitivities.push("compact_size");
  }

  return sensitivities;
}

function detectColors(normalizedPrompt: string): string[] {
  return knownColors.filter((color) => normalizedPrompt.includes(normalizeText(color)));
}

function createKeywords(normalizedPrompt: string, type: BuyerIntentType): string[] {
  const baseKeywords = normalizedPrompt
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !/^\d+$/.test(word))
    .slice(0, 8);

  return unique([type, ...baseKeywords]);
}

function getProductCandidates(
  intent: ParsedBuyerIntent,
  buyerProfile: BuyerProfile | undefined,
  manualPreferences: BuyerManualPreferences | undefined,
): ProductCandidate[] {
  return getProducts()
    .flatMap((product) => {
      const detail = getProductDetail(product.id);

      if (!detail) {
        return [];
      }

      return [scoreProductCandidate(product, detail, intent, buyerProfile, manualPreferences)];
    })
    .sort((first, second) => {
      const cautionDifference = countCautionWarnings(first) - countCautionWarnings(second);

      if (cautionDifference !== 0) {
        return cautionDifference;
      }

      const relevanceDifference = second.relevanceScore - first.relevanceScore;

      if (relevanceDifference !== 0) {
        return relevanceDifference;
      }

      const scoreDifference = second.confidenceScore - first.confidenceScore;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return first.product.price - second.product.price;
    });
}

function scoreProductCandidate(
  product: Product,
  detail: ProductDetail,
  intent: ParsedBuyerIntent,
  buyerProfile: BuyerProfile | undefined,
  manualPreferences: BuyerManualPreferences | undefined,
): ProductCandidate {
  const scorecard = scoreProduct(detail);
  const productText = normalizeProductText(product);
  const matchedUseCases = intent.useCases.filter((useCase) =>
    productText.includes(normalizeText(useCase)),
  );
  const matchedKeywords = intent.keywords.filter((keyword) => productText.includes(keyword));
  const matchedColors = getMatchedColors(product, [
    ...intent.requestedColors,
    ...(buyerProfile?.buyer.preferredColors ?? []),
  ]);
  const negativeThemes = getNegativeThemes(detail.reviews);
  const reasons: string[] = [];
  const warnings = createProductWarnings({
    product,
    scorecard,
    negativeThemes,
    intent,
    buyer: buyerProfile?.buyer,
    manualPreferences,
  });
  let score = scorecard.health.score * 0.2 + product.metrics.ratingAverage * 6;
  const relevanceScore = calculateRelevanceScore({
    product,
    intent,
    matchedUseCases,
    matchedColors,
    matchedKeywords,
  });

  if (intent.categories.includes(product.category)) {
    score += 12;
    reasons.push(`${product.category} kategorisi istenen senaryoya uyuyor.`);
  }

  if (matchedUseCases.length > 0) {
    score += Math.min(18, matchedUseCases.length * 7);
    reasons.push(`Kullanım alanı eşleşti: ${matchedUseCases.join(", ")}.`);
  }

  if (matchedColors.length > 0) {
    score += intent.requestedColors.length > 0 ? 10 : 5;
    reasons.push(`Renk tercihiyle uyumlu: ${matchedColors.join(", ")}.`);
  }

  if (
    intent.maxDeliveryDays &&
    product.fulfillment.deliveryPromiseDays <= intent.maxDeliveryDays &&
    product.fulfillment.averageDeliveryDays <= intent.maxDeliveryDays
  ) {
    score += 10;
    reasons.push(`${intent.maxDeliveryDays} gün teslimat beklentisine uyuyor.`);
  }

  score += scoreSensitivityFit(product, scorecard, intent, buyerProfile?.buyer, reasons);
  score -= warnings.filter((warning) => warning.severity === "caution").length * 14;

  if (intent.softBudgetLimit && product.price > intent.softBudgetLimit) {
    score -= 25;
  }

  if (product.stock.onHand - product.stock.reserved <= 0) {
    score -= 30;
  }

  return {
    product,
    detail,
    scorecard,
    relevanceScore,
    confidenceScore: clampPriority(score),
    reasons: reasons.slice(0, 5),
    warnings,
    matchedColors,
    matchedUseCases,
    negativeThemes,
  };
}

function scoreSensitivityFit(
  product: Product,
  scorecard: ProductScorecard,
  intent: ParsedBuyerIntent,
  buyer: Buyer | undefined,
  reasons: string[],
): number {
  let score = 0;
  const sensitivities = new Set(intent.sensitivities);

  if (sensitivities.has("fast_shipping")) {
    score += scorecard.shipping.score * 0.12;

    if (scorecard.shipping.score >= 75) {
      reasons.push(`Kargo güveni yüksek: ${scorecard.shipping.score}/100.`);
    }
  }

  if (sensitivities.has("low_price")) {
    const priceAnchor = intent.softBudgetLimit ?? budgetAnchorForBuyer(buyer);
    const affordability = Math.max(0, 1 - product.price / priceAnchor);
    score += affordability * 12;
    reasons.push(`Bütçeye göre fiyat seviyesi: ${formatTry(product.price)}.`);
  }

  if (sensitivities.has("color_match") && product.demoStoryFlags.includes("color_style_match")) {
    score += 8;
  }

  if (sensitivities.has("quiet_product") && !scorecard.reviews.evidence.repeatedThemes.includes("ses-seviyesi")) {
    score += 6;
  }

  if (sensitivities.has("easy_return")) {
    score += scorecard.returns.score * 0.06;
  }

  if (sensitivities.has("premium_quality")) {
    score += (scorecard.reviews.score + scorecard.listing.score) * 0.045;
  }

  if (sensitivities.has("compact_size") && includesAny(normalizeProductText(product), ["kompakt", "taşınabilir", "küçük"])) {
    score += 7;
  }

  return score;
}

function calculateRelevanceScore(input: {
  product: Product;
  intent: ParsedBuyerIntent;
  matchedUseCases: string[];
  matchedColors: string[];
  matchedKeywords: string[];
}): number {
  let score = 0;

  if (input.intent.categories.includes(input.product.category)) {
    score += 18;
  }

  score += Math.min(36, input.matchedUseCases.length * 14);
  score += Math.min(18, input.matchedKeywords.length * 6);

  if (input.intent.requestedColors.length > 0 && input.matchedColors.length > 0) {
    score += 18;
  }

  if (input.intent.type === "sports_audio" && normalizeProductText(input.product).includes("kulaklık")) {
    score += 30;
  }

  if (input.intent.type === "coffee_starter" && input.product.category === "kahve-ekipmanlari") {
    score += 12;
  }

  if (input.intent.type === "home_office_setup" && input.product.demoStoryFlags.includes("bundle_candidate")) {
    score += 6;
  }

  if (input.intent.type === "meeting_setup" && includesAny(normalizeProductText(input.product), [
    "webcam",
    "kamera",
    "mikrofon",
    "hub",
    "toplantı",
    "sunum",
    "online ders",
    "laptop stand",
  ])) {
    score += 30;
  }

  if (input.intent.type === "gift_finder" && input.product.catalog.useCases.some((useCase) => normalizeText(useCase).includes("hediye"))) {
    score += 14;
  }

  return clampPriority(score);
}

function createProductWarnings(input: {
  product: Product;
  scorecard: ProductScorecard;
  negativeThemes: ReviewTheme[];
  intent: ParsedBuyerIntent;
  buyer: Buyer | undefined;
  manualPreferences: BuyerManualPreferences | undefined;
}): BuyerCartWarning[] {
  const warnings: BuyerCartWarning[] = [];
  const sensitivities = new Set(input.intent.sensitivities);
  const avoidedThemes = unique([
    ...(input.buyer?.previousComplaintThemes ?? []),
    ...(input.manualPreferences?.avoidReviewThemes ?? []),
  ]);
  const overlappingThemes = avoidedThemes.filter((theme) => input.negativeThemes.includes(theme));

  if (sensitivities.has("fast_shipping") && input.scorecard.shipping.score < 70) {
    warnings.push({
      productId: input.product.id,
      severity: "caution",
      title: "Kargo hassasiyeti için dikkat",
      message: `${input.product.name} hızlı teslimat beklentisi olan alıcı için zayıf kargo sinyali taşıyor.`,
      evidence: input.scorecard.shipping.evidence,
    });
  }

  if (
    input.intent.maxDeliveryDays &&
    (input.product.fulfillment.deliveryPromiseDays > input.intent.maxDeliveryDays ||
      input.product.fulfillment.averageDeliveryDays > input.intent.maxDeliveryDays)
  ) {
    warnings.push({
      productId: input.product.id,
      severity: "caution",
      title: "Kargo süresi beklentiyi aşabilir",
      message: `${input.product.name} için teslimat sinyali ${input.intent.maxDeliveryDays} gün beklentisini karşılamayabilir.`,
      evidence: {
        maxDeliveryDays: input.intent.maxDeliveryDays,
        deliveryPromiseDays: input.product.fulfillment.deliveryPromiseDays,
        averageDeliveryDays: input.product.fulfillment.averageDeliveryDays,
        shippingScore: input.scorecard.shipping.score,
      },
    });
  }

  if (sensitivities.has("easy_return") && input.scorecard.returns.score < 70) {
    warnings.push({
      productId: input.product.id,
      severity: "caution",
      title: "İade riski var",
      message: `${input.product.name} için iade güveni düşük; ürün beklentisi net kontrol edilmeli.`,
      evidence: input.scorecard.returns.evidence,
    });
  }

  if (sensitivities.has("quiet_product") && input.negativeThemes.includes("ses-seviyesi")) {
    warnings.push({
      productId: input.product.id,
      severity: "caution",
      title: "Ses seviyesi uyarısı",
      message: `${input.product.name} yorumlarında ses seviyesi teması var.`,
      evidence: { negativeThemes: input.negativeThemes },
    });
  }

  if (overlappingThemes.length > 0) {
    warnings.push({
      productId: input.product.id,
      severity: "caution",
      title: "Geçmiş şikayetlerle çakışıyor",
      message: `${input.product.name}, alıcının daha önce hassas olduğu ${overlappingThemes.join(", ")} temalarında risk taşıyor.`,
      evidence: { overlappingThemes, negativeThemes: input.negativeThemes },
    });
  }

  if (input.scorecard.listing.score < 55) {
    warnings.push({
      productId: input.product.id,
      severity: "info",
      title: "Ürün açıklamasını kontrol et",
      message: `${input.product.name} listeleme güveni düşük; satın almadan önce özellik ve uyumluluk bilgileri okunmalı.`,
      evidence: input.scorecard.listing.evidence,
    });
  }

  return warnings;
}

function selectCartCandidates(
  candidates: ProductCandidate[],
  intent: ParsedBuyerIntent,
  config: IntentConfig,
  budgetLimit: number,
): ProductCandidate[] {
  const selected: ProductCandidate[] = [];
  const selectedProductIds = new Set<string>();
  const selectedSubcategories = new Set<string>();
  let totalPrice = 0;

  for (const candidate of candidates) {
    if (selected.length >= config.maximumItems) {
      break;
    }

    if (!isIntentRelevant(candidate, intent)) {
      continue;
    }

    if (selectedProductIds.has(candidate.product.id)) {
      continue;
    }

    const nextTotal = totalPrice + candidate.product.price;

    if (nextTotal > budgetLimit) {
      continue;
    }

    if (
      selected.length >= config.minimumItems &&
      selectedSubcategories.has(candidate.product.subcategory)
    ) {
      continue;
    }

    selected.push(candidate);
    selectedProductIds.add(candidate.product.id);
    selectedSubcategories.add(candidate.product.subcategory);
    totalPrice = nextTotal;
  }

  if (selected.length >= config.minimumItems) {
    return selected;
  }

  for (const candidate of candidates) {
    if (selected.length >= config.maximumItems) {
      break;
    }

    if (selectedProductIds.has(candidate.product.id)) {
      continue;
    }

    if (!isIntentRelevant(candidate, intent)) {
      continue;
    }

    if (totalPrice + candidate.product.price > budgetLimit) {
      continue;
    }

    selected.push(candidate);
    selectedProductIds.add(candidate.product.id);
    totalPrice += candidate.product.price;
  }

  return selected;
}

function isIntentRelevant(candidate: ProductCandidate, intent: ParsedBuyerIntent): boolean {
  if (intent.type === "generic") {
    return candidate.confidenceScore >= 45;
  }

  if (intent.type === "sports_audio") {
    const productText = normalizeProductText(candidate.product);

    return includesAny(productText, ["kulaklık", "spor kulaklık", "koşu", "fitness"]);
  }

  if (intent.type === "coffee_starter") {
    const productText = normalizeProductText(candidate.product);

    return candidate.product.category === "kahve-ekipmanlari" || productText.includes("kahve");
  }

  if (intent.type === "meeting_setup") {
    const productText = normalizeProductText(candidate.product);

    return includesAny(productText, [
      "webcam",
      "kamera",
      "mikrofon",
      "hub",
      "toplantı",
      "sunum",
      "online ders",
      "laptop stand",
    ]);
  }

  return candidate.relevanceScore >= 18;
}

function createCartItem(candidate: ProductCandidate): BuyerSmartCartItem {
  return {
    productId: candidate.product.id,
    productName: candidate.product.name,
    category: candidate.product.category,
    price: candidate.product.price,
    quantity: 1,
    confidenceScore: candidate.confidenceScore,
    reasons:
      candidate.reasons.length > 0
        ? candidate.reasons
        : [candidate.scorecard.health.summary, candidate.scorecard.reviews.summary],
    warnings: candidate.warnings,
    evidence: {
      healthScore: candidate.scorecard.health.score,
      reviewScore: candidate.scorecard.reviews.score,
      shippingScore: candidate.scorecard.shipping.score,
      returnScore: candidate.scorecard.returns.score,
      listingScore: candidate.scorecard.listing.score,
      matchedUseCases: candidate.matchedUseCases,
      matchedColors: candidate.matchedColors,
    },
  };
}

function createWorkflowWarnings(input: {
  intent: ParsedBuyerIntent;
  config: IntentConfig;
  selectedItems: BuyerSmartCartItem[];
  selectedCandidates: ProductCandidate[];
  totalPrice: number;
}): BuyerCartWarning[] {
  const warnings = input.selectedItems.flatMap((item) => item.warnings);

  if (input.intent.budget && input.totalPrice > input.intent.budget) {
    warnings.push({
      severity: "info",
      title: "Bütçe toleransı kullanıldı",
      message: `Sepet ${formatTry(input.intent.budget)} bütçeyi aşıyor ama %5 tolerans sınırı içinde kalıyor.`,
      evidence: {
        requestedBudget: input.intent.budget,
        softBudgetLimit: input.intent.softBudgetLimit,
        totalPrice: input.totalPrice,
      },
    });
  }

  if (input.selectedItems.length < input.config.minimumItems) {
    warnings.push({
      severity: "info",
      title: "Sepet kapsamı sınırlı",
      message:
        "Bütçe ve güven sinyalleri nedeniyle bu senaryoda daha az ürün seçildi; eksik parçalar tamamlayıcı önerilerde gösterildi.",
      evidence: {
        selectedItemCount: input.selectedItems.length,
        targetMinimumItemCount: input.config.minimumItems,
      },
    });
  }

  if (input.selectedCandidates.length === 0) {
    warnings.push({
      severity: "caution",
      title: "Uygun sepet bulunamadı",
      message: "Bu komut için mevcut mock katalogda bütçe ve güven sinyallerini aynı anda karşılayan ürün bulunamadı.",
      evidence: { intentType: input.intent.type },
    });
  }

  return warnings;
}

function createAlternativeSuggestions(
  selectedCandidates: ProductCandidate[],
  allCandidates: ProductCandidate[],
  budgetLimit: number,
): BuyerProductSuggestion[] {
  const selectedProductIds = new Set(selectedCandidates.map((candidate) => candidate.product.id));
  const relationSuggestions = selectedCandidates.flatMap((candidate) =>
    getRelatedProducts(candidate.product.id, "alternative").map((product) => ({
      product,
      sourceProduct: candidate.product,
    })),
  );
  const alternatives = relationSuggestions
    .filter(({ product }) => !selectedProductIds.has(product.id) && product.price <= budgetLimit)
    .map(({ product, sourceProduct }) => {
      const candidate = allCandidates.find((item) => item.product.id === product.id);

      return {
        productId: product.id,
        productName: product.name,
        price: product.price,
        reason: `${sourceProduct.name} yerine değerlendirilebilir alternatif.`,
        confidenceScore: candidate?.confidenceScore ?? 60,
      };
    });

  if (alternatives.length > 0) {
    return uniqueSuggestions(alternatives).slice(0, 3);
  }

  return allCandidates
    .filter((candidate) => !selectedProductIds.has(candidate.product.id) && candidate.product.price <= budgetLimit)
    .slice(0, 3)
    .map((candidate) => ({
      productId: candidate.product.id,
      productName: candidate.product.name,
      price: candidate.product.price,
      reason: "Aynı ihtiyaç için bütçe ve güven sinyalleriyle değerlendirilebilir.",
      confidenceScore: candidate.confidenceScore,
    }));
}

function createComplementarySuggestions(
  selectedCandidates: ProductCandidate[],
  budgetLimit: number,
): BuyerProductSuggestion[] {
  const selectedProductIds = new Set(selectedCandidates.map((candidate) => candidate.product.id));
  const suggestions = selectedCandidates.flatMap((candidate) =>
    [...getRelatedProducts(candidate.product.id, "complementary"), ...getRelatedProducts(candidate.product.id, "bundle")]
      .filter((product) => !selectedProductIds.has(product.id) && product.price <= budgetLimit)
      .map((product) => ({
        productId: product.id,
        productName: product.name,
        price: product.price,
        reason: `${candidate.product.name} ile birlikte kullanıldığında sepet değerini artırır.`,
        confidenceScore: product.demoStoryFlags.includes("bundle_candidate") ? 78 : 68,
      })),
  );

  return uniqueSuggestions(suggestions)
    .sort((first, second) => second.confidenceScore - first.confidenceScore)
    .slice(0, 3);
}

function createPersonalizationNotes(
  buyer: Buyer | undefined,
  manualPreferences: BuyerManualPreferences | undefined,
  intent: ParsedBuyerIntent,
): string[] {
  const notes: string[] = [];

  if (buyer) {
    notes.push(`${buyer.name} için kayıtlı hassasiyetler dikkate alındı: ${buyer.sensitivities.join(", ")}.`);

    if (buyer.previousComplaintThemes.length > 0) {
      notes.push(
        `Geçmiş şikayet temaları risk kontrolüne eklendi: ${buyer.previousComplaintThemes.join(", ")}.`,
      );
    }
  }

  if (manualPreferences?.sensitivities?.length) {
    notes.push(`Manuel girilen hassasiyetler önceliklendirildi: ${manualPreferences.sensitivities.join(", ")}.`);
  }

  if (intent.requestedColors.length > 0) {
    notes.push(`Renk tercihi sepet skorlamasına katıldı: ${intent.requestedColors.join(", ")}.`);
  }

  return notes;
}

function createSellerSignalCandidates(input: {
  intent: ParsedBuyerIntent;
  selectedItems: BuyerSmartCartItem[];
  warnings: BuyerCartWarning[];
  complementarySuggestions: BuyerProductSuggestion[];
}): BuyerSellerSignalCandidate[] {
  const selectedProductIds = input.selectedItems.map((item) => item.productId);
  const signals: BuyerSellerSignalCandidate[] = [
    {
      type: "buyer_demand",
      productIds: selectedProductIds,
      summary: `Alıcı komutu ${input.intent.type} senaryosu için talep sinyali oluşturdu.`,
      evidence: {
        prompt: input.intent.prompt,
        useCases: input.intent.useCases,
        categories: input.intent.categories,
      },
    },
  ];

  if (input.intent.requestedColors.length > 0) {
    signals.push({
      type: "color_demand",
      productIds: selectedProductIds,
      summary: `Alıcı renk tercihi belirtti: ${input.intent.requestedColors.join(", ")}.`,
      evidence: { requestedColors: input.intent.requestedColors },
    });
  }

  if (input.selectedItems.length > 1 || input.complementarySuggestions.length > 0) {
    signals.push({
      type: "bundle_opportunity",
      productIds: [
        ...selectedProductIds,
        ...input.complementarySuggestions.map((suggestion) => suggestion.productId),
      ],
      summary: "Bu alıcı ihtiyacı birden fazla ürünün birlikte paketlenebileceğini gösteriyor.",
      evidence: {
        selectedItems: selectedProductIds,
        complementarySuggestions: input.complementarySuggestions.map((suggestion) => suggestion.productId),
      },
    });
  }

  const shippingWarnings = input.warnings.filter((warning) => warning.title.includes("Kargo"));

  if (shippingWarnings.length > 0) {
    signals.push({
      type: "shipping_friction",
      productIds: shippingWarnings.flatMap((warning) => warning.productId ?? []),
      summary: "Alıcı hassasiyeti ile ürün kargo sinyalleri arasında sürtünme var.",
      evidence: { warnings: shippingWarnings },
    });
  }

  const reviewWarnings = input.warnings.filter((warning) =>
    ["Geçmiş şikayetlerle çakışıyor", "Ses seviyesi uyarısı", "İade riski var"].includes(warning.title),
  );

  if (reviewWarnings.length > 0) {
    signals.push({
      type: "review_friction",
      productIds: reviewWarnings.flatMap((warning) => warning.productId ?? []),
      summary: "Alıcı geçmiş şikayetleri veya yorum temaları satın alma güvenini etkileyebilir.",
      evidence: { warnings: reviewWarnings },
    });
  }

  return signals;
}

function calculateCartConfidence(
  selectedItems: BuyerSmartCartItem[],
  warnings: BuyerCartWarning[],
): number {
  if (selectedItems.length === 0) {
    return 0;
  }

  const averageItemScore =
    selectedItems.reduce((sum, item) => sum + item.confidenceScore, 0) / selectedItems.length;
  const cautionPenalty = warnings.filter((warning) => warning.severity === "caution").length * 7;
  const infoPenalty = warnings.filter((warning) => warning.severity === "info").length * 2;

  return clampPriority(averageItemScore - cautionPenalty - infoPenalty);
}

function countCautionWarnings(candidate: ProductCandidate): number {
  return candidate.warnings.filter((warning) => warning.severity === "caution").length;
}

function getFallbackBudgetLimit(config: IntentConfig, buyer: Buyer | undefined): number {
  return Math.round(Math.max(config.defaultBudget, budgetAnchorForBuyer(buyer)) * (1 + budgetToleranceRate));
}

function budgetAnchorForBuyer(buyer: Buyer | undefined): number {
  if (!buyer) {
    return 2500;
  }

  if (buyer.budgetBand === "premium") {
    return 5000;
  }

  if (buyer.budgetBand === "orta") {
    return 3000;
  }

  return 1800;
}

function getNegativeThemes(reviews: Review[]): ReviewTheme[] {
  return unique(
    reviews
      .filter((review) => review.sentiment === "negative" || review.needsSellerAttention)
      .flatMap((review) => review.themes),
  );
}

function getMatchedColors(product: Product, colors: string[]): string[] {
  const normalizedColors = colors.map((color) => normalizeText(color));

  return product.catalog.colors.filter((color) => normalizedColors.includes(normalizeText(color)));
}

function normalizeProductText(product: Product): string {
  return normalizeText(
    [
      product.name,
      product.brand,
      product.category,
      product.subcategory,
      product.listing.title,
      product.listing.shortDescription,
      product.listing.longDescription,
      ...product.catalog.colors,
      ...product.catalog.styleTags,
      ...product.catalog.useCases,
      ...product.catalog.packageContents,
    ].join(" "),
  );
}

function normalizeText(value: string): string {
  return value.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
}

function includesAny(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value.includes(normalizeText(candidate)));
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function uniqueSuggestions(suggestions: BuyerProductSuggestion[]): BuyerProductSuggestion[] {
  const seenProductIds = new Set<string>();
  const uniqueItems: BuyerProductSuggestion[] = [];

  for (const suggestion of suggestions) {
    if (seenProductIds.has(suggestion.productId)) {
      continue;
    }

    uniqueItems.push(suggestion);
    seenProductIds.add(suggestion.productId);
  }

  return uniqueItems;
}

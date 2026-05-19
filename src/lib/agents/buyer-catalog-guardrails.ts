import { getProducts } from "@/lib/data";

export interface BuyerCatalogPromptGuardResult {
  message?: string;
  ok: boolean;
  reason: string;
  unsupportedTerms: string[];
}

const unsupportedCatalogDetectors: Array<{
  label: string;
  match: (prompt: string) => boolean;
}> = [
  { label: "iPhone", match: (prompt) => /\bi\s?phone\b/u.test(prompt) || /\biphone\b/u.test(prompt) },
  { label: "MacBook", match: (prompt) => /\bmacbook\b/u.test(prompt) },
  { label: "PlayStation", match: (prompt) => /\bplaystation\b/u.test(prompt) || /\bps5\b/u.test(prompt) },
  { label: "Xbox", match: (prompt) => /\bxbox\b/u.test(prompt) },
  {
    label: "telefon",
    match: (prompt) =>
      /\b(?:cep telefonu|akıllı telefon|akilli telefon|android|telefon)\b/u.test(prompt) &&
      !includesAny(prompt, ["aksesuar", "stand", "standı", "standi", "tutucu", "şarj", "sarj", "powerbank"]),
  },
  {
    label: "tablet",
    match: (prompt) => /\btablet\b/u.test(prompt) && !includesAny(prompt, ["stand", "standı", "standi", "aksesuar"]),
  },
  {
    label: "laptop",
    match: (prompt) => /\blaptop\b/u.test(prompt) && !includesAny(prompt, ["stand", "standı", "standi", "setup", "hub", "aksesuar"]),
  },
  {
    label: "televizyon",
    match: (prompt) => /\b(?:televizyon|tv)\b/u.test(prompt) && !includesAny(prompt, ["kablo", "düzen", "duzen", "arkası", "arkasi"]),
  },
  { label: "buzdolabı", match: (prompt) => /\bbuzdolab/u.test(prompt) },
  { label: "çamaşır makinesi", match: (prompt) => /\b(?:çamaşır|camasir)\b/u.test(prompt) },
  { label: "bulaşık makinesi", match: (prompt) => /\b(?:bulaşık|bulasik)\b/u.test(prompt) },
  {
    label: "koltuk takımı",
    match: (prompt) =>
      /\b(?:koltuk\s*takımı|koltuk\s*takimi|oturma\s*grubu|salon\s*koltuğu|salon\s*koltugu|kanepe|sofa|çekyat|cekyat|berjer)\b/u.test(
        prompt,
      ) ||
      (/\bkoltuk\b/u.test(prompt) && !includesAny(prompt, ["ofis", "çalışma", "calisma", "masa", "ergonom"])),
  },
  { label: "ayakkabı", match: (prompt) => /\b(?:ayakkabı|ayakkabi|sneaker|bot)\b/u.test(prompt) },
  { label: "mont", match: (prompt) => /\b(?:mont|ceket|kaban)\b/u.test(prompt) },
  { label: "parfüm", match: (prompt) => /\b(?:parfüm|parfum)\b/u.test(prompt) },
  { label: "bisiklet", match: (prompt) => /\bbisiklet\b/u.test(prompt) },
  { label: "araba", match: (prompt) => /\b(?:araba|otomobil|motosiklet)\b/u.test(prompt) },
];

export function analyzeBuyerCatalogPrompt(prompt: string): BuyerCatalogPromptGuardResult {
  const normalizedPrompt = normalizePrompt(prompt);
  const unsupportedTerms = getUnsupportedBuyerCatalogTerms(normalizedPrompt);

  if (unsupportedTerms.length > 0) {
    return {
      message: createUnsupportedBuyerCatalogAnswer(unsupportedTerms),
      ok: false,
      reason: "Prompt Alışveriş Arkadaşım kataloğunda ürün olarak bulunmayan belirgin bir ürün ailesi içeriyor.",
      unsupportedTerms,
    };
  }

  return {
    ok: true,
    reason: "Prompt mevcut katalog kapsamı veya genel katalog filtresi olarak güvenli.",
    unsupportedTerms: [],
  };
}

export function createUnsupportedBuyerCatalogAnswer(terms: string[] = []): string {
  const termLabel = terms.length > 0 ? ` (${terms.join(", ")})` : "";

  return `Bu ürün tipi${termLabel} şu an Alışveriş Arkadaşım kataloğunda yok. Katalogda bulunan ürünlerden bütçe, teslimat, kategori veya kullanım amacına göre seçim yapabilirim; örneğin 2000 TL altı mevcut ürünleri sıralayabilirim.`;
}

export function getUnsupportedBuyerCatalogTerms(prompt: string): string[] {
  const normalizedPrompt = normalizePrompt(prompt);

  return unsupportedCatalogDetectors
    .filter((detector) => detector.match(normalizedPrompt))
    .map((detector) => detector.label);
}

export function hasUnsupportedBuyerCatalogTerm(value: string): boolean {
  return getUnsupportedBuyerCatalogTerms(value).length > 0;
}

export function getCatalogSupportedPromptHints(): string[] {
  const products = getProducts();
  const categories = Array.from(new Set(products.map((product) => product.subcategory)));
  const useCases = Array.from(new Set(products.flatMap((product) => product.catalog.useCases)));

  return [...categories, ...useCases].slice(0, 24);
}

function normalizePrompt(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function includesAny(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword));
}

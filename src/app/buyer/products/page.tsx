import Link from "next/link";
import { BuyerCatalogGrid } from "@/components/commerce/buyer-catalog-grid";
import {
  getBuyerCatalogApiData,
  isBuyerMarketplaceCategory,
  type BuyerCatalogSort,
  type BuyerMarketplaceCategoryId,
} from "@/lib/api/buyer-catalog";

const sortOptions: Array<{ id: BuyerCatalogSort; label: string }> = [
  { id: "featured", label: "Öne Çıkanlar" },
  { id: "fast-delivery", label: "Hızlı Kargo" },
  { id: "rating", label: "Yüksek Puan" },
  { id: "price-asc", label: "Artan Fiyat" },
];

export default async function BuyerProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string | string[]; sort?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const activeCategory = getFirstParam(resolvedSearchParams?.category);
  const activeSort = getFirstParam(resolvedSearchParams?.sort);
  const data = getBuyerCatalogApiData({
    category: activeCategory,
    sort: activeSort,
  });
  const selectedCategory = data.categories.find((category) => category.id === data.request.category);
  const heroProducts = data.products.slice(0, 5);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white px-4 py-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
        <div className="flex gap-5 overflow-x-auto pb-1 md:justify-between">
          {data.categories.map((category) => {
            const isActive = data.request.category === category.id;

            return (
              <Link
                key={category.id}
                href={createCatalogHref({
                  category: isActive ? undefined : category.id,
                  sort: data.request.sort,
                })}
                className={`group flex w-[116px] shrink-0 flex-col items-center gap-2 rounded-lg border px-3 py-3 text-center transition active:translate-y-px ${
                  isActive
                    ? "border-orange-200 bg-orange-50 text-orange-700"
                    : "border-transparent bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-16 w-16 rounded-full border border-slate-200 bg-slate-50 bg-[length:500%_400%] bg-no-repeat shadow-[0_12px_30px_-24px_rgba(15,23,42,0.7)] transition duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${category.image.src})`,
                    backgroundPosition: category.image.position,
                  }}
                />
                <span className="text-sm font-semibold leading-5">{category.label}</span>
                <span className="font-mono text-xs text-slate-400">{category.count} ürün</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="relative overflow-hidden rounded-lg border border-orange-200 bg-orange-50 p-5 shadow-[0_18px_54px_-48px_rgba(249,115,22,0.45)] md:min-h-[190px]">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_360px] md:items-end">
            <div className="relative z-[1] max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950 md:text-4xl">
                İyi ürün. Doğru fiyat. Güvenli alışveriş.
              </h2>
              <p className="mt-3 max-w-[58ch] text-sm leading-6 text-slate-700">
                CommercePilot katalog ürünlerini fiyat, teslimat, yorum ve sepet sinyaliyle birlikte gösterir.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {data.campaignChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-orange-200 bg-white px-3 text-xs font-semibold text-slate-700"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
            <div className="pointer-events-none relative hidden h-36 md:block">
              {heroProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="absolute bottom-[-8px] h-32 w-32 rounded-lg border border-white/80 bg-white bg-[length:500%_400%] bg-no-repeat shadow-[0_18px_42px_-32px_rgba(15,23,42,0.75)]"
                  style={{
                    backgroundImage: `url(${product.image.src})`,
                    backgroundPosition: product.image.position,
                    right: `${index * 56}px`,
                    transform: `rotate(${index % 2 === 0 ? -3 : 4}deg) translateY(${index * -4}px)`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
          <p className="text-sm font-semibold text-slate-950">Agent ile hızlı sepet</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Bütçe, stil ve teslimat beklentini yaz; Agent katalogdaki ürünlerden sepet önerisi hazırlasın.
          </p>
          <Link
            href="/buyer/agent"
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
          >
            Agent’a git
          </Link>
        </div>
      </section>

      <section className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 md:text-3xl">
            {selectedCategory ? selectedCategory.label : "Popüler Ürünler"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {data.summary.visibleProductCount} ürün listeleniyor
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/buyer/products"
            className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
          >
            Tümünü Göster
          </Link>
          {sortOptions.map((option) => (
            <Link
              key={option.id}
              href={createCatalogHref({
                category: isBuyerMarketplaceCategory(data.request.category) ? data.request.category : undefined,
                sort: option.id,
              })}
              className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold transition active:translate-y-px ${
                data.request.sort === option.id
                  ? "border-slate-950 bg-slate-950 text-[#fff]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:text-orange-700"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </section>

      <BuyerCatalogGrid products={data.products} />
    </div>
  );
}

function getFirstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function createCatalogHref(input: {
  category?: BuyerMarketplaceCategoryId;
  sort?: BuyerCatalogSort;
}): string {
  const params = new URLSearchParams();

  if (input.category) {
    params.set("category", input.category);
  }

  if (input.sort && input.sort !== "featured") {
    params.set("sort", input.sort);
  }

  const query = params.toString();

  return query ? `/buyer/products?${query}` : "/buyer/products";
}

import { products } from "@/data/mock/products";
import type { DemoStoryFlag, Product, ProductCategory } from "@/types/commerce";

export function getProducts(): Product[] {
  return products;
}

export function getProductById(productId: string): Product | undefined {
  return products.find((product) => product.id === productId);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getProductsBySellerId(sellerId: string): Product[] {
  return products.filter((product) => product.sellerId === sellerId);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return products.filter((product) => product.category === category);
}

export function getProductsByDemoStoryFlag(flag: DemoStoryFlag): Product[] {
  return products.filter((product) => product.demoStoryFlags.includes(flag));
}

export function getProductsByUseCase(useCase: string): Product[] {
  const normalizedUseCase = useCase.toLocaleLowerCase("tr-TR");

  return products.filter((product) =>
    product.catalog.useCases.some((candidate) =>
      candidate.toLocaleLowerCase("tr-TR").includes(normalizedUseCase),
    ),
  );
}

export function getProductsByColor(color: string): Product[] {
  const normalizedColor = color.toLocaleLowerCase("tr-TR");

  return products.filter((product) =>
    product.catalog.colors.some((candidate) =>
      candidate.toLocaleLowerCase("tr-TR").includes(normalizedColor),
    ),
  );
}

export function getProductsInPriceRange(minPrice: number, maxPrice: number): Product[] {
  return products.filter((product) => product.price >= minPrice && product.price <= maxPrice);
}

export function searchProducts(query: string): Product[] {
  const normalizedQuery = query.toLocaleLowerCase("tr-TR");

  return products.filter((product) => {
    const searchableText = [
      product.name,
      product.brand,
      product.category,
      product.subcategory,
      product.listing.title,
      product.listing.shortDescription,
      ...product.catalog.colors,
      ...product.catalog.styleTags,
      ...product.catalog.useCases,
    ]
      .join(" ")
      .toLocaleLowerCase("tr-TR");

    return searchableText.includes(normalizedQuery);
  });
}

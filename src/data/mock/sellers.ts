import type { Seller } from "@/types/commerce";

export const sellers: Seller[] = [
  {
    id: "seller-commercepilot",
    name: "CommercePilot",
    displayName: "CommercePilot Demo Store",
    market: "turkey",
    rating: 4.6,
    totalProducts: 40,
    joinedAt: "2024-01-15",
    supportResponseHours: 7,
    defaultDeliveryPromiseDays: 3,
    operatingModel: "mock",
    notes: [
      "Satıcı paneli için ana demo mağazası.",
      "Ürün kataloğu satıcı aksiyonları, alıcı akıllı sepet ve yorum zekası senaryolarını beslemek için curated hazırlandı.",
    ],
  },
];

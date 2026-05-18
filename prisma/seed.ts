import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";
import {
  buyers,
  carts,
  inventoryEvents,
  orders,
  productRelations,
  products,
  reviews,
  sellers,
} from "../src/data/mock";

for (const fileName of [".env.local", ".env"]) {
  const envPath = resolve(process.cwd(), fileName);

  if (existsSync(envPath)) {
    loadEnv({ path: envPath, override: false });
  }
}

function getSeedDatabaseUrl(): string {
  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL or DIRECT_URL is required before running prisma seed.");
  }

  return databaseUrl;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getSeedDatabaseUrl() }),
});

function dateFromIsoDay(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function optionalDateFromIsoDay(value: string | undefined): Date | null {
  return value ? dateFromIsoDay(value) : null;
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function clearCommerceData() {
  await prisma.sellerListingMutation.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.commerceOrder.deleteMany();
  await prisma.review.deleteMany();
  await prisma.inventoryEvent.deleteMany();
  await prisma.productRelation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.seller.deleteMany();
}

async function seedCommerceData() {
  await prisma.seller.createMany({
    data: sellers.map((seller) => ({
      id: seller.id,
      name: seller.name,
      displayName: seller.displayName,
      market: seller.market,
      rating: seller.rating,
      totalProducts: seller.totalProducts,
      joinedAt: dateFromIsoDay(seller.joinedAt),
      supportResponseHours: seller.supportResponseHours,
      defaultDeliveryPromiseDays: seller.defaultDeliveryPromiseDays,
      operatingModel: seller.operatingModel,
      notes: seller.notes,
    })),
  });

  await prisma.buyer.createMany({
    data: buyers.map((buyer) => ({
      id: buyer.id,
      name: buyer.name,
      city: buyer.city,
      persona: buyer.persona,
      sensitivities: buyer.sensitivities,
      preferredColors: buyer.preferredColors,
      budgetBand: buyer.budgetBand,
      previousComplaintThemes: buyer.previousComplaintThemes,
      notes: buyer.notes,
    })),
  });

  await prisma.product.createMany({
    data: products.map((product) => ({
      id: product.id,
      sellerId: product.sellerId,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      subcategory: product.subcategory,
      currency: product.currency,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      unitCost: product.unitCost,
      stock: json(product.stock),
      fulfillment: json(product.fulfillment),
      listing: json(product.listing),
      catalog: json(product.catalog),
      specs: json(product.specs),
      metrics: json(product.metrics),
      demoStoryFlags: product.demoStoryFlags,
    })),
  });

  await prisma.review.createMany({
    data: reviews.map((review) => ({
      id: review.id,
      productId: review.productId,
      buyerId: review.buyerId,
      rating: review.rating,
      title: review.title,
      body: review.body,
      sentiment: review.sentiment,
      themes: review.themes,
      createdAt: dateFromIsoDay(review.createdAt),
      verifiedPurchase: review.verifiedPurchase,
      deliveryDays: review.deliveryDays,
      needsSellerAttention: review.needsSellerAttention,
    })),
  });

  await prisma.commerceOrder.createMany({
    data: orders.map((order) => ({
      id: order.id,
      sellerId: order.sellerId,
      buyerId: order.buyerId,
      status: order.status,
      createdAt: dateFromIsoDay(order.createdAt),
      deliveredAt: optionalDateFromIsoDay(order.deliveredAt),
      total: order.total,
      deliveryDays: order.deliveryDays,
      returnedProductIds: order.returnedProductIds,
    })),
  });

  await prisma.orderItem.createMany({
    data: orders.flatMap((order) =>
      order.items.map((item, index) => ({
        id: `${order.id}-${item.productId}-${index}`,
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    ),
  });

  await prisma.inventoryEvent.createMany({
    data: inventoryEvents.map((event) => ({
      id: event.id,
      productId: event.productId,
      type: event.type,
      quantity: event.quantity,
      createdAt: dateFromIsoDay(event.createdAt),
      note: event.note,
    })),
  });

  await prisma.productRelation.createMany({
    data: productRelations.map((relation) => ({
      id: relation.id,
      sourceProductId: relation.sourceProductId,
      relatedProductId: relation.relatedProductId,
      type: relation.type,
      strength: relation.strength,
      reason: relation.reason,
    })),
  });

  await prisma.cart.createMany({
    data: carts.map((cart) => ({
      id: cart.id,
      buyerId: cart.buyerId,
      prompt: cart.prompt,
      budget: cart.budget,
      status: cart.status,
      rationale: cart.rationale,
    })),
  });

  await prisma.cartItem.createMany({
    data: carts.flatMap((cart) =>
      cart.items.map((item, index) => ({
        id: `${cart.id}-${item.productId}-${index}`,
        cartId: cart.id,
        productId: item.productId,
        quantity: item.quantity,
      })),
    ),
  });
}

async function main() {
  await clearCommerceData();
  await seedCommerceData();

  console.log("CommercePilot Supabase seed completed.");
  console.log(`Sellers: ${sellers.length}`);
  console.log(`Buyers: ${buyers.length}`);
  console.log(`Products: ${products.length}`);
  console.log(`Reviews: ${reviews.length}`);
  console.log(`Orders: ${orders.length}`);
  console.log(`Inventory events: ${inventoryEvents.length}`);
  console.log(`Product relations: ${productRelations.length}`);
  console.log(`Carts: ${carts.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

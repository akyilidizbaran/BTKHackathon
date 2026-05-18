# Supabase Database Kurulum Rehberi

Bu rehber, CommercePilot curated mock dataset'ini Supabase Postgres içine taşımak için izlenecek güvenli yolu anlatır.

Amaç bu aşamada uygulamanın tüm davranışını bir anda değiştirmek değildir. İlk fazda mevcut mock data PostgreSQL'e seed edilir; route, workflow, scoring ve Agent contract'ları kırılmadan korunur. Sonraki fazda data access layer DB'den okumaya alınabilir.

## 1. Supabase Projesi Oluştur

1. Supabase dashboard'a gir.
2. Yeni bir project oluştur.
3. Region olarak mümkünse Vercel deploy region'ına yakın bir region seç.
4. Database password'ünü kaydet. Bu parola `.env.local` içinde kullanılacak; repoya commitlenmeyecek.

Referans:

- Supabase Next.js quickstart: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Supabase Prisma bağlantı notları: https://supabase.com/docs/guides/database/prisma

## 2. Connection String'leri Al

Supabase dashboard içinde Project Settings -> Database -> Connection string bölümüne gir.

Prisma için iki bağlantı kullanacağız:

```text
DATABASE_URL = pooled / transaction mode bağlantı
DIRECT_URL   = direct / session mode bağlantı
```

`.env.local` içine şu şekilde ekle:

```bash
DATA_SOURCE=mock
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="ey..."
DATABASE_URL="postgres://postgres.[PROJECT-REF]:[DB-PASSWORD]@[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgres://postgres.[PROJECT-REF]:[DB-PASSWORD]@[REGION].pooler.supabase.com:5432/postgres"
```

Notlar:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ve legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` Supabase MCP ile okunabilir public client değerleridir.
- `DATA_SOURCE=mock` şimdilik bilinçli. DB seed edilecek ama uygulama okuma katmanı sonraki fazda taşınacak.
- Supabase dashboard Prisma için hazır connection string veriyorsa onu kullan.
- `[DB-PASSWORD]` köşeli parantezle kalmaz; gerçek parola doğrudan yazılır. Parolada URL için özel karakter varsa encode etmek gerekebilir.
- Secret değerleri chat'e veya GitHub'a yazma.

## 3. Lokal Prisma Kontrollerini Çalıştır

Önce schema doğrula:

```bash
npm run db:validate
```

Client üret:

```bash
npm run db:generate
```

Beklenen sonuç:

```text
Prisma schema loaded from prisma/schema.prisma
The schema at prisma/schema.prisma is valid
Generated Prisma Client
```

## 4. Migration'ı Supabase'e Uygula

Repo içinde ilk migration dosyası hazır:

```text
prisma/migrations/20260518190000_init_commercepilot_schema/migration.sql
```

Supabase DB'ye uygula:

```bash
npm run db:migrate:deploy
```

Bu komut tabloları ve ilişkileri oluşturur:

- `sellers`
- `buyers`
- `products`
- `reviews`
- `orders`
- `order_items`
- `inventory_events`
- `product_relations`
- `carts`
- `cart_items`
- `seller_listing_mutations`

## 5. Mock Dataset'i DB'ye Seed Et

```bash
npm run db:seed
```

Beklenen özet:

```text
CommercePilot Supabase seed completed.
Sellers: 1
Buyers: 8
Products: 48
Reviews: 55
Orders: ...
Inventory events: 25
Product relations: 30
Carts: 5
```

Seed script'i şu kaynakları DB'ye taşır:

- `src/data/mock/sellers.ts`
- `src/data/mock/buyers.ts`
- `src/data/mock/products.ts`
- `src/data/mock/reviews.ts`
- `src/data/mock/orders.ts`
- `src/data/mock/inventory-events.ts`
- `src/data/mock/product-relations.ts`
- `src/data/mock/carts.ts`

Seed tekrar çalıştırılabilir olacak şekilde tasarlandı. Önce ilişkili tabloları güvenli sırayla temizler, sonra aynı curated dataset'i yeniden yazar; Supabase pooler üzerinde transaction başlangıç timeout riskini azaltmak için temizleme adımları tek büyük transaction içinde çalışmaz.

## 6. Supabase Dashboard'da Kontrol Et

Supabase Table Editor'da şu sayıları kontrol et:

| Tablo | Beklenen |
|---|---:|
| `sellers` | 1 |
| `buyers` | 8 |
| `products` | 48 |
| `reviews` | 55 |
| `inventory_events` | 25 |
| `product_relations` | 30 |
| `carts` | 5 |

Sipariş sayısı `src/data/mock/orders.ts` içindeki kayıt sayısıyla aynı olmalı.

## 7. Vercel Env Ayarları

Vercel Project Settings -> Environment Variables içine şunları ekle:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
DATABASE_URL
DIRECT_URL
DATA_SOURCE
```

Şimdilik:

```text
DATA_SOURCE=mock
```

DB okuma fazına geçtiğimizde:

```text
DATA_SOURCE=database
```

Vercel Marketplace storage kullanılırsa credentials otomatik env olarak inject edilebilir. Referans: https://vercel.com/docs/marketplace-storage

## 8. Bu Fazın Sınırı

Bu commit ile yapılan iş:

- Prisma schema eklendi.
- Supabase/Postgres migration eklendi.
- Mock dataset'i DB'ye seed eden script eklendi.
- Safe Prisma generate/validate script'leri eklendi.

Henüz yapılmayan iş:

- `src/lib/data/*` helper'larını DB'den okuyacak hale getirmek.
- Buyer cart `localStorage` state'ini DB'ye taşımak.
- Buyer/seller profile draft'larını DB'ye taşımak.
- Seller listing mutation/audit rollback state'ini DB'ye taşımak.

Bunlar P2 aşamasında yapılmalı. Böylece demo/deploy öncesi kırılma riski kontrol altında kalır.

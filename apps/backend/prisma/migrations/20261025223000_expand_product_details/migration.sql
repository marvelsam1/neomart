ALTER TABLE "products"
ADD COLUMN "rating" DECIMAL(2,1) NOT NULL DEFAULT 0,
ADD COLUMN "reviews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "badge" TEXT,
ADD COLUMN "details" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "options" JSONB,
ADD COLUMN "originCity" TEXT;

INSERT INTO "categories" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Fashion', 'fashion', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Home & Living', 'home-living', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Food & Spices', 'food-spices', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Beauty', 'beauty', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Art & Crafts', 'art-crafts', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Accessories', 'accessories', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

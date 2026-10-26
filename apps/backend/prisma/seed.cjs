const bcrypt = require("bcrypt");
const { PrismaClient, Role } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const defaultCategories = [
    { name: "Fashion", slug: "fashion" },
    { name: "Home & Living", slug: "home-living" },
    { name: "Food & Spices", slug: "food-spices" },
    { name: "Beauty", slug: "beauty" },
    { name: "Art & Crafts", slug: "art-crafts" },
    { name: "Accessories", slug: "accessories" },
  ];
  await prisma.category.createMany({
    data: defaultCategories,
    skipDuplicates: true,
  });

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD in apps/backend/.env before seeding.",
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.endsWith("@example.com")) {
    throw new Error("ADMIN_EMAIL must be a real administrator email address.");
  }
  if (
    password.length < 12 ||
    password.startsWith("replace-with-") ||
    password === "password123"
  ) {
    throw new Error(
      "ADMIN_PASSWORD must be a unique password with at least 12 characters.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const firstName = process.env.ADMIN_FIRST_NAME?.trim() || "Marketplace";
  const lastName = process.env.ADMIN_LAST_NAME?.trim() || "Administrator";

  const admin = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: Role.ADMIN,
      isVerified: true,
    },
    update: {
      passwordHash,
      firstName,
      lastName,
      role: Role.ADMIN,
      isVerified: true,
    },
    select: { email: true, role: true },
  });

  console.info(`Admin account seeded: ${admin.email} (${admin.role}).`);
}

main()
  .catch((error) => {
    console.error("Admin account seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const username = process.env.ADMIN_SEED_USERNAME;
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const fullName = process.env.ADMIN_SEED_FULL_NAME;

  if (!username || !email || !password) {
    throw new Error(
      "ADMIN_SEED_USERNAME, ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required.",
    );
  }

  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error(
      "Admin password must be at least 12 characters and no more than 72 bytes.",
    );
  }

  const existingAdmin = await prisma.admin.findFirst({
    where: {
      OR: [{ username }, { email: email.toLowerCase() }],
    },
  });

  if (existingAdmin) {
    console.log("An admin with this username or email already exists.");
    console.log("No existing admin data or password was changed.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.create({
    data: {
      username,
      email: email.toLowerCase(),
      passwordHash,
      fullName: fullName || "Portfolio Super Administrator",
      role: "SUPER_ADMIN",
      isActive: true,
    },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  console.log("Super Admin created successfully:");
  console.log(admin);
}

main()
  .catch((error) => {
    console.error("Admin seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123", 12);

  const org = await prisma.organization.upsert({
    where: { slug: "sunrise-realty-demo" },
    update: {},
    create: {
      name: "Sunrise Realty",
      slug: "sunrise-realty-demo",
      industry: "REAL_ESTATE",
      city: "Mumbai",
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@sunriserealty.demo" },
    update: {},
    create: {
      name: "Asha Mehta",
      email: "owner@sunriserealty.demo",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: owner.id, organizationId: org.id } },
    update: {},
    create: { userId: owner.id, organizationId: org.id, role: "OWNER" },
  });

  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      plan: "GROWTH",
      status: "ACTIVE",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.aIAgent.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      personaPrompt: "Demo persona — see lib/ai/prompts/persona.ts for the generated default.",
    },
  });

  console.log(`Seeded demo org: ${org.name} (${org.slug})`);
  console.log(`Login: owner@sunriserealty.demo / Password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

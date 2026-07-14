import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { SignupInput } from "@/lib/validation/auth";
import { getDefaultPersonaPrompt } from "@/lib/ai/prompts/persona";
import { sendVerificationEmail } from "@/lib/integrations/resend.client";
import crypto from "crypto";

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  // Append a short random suffix so two "Sunrise Realty" signups don't collide.
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
}

/**
 * Creates the org, owner user, membership, trial subscription, and a
 * default AI agent in a single transaction — signup either fully
 * succeeds or leaves no partial rows behind.
 */
export async function signupNewOrganization(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const slug = slugify(input.organizationName);

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: input.organizationName,
        slug,
        industry: input.industry,
        phone: input.phone,
      },
    });

    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "OWNER",
      },
    });

    await tx.subscription.create({
      data: {
        organizationId: organization.id,
        plan: "STARTER",
        status: "TRIALING",
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
      },
    });

    await tx.aIAgent.create({
      data: {
        organizationId: organization.id,
        personaPrompt: getDefaultPersonaPrompt(input.industry),
      },
    });

    return { organization, user };
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: input.email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await sendVerificationEmail(input.email, token);

  return result;
}

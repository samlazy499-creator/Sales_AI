import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { sendPasswordResetEmail } from "@/lib/integrations/resend.client";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 422 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always return success, whether or not the account exists — prevents
  // account enumeration via this endpoint.
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${parsed.data.email}`,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await sendPasswordResetEmail(parsed.data.email, token);
  }

  return NextResponse.json({
    message: "If an account exists for that email, a reset link has been sent.",
  });
}

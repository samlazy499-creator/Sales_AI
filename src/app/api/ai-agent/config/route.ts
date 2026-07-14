import { NextRequest, NextResponse } from "next/server";
import { requireOrgMember } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  organizationId: z.string().cuid(),
  name: z.string().min(1).max(60).optional(),
  personaPrompt: z.string().min(20).max(4000).optional(),
  temperature: z.number().min(0).max(1).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const organizationId = req.nextUrl.searchParams.get("organizationId");
  if (!organizationId) return NextResponse.json({ error: "organizationId is required" }, { status: 400 });

  try {
    await requireOrgMember(organizationId);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const agent = await prisma.aIAgent.findUnique({ where: { organizationId } });
  return NextResponse.json({ agent });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { organizationId, ...data } = parsed.data;

  try {
    await requireOrgMember(organizationId);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const agent = await prisma.aIAgent.update({ where: { organizationId }, data });
  return NextResponse.json({ agent });
}

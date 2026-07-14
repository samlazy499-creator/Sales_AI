import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";

/** Ordered from most to least privileged so `hasAtLeast` can compare ranks. */
const ROLE_RANK: Record<Role, number> = {
  OWNER: 3,
  SALES_MANAGER: 2,
  SALES_EMPLOYEE: 1,
};

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Resolves the current session and confirms the caller is a member of
 * `organizationId` with at least `minRole`. Throws rather than returning
 * a nullable so route handlers can call this first and trust the result
 * without an extra null-check branch.
 */
export async function requireRole(organizationId: string, minRole: Role) {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();

  const membership = session.memberships.find(
    (m) => m.organizationId === organizationId
  );
  if (!membership) throw new ForbiddenError("Not a member of this organization");

  if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw new ForbiddenError(`Requires ${minRole} or higher`);
  }

  return { session, membership };
}

export async function requireOrgMember(organizationId: string) {
  return requireRole(organizationId, "SALES_EMPLOYEE");
}

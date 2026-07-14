import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

export type MembershipSummary = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: Role;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    memberships: MembershipSummary[];
    activeOrganizationId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    memberships?: MembershipSummary[];
    activeOrganizationId?: string | null;
  }
}

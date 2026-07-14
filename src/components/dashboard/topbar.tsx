import { auth } from "@/lib/auth/config";

export async function Topbar() {
  const session = await auth();
  const activeOrg = session?.memberships?.find(
    (m) => m.organizationId === session.activeOrganizationId
  );

  return (
    <header className="h-16 border-b border-white/[0.06] flex items-center justify-between px-6 sticky top-0 bg-ink-950/80 backdrop-blur-lg z-10">
      <div>
        <p className="text-sm text-mist-50 font-medium">
          {activeOrg?.organizationName ?? "Your organization"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-signal-600/30 flex items-center justify-center text-xs font-medium text-signal-400">
          {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
        </div>
      </div>
    </header>
  );
}

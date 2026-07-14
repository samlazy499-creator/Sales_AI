import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { ChannelSettingsForm } from "@/components/dashboard/channel-settings-form";

export default async function SettingsPage() {
  const session = await auth();
  const organizationId = session?.activeOrganizationId;
  if (!organizationId) redirect("/login");

  const channel = await prisma.channel.findUnique({ where: { organizationId } });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://your-app.vercel.app";

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-mist-50 mb-6">Settings</h1>
      <ChannelSettingsForm channel={channel} organizationId={organizationId} appUrl={appUrl} />
    </div>
  );
}

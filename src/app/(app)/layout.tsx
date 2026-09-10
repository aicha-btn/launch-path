import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/toaster";
import { requireMembership } from "@/server/auth/session";

/**
 * Shell applicatif.
 *
 * `requireMembership()` fait deux redirections différentes : vers `/login`
 * s'il n'y a pas de session, vers `/welcome` s'il y a une session mais pas
 * encore d'organisation. Le middleware ne peut pas faire la seconde : il
 * n'a pas accès à la base.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const membership = await requireMembership();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas md:flex-row">
      <Sidebar membership={membership} />
      <main className="min-w-0 flex-1">{children}</main>
      <Toaster />
    </div>
  );
}

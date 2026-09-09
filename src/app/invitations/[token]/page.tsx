import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { acceptInvitation, readInvitation } from "@/server/actions/invitations";
import { getCurrentUser } from "@/server/auth/session";

/** Page publique : la personne invitée n'a pas encore forcément de compte. */
export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await readInvitation(token);
  const user = await getCurrentUser();

  const frame = (
    kicker: string,
    title: React.ReactNode,
    body: React.ReactNode,
    action?: React.ReactNode,
  ) => (
    <main className="min-h-dvh bg-paper px-6 py-16 sm:px-16 lg:px-24">
      <div className="flex min-h-[calc(100dvh-8rem)] items-center">
        <div className="w-full max-w-[460px]">
          <div className="rule-double pt-6">
            <Link href="/" className="no-underline">
              <Logo />
            </Link>
          </div>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-70">
            {kicker}
          </p>

          <h1 className="mt-3 font-serif text-[40px] leading-[1.03] tracking-[-0.02em] text-ink">
            {title}
          </h1>

          <div className="mt-6 max-w-[46ch] text-[13px] leading-relaxed text-ink-70">
            {body}
          </div>

          {action && <div className="mt-8">{action}</div>}
        </div>
      </div>
    </main>
  );

  if (invitation.status === "invalid") {
    return frame(
      "Invitation",
      <>Ce lien n&apos;est pas valide.</>,
      <p>
        Le lien est peut-être incomplet, ou l&apos;invitation a été annulée.
        Demandez-en une nouvelle à la personne qui vous a invité·e.
      </p>,
      <Link
        href="/"
        className="inline-flex h-9 items-center border border-ink px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink no-underline hover:bg-ink-08"
      >
        Retour à l&apos;accueil
      </Link>,
    );
  }

  if (invitation.status === "expired") {
    return frame(
      `Invitation · ${invitation.organizationName}`,
      <>Cette invitation a expiré.</>,
      <p>
        Les invitations sont valables sept jours. Demandez à un administrateur
        de {invitation.organizationName} de vous en envoyer une nouvelle.
      </p>,
    );
  }

  if (invitation.status === "accepted") {
    return frame(
      `Invitation · ${invitation.organizationName}`,
      <>Cette invitation a déjà été utilisée.</>,
      <p>
        Si c&apos;était vous, connectez-vous simplement. Sinon, demandez une
        nouvelle invitation.
      </p>,
      <Link
        href="/login"
        className="inline-flex h-9 items-center bg-offset px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper no-underline hover:bg-ink"
      >
        Se connecter
      </Link>,
    );
  }

  // Invitation valide.
  return frame(
    `Invitation · ${invitation.organizationName}`,
    <>
      Rejoignez
      <br />
      {invitation.organizationName}.
    </>,
    <>
      <p>
        Vous avez été invité·e en tant que{" "}
        <strong className="font-semibold text-ink">
          {invitation.role === "admin" ? "administrateur" : "membre"}
        </strong>
        . Vous pourrez voir les intégrations en cours et traiter les étapes qui
        vous sont assignées.
      </p>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-45">
        Adresse invitée · {invitation.email}
      </p>
    </>,
    user ? (
      <form action={acceptInvitation}>
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="inline-flex h-9 items-center bg-offset px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper transition-colors duration-[120ms] hover:bg-ink"
        >
          Accepter l&apos;invitation
        </button>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45">
          Connecté en tant que {user.email}
        </p>
      </form>
    ) : (
      <>
        <Link
          href={`/login?suivant=${encodeURIComponent(`/invitations/${token}`)}`}
          className="inline-flex h-9 items-center bg-offset px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper no-underline transition-colors duration-[120ms] hover:bg-ink"
        >
          Se connecter pour accepter
        </Link>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-70">
          Vous reviendrez ici automatiquement après la connexion.
        </p>
      </>
    ),
  );
}

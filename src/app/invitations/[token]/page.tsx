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
    <main className="motion-page min-h-dvh bg-canvas px-6 py-16 sm:px-16 lg:px-24">
      <div className="flex min-h-[calc(100dvh-8rem)] items-center">
        <div className="motion-stagger w-full max-w-[460px]">
          <div className="rule-double pt-6">
            <Link href="/" className="motion-link inline-block no-underline">
              <Logo />
            </Link>
          </div>

          <p className="mt-10 text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-text">
            {kicker}
          </p>

          <h1 className="mt-3 text-[40px] font-semibold leading-[1.04] tracking-[-0.01em] text-text">
            {title}
          </h1>

          <div className="mt-6 max-w-[46ch] text-[13px] leading-relaxed text-text-muted">
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
        className="motion-button secondary-action"
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
        className="motion-button primary-action"
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
        <strong className="font-semibold text-text">
          {invitation.role === "admin" ? "administrateur" : "membre"}
        </strong>
        . Vous pourrez voir les intégrations en cours et traiter les étapes qui
        vous sont assignées.
      </p>
      <p className="text-action mt-4">
        Adresse invitée · {invitation.email}
      </p>
    </>,
    user ? (
      <form action={acceptInvitation}>
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="motion-button primary-action"
        >
          Accepter l&apos;invitation
        </button>
        <p className="text-action mt-3">
          Connecté en tant que {user.email}
        </p>
      </form>
    ) : (
      <>
        <Link
          href={`/login?suivant=${encodeURIComponent(`/invitations/${token}`)}`}
          className="motion-button primary-action"
        >
          Se connecter pour accepter
        </Link>
        <p className="mt-3 text-[12px] leading-relaxed text-text-muted">
          Vous reviendrez ici automatiquement après la connexion.
        </p>
      </>
    ),
  );
}

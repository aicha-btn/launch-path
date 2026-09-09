import { Masthead } from "@/components/masthead";
import { SectionRule, StatusLabel } from "@/components/marks";
import { InviteForm, RemoveMemberForm } from "@/components/members/invite-form";
import { cancelInvitation } from "@/server/actions/members";
import { requireMembership } from "@/server/auth/session";
import { getMembers, getPendingInvitations } from "@/server/db/queries";
import { formatShort, toBusinessDate } from "@/lib/dates";

/** Deux lettres depuis l'email, faute de nom complet en base. */
function initialsFrom(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase() || "??";
}

export default async function MembersPage() {
  const membership = await requireMembership();

  const [members, invitations] = await Promise.all([
    getMembers(membership.organizationId),
    getPendingInvitations(membership.organizationId),
  ]);

  const isAdmin = membership.role === "admin";

  return (
    <>
      <Masthead
        kicker={`Paramètres · ${members.length} membre${members.length > 1 ? "s" : ""}`}
        title="Équipe"
      />

      <div className="px-6 py-10 sm:px-10">
        {/* L'invitation est la fonctionnalité qui rend l'assignation possible :
            sans second membre, on ne peut assigner une étape qu'à soi-même. */}
        {isAdmin && (
          <section className="max-w-[640px]">
            <SectionRule>Inviter un collègue</SectionRule>
            <InviteForm />
            <p className="mt-4 text-[12px] leading-relaxed text-ink-70">
              La personne reçoit un lien valable sept jours. En développement,
              l&apos;email arrive dans la boîte locale sur le port 54324.
            </p>
          </section>
        )}

        <section className="mt-14">
          <SectionRule count={members.length}>Membres</SectionRule>
          <ul>
            {members.map((member) => {
              const isSelf = member.userId === membership.userId;

              return (
                <li
                  key={member.userId}
                  className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-15 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center bg-ink font-mono text-[11px] text-paper">
                      {initialsFrom(member.email)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {member.email}
                        {isSelf && (
                          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45">
                            vous
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45">
                        Depuis le {formatShort(toBusinessDate(member.joinedAt))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <StatusLabel tone={member.role === "admin" ? "offset" : "neutral"}>
                      {member.role === "admin" ? "Administrateur" : "Membre"}
                    </StatusLabel>

                    {isAdmin && !isSelf && (
                      <RemoveMemberForm
                        userId={member.userId}
                        email={member.email}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {invitations.length > 0 && (
          <section className="mt-14">
            <SectionRule count={invitations.length}>
              Invitations en attente
            </SectionRule>
            <ul>
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-15 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-70">
                      {invitation.email}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45">
                      Expire le{" "}
                      {formatShort(toBusinessDate(invitation.expiresAt))}
                      {invitation.invitedByEmail &&
                        ` · invité par ${invitation.invitedByEmail}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <StatusLabel tone="muted">
                      {invitation.role === "admin" ? "Administrateur" : "Membre"}
                    </StatusLabel>

                    {isAdmin && (
                      <form action={cancelInvitation}>
                        <input type="hidden" name="id" value={invitation.id} />
                        <button
                          type="submit"
                          aria-label={`Annuler l'invitation de ${invitation.email}`}
                          className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45 underline transition-colors duration-[120ms] hover:text-correction-text"
                        >
                          Annuler
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!isAdmin && (
          <p className="mt-10 max-w-[60ch] text-[13px] leading-relaxed text-ink-70">
            Seuls les administrateurs peuvent inviter ou retirer des membres.
          </p>
        )}
      </div>
    </>
  );
}

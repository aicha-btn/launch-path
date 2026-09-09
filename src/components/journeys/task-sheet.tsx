import Link from "next/link";
import { formatDateTime, formatShort, lateDays } from "@/lib/dates";
import { Stamp, StatusLabel } from "@/components/marks";
import { Avatar } from "@/components/ui";
import { CommentForm, TaskEditForm } from "@/components/journeys/task-form";
import { deleteComment } from "@/server/actions/comments";
import type { TaskDetail } from "@/server/db/queries/tasks";
import type { Member } from "@/types";

/**
 * Panneau de détail piloté par l'URL — § 4 du design system.
 *
 * Ouvert par `?task=<id>`, et non par un `useState` local. Bénéfices
 * concrets : le lien est partageable, le bouton retour du navigateur
 * fonctionne, un rechargement conserve le panneau ouvert, et les
 * commentaires se chargent côté serveur.
 *
 * Fermeture sans JavaScript : le voile de fond et la croix sont des liens
 * vers la même page sans le paramètre.
 */
export function TaskSheet({
  detail,
  members,
  closeHref,
  currentUserId,
}: {
  detail: TaskDetail;
  members: Member[];
  closeHref: string;
  currentUserId: string;
}) {
  const { task, comments } = detail;
  const late = lateDays(task.dueDate);

  return (
    <>
      {/* Voile : encre à 88 %, sans flou — l'élévation ne se dit jamais par
          un dégradé dans ce système. */}
      <Link
        href={closeHref}
        aria-label="Fermer le panneau"
        className="fixed inset-0 z-40 bg-ink/[0.88] no-underline"
      />

      <aside
        aria-label={`Détail de l'étape ${task.position}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l-[3px] border-ink bg-paper"
      >
        {/* En-tête */}
        <div className="border-b-[3px] border-ink px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70">
              Étape {String(task.position).padStart(2, "0")} sur{" "}
              {String(detail.totalSteps).padStart(2, "0")} ·{" "}
              {detail.journeySubject}
            </p>
            <Link
              href={closeHref}
              aria-label="Fermer"
              className="font-mono text-[13px] leading-none text-ink no-underline hover:text-correction-text"
            >
              ✕
            </Link>
          </div>

          <h2 className="mt-3 font-serif text-[28px] leading-[1.08] tracking-[-0.01em] text-ink">
            {task.title}
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            {task.status === "done" ? (
              <StatusLabel tone="offset">Terminée</StatusLabel>
            ) : task.status === "skipped" ? (
              <StatusLabel tone="muted">Ignorée</StatusLabel>
            ) : (
              <StatusLabel>À faire</StatusLabel>
            )}

            {late > 0 && task.status === "todo" ? (
              <Stamp>{`Retard ${late} j`}</Stamp>
            ) : (
              <span className="font-mono text-[12px] tabular-nums text-ink-70">
                {formatShort(task.dueDate)}
              </span>
            )}

            {task.assignee && (
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-70">
                <Avatar member={task.assignee} /> {task.assignee.name}
              </span>
            )}
          </div>
        </div>

        {/* Corps défilant */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {task.description && (
            <p className="mb-8 text-[13px] leading-relaxed text-ink-70">
              {task.description}
            </p>
          )}

          <section>
            <h3 className="border-b-[3px] border-ink pb-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink">
              Affectation
            </h3>
            <div className="mt-5">
              <TaskEditForm task={task} members={members} />
            </div>
          </section>

          <section className="mt-12">
            <div className="flex items-baseline justify-between border-b-[3px] border-ink pb-2">
              <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink">
                Commentaires
              </h3>
              <span className="font-mono text-[11px] tabular-nums text-ink-70">
                {String(comments.length).padStart(2, "0")}
              </span>
            </div>

            {comments.length === 0 ? (
              <p className="py-5 text-[13px] text-ink-70">
                Aucun commentaire. Notez ici ce qui bloque : c&apos;est ce
                qu&apos;on relit pour améliorer le parcours type.
              </p>
            ) : (
              <ul className="mt-2">
                {comments.map((comment) => (
                  <li key={comment.id} className="border-b border-ink-15 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        {comment.author && <Avatar member={comment.author} />}
                        <span className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70">
                          {comment.author?.name ?? "(auteur inconnu)"}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-45">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                      {comment.body}
                    </p>

                    {/* On ne peut supprimer que son propre commentaire. */}
                    {comment.author?.id === currentUserId && (
                      <form action={deleteComment} className="mt-2">
                        <input
                          type="hidden"
                          name="commentId"
                          value={comment.id}
                        />
                        <button
                          type="submit"
                          className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45 underline transition-colors duration-[120ms] hover:text-correction-text"
                        >
                          Supprimer
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <CommentForm taskId={task.id} />
          </section>
        </div>
      </aside>
    </>
  );
}

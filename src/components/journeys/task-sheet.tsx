import Link from "next/link";
import { formatDateTime, lateDays } from "@/lib/dates";
import { DueBadge, OwnerBadge } from "@/components/path-rail";
import { Stamp, StatusLabel } from "@/components/marks";
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
      <Link
        href={closeHref}
        aria-label="Fermer le panneau"
        className="motion-fade fixed inset-0 z-40 bg-text/55 no-underline"
      />

      <aside
        aria-label={`Détail de l'étape ${task.position}`}
        className="motion-sheet fixed inset-y-0 right-0 z-50 flex w-full max-w-[500px] flex-col border-l border-line bg-surface-raised"
      >
        {/* En-tête */}
        <div className="border-b border-line px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-text">
              Étape {String(task.position).padStart(2, "0")} sur{" "}
              {String(detail.totalSteps).padStart(2, "0")} ·{" "}
              {detail.journeySubject}
            </p>
            <Link
              href={closeHref}
              aria-label="Fermer"
              className="motion-button inline-flex h-8 w-8 items-center justify-center rounded-full text-[13px] leading-none text-text-muted no-underline hover:bg-overdue-soft hover:text-overdue"
            >
              ✕
            </Link>
          </div>

          <h2 className="mt-3 text-[28px] font-semibold leading-[1.08] tracking-[-0.01em] text-text">
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
              <DueBadge task={task} />
            )}

            {task.assignee && (
              <OwnerBadge member={task.assignee} />
            )}
          </div>
        </div>

        {/* Corps défilant */}
        <div className="motion-stagger flex-1 overflow-y-auto px-6 py-6">
          {task.description && (
            <p className="mb-8 text-[13px] leading-relaxed text-text-muted">
              {task.description}
            </p>
          )}

          <section>
            <h3 className="border-b border-line pb-3 text-[14px] font-semibold text-text">
              Affectation
            </h3>
            <div className="mt-5">
              <TaskEditForm task={task} members={members} />
            </div>
          </section>

          <section className="mt-12">
            <div className="flex items-baseline justify-between border-b border-line pb-3">
              <h3 className="text-[14px] font-semibold text-text">
                Commentaires
              </h3>
              <span className="font-mono text-[11px] tabular-nums text-text-muted">
                {String(comments.length).padStart(2, "0")}
              </span>
            </div>

            {comments.length === 0 ? (
              <p className="py-5 text-[13px] text-text-muted">
                Aucun commentaire. Notez ici ce qui bloque : c&apos;est ce
                qu&apos;on relit pour améliorer le parcours type.
              </p>
            ) : (
              <ul className="mt-2">
                {comments.map((comment) => (
                  <li key={comment.id} className="motion-row border-b border-line py-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        {comment.author && (
                          <OwnerBadge member={comment.author} showName={false} />
                        )}
                        <span className="truncate text-action text-text-muted">
                          {comment.author?.name ?? "(auteur inconnu)"}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-text-soft">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-text">
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
                          className="motion-link text-action"
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

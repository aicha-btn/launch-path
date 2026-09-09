"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { inviteMember, removeMember } from "@/server/actions/members";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="motion-button h-9 shrink-0 bg-offset px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper transition-colors duration-[120ms] hover:bg-ink disabled:bg-ink-30"
    >
      {pending ? "Envoi…" : label}
    </button>
  );
}

export function InviteForm() {
  const [state, action] = useActionState(inviteMember, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("Invitation envoyée", { description: state.message });
      formRef.current?.reset();
    } else {
      toast.error("Invitation impossible", { description: state.error });
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="motion-rise mt-6">
      <div className="motion-stagger flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="invite-email"
            className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
          >
            Adresse email
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            placeholder="collegue@exemple.fr"
            className="motion-input mt-2 h-9 w-full border border-ink-30 bg-paper px-3 text-sm text-ink placeholder:text-ink-30 focus:border-ink focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="invite-role"
            className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
          >
            Rôle
          </label>
          <select
            id="invite-role"
            name="role"
            defaultValue="member"
            className="motion-input mt-2 h-9 w-full border border-ink-30 bg-paper px-3 text-sm text-ink focus:border-ink focus:outline-none sm:w-[160px]"
          >
            <option value="member">Membre</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <Submit label="Inviter" />
      </div>
    </form>
  );
}

export function RemoveMemberForm({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [state, action] = useActionState(removeMember, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Membre retiré", { description: state.message });
    else toast.error("Retrait impossible", { description: state.error });
  }, [state]);

  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        aria-label={`Retirer ${email} de l'organisation`}
        className="motion-link font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45 underline transition-colors duration-[120ms] hover:text-correction-text"
      >
        Retirer
      </button>
    </form>
  );
}

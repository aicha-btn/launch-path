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
      className="motion-button primary-action shrink-0"
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
    <form
      ref={formRef}
      action={action}
      className="motion-rise mt-6 rounded-lg border border-line bg-surface p-5"
    >
      <div className="motion-stagger flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="invite-email"
            className="field-label"
          >
            Adresse email
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            placeholder="collegue@exemple.fr"
            className="motion-input field-control mt-2"
          />
        </div>

        <div>
          <label
            htmlFor="invite-role"
            className="field-label"
          >
            Rôle
          </label>
          <select
            id="invite-role"
            name="role"
            defaultValue="member"
            className="motion-input field-control mt-2 sm:w-[170px]"
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
        className="motion-link text-action"
      >
        Retirer
      </button>
    </form>
  );
}

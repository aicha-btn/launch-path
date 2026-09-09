import { describe, expect, it } from "vitest";
import {
  invitationEmail,
  taskAssignedEmail,
  taskDueSoonEmail,
  taskOverdueEmail,
} from "./templates";

/**
 * Ces gabarits étaient injectés BRUTS. Les titres d'étapes et les noms de
 * personnes viennent de saisies utilisateur : un membre pouvait glisser un
 * lien d'hameçonnage dans un titre, et le produit l'envoyait à ses collègues
 * depuis son adresse légitime.
 *
 * Deux contextes, deux règles — et les tester séparément est le seul moyen
 * d'éviter de corriger l'un en cassant l'autre : le premier jet échappait le
 * titre puis le réutilisait dans la version texte, où « Marie d'Anjou »
 * devenait « Marie d&#39;Anjou ».
 */

const HAMEÇON = `<a href="https://evil.example">Réinitialisez votre mot de passe</a>`;
const BASE = {
  to: "destinataire@test.local",
  subjectName: "Marie d'Anjou",
  taskTitle: HAMEÇON,
  dueDate: "12 MARS",
  url: "http://localhost:3200/journeys/abc",
};

describe("échappement du HTML", () => {
  it("neutralise un lien injecté dans un titre d'étape", () => {
    const message = taskAssignedEmail(BASE);

    expect(message.html).not.toContain("<a href=\"https://evil.example\"");
    expect(message.html).toContain("&lt;a href=&quot;https://evil.example&quot;");
  });

  it("échappe le nom de la personne dans les trois modèles de tâche", () => {
    for (const message of [
      taskAssignedEmail(BASE),
      taskDueSoonEmail(BASE),
      taskOverdueEmail({ ...BASE, lateDays: 3 }),
    ]) {
      expect(message.html).toContain("Marie d&#39;Anjou");
      expect(message.html).not.toContain("Marie d'Anjou");
    }
  });

  it("échappe le nom de l'organisation dans l'invitation", () => {
    const message = invitationEmail({
      to: "invite@test.local",
      organizationName: `Atelier <script>alert(1)</script>`,
      inviterEmail: "admin@test.local",
      url: "http://localhost:3200/invitations/jeton",
    });

    expect(message.html).not.toContain("<script>");
    expect(message.html).toContain("&lt;script&gt;");
  });

  it("ne laisse subsister aucune balise ouvrante venue des données", () => {
    const message = taskOverdueEmail({ ...BASE, lateDays: 1 });
    // Les seules balises du document doivent être celles du gabarit.
    expect(message.html).not.toMatch(/<a href="https/);
  });
});

describe("la version texte n'est PAS échappée", () => {
  it("garde l'apostrophe d'un nom propre", () => {
    const message = taskAssignedEmail(BASE);

    expect(message.text).toContain("Marie d'Anjou");
    expect(message.text).not.toContain("&#39;");
  });

  it("garde le titre tel quel, sans entités", () => {
    const message = taskDueSoonEmail(BASE);

    expect(message.text).toContain(HAMEÇON);
    expect(message.text).not.toContain("&lt;");
  });
});

describe("objet du message", () => {
  it("supprime les retours à la ligne, qui permettraient d'injecter un en-tête", () => {
    const message = taskAssignedEmail({
      ...BASE,
      subjectName: "Marie\r\nBcc: espion@evil.example",
    });

    expect(message.subject).not.toMatch(/[\r\n]/);
    expect(message.subject).toContain("Bcc: espion@evil.example");
  });

  it("reste sur une seule ligne pour l'invitation", () => {
    const message = invitationEmail({
      to: "invite@test.local",
      organizationName: "Atelier\nNovembre",
      inviterEmail: "admin@test.local",
      url: "http://localhost:3200/invitations/jeton",
    });

    expect(message.subject).not.toMatch(/[\r\n]/);
  });
});

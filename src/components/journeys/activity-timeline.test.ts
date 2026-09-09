import { describe, expect, it } from "vitest";
import { LABEL } from "./activity-timeline";
import { activityType } from "@/server/db/schema";

/* ==========================================================================
   L'historique doit savoir raconter tout ce que la base sait écrire.

   CE TEST REMPLACE UN TEST QUI NE VÉRIFIAIT RIEN

   Un test d'intégration lisait les types présents dans `activity_events` et
   vérifiait qu'ils appartenaient à une liste recopiée à la main. Il ne pouvait
   pas échouer : `type` est une colonne d'énumération, Postgres refuse déjà
   toute autre valeur. Il prétendait couvrir « un type produit mais non traduit
   s'afficherait brut à l'écran » — le risque réel — sans jamais regarder la
   carte des libellés.

   Celui-ci compare les deux ensembles, dans les deux sens, et n'a besoin ni de
   base ni de Docker : `schema.ts` n'ouvre aucune connexion, il ne déclare que
   des tables et des énumérations.
   ========================================================================== */

describe("libellés de l'historique", () => {
  it("couvre exactement les types de l'énumération, dans les deux sens", () => {
    // Manque un libellé → un type brut s'affiche à l'écran.
    // Libellé en trop → du code mort, et le doute sur ce qui est réellement
    // écrit en base.
    expect(Object.keys(LABEL).sort()).toEqual(
      [...activityType.enumValues].sort(),
    );
  });

  it("produit une phrase lisible pour chaque type", () => {
    for (const type of activityType.enumValues) {
      const phrase = LABEL[type]("Préparer le poste");

      expect(phrase.length).toBeGreaterThan(3);
      // Le libellé complète un sujet : « Marie <phrase> ». Un type brut
      // recopié tel quel — `task_due_date_changed` — se repère à son underscore.
      expect(phrase).not.toContain("_");
    }
  });

  it("nomme une étape supprimée au lieu d'afficher un vide", () => {
    // `taskTitle` est nul quand la tâche a été supprimée depuis. Sans repli,
    // la ligne se lisait « a terminé «  » ».
    for (const type of activityType.enumValues) {
      expect(LABEL[type](null)).not.toContain("«  »");
    }
  });
});

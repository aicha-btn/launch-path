import { describe, expect, it } from "vitest";
import { addBusinessDays } from "./scheduling";

/**
 * Le test le plus rentable du projet.
 *
 * `addBusinessDays` est une fonction pure : aucune base, aucun réseau, aucun
 * fuseau horaire. Elle porte pourtant toute la logique métier qui distingue
 * LaunchPath d'un CRUD — et c'est là que se cachent les erreurs d'un jour,
 * celles qu'on ne remarque qu'en production.
 *
 * Règles arrêtées (docs/plan_action_launchpath.md, décision n° 3) :
 *   offset 0  → la date de départ TELLE QUELLE, même un samedi
 *   offset > 0 → on avance de N jours ouvrés
 *   offset < 0 → on recule de N jours ouvrés
 *   pas de gestion des jours fériés (hors MVP)
 *
 * Repères de calendrier utilisés ci-dessous :
 *   2026-03-09 lundi     2026-03-13 vendredi
 *   2026-03-14 samedi    2026-03-15 dimanche
 *   2026-03-16 lundi
 */
describe("addBusinessDays", () => {
  it("renvoie la date de départ telle quelle pour un décalage nul", () => {
    expect(addBusinessDays("2026-03-11", 0)).toBe("2026-03-11");
  });

  it("ne décale PAS un décalage nul tombant un samedi", () => {
    // Le jour d'arrivée est le jour d'arrivée : on ne le déplace jamais.
    expect(addBusinessDays("2026-03-14", 0)).toBe("2026-03-14");
  });

  it("avance d'un jour ouvré simple", () => {
    expect(addBusinessDays("2026-03-09", 1)).toBe("2026-03-10");
  });

  it("saute le week-end en avançant", () => {
    // Vendredi + 1 jour ouvré = lundi, pas samedi.
    expect(addBusinessDays("2026-03-13", 1)).toBe("2026-03-16");
  });

  it("saute deux week-ends sur dix jours ouvrés", () => {
    // Lundi 9 + 10 ouvrés = lundi 23 (14 jours calendaires).
    expect(addBusinessDays("2026-03-09", 10)).toBe("2026-03-23");
  });

  it("recule en jours ouvrés", () => {
    // Lundi 16 − 1 ouvré = vendredi 13, pas dimanche 15.
    expect(addBusinessDays("2026-03-16", -1)).toBe("2026-03-13");
  });

  it("recule de trois jours ouvrés en franchissant le week-end", () => {
    // C'est le cas réel du template : « créer les comptes, 3 jours avant ».
    expect(addBusinessDays("2026-03-16", -3)).toBe("2026-03-11");
  });

  it("part d'un samedi en avançant", () => {
    // Samedi + 1 ouvré = lundi.
    expect(addBusinessDays("2026-03-14", 1)).toBe("2026-03-16");
  });

  it("part d'un dimanche en reculant", () => {
    // Dimanche − 1 ouvré = vendredi.
    expect(addBusinessDays("2026-03-15", -1)).toBe("2026-03-13");
  });

  it("franchit un changement de mois", () => {
    // Lundi 30 mars + 5 ouvrés = lundi 6 avril.
    expect(addBusinessDays("2026-03-30", 5)).toBe("2026-04-06");
  });

  it("franchit un changement d'année", () => {
    // Mercredi 30 décembre 2026 + 3 ouvrés = lundi 4 janvier 2027.
    expect(addBusinessDays("2026-12-30", 3)).toBe("2027-01-04");
  });

  it("gère une année bissextile", () => {
    // 2028 est bissextile : le 28 février est un lundi, le 29 un mardi.
    expect(addBusinessDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("ne modifie jamais son argument", () => {
    const input = "2026-03-09";
    addBusinessDays(input, 10);
    expect(input).toBe("2026-03-09");
  });

  it("refuse une date mal formée", () => {
    expect(() => addBusinessDays("09/03/2026", 1)).toThrow();
  });
});

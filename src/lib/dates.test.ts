import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  formatDateTime,
  formatLong,
  formatShort,
  lateDays,
  parseCivilDate,
  today,
  toBusinessDate,
} from "./dates";

/**
 * Ce fichier portait la règle métier la plus délicate du produit sans aucun
 * test. C'était le plus gros trou de couverture du projet : `lateDays`
 * décide de ce qui est « en retard », donc de ce qui s'affiche en rouge, de
 * ce que compte le dashboard, et de ce que le cron relance par email.
 *
 * Repères de calendrier :
 *   2026-03-13 vendredi · 2026-03-14 samedi · 2026-03-16 lundi
 */

describe("toBusinessDate — le fuseau métier", () => {
  it("renvoie le jour de Paris, pas celui d'UTC, en heure d'hiver", () => {
    // 23h30 UTC le 12 → 00h30 à Paris le 13. C'EST le bug que la décision
    // n° 2 existe pour éviter : `toISOString()` aurait renvoyé le 12.
    const instant = new Date("2026-03-12T23:30:00Z");

    expect(toBusinessDate(instant)).toBe("2026-03-13");
    expect(instant.toISOString().slice(0, 10)).toBe("2026-03-12");
  });

  it("renvoie le jour de Paris en heure d'été", () => {
    // En juillet, Paris est à UTC+2 : 22h30 UTC devient 00h30 le lendemain.
    expect(toBusinessDate(new Date("2026-07-15T22:30:00Z"))).toBe("2026-07-16");
  });

  it("ne décale rien en milieu de journée", () => {
    expect(toBusinessDate(new Date("2026-03-12T12:00:00Z"))).toBe("2026-03-12");
  });

  it("franchit correctement le changement d'année", () => {
    expect(toBusinessDate(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });
});

describe("today", () => {
  it("renvoie un jour civil au bon format", () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("passe par le fuseau métier, pas par UTC", () => {
    // Cohérence interne : `today()` ne doit pas avoir sa propre logique.
    expect(today()).toBe(toBusinessDate(new Date()));
  });
});

describe("lateDays — LA frontière du produit", () => {
  it("une tâche due AUJOURD'HUI n'est pas en retard", () => {
    // La règle la plus importante : c'est elle qui évite d'envoyer un email
    // de retard le matin même de l'échéance.
    expect(lateDays("2026-03-16", "2026-03-16")).toBe(0);
  });

  it("une tâche due demain n'est pas en retard", () => {
    expect(lateDays("2026-03-17", "2026-03-16")).toBe(0);
  });

  it("une tâche due hier est en retard d'un jour", () => {
    expect(lateDays("2026-03-15", "2026-03-16")).toBe(1);
  });

  it("compte les jours CALENDAIRES de retard, week-ends compris", () => {
    // Volontaire : un retard se compte en jours réels, pas en jours ouvrés.
    // Le calcul de l'échéance, lui, exclut les week-ends.
    expect(lateDays("2026-03-13", "2026-03-16")).toBe(3);
  });

  it("une échéance très ancienne donne un grand nombre", () => {
    expect(lateDays("2026-01-16", "2026-03-16")).toBe(59);
  });

  it("refuse une date invalide au lieu de répondre « pas en retard »", () => {
    // Avant correction : `NaN > 0` valant `false`, la fonction renvoyait 0 —
    // une réponse fausse et silencieuse.
    expect(() => lateDays("j-clara", "2026-03-16")).toThrow();
  });
});

describe("daysBetween", () => {
  it("compte vers l'avant", () => {
    expect(daysBetween("2026-03-13", "2026-03-16")).toBe(3);
  });

  it("compte vers l'arrière", () => {
    expect(daysBetween("2026-03-16", "2026-03-13")).toBe(-3);
  });

  it("renvoie zéro pour le même jour", () => {
    expect(daysBetween("2026-03-16", "2026-03-16")).toBe(0);
  });

  it("franchit un changement d'année", () => {
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
  });

  it("n'est pas faussé par le changement d'heure", () => {
    // Le passage à l'heure d'été (29 mars 2026) fait une journée de 23 h.
    // L'ancrage en UTC de `parseCivilDate` protège de l'arrondi à 0 ou 2.
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
  });

  it("refuse une date invalide", () => {
    expect(() => daysBetween("2026-03-16", "bidon")).toThrow();
  });
});

describe("addDays — jours calendaires", () => {
  it("avance", () => {
    expect(addDays("2026-03-13", 3)).toBe("2026-03-16");
  });

  it("recule", () => {
    expect(addDays("2026-03-16", -3)).toBe("2026-03-13");
  });

  it("ne saute PAS les week-ends, contrairement à addBusinessDays", () => {
    // Vendredi + 1 jour calendaire = samedi.
    expect(addDays("2026-03-13", 1)).toBe("2026-03-14");
  });

  it("franchit un changement de mois", () => {
    expect(addDays("2026-03-30", 5)).toBe("2026-04-04");
  });

  it("gère le 29 février d'une année bissextile", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("saute le 29 février hors année bissextile", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("refuse un décalage non entier", () => {
    expect(() => addDays("2026-03-16", 1.5)).toThrow();
  });

  it("refuse une date invalide au lieu de lever un RangeError obscur", () => {
    expect(() => addDays("j-clara", 1)).toThrow(/YYYY-MM-DD/);
  });
});

describe("parseCivilDate", () => {
  it("accepte une date valide", () => {
    expect(parseCivilDate("2026-03-16").toISOString()).toBe(
      "2026-03-16T00:00:00.000Z",
    );
  });

  it("refuse un format jour/mois/année", () => {
    expect(() => parseCivilDate("16/03/2026")).toThrow();
  });

  it("refuse une date inexistante que la regex laisse passer", () => {
    // JavaScript décalerait silencieusement au 3 mars.
    expect(() => parseCivilDate("2026-02-31")).toThrow(/inexistante/);
  });

  it("refuse un 30 février", () => {
    expect(() => parseCivilDate("2026-02-30")).toThrow(/inexistante/);
  });

  it("refuse un mois 13", () => {
    expect(() => parseCivilDate("2026-13-01")).toThrow();
  });

  it("refuse un horodatage complet", () => {
    expect(() => parseCivilDate("2026-03-16T10:00:00Z")).toThrow();
  });
});

describe("formatage", () => {
  it("formatShort donne le jour et le mois en capitales", () => {
    expect(formatShort("2026-03-12")).toBe("12 MARS");
  });

  it("formatShort ne décale pas la date d'un jour", () => {
    // Le 1er janvier doit rester le 1er janvier, pas devenir le 31 décembre.
    expect(formatShort("2026-01-01")).toBe("1 JANVIER");
  });

  it("formatLong inclut le jour de la semaine", () => {
    // Le 16 mars 2026 est un lundi.
    expect(formatLong("2026-03-16")).toBe("LUNDI 16 MARS 2026");
  });

  it("formatDateTime convertit l'instant en heure de Paris", () => {
    // 12h00 UTC en mars = 13h00 à Paris (heure d'hiver, UTC+1).
    expect(formatDateTime(new Date("2026-03-12T12:00:00Z"))).toBe(
      "12 MARS · 13:00",
    );
  });

  it("formatDateTime change de jour quand le fuseau le demande", () => {
    expect(formatDateTime(new Date("2026-03-12T23:30:00Z"))).toBe(
      "13 MARS · 00:30",
    );
  });
});

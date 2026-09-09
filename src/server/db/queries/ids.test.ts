import { describe, expect, it } from "vitest";
import { isUuid } from "./ids";

/**
 * Ce garde-fou existe à cause d'un bug réel : `/journeys/j-clara` — un vieux
 * lien pointant sur un identifiant de données fictives — faisait lever à
 * Postgres une erreur `22P02` au lieu de renvoyer zéro ligne. La page
 * n'appelait donc jamais `notFound()`, et le `loading.tsx` ayant déjà lancé
 * le flux de réponse, la frontière d'erreur ne pouvait plus s'afficher :
 * squelette infini.
 */
describe("isUuid", () => {
  it("accepte un UUID généré par la base", () => {
    expect(isUuid("9a72bfbd-b88c-4419-9d68-0dfe18acfa01")).toBe(true);
  });

  it("accepte les majuscules", () => {
    expect(isUuid("9A72BFBD-B88C-4419-9D68-0DFE18ACFA01")).toBe(true);
  });

  it("refuse un identifiant de données fictives", () => {
    // Le cas exact qui a causé le bug.
    expect(isUuid("j-clara")).toBe(false);
  });

  it("refuse une chaîne vide", () => {
    expect(isUuid("")).toBe(false);
  });

  it("refuse un UUID tronqué", () => {
    expect(isUuid("9a72bfbd-b88c-4419-9d68")).toBe(false);
  });

  it("refuse des caractères hors hexadécimal", () => {
    expect(isUuid("9a72bfbd-b88c-4419-9d68-0dfe18acfaZZ")).toBe(false);
  });

  it("refuse un UUID entouré d'espaces", () => {
    expect(isUuid(" 9a72bfbd-b88c-4419-9d68-0dfe18acfa01 ")).toBe(false);
  });

  it("refuse une tentative d'injection", () => {
    expect(isUuid("' or 1=1 --")).toBe(false);
  });
});

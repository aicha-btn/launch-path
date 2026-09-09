import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./safe-redirect";

describe("safeInternalPath", () => {
  it("accepte un chemin interne simple", () => {
    expect(safeInternalPath("/journeys")).toBe("/journeys");
  });

  it("accepte un chemin avec paramètres", () => {
    expect(safeInternalPath("/journeys/abc?task=def")).toBe(
      "/journeys/abc?task=def",
    );
  });

  it("accepte la racine", () => {
    expect(safeInternalPath("/")).toBe("/");
  });

  it("remplace une valeur absente par le repli", () => {
    expect(safeInternalPath(undefined)).toBe("/dashboard");
    expect(safeInternalPath(null)).toBe("/dashboard");
    expect(safeInternalPath("")).toBe("/dashboard");
  });

  it("refuse une URL absolue", () => {
    expect(safeInternalPath("https://evil.example")).toBe("/dashboard");
  });

  it("refuse une URL protocole-relative", () => {
    // Le défaut n° 1 : `startsWith("/")` laissait passer celle-ci.
    expect(safeInternalPath("//evil.example")).toBe("/dashboard");
  });

  it("refuse la variante à antislash", () => {
    expect(safeInternalPath("/\\evil.example")).toBe("/dashboard");
  });

  it("refuse un identifiant d'URL", () => {
    // Le défaut n° 2 : `origin + "@evil.example"` a pour hôte evil.example.
    expect(safeInternalPath("@evil.example")).toBe("/dashboard");
  });

  it("refuse un @ n'importe où dans le chemin", () => {
    expect(safeInternalPath("/journeys@evil.example")).toBe("/dashboard");
  });

  it("refuse une tentative d'injection d'en-tête", () => {
    expect(safeInternalPath("/journeys\r\nLocation: https://evil.example")).toBe(
      "/dashboard",
    );
  });

  it("refuse un schéma javascript", () => {
    expect(safeInternalPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("respecte un repli personnalisé", () => {
    expect(safeInternalPath("https://evil.example", "/login")).toBe("/login");
  });
});

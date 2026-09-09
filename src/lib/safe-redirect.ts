/**
 * Validation des cibles de redirection venant de l'URL.
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * Le paramètre `?suivant=` sert à revenir là où l'utilisateur voulait aller
 * après connexion. C'est aussi le mécanisme classique de la « redirection
 * ouverte » : si on redirige vers une valeur fournie par l'appelant sans la
 * valider, un lien de phishing peut emprunter la crédibilité du domaine.
 *
 * Deux défauts trouvés en relisant, tous deux corrigés ici :
 *
 *   1. La page de connexion vérifiait seulement `startsWith("/")`. Or
 *      `//evil.example` et `/\evil.example` passent ce test. Ils étaient
 *      inoffensifs *par accident*, parce que la cible était construite par
 *      concaténation de chaînes. Le jour où quelqu'un serait passé à
 *      `new URL(next, origin)`, ça devenait exploitable.
 *
 *   2. La route `/auth/callback` ne validait RIEN : `?suivant=@evil.example`
 *      produisait `http://localhost:3200@evil.example`, dont l'hôte réel est
 *      `evil.example` — la partie avant le `@` est lue comme un identifiant.
 *
 * Règle retenue : un chemin interne commence par `/`, n'est pas suivi d'un
 * second `/` ni d'un antislash, et ne contient ni schéma ni `@`.
 */

const DEFAULT_PATH = "/dashboard";

export function safeInternalPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_PATH,
): string {
  if (!value) return fallback;

  // Un chemin interne commence par une seule barre oblique. `//` ouvre une
  // URL protocole-relative, `/\` est traité comme `//` par certains
  // navigateurs.
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;

  // Ceinture et bretelles : ni identifiant, ni schéma, ni saut de ligne
  // (injection d'en-tête).
  if (/[@\\]/.test(value)) return fallback;
  if (/[\r\n]/.test(value)) return fallback;
  if (value.includes("://")) return fallback;

  return value;
}

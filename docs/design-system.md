# Design System — LaunchPath

> Direction artistique : **brutalisme éditorial**.
> Document de référence unique. Toute décision visuelle non couverte ici doit être ajoutée ici avant d’être codée.

---

# 1. Manifeste

LaunchPath ne ressemble pas à un logiciel. Il ressemble à un **document imprimé** : une revue, un registre, une épreuve d’imprimerie annotée.

Cinq principes, dans l’ordre de priorité. En cas de conflit, le plus haut gagne.

### 1. La typographie fait tout le travail

Il n’y a ni carte, ni ombre, ni dégradé, ni illustration. La hiérarchie vient uniquement de la **taille**, de la **graisse**, de la **casse** et des **filets**. Si un écran ne fonctionne pas, c’est un problème de composition typographique, pas un manque d’effet visuel.

### 2. Quatre encres, un rôle exclusif chacune

Une presse ne tire pas en noir seul : elle tire en **trichromie**, noir plus deux encres directes, en grands aplats. C’est le principe du risographe et du fanzine — et c’est ce qui permet d’avoir de la couleur franche sans jamais décorer.

| Encre | Rôle |
|---|---|
| **Noir** | Texte et filets. Rien d’autre |
| **Bleu offset** | Identité, structure, action : sidebar, boutons primaires, navigation active, étapes franchies |
| **Jaune signal** | Emphase, **en aplat de fond uniquement** — jamais du texte en jaune |
| **Rouge de correction** | **Ce qui requiert une attention** — trois usages, et seulement trois |

La règle qui fait tenir l’ensemble : **une encre n’est jamais décorative.** Chaque apparition doit répondre à « pourquoi cette couleur ici ? » par une raison fonctionnelle.

## Les trois usages du rouge, et aucun autre

| Usage | Exemple |
|---|---|
| **Le retard** | nœud du `Folio`, tampon `RETARD 3 J`, chiffre du dashboard, filtre actif |
| **Une erreur de saisie** | message sous un champ, bandeau de lien de connexion expiré |
| **Une action destructive, au survol** | « Supprimer », « Retirer », « Annuler l’invitation » |

Ces trois cas partagent la même sémantique : *quelque chose ne va pas, ou va casser*. Toute autre apparition du rouge est un défaut.

**Pourquoi pas l’exclusivité au retard**, comme la première version de ce document l’affirmait : un message d’erreur en encre noire se remarque mal, et une action destructive sans affordance rouge est un piège pour l’utilisateur. Refuser le rouge à ces deux cas aurait été de la dogmatique contre l’usage. La discipline reste entière — le rouge n’apparaît jamais pour attirer l’œil sans raison.

## Les usages du jaune, et aucun autre

| Usage | Exemple |
|---|---|
| **Emphase d’un chiffre** | « dues sous 7 jours » sur le dashboard |
| **Bandeau d’information** | parcours type archivé |
| **Survol d’une action secondaire** | bouton du compte de démonstration |
| **Accent de section** | une seule section de la page publique |

Le jaune reste **rare par construction** et **jamais utilisé pour du texte** : son contraste ne le permet pas.

Le vert reste interdit : le terminé se dit par le barré et le bleu, pas par une cinquième encre.

### 3. Les états sont des marques, pas des couleurs

Une tâche faite est **barrée**. Une tâche ignorée est **estompée et annotée**. Une échéance proche est **soulignée**. Un retard est **tamponné en rouge**. C’est le vocabulaire de la correction d’épreuves, et il reste lisible pour une personne daltonienne.

### 4. Aucun angle arrondi, aucune ombre

`border-radius: 0` partout. `box-shadow: none` partout. L’élévation s’exprime par l’épaisseur du filet et par le fond, jamais par le flou. C’est la règle la plus visible du système et celle qui ne souffre aucune exception.

### 5. Chrome flamboyant, données calmes

Les en-têtes de page, l’écran de connexion et les états vides sont spectaculaires. Les tableaux, les formulaires et les lignes de tâches sont sobres, denses et alignés au pixel. On travaille dans le calme, on est impressionné dans les marges.

---

# 2. Ce que le système interdit

À relire avant chaque écran. Chaque ligne correspond à un réflexe qu’il faut désapprendre.

| Interdit | Pourquoi |
|---|---|
| `border-radius` autre que `0` | La règle identitaire du système |
| `box-shadow`, `drop-shadow`, `blur` | L’élévation vient du filet et du fond |
| Dégradés, y compris subtils | Le papier est plat |
| Une cinquième encre | Quatre encres, au-delà plus rien ne signifie |
| Rouge hors des trois usages listés au § 3 | Le rouge perdrait son pouvoir d’alerte |
| Du texte en jaune signal | Le jaune est une encre d’aplat, illisible en texte |
| Vert pour « terminé » | Le terminé se dit par le barré et le bleu |
| Badges en pilule arrondie | Remplacés par les micro-libellés et le tampon |
| Icônes décoratives dans le contenu | Les marques sont typographiques |
| Illustrations, dessins, emoji | Les états vides sont des phrases |
| Avatars circulaires ou photos | Carrés d’encre à initiales |
| Plus de trois familles typographiques | Trois, chacune avec un rôle exclusif |
| Texte gris clair sur fond gris clair | Contraste minimum 4.5:1, sans exception |
| Animation de plus de 200 ms | Le papier ne bouge pas beaucoup |

---

# 3. Fondations — couleur

Le système compte **quatre encres** sur un papier, et une échelle de gris dérivée du noir.

## Palette

| Token | Clair | Sombre | Rôle |
|---|---|---|---|
| `paper` | `#F8F7F4` | `#111110` | Fond de page |
| `ink` | `#111110` | `#F8F7F4` | Texte, filets |
| `offset` | `#2242D8` | `#5B79FF` | Identité, structure, action — grands aplats |
| `offset-text` | `#1B35AB` | `#8FA3FF` | Variante pour du **texte** bleu en petit corps |
| `signal` | `#FFDD00` | `#FFDD00` | Emphase — **aplat de fond uniquement** |
| `correction` | `#D8231A` | `#FF4436` | **Retard uniquement** — aplats et tampons |
| `correction-text` | `#B81C10` | `#FF6B5F` | Variante pour du **texte** rouge en petit corps |

## Où va chaque encre

| Surface | Encre |
|---|---|
| Sidebar (les deux thèmes) | `offset` |
| Bouton primaire | `offset`, survol `ink` |
| Navigation active | `offset` + barre `paper` |
| Étape franchie du `Folio` | `offset` |
| Case cochée | `offset` |
| Chiffre « onboardings actifs » | aplat `offset` |
| Chiffre « dues sous 7 jours » | aplat `signal` |
| Chiffre « tâches en retard » | aplat `correction` |
| Tampon de retard | `correction` |
| Tout le reste | `ink` sur `paper` |

Le jaune est **rare par construction** : un seul usage dans tout le produit. C’est ce qui lui garde sa force.

Le papier n’est pas blanc : il est légèrement crème, ce qui suffit à faire basculer la perception d’« écran » vers « imprimé ». L’encre n’est pas noire : elle est très légèrement chaude. **Ne jamais utiliser `#000` ni `#FFF`.**

## Échelle d’encre

Des valeurs solides, pas des opacités — pour que deux filets superposés ne créent jamais une valeur intermédiaire imprévue.

| Token | Clair | Sombre | Usage |
|---|---|---|---|
| `ink` | `#111110` | `#F8F7F4` | Texte principal |
| `ink-70` | `#4E4D4A` | `#B4B3AF` | Texte secondaire, métadonnées |
| `ink-45` | `#8B8A86` | `#7C7B78` | Texte désactivé, tâche terminée |
| `ink-30` | `#ABAAA6` | `#565553` | Bordures de champs, nœuds vides |
| `ink-15` | `#D3D2CE` | `#33322F` | Filets de tableau |
| `ink-08` | `#E6E5E1` | `#232220` | Fond de survol, zébrures |

## Le thème sombre est un négatif

Ce n’est pas un thème sombre de dashboard : c’est une **épreuve en négatif**. Même papier, même encre, inversés. Le rouge s’éclaircit pour tenir son contraste. Rien d’autre ne change — ni les rayons, ni les filets, ni les espacements.

## Cas particulier : les graphiques

S’il y a un jour un graphique, il utilise **quatre valeurs d’encre** (`ink`, `ink-70`, `ink-45`, `ink-30`) et le rouge pour la seule série « en retard ». Pas de palette catégorielle colorée.

---

# 4. Fondations — typographie

Trois familles, trois rôles **exclusifs**. Une famille ne sort jamais de son rôle : c’est ce qui garantit la cohérence sans avoir à réfléchir.

| Famille | Rôle exclusif | Chargement |
|---|---|---|
| **Instrument Serif** | Titres d’affichage uniquement — jamais en dessous de 28 px | `next/font/google` |
| **Archivo** | Toute l’interface : corps, boutons, formulaires, tableaux | `next/font/google`, variable |
| **IBM Plex Mono** | Libellés, métadonnées, dates, heures, compteurs, identifiants | `next/font/google` |

Instrument Serif est une serif d’affichage à fort contraste. Elle est superbe à 48 px et illisible à 14 px — d’où la règle du seuil. C’est la **tension** centrale du système : une serif délicate posée sur une grille brutale.

## Échelle

Contraste volontairement fort : rapport de 1 à 6 entre le plus petit et le plus grand.

| Token | Taille / interligne | Famille | Détails | Usage |
|---|---|---|---|---|
| `display-xl` | 72 / 0.92 | Instrument Serif | `tracking: -0.02em` | Connexion, états vides |
| `display-l` | 48 / 1.0 | Instrument Serif | `tracking: -0.02em` | Titre de page |
| `display-m` | 32 / 1.05 | Instrument Serif | `tracking: -0.01em` | Titre de section, nom du sujet |
| `heading` | 20 / 1.3 | Archivo 600 | — | Titres de bloc |
| `body` | 14 / 1.55 | Archivo 400 | — | Texte courant |
| `body-strong` | 14 / 1.55 | Archivo 600 | — | Titre de tâche, libellé de champ |
| `small` | 13 / 1.45 | Archivo 400 | — | Aide, description secondaire |
| `label` | 11 / 1.2 | IBM Plex Mono 500 | `uppercase`, `tracking: 0.08em` | Sur-titres, en-têtes de colonne, statuts |
| `data` | 13 / 1.2 | IBM Plex Mono 400 | `tabular-nums` | Dates, échéances, compteurs |
| `figure` | 40 / 1.0 | IBM Plex Mono 500 | `tabular-nums` | Chiffres du dashboard |

## Règles non négociables

- **`font-variant-numeric: tabular-nums` sur tout ce qui est chiffré.** Sans ça, les colonnes de dates tremblent d’une ligne à l’autre.
- **Les capitales sont réservées aux `label`**, courts, avec interlettrage. Jamais une phrase entière en capitales : illisible.
- **Une seule `display` par écran applicatif.** Deux titres en Instrument Serif sur le même écran annulent l’effet des deux.
- **Exception : la page publique `/`.** Une landing est une suite de sections, chacune ayant besoin de son titre. La règle y devient : **un seul `display-xl` (le hero), puis des titres de section à 32-40 px**, jamais deux tailles d’affichage identiques côte à côte. La hiérarchie reste lisible parce que le hero écrase tout le reste.
- Les liens sont **soulignés en encre**, jamais colorés. `text-underline-offset: 3px`.
- Pas d’italique, sauf dans les citations d’activité (`« a marqué l’étape comme ignorée »`), où l’italique d’Instrument Serif est superbe.

---

# 5. Fondations — filets

Les filets remplacent les cartes, les ombres et les bordures arrondies. C’est le système structurel du produit. Quatre épaisseurs, quatre significations.

| Token | Épaisseur | Couleur | Signification |
|---|---|---|---|
| `rule-hair` | 1 px | `ink-15` | Séparation de lignes dans un tableau |
| `rule` | 1 px | `ink` | Séparation de sections, bordure de champ |
| `rule-heavy` | 3 px | `ink` | Bas d’un en-tête de page, délimitation majeure |
| `rule-double` | 3 px + 1 px, écart 3 px | `ink` | **Haut de l’en-tête de page uniquement** |

Le filet double est la signature éditoriale du produit. Il n’apparaît qu’à un seul endroit par page, tout en haut. C’est ce qui fait qu’une page ressemble à un article.

```css
.rule-double {
  border-top: 3px solid var(--color-ink);
  box-shadow: none;              /* jamais d'ombre */
  position: relative;
}
.rule-double::after {
  content: "";
  position: absolute;
  left: 0; right: 0; top: 3px;
  border-top: 1px solid var(--color-ink);
  margin-top: 3px;
}
```

## Élévation

Il n’y a pas d’élévation visuelle. Un panneau latéral ou une modale se distingue par :

1. un **fond papier** opaque ;
2. une **bordure de 3 px en encre** sur le côté d’attache ;
3. un **voile de fond** en encre à 88 %, sans flou.

---

# 6. Grille, espacement, densité

## Espacement

Base de **4 px**. Valeurs autorisées : `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`. Rien entre.

## Structure de page

| Élément | Valeur |
|---|---|
| Sidebar | 260 px, fixe, fond encre |
| En-tête de page | pleine largeur, `padding: 32px 40px 24px`, filet double en haut, filet lourd en bas |
| Contenu — listes | pleine largeur, `padding: 0 40px` |
| Contenu — formulaires et détail | `max-width: 720px` |
| Gouttière de colonne | 32 px |

## Densité — le contraste est intentionnel

| Zone | Densité |
|---|---|
| En-tête de page | très aérée — 32 px au-dessus, 24 px en dessous du titre |
| Ligne de tableau, ligne de tâche | **40 px** de hauteur |
| Hauteur de contrôle (bouton, champ) | **36 px** |
| Espacement entre blocs de contenu | 48 px |
| Espacement dans un formulaire | 20 px entre les champs |

Cette combinaison — chrome respirant, données serrées — n’est pas une incohérence. C’est la mise en page d’un journal : titre immense, corps en colonnes denses.

---

# 7. Les états sont des marques typographiques

**L’idée centrale du système.** À lire deux fois.

## Tâches

| État | Représentation | Détail |
|---|---|---|
| `todo` | Case vide, titre en `ink` | Carré 16 px, bordure 1 px `ink-30` |
| `done` | Case avec **✕**, titre **barré** en `ink-45` | La croix, pas la coche : c’est le geste du papier |
| `skipped` | Case barrée, titre en `ink-30`, libellé `IGNORÉE` | Aucun barré sur le titre pour ne pas confondre avec `done` |

## Échéances

| État | Représentation |
|---|---|
| À venir | Date en `data`, couleur `ink-70` |
| Aujourd’hui ou demain | Date en `data` `ink`, **soulignée** |
| En retard | **Tampon** `RETARD 3 J` — aplat rouge, texte papier |

## Parcours

| État | Représentation |
|---|---|
| `active` | Libellé `EN COURS` en `ink-70` |
| `completed` | Libellé `TERMINÉ` en `ink-45`, titre du parcours barré dans les listes |
| `cancelled` | Libellé `ANNULÉ` en `ink-30`, titre barré et estompé |

Aucune de ces distinctions ne dépend de la couleur, sauf le retard. C’est volontaire, et c’est la réponse à donner si on te demande comment tu as pensé l’accessibilité.

---

# 8. Composants

## Boutons

Hauteur 36 px, `padding: 0 16px`, `label` en mono capitales, `border-radius: 0`.

| Variante | Style |
|---|---|
| Primaire | Aplat `ink`, texte `paper`. Survol : `ink-70` |
| Secondaire | Fond transparent, bordure 1 px `ink`, texte `ink`. Survol : fond `ink-08` |
| Discret | Texte `ink-70` souligné au survol, sans bordure |
| Destructif | Aplat `correction`, texte `paper` |

Pas de bouton « icône seule » sans `aria-label`. Pas de bouton arrondi. Pas d’état désactivé pâle : un bouton désactivé garde sa bordure et passe son texte en `ink-30`.

## Champs de formulaire

Hauteur 36 px, bordure 1 px `ink-30`, fond `paper`, `border-radius: 0`.

- **Focus** : bordure 2 px `ink`, plus un contour `outline: 2px solid ink; outline-offset: 2px`. Aucune lueur, aucun halo coloré.
- **Erreur** : bordure 1 px `correction`, message en dessous en `small` `correction-text`, précédé de `→`.
- **Libellé** : `label` en mono capitales, 8 px au-dessus du champ.
- **Exception unique** : le champ de recherche est **souligné seulement** — bordure basse 1 px `ink`, pas de cadre. C’est le seul endroit où le système s’autorise cette liberté.

## Case à cocher

Carré 16 px, bordure 1 px `ink-30`, `border-radius: 0`. Cochée : fond `ink`, marque `✕` en `paper`. Jamais de coche arrondie, jamais d’animation d’échelle — seule la marque apparaît, en 120 ms.

## Tableau

- En-tête : `label` en mono capitales `ink-70`, filet lourd en dessous ;
- lignes séparées par `rule-hair` ;
- survol de ligne : fond `ink-08` ;
- pas de zébrures — les filets suffisent ;
- colonnes numériques **alignées à droite**, en `data` tabulaire ;
- première colonne en `body-strong`.

## Sidebar

Fond `ink` dans **les deux thèmes** — c’est un bloc d’encre, pas une surface qui suit le thème.

- Wordmark `LAUNCHPATH` en Archivo 600 capitales, interlettrage `0.12em`, avec le glyphe de rail ;
- entrées de navigation en `label` mono capitales, `paper-70` ;
- entrée active : texte `paper` + barre verticale de 3 px en `paper` collée au bord gauche ;
- survol : texte `paper` ;
- pied : utilisateur courant avec son carré d’initiales et un lien de déconnexion discret.

## Avatars

Carré 24 px (32 px sur les pages de détail), fond `ink`, initiales en mono 10 px `paper`. Uniforme, sans couleur dérivée du nom. En groupe, les carrés sont **accolés sans espace**, séparés par un filet 1 px `paper`.

## Micro-libellé de statut

`label` en mono capitales `ink-70`, précédé d’un nœud carré de 6 px. Pas de fond, pas de bordure, pas de pilule.

## Tampon de retard

Le seul élément coloré du produit. Aplat `correction`, texte `paper` en `label`, `padding: 3px 8px`.

Variante sur la page de détail d’un parcours : **rotation de −2°**. Uniquement là, uniquement une fois par page. Dans les tableaux et les listes, rotation nulle — l’alignement primerait toujours sur l’effet.

## États vides

Pas d’icône, pas d’illustration. Composition centrée, alignée à gauche dans un bloc de 480 px :

```
AUCUN DÉPART
PROGRAMMÉ
─────────────────────────────────
Lancez un premier onboarding pour voir
apparaître les tâches et les échéances.

[ LANCER UN ONBOARDING ]
```

Titre en `display-l`, filet `rule` en dessous, une phrase en `body` `ink-70`, un bouton primaire. Chaque état vide propose l’action suivante — sans exception.

## Toasts

Ancrés en bas à droite, aplat `ink`, texte `paper`, `label` en mono capitales pour le titre et `small` pour le détail. Bordure gauche de 3 px : `paper` en cas de succès, `correction` en cas d’erreur. Apparition par translation de 8 px vers le haut, 150 ms.

## Panneau latéral et modale

Fond `paper`, bordure gauche 3 px `ink`, voile de fond `ink` à 88 % sans flou. Largeur 480 px. En-tête du panneau : `label` mono en sur-titre, titre en `heading`, filet lourd en dessous.

---

# 9. Les quatre composants signature

Ce sont eux qu’un recruteur regardera. Leur code est donné pour qu’il n’y ait aucun écart entre le document et l’implémentation.

## 9.1 `Masthead` — l’en-tête de page

L’élément qui fait qu’une page ressemble à un article de revue. Présent sur **chaque** écran.

```tsx
// src/components/masthead.tsx
type MastheadProps = {
  kicker: string;          // sur-titre mono capitales — ex. "ONBOARDING · DÉVELOPPEUR"
  title: string;           // titre en serif d'affichage
  meta?: string[];         // fragments de métadonnées, séparés par des points médians
  actions?: React.ReactNode;
};

export function Masthead({ kicker, title, meta, actions }: MastheadProps) {
  return (
    <header className="rule-double border-b-[3px] border-ink px-10 pb-6 pt-8">
      <div className="flex items-end justify-between gap-8">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-70">
            {kicker}
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-none tracking-[-0.02em] text-ink">
            {title}
          </h1>
          {meta && meta.length > 0 && (
            <p className="mt-4 font-mono text-[13px] tabular-nums text-ink-70">
              {meta.join("  ·  ")}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
```

Exemple d’usage sur la page d’un parcours :

```tsx
<Masthead
  kicker="Onboarding · Développeur"
  title="Marie Dupont"
  meta={["DÉPART 12 MARS 2026", "ÉTAPE 4/10", "PILOTE AA"]}
  actions={<><Button variant="secondary">Annuler</Button><Button>Ajouter une étape</Button></>}
/>
```

## 9.2 `Folio` — la progression

Le composant identitaire du produit. Les étapes deviennent des **numéros de page** : une rangée de carrés numérotés, empruntée à la pagination d’un livre.

```tsx
// src/components/folio.tsx
type FolioStep = { position: number; status: "todo" | "done" | "skipped"; late: boolean };

export function Folio({ steps }: { steps: FolioStep[] }) {
  return (
    <ol className="flex flex-wrap gap-[3px]" aria-label="Progression du parcours">
      {steps.map((step) => {
        const label = String(step.position).padStart(2, "0");
        const state = step.late && step.status === "todo" ? "late" : step.status;

        return (
          <li
            key={step.position}
            aria-label={`Étape ${step.position} — ${STATE_LABEL[state]}`}
            className={[
              "grid h-6 w-6 place-items-center border font-mono text-[10px] tabular-nums",
              state === "done" && "border-ink bg-ink text-paper",
              state === "todo" && "border-ink-30 bg-transparent text-ink-45",
              state === "skipped" && "border-ink-15 bg-ink-08 text-ink-30 line-through",
              state === "late" && "border-correction bg-correction text-paper",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {label}
          </li>
        );
      })}
    </ol>
  );
}

const STATE_LABEL = {
  done: "terminée",
  todo: "à faire",
  skipped: "ignorée",
  late: "en retard",
} as const;
```

Version compacte pour les listes : les mêmes carrés en 10 px sans numéro, `gap: 2px`.

**Pourquoi ce composant et pas une barre de progression** : il dit en un coup d’œil trois choses qu’une barre ne dit pas — combien d’étapes au total, laquelle est en retard, et où l’on en est dans la séquence.

## 9.3 `Stamp` — le tampon de retard

```tsx
// src/components/stamp.tsx
export function Stamp({
  children,
  tilted = false,
}: { children: React.ReactNode; tilted?: boolean }) {
  return (
    <span
      className={[
        "inline-block bg-correction px-2 py-[3px]",
        "font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper",
        tilted && "-rotate-2",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
```

Usage : `<Stamp tilted>Retard 3 j</Stamp>` sur la page de détail, `<Stamp>Retard 3 j</Stamp>` partout ailleurs.

Le texte contient **toujours** le mot « retard ». Le rouge n’est jamais la seule information.

## 9.4 `LedgerRow` — la ligne de tâche

La ligne du registre. Le composant le plus utilisé du produit, donc le plus sobre.

```tsx
// src/components/ledger-row.tsx
type LedgerRowProps = {
  title: string;
  assignee: { initials: string; name: string } | null;
  dueDate: string;              // déjà formaté — ex. "12 MARS"
  status: "todo" | "done" | "skipped";
  lateDays: number | null;      // > 0 si en retard
  onToggle: () => void;
  onOpen: () => void;
};

export function LedgerRow({
  title, assignee, dueDate, status, lateDays, onToggle, onOpen,
}: LedgerRowProps) {
  const done = status === "done";
  const skipped = status === "skipped";

  return (
    <div className="grid h-10 grid-cols-[24px_1fr_auto_auto] items-center gap-4 border-b border-ink-15 px-2 hover:bg-ink-08">
      <button
        type="button"
        onClick={onToggle}
        aria-label={done ? `Rouvrir « ${title} »` : `Terminer « ${title} »`}
        className={[
          "grid h-4 w-4 place-items-center border transition-colors duration-[120ms]",
          done ? "border-ink bg-ink" : "border-ink-30 bg-transparent",
          skipped && "border-ink-15 line-through",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {done && <span className="font-mono text-[10px] leading-none text-paper">✕</span>}
      </button>

      <button type="button" onClick={onOpen} className="truncate text-left">
        <span
          className={[
            "text-sm font-semibold",
            done && "text-ink-45 line-through",
            skipped && "text-ink-30",
            !done && !skipped && "text-ink",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {title}
        </span>
        {skipped && (
          <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-30">
            Ignorée
          </span>
        )}
      </button>

      {assignee ? (
        <span
          title={assignee.name}
          className="grid h-6 w-6 place-items-center bg-ink font-mono text-[10px] text-paper"
        >
          {assignee.initials}
        </span>
      ) : (
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-30">
          Non assignée
        </span>
      )}

      {lateDays && lateDays > 0 ? (
        <Stamp>{`Retard ${lateDays} j`}</Stamp>
      ) : (
        <span className="font-mono text-[13px] tabular-nums text-ink-70">{dueDate}</span>
      )}
    </div>
  );
}
```

---

# 10. Tokens — à coller dans le projet

## `src/app/globals.css`

Les noms `--background`, `--foreground`, `--primary`… sont ceux qu’attend shadcn/ui : les redéfinir suffit à faire basculer tous ses composants dans le système, sans les modifier un par un.

```css
@import "tailwindcss";

:root {
  /* — Fondations — */
  --color-paper: #f8f7f4;
  --color-ink: #111110;
  --color-ink-70: #4e4d4a;
  --color-ink-45: #8b8a86;
  --color-ink-30: #abaaa6;
  --color-ink-15: #d3d2ce;
  --color-ink-08: #e6e5e1;
  --color-correction: #d8231a;
  --color-correction-text: #b81c10;

  /* — Correspondance shadcn/ui — */
  --background: var(--color-paper);
  --foreground: var(--color-ink);
  --card: var(--color-paper);
  --card-foreground: var(--color-ink);
  --popover: var(--color-paper);
  --popover-foreground: var(--color-ink);
  --primary: var(--color-ink);
  --primary-foreground: var(--color-paper);
  --secondary: var(--color-ink-08);
  --secondary-foreground: var(--color-ink);
  --muted: var(--color-ink-08);
  --muted-foreground: var(--color-ink-70);
  --accent: var(--color-ink-08);
  --accent-foreground: var(--color-ink);
  --destructive: var(--color-correction);
  --destructive-foreground: var(--color-paper);
  --border: var(--color-ink-15);
  --input: var(--color-ink-30);
  --ring: var(--color-ink);

  /* La règle identitaire, en une ligne */
  --radius: 0px;
}

.dark {
  --color-paper: #111110;
  --color-ink: #f8f7f4;
  --color-ink-70: #b4b3af;
  --color-ink-45: #7c7b78;
  --color-ink-30: #565553;
  --color-ink-15: #33322f;
  --color-ink-08: #232220;
  --color-correction: #ff4436;
  --color-correction-text: #ff6b5f;
}

@theme inline {
  --color-paper: var(--color-paper);
  --color-ink: var(--color-ink);
  --color-ink-70: var(--color-ink-70);
  --color-ink-45: var(--color-ink-45);
  --color-ink-30: var(--color-ink-30);
  --color-ink-15: var(--color-ink-15);
  --color-ink-08: var(--color-ink-08);
  --color-correction: var(--color-correction);

  --font-sans: var(--font-archivo);
  --font-serif: var(--font-instrument-serif);
  --font-mono: var(--font-plex-mono);

  --radius-none: 0px;
}

@layer base {
  * {
    border-radius: 0 !important;   /* garde-fou pendant tout le projet */
    box-shadow: none !important;
  }

  body {
    background: var(--color-paper);
    color: var(--color-ink);
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }

  /* Chiffres tabulaires partout où il y a des chiffres */
  .font-mono,
  table,
  time,
  [data-numeric] {
    font-variant-numeric: tabular-nums;
  }

  a {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  :focus-visible {
    outline: 2px solid var(--color-ink);
    outline-offset: 2px;
  }
}
```

Le `!important` sur `border-radius` et `box-shadow` est un choix assumé pour la durée du projet : il empêche mécaniquement tout composant shadcn nouvellement installé de réintroduire des angles arrondis ou une ombre. À retirer et remplacer par une configuration propre au moment de la mise en ligne, en le notant dans `docs/journal.md`.

## `src/app/layout.tsx` — les polices

```tsx
import { Archivo, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});
```

---

# 11. Mouvement

Le papier ne bouge pas beaucoup. Trois transitions autorisées, rien d’autre.

| Élément | Animation | Durée |
|---|---|---|
| Case à cocher | apparition de la marque `✕` | 120 ms `ease-out` |
| Toast | translation de 8 px vers le haut + opacité | 150 ms `ease-out` |
| Panneau latéral | translation depuis la droite | 180 ms `cubic-bezier(0.2, 0, 0, 1)` |

Le survol change une couleur, jamais une position ni une échelle. Pas de `transform: scale`, pas de rebond, pas de parallaxe.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# 12. Accessibilité

| Point | Règle |
|---|---|
| Contraste du texte | Minimum 4.5:1. `ink` sur `paper` dépasse 17:1 — la marge est confortable partout |
| Rouge en **texte** | Uniquement `correction-text` (`#B81C10`, 6.2:1). Le `correction` plein (4.7:1) est réservé aux **aplats** avec texte papier |
| Couleur seule | Interdite comme unique porteuse d’information. Le retard associe toujours l’aplat rouge **et** le mot « retard » |
| Capitales | Réservées aux `label` courts. Jamais une phrase |
| Focus | Contour 2 px `ink` avec `offset: 2px`. Visible sur les deux thèmes, jamais supprimé |
| Cibles tactiles | 36 px minimum en hauteur ; la case à cocher de 16 px a une zone cliquable de 36 px |
| Icônes | `aria-label` obligatoire dès qu’un bouton n’a pas de texte |
| Marques typographiques | `✕`, `→`, `·` sont décoratifs : `aria-hidden` et libellé textuel à côté |

Le système est nativement solide sur l’accessibilité, parce qu’il repose sur le contraste et la forme plutôt que sur la couleur. C’est un argument à mettre en avant, pas un effet secondaire.

---

# 13. Application écran par écran

**Connexion** — page unique, papier plein, bloc de 420 px aligné à gauche avec de grandes marges. Filet double, lockup `Logo` en Archivo, **titre éditorial en `display-l` serif** (« Chaque intégration, étape par étape. »), baseline en `label` mono, un champ email souligné, un bouton primaire pleine largeur. Rien d’autre.

Le wordmark reste dans le lockup en Archivo : la serif porte une **phrase**, jamais le nom du produit — sinon elle entrerait en conflit avec la règle du §14. Composition de couverture de revue : titre de publication en petit, accroche en grand.

**Dashboard** — `Masthead` avec la date du jour en métadonnée. Quatre chiffres en `figure` mono 40 px, séparés par des filets verticaux, libellés en `label` en dessous. Puis les parcours actifs en registre, chacun avec son `Folio` compact. Enfin le bloc « en retard », seul endroit rouge de la page.

**Liste des parcours** — registre pleine largeur. Recherche soulignée en haut à droite, filtres en `label` mono cliquables avec soulignement pour l’état actif. Pas de menus déroulants là où trois liens suffisent.

**Détail d’un parcours** — `Masthead` avec le nom du sujet en `display-l`, le `Folio` numéroté juste en dessous à pleine largeur, puis les tâches en `LedgerRow` groupées par semaine avec un sur-titre `label` par groupe. Le tampon incliné apparaît une seule fois, dans l’en-tête, s’il y a du retard.

**Mes tâches** — véritable tableau, colonnes alignées, échéances en mono à droite, groupes `EN RETARD` / `AUJOURD’HUI` / `7 PROCHAINS JOURS` / `PLUS TARD` en `label`.

**Éditeur de template** — formulaire en 720 px. Les étapes forment un registre numéroté ; `offset_days` s’affiche en langage clair (`3 jours avant l’arrivée`) avec la valeur en mono.

---

# 14. Logotype et glyphe

## Le glyphe : trois stations

Le glyphe est une **réduction du `Folio`**. C’est la même idée — des étapes sur un parcours — ramenée à trois carrés posés sur un filet : deux franchis, un à venir.

Aucun dessin décoratif n’est inventé : le logo est un composant du produit, réduit. C’est ce qui fait qu’il ne ressemble à aucun autre.

```tsx
// src/components/brand/glyph.tsx
export function Glyph({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      {/* le filet : le parcours */}
      <path d="M1 12h22" stroke="currentColor" strokeWidth="2" />
      {/* deux stations franchies */}
      <rect x="1" y="9" width="6" height="6" fill="currentColor" />
      <rect x="9" y="9" width="6" height="6" fill="currentColor" />
      {/* une station à venir */}
      <rect x="17.5" y="9.5" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
```

## Le lockup

```tsx
// src/components/brand/logo.tsx
import { Glyph } from "./glyph";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Glyph className="h-5 w-5" />
      <span className="text-[15px] font-semibold uppercase tracking-[0.12em]">
        LaunchPath
      </span>
    </span>
  );
}
```

Le mot est en **Archivo 600 capitales**, interlettrage `0.12em`. Jamais en Instrument Serif : la serif est réservée aux titres de contenu, et un logo en serif d’affichage entrerait en concurrence avec eux.

Le lockup hérite de `currentColor` : encre sur papier dans le contenu, papier sur encre dans la sidebar. Un seul composant, deux contextes, zéro variante à maintenir.

## Le favicon

Le glyphe à trois carrés devient illisible à 16 px. Le favicon est donc une **réduction de la réduction** : champ d’encre, un filet papier, une seule station.

```svg
<!-- public/icon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#111110"/>
  <path d="M4 16h24" stroke="#F8F7F4" stroke-width="2.5"/>
  <rect x="12" y="12" width="8" height="8" fill="#F8F7F4"/>
</svg>
```

Placé dans `src/app/icon.svg`, Next.js le sert automatiquement comme favicon. Pas de `<link>` à écrire.

---

# 15. Sur-titres, par écran

Le `Masthead` impose un sur-titre en `label` mono. Pour qu’il ne devienne pas décoratif, une règle :

> **Le sur-titre porte toujours la rubrique, puis un chiffre ou une date réels.**

C’est ce qui transforme un ornement typographique en information utile — et ce qui donne au produit son air de publication.

| Écran | Sur-titre | Titre en `display` |
|---|---|---|
| `/` | `ONBOARDING · RH & CUSTOMER SUCCESS` | Vos intégrations ne devraient pas vivre dans un tableur. |
| `/login` | *aucun* — la baseline le remplace | Chaque intégration, étape par étape. |
| `/welcome` | `PREMIÈRE CONNEXION` | Créez votre organisation |
| `/invitations/[token]` | `INVITATION · <NOM DE L’ORGANISATION>` | Rejoignez l’équipe |
| `/` | `SYNTHÈSE · JEUDI 12 MARS 2026` | *nom de l’organisation* |
| `/journeys` | `ONBOARDINGS · 12 EN COURS` | Onboardings |
| `/journeys/new` | `ONBOARDINGS · NOUVEAU LANCEMENT` | Lancer un onboarding |
| `/journeys/[id]` | `ONBOARDING · <NOM DU TEMPLATE>` | *nom de la personne* |
| `/templates` | `TEMPLATES · 3 MODÈLES` | Templates |
| `/templates/new` | `TEMPLATES · NOUVEAU MODÈLE` | Créer un template |
| `/templates/[id]` | `TEMPLATE · COLLABORATEUR` | *nom du template* |
| `/my-tasks` | `MES TÂCHES · 7 À TRAITER` | Mes tâches |
| `/settings/members` | `PARAMÈTRES · 3 MEMBRES` | Équipe |

Deux titres portent une **donnée** et non un libellé : le dashboard affiche le nom de l’organisation, la page de détail affiche le nom de la personne. Ce sont les deux écrans les plus personnels du produit, et les voir en serif 48 px fait toute la différence en démonstration.

---

# 16. Checklist de conformité

À passer avant de considérer un écran terminé.

- [ ] Aucun angle arrondi, aucune ombre
- [ ] Une seule `display` en Instrument Serif sur l’écran
- [ ] Instrument Serif n’apparaît nulle part en dessous de 28 px
- [ ] Le rouge n’apparaît que pour du retard
- [ ] Chaque famille typographique reste dans son rôle
- [ ] Tous les chiffres sont tabulaires
- [ ] Les capitales ne servent qu’à des `label` courts
- [ ] L’écran a un `Masthead` avec filet double en haut et filet lourd en bas
- [ ] Les états vide, chargement et erreur existent
- [ ] L’état vide propose l’action suivante
- [ ] Le focus au clavier est visible partout
- [ ] Aucun débordement horizontal à 390 px
- [ ] Rendu vérifié dans les deux thèmes

## Ce qui trahirait le système

Si l’un de ces éléments apparaît, ce n’est plus LaunchPath : un angle arrondi, une ombre portée, un badge en pilule, un vert de validation, une icône décorative dans le contenu, une deuxième couleur d’accent, ou une phrase entière en capitales.

---

# 17. Le pitch design, en trois phrases

> J’ai traité LaunchPath comme un document imprimé plutôt que comme un dashboard : serif d’affichage, filets, encre sur papier crème, aucun angle arrondi et aucune ombre.
>
> Le système n’a qu’une couleur d’accent, un rouge de correction, et elle ne sert qu’à signaler un retard — tous les autres états sont exprimés par des marques typographiques, ce qui reste lisible sans percevoir les couleurs.
>
> La progression d’un onboarding est rendue par une rangée de carrés numérotés inspirée de la pagination d’un livre : on voit d’un coup d’œil le nombre d’étapes, où l’on en est, et laquelle est en retard.

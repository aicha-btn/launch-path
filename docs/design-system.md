# Design System — LaunchPath

Direction artistique actuelle : **Journey Orchestration System**.

LaunchPath doit ressembler à un cockpit d'orchestration de parcours : calme,
lisible, rythmé par des checkpoints, des owners, des échéances et la prochaine
action. Le produit parle d'onboarding, mais il ne doit pas tomber dans les
clichés de fusée, carte, route illustrée ou logiciel RH générique.

## 1. Principe Directeur

Chaque élément visuel doit répondre à une question métier :

- Où en est le parcours ?
- Quel checkpoint demande une action ?
- Qui est owner ?
- Quand faut-il agir ?
- Qu'est-ce qui est en retard ?

La direction artistique est donc fonctionnelle avant d'être décorative. Les
animations existent pour rendre le produit vivant et agréable, mais jamais pour
masquer l'information.

## 2. Palette

Le fond est chaud, les surfaces sont douces, l'action est indigo, le succès est
vert, le retard est corail, l'attention est ambre.

| Token | Valeur | Rôle |
|---|---:|---|
| `canvas` | `#f7f3ea` | Fond global |
| `surface` | `#fffaf1` | Cartes, formulaires, rows |
| `surface-raised` | `#fffdf7` | Surfaces prioritaires |
| `surface-muted` | `#ece6db` | Pistes, états neutres |
| `sidebar` | `#eeedf8` | Navigation applicative |
| `text` | `#25231f` | Texte principal |
| `text-muted` | `#69645b` | Texte secondaire |
| `text-soft` | `#948d82` | Texte tertiaire |
| `line` | `#d7cec0` | Bordures calmes |
| `primary` | `#5667e8` | Action, position actuelle |
| `primary-soft` | `#e4e7ff` | Badges actifs, focus |
| `success` | `#5f8d70` | Checkpoints terminés |
| `warning` | `#d99a2b` | Aujourd'hui, bientôt |
| `overdue` | `#c85f45` | Retards, erreurs, actions destructives |
| `blocked` | `#51465e` | Footer et états structurels sombres |

Les anciens noms (`paper`, `ink`, `offset`, `signal`, `correction`) restent
mappés dans `globals.css` pour éviter de casser les anciens composants pendant
les migrations.

## 3. Typographie

Archivo porte le produit. IBM Plex Mono sert uniquement aux dates, compteurs,
IDs courts et métadonnées. Instrument Serif reste disponible, mais ne doit plus
dominer l'interface.

Les titres applicatifs sont sans-serif, larges et nets. Les labels peuvent être
en capitales avec `letter-spacing: 0.08em`, mais les paragraphes et boutons
restent en casse naturelle.

## 4. Formes

Le système abandonne le brutalisme anguleux. Les formes sont arrondies sans
devenir molles :

- `6px` pour les micro-éléments
- `10px` pour les champs
- `16px` pour les cartes et panneaux
- `22px` pour les grands conteneurs
- `999px` pour les badges, avatars, actions principales

Les cartes sont autorisées pour les éléments répétés, les formulaires et les
panneaux. Éviter les cartes imbriquées décoratives.

## 5. Composants Signés

`PathRail` est la signature visuelle du produit : une ligne de checkpoints qui
montre la progression d'un onboarding.

`JourneyPathPreview` expose la trajectoire verticale détaillée, utile dans le
hero, la page détail et les panneaux de contexte.

`JourneyCard` est la carte standard d'un onboarding : sujet, modèle, état de
santé, rail, checkpoint actuel, suivant, owner et due badge.

`DueBadge` et `OwnerBadge` doivent rester compacts, tronqués si nécessaire, et
lisibles sur mobile.

## 6. Animation

Le mouvement doit réveiller l'interface, pas l'envahir.

- Entrées de page : montée douce autour de 520 ms
- Stagger : petites listes et rails
- Hover carte : léger lift + shadow fonctionnelle
- Hover row : déplacement de quelques pixels
- Bouton : micro-lueur et translation courte
- Reduced motion : tout mouvement se neutralise

Ne pas utiliser d'animations permanentes, de blobs, d'orbes, de dégradés
décoratifs ou d'effets qui attirent l'oeil sans information.

## 7. Pages Prioritaires

La landing doit montrer le produit lui-même : rail, owners, échéances, retard,
prochaine action. Pas d'illustration abstraite.

Le dashboard doit répondre immédiatement à : "quelle est la prochaine action ?"
Les chiffres viennent après.

La page détail doit fonctionner comme une salle de contrôle : trajectoire,
groupes d'étapes, historique, position actuelle.

Les templates doivent être perçus comme des trajectoires réutilisables, pas
comme des documents.

Les écrans d'auth et d'invitation restent sobres et rassurants.

## 8. Garde-Fous

À éviter :

- carte géographique, fusée, route illustrée, métaphore trop littérale
- dashboard générique bleu/gris
- hero marketing split texte/image avec carte décorative
- tables ou formulaires qui imposent un scroll horizontal de page
- email ou nom long qui déborde d'un badge
- rouge utilisé comme simple décoration
- animations qui se répètent en boucle sans état métier

# Questionnaire — Direction artistique et design system LaunchPath

## But de ce document

Répondre à ces questions me permettra d’écrire `design-system.md` : un document unique qui définira les couleurs, la typographie, les espacements, les formes, les composants et le ton de LaunchPath — assez précisément pour que chaque écran soit cohérent sans avoir à redécider quoi que ce soit pendant le développement.

## Comment répondre

- Réponds par **numéro + lettre** : `1. B`, `2. C`… Pas besoin de rédiger.
- Tu peux ajouter une phrase quand tu as un avis précis, mais ce n’est jamais obligatoire.
- Si une question ne t’évoque rien, écris **`défaut`** : j’applique la recommandation indiquée. Tu peux même écrire `bloc D : défaut` pour un bloc entier.
- **Les références concrètes valent dix fois les adjectifs.** « Comme Linear » me dit beaucoup ; « moderne et épuré » ne me dit presque rien.
- Si une option manque, écris ta propre réponse — les listes ne sont pas fermées.

Il y a **32 questions**, réparties en 11 blocs. Compte 20 à 30 minutes.

---

# Bloc A — Intention générale

*Ce bloc oriente tout le reste. Si tu ne réponds qu’à un seul bloc, c’est celui-là.*

### 1. Quelle impression dominante l’interface doit-elle donner ?

- **A.** Sobre et corporate — on dirait un outil acheté par une DRH, rassurant, discret
- **B.** Technique et dense — beaucoup d’information bien rangée, efficace, pour des gens pressés
- **C.** Chaleureux et humain — c’est un produit qui parle d’accueil de personnes, donc il accueille
- **D.** Éditorial et premium — typographie soignée, beaucoup d’air, sensation de qualité

*Défaut : **C**, nuancé par la rigueur de B. Un produit d’onboarding froid est une contradiction, mais un outil de suivi doit rester lisible et sérieux.*

→ Détermine la palette, la densité et le ton des textes.

### 2. Qui doit être impressionné en premier ?

- **A.** Le recruteur qui découvre le projet en 90 secondes → priorité à l’effet immédiat du dashboard
- **B.** L’utilisatrice fictive qui l’utiliserait tous les jours → priorité au confort et à la lisibilité
- **C.** Les deux à égalité, sans sacrifier l’un pour l’autre

*Défaut : **C**, avec un soin particulier sur le dashboard et la page détail d’un onboarding, qui sont les deux écrans que tu montreras.*

→ Détermine où investir le temps de finition.

### 3. À quoi le projet ne doit surtout PAS ressembler ?

Coche tout ce qui te dérange (plusieurs réponses) :

- **A.** Un template Bootstrap générique, bleu et gris, sans personnalité
- **B.** Un dashboard « crypto / AI startup » : dégradés violets, néons, fonds sombres partout
- **C.** Un outil administratif austère type logiciel RH d’entreprise des années 2010
- **D.** Un site vitrine trop marketing, avec des grosses illustrations 3D
- **E.** Une interface trop « designer » où l’on ne comprend pas où cliquer

*Défaut : **A + B**, ce sont les deux pièges les plus fréquents.*

→ Ce sont mes garde-fous : je m’en servirai pour arbitrer les cas où j’hésite.

---

# Bloc B — Références

*La question la plus utile du questionnaire est la 4. Prends le temps d’ouvrir deux ou trois de ces produits.*

### 4. Parmi ces interfaces SaaS, lesquelles te plaisent visuellement ? (2 ou 3 maximum)

- **A. Linear** — dense, sombre par défaut, très typé, sidebar compacte, animations discrètes
- **B. Notion** — très neutre, beaucoup de blanc, typographie modeste, presque pas de couleur
- **C. Stripe Dashboard** — dense mais lisible, bleu-violet franc, excellents tableaux et graphiques
- **D. Vercel** — noir et blanc radical, géométrie nette, angles peu arrondis, très peu de couleur
- **E. Attio / Height** — moderne, arrondis marqués, couleurs douces, beaucoup de badges colorés
- **F. Basecamp** — chaleureux, gros textes, couleurs franches, assumé « pas corporate »
- **G. Intercom** — arrondi, amical, illustrations, bleu-violet doux
- **H. Aucune, je préfère du plus classique** — proche de shadcn/ui par défaut

*Défaut : **C + E**. Le sérieux et la densité de Stripe, la douceur et les badges d’Attio.*

### 5. Quel niveau de personnalité visuelle veux-tu assumer ? (1 à 5)

- **1.** shadcn/ui par défaut, sans rien changer — neutre, rapide, invisible
- **2.** shadcn avec une couleur primaire et un rayon d’angles choisis
- **3.** Identité claire : palette propre, typographie choisie, quelques composants signés
- **4.** Identité forte : un parti pris visible sur chaque écran
- **5.** Très typé, presque une démonstration de style

*Défaut : **3**. En dessous, le projet ne se distingue d’aucun tutoriel. Au-dessus, le temps passé en design est pris sur les fonctionnalités — et un recruteur technique regarde d’abord le produit.*

→ C’est le curseur le plus important pour calibrer mon travail.

### 6. *(optionnel)* Une référence hors logiciel qui t’inspire ?

Signalétique d’aéroport, planning de chantier, carnet de bord, agenda papier, tableau de gare, mode d’emploi Muji, plan de métro…

*Défaut : aucune. Mais si tu en as une, elle donnera au projet quelque chose qu’aucun autre portfolio n’aura.*

---

# Bloc C — Marque

### 7. Comment le nom s’écrit-il exactement ?

- **A.** `LaunchPath` — un mot, deux majuscules
- **B.** `Launch Path` — deux mots
- **C.** `launchpath` — tout en minuscules
- **D.** `LAUNCHPATH` — capitales

*Défaut : **A**.*

### 8. Quelle forme prend le logo ?

- **A.** Wordmark seul — le nom composé dans la police du produit, rien d’autre
- **B.** Monogramme `LP` dans un carré arrondi, + le nom à côté
- **C.** Pictogramme abstrait + le nom
- **D.** Je verrai plus tard, mets un placeholder propre

*Défaut : **B**. C’est le meilleur rapport crédibilité / temps passé, et ça donne un favicon utilisable immédiatement.*

### 9. Une métaphore visuelle à exploiter, ou à éviter ?

- **A.** Le chemin, la trajectoire, les jalons — cohérent avec « path »
- **B.** La checklist, la progression, ce qui se remplit
- **C.** La fusée, le décollage — cohérent avec « launch », mais très utilisé
- **D.** Aucune métaphore, uniquement de la typographie et de la couleur

*Défaut : **B** comme fil visuel (progression, étapes franchies), **A** discrètement dans le logo, et **C** évité — la fusée est le cliché absolu du SaaS.*

### 10. Faut-il une baseline visible dans l’application ?

- **A.** Oui, sous le logo dans la sidebar ou l’écran de connexion
- **B.** Non, seulement dans le README et le portfolio
- **C.** Uniquement sur l’écran de connexion

*Défaut : **C**.*

---

# Bloc D — Couleur

### 11. Quelle famille pour la couleur principale ?

- **A.** Bleu — le choix sûr, professionnel, un peu attendu
- **B.** Indigo / violet — moderne, très présent dans le SaaS actuel
- **C.** Vert — progression, validation, cohérent avec un produit de suivi
- **D.** Teal / cyan sombre — moins courant, technique sans être froid
- **E.** Ambre / orange — chaleureux, énergique, rare comme couleur primaire
- **F.** Presque pas de couleur — noir, blanc, gris, avec un seul accent
- **G.** Autre : ma couleur préférée est…

*Défaut : **D**. Le teal évite le bleu générique et l’indigo saturé, il reste sérieux, et il laisse le vert entièrement disponible pour signifier « terminé » — ce qui compte dans un produit dont le sujet est la progression.*

→ Attention : si la couleur primaire est verte, elle entre en conflit avec le vert de validation. Si elle est rouge ou orange, elle entre en conflit avec les alertes de retard.

### 12. Quelle intensité pour cette couleur ?

- **A.** Douce, désaturée, presque pastel
- **B.** Franche et lisible, sans être criarde
- **C.** Profonde et saturée, très présente

*Défaut : **B**.*

### 13. Quel rôle la couleur joue-t-elle dans l’interface ?

- **A.** Structurelle — sidebar colorée, en-têtes colorés, surfaces teintées
- **B.** Ponctuelle — interface en gris et blanc, couleur réservée aux actions et aux éléments actifs
- **C.** Mixte — sidebar légèrement teintée, reste neutre

*Défaut : **B**. C’est ce qui distingue le plus nettement une interface professionnelle d’un template : la couleur devient un signal, pas une décoration. Un bouton primaire coloré se voit d’autant mieux que rien d’autre ne l’est.*

### 14. Combien de couleurs de statut acceptes-tu ?

Le produit a beaucoup d’états : tâche `todo` / `done` / `skipped`, onboarding `active` / `completed` / `cancelled`, échéance en retard / aujourd’hui / à venir.

- **A.** Le minimum — gris pour le neutre, vert pour le terminé, rouge pour le retard, rien d’autre
- **B.** Une couleur par statut, soit 6 à 8 teintes distinctes
- **C.** Peu de couleurs, mais des formes différentes (point plein, point creux, coche, croix)

*Défaut : **C**. Le retard est le seul vrai signal d’alerte du produit ; si tout est coloré, plus rien ne ressort. Et la forme reste lisible pour une personne daltonienne.*

### 15. Quel type de gris ?

- **A.** Gris froids, légèrement bleutés — sensation technique
- **B.** Gris chauds, légèrement beiges — sensation douce et papier
- **C.** Gris purs, parfaitement neutres

*Défaut : **A**, accordés au teal. Les gris chauds iraient très bien avec l’ambre si tu choisis E en question 11.*

---

# Bloc E — Thème clair et sombre

### 16. Quels thèmes veux-tu ?

- **A.** Clair uniquement — deux fois moins de travail, et suffisant pour une démo
- **B.** Clair et sombre, avec un bouton de bascule
- **C.** Sombre uniquement, style Linear

*Défaut : **B**, mais uniquement si les tokens de couleur sont posés correctement dès le premier jour. Fait proprement avec des variables CSS, le mode sombre coûte deux heures et impressionne un recruteur ; fait après coup, il coûte deux jours. C’est donc une décision à prendre maintenant ou jamais.*

### 17. Si les deux : lequel par défaut ?

- **A.** Clair
- **B.** Sombre
- **C.** Celui du système d’exploitation

*Défaut : **C**, avec repli sur le clair. Et les captures d’écran du README seront en clair — plus lisibles pour tout le monde.*

---

# Bloc F — Typographie

### 18. Quelle police pour l’interface ?

- **A. Inter** — le standard du SaaS, neutre, excellente lisibilité, un peu vue partout
- **B. Geist** — la police de Vercel, géométrique, contemporaine, légèrement plus caractérisée
- **C. IBM Plex Sans** — un vrai caractère, légèrement technique, moins courante
- **D. Source Sans 3** — humaniste, douce, très lisible dans les petits corps
- **E. system-ui** — la police du système, zéro chargement, aucune personnalité
- **F. Autre :** …

*Défaut : **C**. IBM Plex Sans est libre, très lisible, et donne immédiatement une identité sans coûter le moindre effort — là où Inter passe inaperçue. Son compagnon `IBM Plex Mono` sera parfait pour les dates et les compteurs.*

### 19. Une police différente pour les titres ?

- **A.** Non, une seule famille avec des graisses différentes
- **B.** Oui, un caractère plus marqué pour les titres de page
- **C.** Oui, et j’assume une serif pour les titres — inattendu dans un SaaS

*Défaut : **A**. Deux familles sur un projet de portfolio, c’est un risque d’incohérence pour un gain faible. La hiérarchie se fait par la taille, la graisse et la couleur.*

### 20. Quelle échelle typographique ?

- **A.** Compacte — corps de texte à 13 px, beaucoup d’information à l’écran (façon Linear)
- **B.** Standard — corps à 14 px, l’équilibre habituel du SaaS
- **C.** Confortable — corps à 15-16 px, plus lisible, moins dense

*Défaut : **B**. Avec une exception assumée : les tableaux de tâches descendent à 13 px, les titres de page montent à 24 px.*

*(Note appliquée sans te demander ton avis : les chiffres seront tabulaires — `font-variant-numeric: tabular-nums` — sur toutes les dates, compteurs et pourcentages. Sinon les colonnes de dates tremblent d’une ligne à l’autre. C’est un détail que les gens remarquent sans savoir le nommer.)*

---

# Bloc G — Formes et matière

### 21. Quel rayon pour les angles ?

```
A. 0px      ┌──────────┐    tranchant, technique
B. 4px      ╭──────────╮    discret, sobre
C. 8px      ( ──────── )    standard actuel, doux
D. 12-16px  (  ──────  )    très arrondi, amical
```

*Défaut : **B** pour les petits éléments (boutons, champs, badges) et **C** pour les grandes surfaces (cartes, panneaux, modales). Un rayon unique partout donne toujours un résultat un peu mou.*

### 22. Comment séparer les surfaces ?

- **A.** Bordures fines uniquement, aucune ombre — net, plat, moderne
- **B.** Ombres douces uniquement, sans bordure — surfaces qui flottent
- **C.** Les deux : bordure fine + ombre très légère
- **D.** Différence de fond seulement, ni bordure ni ombre

*Défaut : **A**, avec des ombres réservées aux éléments réellement superposés (menus déroulants, panneau latéral, modales). Les ombres partout, c’est la signature d’un template.*

### 23. Quelle densité générale ?

```
A. Dense           │ Tâche 1                    │ 32px de hauteur de ligne
                   │ Tâche 2                    │
                   │ Tâche 3                    │

B. Confortable     │                            │ 44px
                   │  Tâche 1                   │
                   │                            │
                   │  Tâche 2                   │

C. Aérée           │                            │ 56px+
                   │                            │
                   │   Tâche 1                  │
                   │                            │
```

*Défaut : **B**. Un onboarding peut compter 10 étapes : en dense, l’écran devient un tableur ; en aérée, il faut scroller pour voir la progression. Le dashboard sera légèrement plus aéré que les listes.*

### 24. Quel fond pour les pages ?

- **A.** Blanc pur, cartes délimitées par des bordures
- **B.** Gris très clair en fond, cartes blanches qui ressortent
- **C.** Blanc partout, séparations uniquement par des traits

*Défaut : **B**. C’est ce qui donne le plus facilement une impression de produit fini, et ça met le dashboard en valeur.*

---

# Bloc H — Structure et navigation

### 25. Quelle sidebar ?

- **A.** Large et fixe, 240-260 px, icônes + libellés, toujours visible
- **B.** Compacte, icônes seules, libellé au survol
- **C.** Large mais repliable, avec mémorisation du choix

*Défaut : **A**. Le produit n’a que 6 entrées de navigation : les cacher derrière des icônes n’apporte rien et nuit à la lisibilité de la démo.*

### 26. Quelle largeur de contenu ?

- **A.** Pleine largeur — les tableaux occupent tout l’écran
- **B.** Contenue, maximum 1200-1280 px, centrée
- **C.** Mixte : listes en pleine largeur, formulaires et pages de détail contenus

*Défaut : **C**. Un formulaire de 1800 px de large est illisible, une liste de tâches bridée à 900 px gaspille l’écran.*

### 27. À quoi ressemble le haut de chaque page ?

- **A.** Titre + description courte + boutons d’action alignés à droite
- **B.** Fil d’Ariane + titre + actions
- **C.** Titre + onglets de sous-navigation + actions
- **D.** Titre seul, minimal

*Défaut : **A**, avec un fil d’Ariane uniquement sur les pages de détail (`Onboardings › Marie Dupont`), parce que c’est le seul endroit où l’on peut se perdre.*

---

# Bloc I — Composants clés du produit

*Ces quatre composants sont ceux qu’un recruteur regardera. Ils méritent une décision explicite.*

### 28. Comment se présente une tâche dans la liste ?

- **A.** Case à cocher à gauche, titre, puis responsable et échéance à droite — style liste de tâches
- **B.** Ligne de tableau avec de vraies colonnes alignées — style tableur, très lisible en comparaison
- **C.** Carte par tâche, avec avatar du responsable
- **D.** Colonnes kanban par statut

*Défaut : **A** sur la page d’un onboarding (on y coche, c’est le geste principal) et **B** sur l’écran « mes tâches » (on y compare des échéances). Le kanban est séduisant mais faux ici : les étapes sont ordonnées et datées, pas déplaçables entre colonnes.*

### 29. Comment afficher la progression d’un onboarding ?

- **A.** Barre linéaire + pourcentage
- **B.** Anneau de progression + fraction (`7/10`)
- **C.** Segments, un par étape, remplis au fur et à mesure
- **D.** Barre linéaire dans les listes, anneau sur la page de détail

*Défaut : **C** sur la page de détail — c’est le composant signature du produit, il rend visible d’un coup d’œil combien d’étapes restent et lesquelles sont en retard — et **A** dans les listes, où il faut rester compact.*

### 30. Comment afficher un statut ou un retard ?

- **A.** Pastilles pleines colorées, texte blanc dedans
- **B.** Badges à fond très clair et texte foncé de la même teinte
- **C.** Point coloré + texte en gris foncé, sans fond
- **D.** Texte seul, différencié par la couleur et la graisse

*Défaut : **C** pour les statuts courants (discret, ne surcharge pas les listes) et **B** en rouge pour le seul cas qui doit sauter aux yeux : « En retard de 3 jours ».*

### 31. Comment représenter les personnes ?

- **A.** Avatars circulaires avec initiales colorées, la couleur dérivée du nom
- **B.** Initiales dans un carré arrondi
- **C.** Nom écrit en entier, sans avatar
- **D.** Avatar + nom côte à côte

*Défaut : **A** dans les listes et les tableaux, **D** sur la page de détail et le panneau de tâche. Les avatars à initiales évitent le problème des fausses photos dans les données de démonstration.*

---

# Bloc J — Détails d’expérience

### 32. Trois décisions rapides, en une seule question

**a) Animations**
- **A.** Aucune — instantané
- **B.** Discrètes — apparitions de 150 ms, transitions de survol, panneau qui glisse
- **C.** Expressives — la progression s’animne, les tâches cochées se replient

*Défaut : **B**, avec une exception : cocher une tâche mérite une micro-animation, parce que c’est le geste central du produit et que la récompense visuelle fait partie de l’expérience. Et respect systématique de `prefers-reduced-motion`.*

**b) États vides**
- **A.** Illustration dessinée
- **B.** Grande icône + titre + une phrase + bouton d’action
- **C.** Texte seul, centré

*Défaut : **B**. Les illustrations coûtent cher en temps et vieillissent mal ; une icône bien choisie et une phrase utile suffisent. Chaque état vide proposera l’action suivante — c’est ce qui distingue un produit d’une maquette.*

**c) Ton des textes et langue**
- **A.** Interface en français, tutoiement
- **B.** Interface en français, vouvoiement
- **C.** Interface en anglais (code et UI en anglais, cohérent avec les noms de tables)
- **D.** Code en anglais, interface en français

*Défaut : **D** avec vouvoiement sobre. Le produit s’adresse à des professionnels RH ; le code reste en anglais, ce qui est la norme et ce qu’un recruteur attend. Attention : ça implique de ne jamais mélanger les deux dans un même fichier.*

---

# Bloc K — Périmètre du design system

*Ces deux questions ne portent pas sur le style mais sur ce que je vais produire.*

### 33. Que doit contenir `design-system.md` ?

- **A.** La documentation seule — principes, palette, échelles, règles d’usage
- **B.** Documentation + les tokens prêts à coller dans `globals.css` et la config Tailwind
- **C.** Documentation + tokens + exemples de code pour les composants signature (badge de statut, segments de progression, ligne de tâche, avatar)

*Défaut : **C**. C’est ce qui évite l’écart classique entre un beau document et un code qui ne le suit pas.*

### 34. Ce design system sert-il uniquement à LaunchPath ?

- **A.** LaunchPath seulement — chaque projet du portfolio aura sa propre identité
- **B.** Une base commune aux trois projets, avec une couleur primaire différente par projet
- **C.** Identité totalement partagée entre les trois projets

*Défaut : **A**. Trois produits différents avec trois identités montrent une capacité d’adaptation ; trois clones de la même interface donnent l’impression d’un unique template réutilisé. En revanche, les **principes** (densité, règles de token, méthode) seront réutilisables.*

---

# Feuille de réponses

Copie ce bloc et remplis-le. Écris `défaut` partout où tu n’as pas d’avis.

```text
Bloc A — Intention
1.
2.
3.

Bloc B — Références
4.
5.
6.

Bloc C — Marque
7.
8.
9.
10.

Bloc D — Couleur
11.
12.
13.
14.
15.

Bloc E — Thèmes
16.
17.

Bloc F — Typographie
18.
19.
20.

Bloc G — Formes
21.
22.
23.
24.

Bloc H — Structure
25.
26.
27.

Bloc I — Composants
28.
29.
30.
31.

Bloc J — Détails
32a.
32b.
32c.

Bloc K — Périmètre
33.
34.

Remarques libres :
```

---

## Les trois questions qui compteront le plus

Si tu manques de temps, réponds au moins à celles-ci — le reste peut rester en défaut sans dommage :

- **4** (tes références) — c’est ce qui m’évite de deviner
- **5** (niveau de personnalité) — c’est le curseur qui calibre tout mon travail
- **16** (clair, sombre, ou les deux) — c’est la seule réponse qui ne pourra pas être changée à moindre coût plus tard

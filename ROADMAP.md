# Deck Roulette — Roadmap

Suivi vivant du projet. Une phase = un ensemble de concepts à comprendre.
On ne passe à la suivante que quand la précédente tourne.

> **Réorientation du 29/08/2026.** Le projet était parti en Expo / React Native.
> Il devient un **monorepo web**, pour deux raisons : la stack à apprendre
> (Radix, Tailwind, Storybook, Turborepo, maplibre-gl) est une stack web, et
> l'app mobile pourra être ajoutée plus tard dans `apps/mobile` en réutilisant
> `packages/domain`. L'échafaudage Expo n'avait jamais dépassé le boilerplate.

---

## Phase 0 — Le squelette du monorepo

**Objectif pédagogique :** comprendre ce qu'un monorepo résout réellement, et pourquoi
`pnpm workspaces` et Turborepo sont deux outils distincts qui ne font pas le même travail.

- [ ] Supprimer l'échafaudage Expo (`app/`, `components/`, `hooks/`, `constants/`, `app.json`, `node_modules`)
- [ ] `pnpm-workspace.yaml` : déclarer `apps/*` et `packages/*`
- [ ] `package.json` racine : scripts qui délèguent à Turborepo, aucune dépendance applicative
- [ ] `turbo.json` : pipeline `build`, `dev`, `test`, `lint` avec ses dépendances
- [ ] TypeScript : une config de base partagée, étendue par chaque package
- [ ] ESLint (flat config) + Prettier à la racine
- [ ] Premier commit de la nouvelle structure

**Concepts :** workspace vs package · pourquoi pnpm n'aplatit pas `node_modules` ·
graphe de tâches et cache de Turborepo · dépendance interne déclarée avec `workspace:*`.

---

## Phase 1 — `packages/domain` : la logique pure

**Objectif pédagogique :** écrire du **TypeScript sérieux** sur du code sans UI —
la meilleure porte d'entrée, parce que rien ne cache les types derrière du JSX.

- [ ] Types `Deck`, `Pool`, `ColorIdentity`, `Bracket`
- [ ] `commanders` modélisé comme une liste de 1 à 2 éléments, jamais une chaîne
- [ ] Dérivation de l'identité colorée d'un deck : union des identités de ses commandants
- [ ] Fonctions pures : `drawDeck`, `resetPool`, `addDeck`, `removeDeck`, `returnDeckToPool`
- [ ] Faire respecter l'invariant `drawnDeckIds ⊆ deckIds` par le type autant que possible
- [ ] Tests Vitest, dont le cas « pool épuisé » et la suppression d'un deck présent dans plusieurs pools
- [ ] Vérifier l'uniformité réelle du tirage (attention aux biais d'un shuffle maison)
- [ ] Schéma versionné dès maintenant (`version` + fonction `migrate`), y compris pour la future entité `Match`

**Concepts :** `type` vs `interface` · unions et unions discriminées · `unknown` plutôt que `any` ·
génériques (première approche) · types utilitaires (`Omit`, `Pick`, `Readonly`) · immutabilité ·
fonction pure et testabilité sans navigateur.

---

## Phase 2 — `packages/tokens` : les design tokens

**Objectif pédagogique :** comprendre pourquoi une couleur ne s'écrit jamais dans un composant,
et ce que veut dire « source de vérité partagée avec l'UX/UI ».

- [ ] Tokens en JSON : couleurs, espacements, typo, rayons, ombres, durées d'animation
- [ ] Distinguer tokens **primitifs** (`blue-500`) et **sémantiques** (`color-surface-danger`)
- [ ] Thème clair et thème sombre définis dès le départ
- [ ] Génération des variables CSS à partir du JSON
- [ ] Brancher Tailwind 4 sur ces variables

**Concepts :** primitif vs sémantique (la distinction qui fait tout) · thématisation par
variables CSS · pourquoi le JSON plutôt qu'un fichier TS (l'UX/UI doit pouvoir le lire) ·
contraste AA vérifié dès la définition des couleurs.

---

## Phase 3 — `packages/ui` : le design system

**Objectif pédagogique :** l'atomic design appliqué pour de vrai, et la découverte de ce que
Radix apporte — et surtout de ce qu'il n'apporte pas.

- [ ] Storybook installé sur le package
- [ ] **Atomes** : Button, Input, Text, Badge, Icon
- [ ] **Molécules** : Field (label + input + erreur), DeckCard, EmptyState
- [ ] **Organismes** : DeckList, PoolCard
- [ ] Primitives Radix stylées via les tokens : Dialog, DropdownMenu, Toast, Tooltip
- [ ] Une story par composant, avec ses variantes et ses états
- [ ] Passe d'accessibilité : navigation clavier complète, focus visible, noms accessibles
- [ ] Bascule clair / sombre testée dans Storybook

**Concepts :** atomes / molécules / organismes, et où s'arrête chacun · composant *headless* ·
composition plutôt qu'une prop booléenne de plus (le piège des 15 drapeaux) · API de variantes ·
ce que Radix gère (focus trap, ARIA, clavier) et ce qu'il laisse à ta charge (tout le style).

---

## Phase 4 — `apps/web` : l'application

**Objectif pédagogique :** assembler. L'app ne contient que du routage, de la composition
et du branchement — aucune logique métier, aucun style en dur.

- [ ] Vite + React 19 + TypeScript strict
- [ ] Routage : liste des pools · détail d'un pool · bibliothèque de decks · réglages
- [ ] CRUD des decks avec formulaires validés (nom obligatoire, pas de doublon exact)
- [ ] Création et édition d'un pool, sélection des decks qui le composent
- [ ] États vides travaillés partout
- [ ] Confirmation sur les suppressions

**Concepts :** où vit l'état (le réflexe n°1 avant toute optimisation) · découpage
page / conteneur / présentation · formulaires contrôlés vs non contrôlés.

---

## Phase 5 — Zustand : l'état client

**Objectif pédagogique :** distinguer ce qui appartient à l'app de ce qui vient d'ailleurs.

- [ ] Store Zustand pour pools, decks et tirage en cours
- [ ] Middleware `persist` sur localStorage, avec `version` et `migrate`
- [ ] Sélecteurs pour éviter les re-renders inutiles
- [ ] Le store appelle `packages/domain` — il ne réimplémente aucune règle métier

**Concepts :** state client vs state serveur · sélecteur et re-render ciblé ·
sérialisation et migration de schéma · pourquoi la logique métier ne vit pas dans le store.

---

## Phase 6 — Le tirage ⭐ cœur de l'app

**Objectif pédagogique :** transformer une fonction correcte en un moment qui fait plaisir.

- [ ] Écran détail : gros bouton « Tirer un deck »
- [ ] Animation de résultat marquante, `prefers-reduced-motion` respecté
- [ ] Section « déjà sortis » consultable
- [ ] Fin de cycle : message clair, proposition de reset, jamais de reset silencieux
- [ ] Remise d'un deck dans le pool individuellement
- [ ] Résultat annoncé aux lecteurs d'écran (région live)

**Concepts :** animation accessible · région live ARIA · feedback perçu vs temps réel.

---

## Phase 7 — TanStack Query + Scryfall

**Objectif pédagogique :** le state serveur en conditions réelles — cache, fraîcheur,
erreurs, et tout ce que Zustand ne fait pas.

- [ ] Recherche de cartes via l'API Scryfall (publique, ~10 req/s, User-Agent obligatoire)
- [ ] Auto-complétion du ou des commandants à la création d'un deck (1 ou 2)
- [ ] Affichage des images de cartes et de l'identité colorée (union si deux commandants)
- [ ] `queryKey` construite correctement (tout ce qui change le résultat y figure)
- [ ] `staleTime` choisi et **justifié** (les cartes Magic ne bougent pas — cache long)
- [ ] États de chargement et d'erreur traités, erreurs catégorisées (4xx vs 5xx vs réseau)
- [ ] Réponses validées avec Zod avant d'entrer dans l'app
- [ ] Debounce sur la saisie de recherche

**Concepts :** `useQuery` / `useMutation` · `queryKey` comme identité de cache ·
`staleTime` vs `gcTime` (périmé ≠ jeté) · `invalidateQueries` · optimistic update et rollback ·
ne jamais afficher un message d'erreur brut venant du serveur.

---

## Phase 8 — Import / export JSON

- [ ] Export du fichier de sauvegarde
- [ ] Import via sélecteur de fichier
- [ ] Validation Zod du fichier importé — ne jamais faire confiance à un JSON externe
- [ ] Stratégie de conflit : fusionner ou remplacer, choix explicite de l'utilisateur
- [ ] Migration si le fichier vient d'une version antérieure du schéma

---

## Phase 9 — maplibre-gl : la carte des événements

**Objectif pédagogique :** monter une carte maplibre-gl **de zéro** — les sources, les
couches, le cycle de vie d'une lib impérative dans React, et le mode offline. Consommer
un SDK cartographique déjà configuré ne prépare pas à ça : ce sont des sujets à part entière.

Cas d'usage : les **événements Magic** — tournois récurrents des boutiques, événements
ponctuels ajoutés par les joueurs. De quoi découvrir ce qui se passe près de chez soi.
Plus crédible qu'une carte de joueurs, et ça donne des données à modéliser.

- [ ] Type `Event` (lieu, date, récurrence, format, organisateur) + validation Zod
- [ ] Carte maplibre-gl intégrée dans un composant React (cycle de vie, nettoyage)
- [ ] Marqueurs d'événements, popup au clic
- [ ] Regroupement (*clustering*) quand les points se densifient
- [ ] Mode offline : tuiles embarquées et stockage local
- [ ] Comportement dégradé propre quand le réseau tombe
- [ ] Accessibilité : la carte n'est pas la seule voie d'accès à l'information

**Concepts :** intégration d'une lib impérative dans React · sources et couches ·
tuiles vectorielles · stratégie de cache offline.

---

## Phase 10 — Qualité, CI/CD, déploiement

- [ ] Tests e2e (Playwright — voisin de Cypress, déjà connu)
- [ ] CI GitHub Actions : lint, types, tests, build, en tirant parti du cache Turborepo
- [ ] Déploiement de `apps/web` (Vercel ou Netlify)
- [ ] Storybook déployé et partageable
- [ ] Audit Lighthouse : performance et accessibilité

---

## Phase 11 — Winrate & statistiques

Après un tirage, noter le résultat de la partie → winrate par deck. Nécessite une
**troisième entité**, à ne pas bricoler dans `Deck` :

```ts
type Match = {
  id: string;
  deckId: string;        // référence la bibliothèque
  poolId?: string;       // dans quel contexte / bracket
  result: 'win' | 'loss' | 'draw';
  playedAt: string;      // ISO
  playerCount?: number;  // 4 joueurs par défaut en Commander
  notes?: string;
};
```

- [ ] Saisie du résultat après un tirage (3 boutons, rapide, skippable)
- [ ] Winrate par deck, par pool, par période
- [ ] Écran stats : deck le plus joué, le plus gagnant, celui qu'on ne sort jamais
- [ ] Petits échantillons : ne pas afficher « 100 % » sur une seule partie

---

## Phase 12 — `apps/mobile` (plus tard)

Le retour d'Expo, une fois le web stabilisé. `packages/domain` est réutilisé tel quel :
c'est toute la raison d'être du monorepo.

- [ ] Expo dans `apps/mobile`, en vérifiant **d'abord** le SDK supporté par Expo Go
- [ ] `packages/domain` consommé sans modification
- [ ] Persistance via AsyncStorage plutôt que localStorage
- [ ] UI native — `packages/ui` n'est **pas** réutilisable (Radix et Tailwind sont web)

> 🩹 **Incident Expo, pour mémoire (août 2026).** Projet généré en SDK 57, refusé par
> Expo Go bloqué en SDK 54 : « project is incompatible with this version of Expo Go ».
> Pas un problème d'iOS. Leçon : avec Expo Go, **c'est Expo Go qui dicte le SDK**.
> Vérifier la version supportée *avant* de générer le projet.

---

## Idées en vrac (non priorisées)

- Historique des tirages (qui a joué quoi, quand)
- Mode « table » : tirer un deck pour chaque joueur d'un coup, sans doublon
- Contrainte d'accord de brackets à la table
- Import d'une decklist depuis une URL (Archidekt — pas Moxfield, pas d'API publique)
- PWA installable sur le téléphone, en attendant l'app native

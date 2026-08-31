---
name: deck-roulette
description: Conventions, architecture et roadmap du projet Deck Roulette (monorepo web React/TypeScript de tirage aléatoire de decks Magic the Gathering, doublé d'un programme d'apprentissage de la stack front 2026). À charger avant toute tâche de code, de design ou de décision technique sur ce projet.
---

# Deck Roulette — guide du projet

App web qui tire au sort un deck Magic: The Gathering parmi une liste, sans jamais
retirer deux fois le même tant que la liste n'est pas épuisée.

> Un fichier `.claude/LEARNING.local.md` (non versionné) complète ce guide avec le contexte
> personnel et les objectifs d'apprentissage. Le charger aussi s'il est présent.

## Principes de travail

- **Une étape = un concept.** Ne jamais générer dix fichiers d'un coup.
- À chaque choix : expliquer *pourquoi*, quelles alternatives, quel piège on évite.
- Ce projet est autant un support d'apprentissage qu'un produit. Quand une décision oppose
  « le plus rapide à livrer » et « celui qui fait comprendre », **choisir le second**.
  On n'installe pas une lib pour éviter de comprendre un problème.
- Tutoiement. Challenger les idées discutables plutôt que d'acquiescer.

## Décisions actées (ne pas re-débattre sans raison)

| Sujet | Choix | Pourquoi |
|---|---|---|
| Cible | **Web d'abord**, mobile plus tard | La stack à apprendre (Radix, Tailwind, Storybook, maplibre-gl) est une stack web. React Native viendra dans `apps/mobile` en réutilisant `packages/domain`. |
| Structure | **Monorepo pnpm workspaces + Turborepo** | Justifié par le partage réel du domaine entre web et mobile, et par l'extraction du design system en package. Pas un exercice artificiel. |
| Package manager | **pnpm** | Dépendances déclarées et isolées par package, pas de hoisting sauvage. |
| Build app | **Vite + React 19 + TypeScript strict** | Standard 2026. |
| Styling | **Tailwind 4 + design tokens** | Les tokens sont la source de vérité, Tailwind les consomme. Jamais de valeur en dur dans un composant. |
| Primitives UI | **Radix** | Comportement et accessibilité fournis, style entièrement à nous via les tokens. |
| Documentation UI | **Storybook**, découpage **atomic design** | Une story par composant, dès sa création. |
| État client | **Zustand** + `persist` sur localStorage | Ce qui appartient à l'app : pools, decks, tirage en cours. |
| État serveur | **TanStack Query** | Ce qui vient d'ailleurs : Scryfall. Ne jamais mettre de données serveur dans Zustand. |
| Cartographie | **maplibre-gl** | Carte des événements Magic. La lib est montée de zéro : sources, couches, cycle de vie dans React, offline. |
| Tests | **Vitest** + Testing Library | `packages/domain` testé en priorité — logique pure, aucun pixel. |
| Validation externe | **Zod** | Tout JSON venant du dehors (import de fichier, réponse Scryfall) est validé. |

### Décisions abandonnées (pour mémoire)

Le projet a d'abord été démarré en **Expo / React Native SDK 54** (août 2026), avec
expo-router, AsyncStorage et StyleSheet natif. Abandonné en faveur du web : Radix,
Tailwind, Storybook et maplibre-gl n'y ont pas d'équivalent direct, or ce sont
précisément les sujets à apprendre. L'échafaudage Expo n'a jamais dépassé le boilerplate.

## Architecture cible

```
deck-roulette/
├── apps/
│   ├── web/                  # React + Vite — l'app
│   └── mobile/               # Expo — plus tard, réutilise packages/domain
├── packages/
│   ├── domain/               # types + logique pure. ZÉRO import React, zéro storage
│   ├── ui/                   # design system : tokens, primitives Radix, Storybook
│   └── tokens/               # design tokens en JSON, source de vérité UX/UI
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

**Règle d'or** : si une fonction de `packages/domain` importe React, un store ou une API,
elle est au mauvais endroit. Le domaine est pur, testable sans navigateur.

## Modèle de données

Decks et pools sont **séparés** : un même deck peut appartenir à plusieurs pools
(ex. un deck bracket 2 présent dans « Soirée chill » et « Table du jeudi »).

```ts
type Deck = {
  id: string;               // crypto.randomUUID()
  name: string;
  commanders?: string[];    // 1 ou 2 — voir note ci-dessous
  colors?: ColorIdentity[]; // 'W' | 'U' | 'B' | 'R' | 'G' | 'C'
  bracket?: 1 | 2 | 3 | 4 | 5; // brackets officiels Commander
  url?: string;             // Moxfield / Archidekt — futur
  createdAt: string;        // ISO
};

type Pool = {
  id: string;
  name: string;
  deckIds: string[];
  drawnDeckIds: string[];   // sous-ensemble de deckIds déjà sortis ce cycle
  createdAt: string;
};
```

**Deux commandants sont possibles.** Le format autorise plusieurs cas de commandement
partagé (Partner, Partner With, Friends Forever, Choose a Background, Doctor's companion).
Le champ est donc une **liste de 1 à 2 éléments**, jamais une chaîne unique — c'est le
genre de raccourci qu'on paie cher trois phases plus tard. L'identité colorée d'un deck
à deux commandants est l'**union** de leurs identités.

**Invariant central** : `drawnDeckIds ⊆ deckIds`. Toute suppression de deck doit nettoyer
les deux tableaux dans tous les pools. C'est le bug n°1 qui guette ce projet.

**Règle de tirage** : piocher uniformément dans `deckIds \ drawnDeckIds`.
Si l'ensemble est vide → cycle terminé, on propose le reset (on ne reset **pas** en silence :
l'utilisateur doit savoir qu'un tour complet vient de s'achever).

**Ne jamais stocker `wins`/`losses` comme compteurs sur `Deck`** : on perd l'historique,
on ne peut plus filtrer par période ni corriger une saisie. Les compteurs se dérivent
d'une entité `Match` séparée (voir ROADMAP phase 8), à prévoir dès le versionnage du schéma.

## Règles de qualité non négociables

- **TypeScript strict, jamais de `any`.** Quand le type est réellement inconnu (JSON externe),
  c'est `unknown` puis un narrowing — ou Zod.
- **Design tokens d'abord.** Aucune couleur, aucun espacement en dur dans un composant.
  Rétro-ajouter des tokens coûte 10× plus cher que les poser au départ.
- **Une story Storybook par composant**, écrite en même temps que le composant, pas après.
- **Accessibilité** : Radix fournit le comportement, pas le reste. Chaque interactif a un
  nom accessible explicite (« Tirer un deck au hasard », pas « bouton »), cible ≥ 44×44 px,
  navigation clavier complète, focus visible et géré à l'ouverture des dialogues.
  Contraste AA minimum. Le résultat d'un tirage doit être annoncé aux lecteurs d'écran
  (région live). Niveau d'exigence visé : celui du RGAA.
- **Dark mode dès le départ**, via les tokens. Le rétrofitter coûte 10× plus cher.
- **États vides** travaillés et actionnables sur chaque écran, jamais une page blanche.
- **Confirmation explicite** sur toute action destructive (suppression de deck ou de pool).
- **Feedback** : le tirage est le cœur de l'app. Animation + résultat marquant, en
  respectant `prefers-reduced-motion`.
- **Validation de tout JSON externe avec Zod.** Ne jamais faire confiance à un fichier importé
  ni à une réponse d'API.

## Roadmap

Voir `ROADMAP.md` à la racine — fichier de suivi vivant. Cases à cocher et notes à mettre
à jour à la fin de chaque phase, y compris les incidents rencontrés et leur résolution.

## Contexte métier Magic

- **Commander / EDH** : format 100 cartes, singleton. Seul format visé.
- **Un ou deux commandants.** Le cas à deux existe bel et bien (Partner, Partner With,
  Friends Forever, Choose a Background, Doctor's companion). Le modèle de données doit
  le prévoir dès le départ.
- **Brackets** : échelle officielle 1–5 de puissance/intention de jeu (1 = ultra casual,
  4 = optimisé, 5 = cEDH). Sert à taguer les pools pour accorder les niveaux à la table.
- **Moxfield n'a pas d'API publique ouverte.** L'import d'URL devra passer par Archidekt
  (API publique) ou **Scryfall** (API cartes, publique et gratuite, rate limit ~10 req/s,
  User-Agent obligatoire, pas de clé). Ne pas promettre Moxfield.
- **Scryfall sera appelé de toute façon**, indépendamment de l'import d'URL : c'est la
  source des images et de l'identité colorée des commandants. C'est donc l'API qui porte
  l'apprentissage de TanStack Query, et elle n'est conditionnée à rien.

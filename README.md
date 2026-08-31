# Deck Roulette

Application web qui tire au sort un deck **Magic: The Gathering** parmi une liste, sans
jamais ressortir le même tant que la liste n'est pas épuisée. Pensée pour les tables de
Commander, où le choix du deck prend souvent plus de temps que la partie.

## État

Projet en cours de construction. Voir [`ROADMAP.md`](./ROADMAP.md) pour le détail des phases.

## Stack

| | |
|---|---|
| Langage | TypeScript strict |
| App | React 19 + Vite |
| Monorepo | pnpm workspaces + Turborepo |
| Style | Tailwind 4, pilotée par des design tokens |
| Composants | Radix (primitives non stylées) + Storybook, découpage atomic design |
| État client | Zustand |
| État serveur | TanStack Query (API [Scryfall](https://scryfall.com/docs/api)) |
| Validation | Zod |
| Cartographie | maplibre-gl |
| Tests | Vitest, Playwright |

## Structure

```
apps/
  web/          # l'application
packages/
  domain/       # types et logique pure — zéro dépendance UI
  tokens/       # design tokens (JSON), source de vérité partagée avec l'UX/UI
  ui/           # design system : primitives Radix stylées, Storybook
  tsconfig/     # configuration TypeScript partagée
```

La logique métier vit dans `packages/domain`, sans React ni stockage : elle est testable
sans navigateur, et réutilisable telle quelle par une future application mobile.

## Développement

```bash
pnpm install
pnpm dev
```

Node 22+ et pnpm 10 (via Corepack) requis.

/**
 * Les cinq couleurs de Magic, plus l'incolore.
 * W = White, U = Blue, B = Black, R = Red, G = Green, C = Colorless.
 */
export type Color = "W" | "U" | "B" | "R" | "G" | "C";

/** L'identité colorée d'un deck : l'ensemble des couleurs de son ou ses commandants. */
export type ColorIdentity = readonly Color[];

/**
 * Échelle officielle de puissance du format Commander.
 * 1 = ultra casual, 4 = optimisé, 5 = cEDH.
 */
export type Bracket = 1 | 2 | 3 | 4 | 5;

/**
 * Un ou deux commandants — jamais zéro, jamais trois.
 * Le cas à deux existe réellement (Partner, Partner With, Friends Forever,
 * Choose a Background, Doctor's companion).
 */
export type Commanders = readonly [string] | readonly [string, string];

export type Deck = {
  readonly id: string;
  readonly name: string;
  readonly commanders?: Commanders;
  readonly colors?: ColorIdentity;
  readonly bracket?: Bracket;
  /** Lien Moxfield / Archidekt, purement informatif. */
  readonly url?: string;
  /** Date ISO 8601. */
  readonly createdAt: string;
};

/**
 * Un ensemble de decks parmi lesquels on tire.
 *
 * Invariant : `drawnDeckIds` est toujours un sous-ensemble de `deckIds`.
 * Toute suppression d'un deck doit nettoyer les deux listes.
 */
export type Pool = {
  readonly id: string;
  readonly name: string;
  readonly deckIds: readonly string[];
  /** Les decks déjà sortis pendant le cycle en cours. */
  readonly drawnDeckIds: readonly string[];
  readonly createdAt: string;
};

import type { Library } from "./library";

/**
 * The shape of the current code. Bumped whenever the persisted shape changes,
 * together with a migration from the previous number.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/** What actually gets written to storage: the library, plus its version stamp. */
export type PersistedLibrary = Library & {
  readonly version: number;
};

/**
 * Upgrades data from one version to the next.
 *
 * Takes and returns `unknown` on purpose: a migration works on a shape that no
 * longer exists in the code (the old one) and produces one that is not the
 * current shape either (just the next step). Typing it with today's `Library`
 * would be a lie, and would break the day the shape changes again.
 */
export type Migration = (data: unknown) => unknown;

/**
 * Indexed by the version each step upgrades **from**: `migrations[1]` turns
 * version 1 data into version 2 data.
 *
 * Empty for now — version 1 is the first one. A published migration is never
 * edited afterwards: code in production has already written data with it, and
 * rewriting it would rewrite the history of data already migrated. A wrong
 * migration is fixed by adding the next one, never by changing it.
 */
export const migrations: Readonly<Record<number, Migration>> = {};

/** Stamps a library with the current version, ready to be stored. */
export function toPersisted(library: Library): PersistedLibrary {
  return { ...library, version: CURRENT_SCHEMA_VERSION };
}

/**
 * Runs every migration step between two versions, in order.
 *
 * `steps` is a parameter rather than a direct reference to `migrations`, so the
 * chaining itself can be tested without waiting for a real second version.
 */
export function applyMigrations(
  data: unknown,
  fromVersion: number,
  toVersion: number,
  steps: Readonly<Record<number, Migration>> = migrations,
): unknown {
  let current = data;

  for (let version = fromVersion; version < toVersion; version++) {
    const step = steps[version];

    if (step === undefined) {
      throw new RangeError(`no migration from version ${version} to ${version + 1}`);
    }

    current = step(current);
  }

  return current;
}

/** Narrows `unknown` down to something with readable properties. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Turns whatever was found in storage into a usable library.
 *
 * The parameter is `unknown` and not `Library`: this data comes from outside the
 * program — localStorage, an imported file — and nothing guarantees it is what
 * we expect. Typing it `Library` would be a promise the compiler cannot keep.
 *
 * Structural checks are kept minimal here; Zod will validate the contents in
 * phase 8. Migrating and validating are two different problems: "this data is
 * old" and "this data is corrupt".
 */
export function readPersisted(raw: unknown): Library {
  if (!isRecord(raw)) {
    throw new TypeError("stored data is not an object");
  }

  const version = raw["version"];

  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    throw new TypeError("stored data carries no usable schema version");
  }

  if (version > CURRENT_SCHEMA_VERSION) {
    // Written by a newer build — another tab, or a browser that cached an older
    // bundle. Guessing would silently destroy fields this code knows nothing
    // about, so refuse instead.
    throw new RangeError(
      `stored data is version ${version}, this build only understands ${CURRENT_SCHEMA_VERSION}`,
    );
  }

  const migrated = applyMigrations(raw, version, CURRENT_SCHEMA_VERSION);

  if (!isRecord(migrated) || !Array.isArray(migrated["decks"]) || !Array.isArray(migrated["pools"])) {
    throw new TypeError("stored data has no decks or no pools");
  }

  return { decks: migrated["decks"], pools: migrated["pools"] };
}

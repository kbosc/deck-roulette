import type { Library } from "./library";

/** Bump it with every change to the persisted shape, along with a migration. */
export const CURRENT_SCHEMA_VERSION = 1;

export type PersistedLibrary = Library & {
  readonly version: number;
};

/** `unknown` on purpose: neither the old shape nor the next one is today's `Library`. */
export type Migration = (data: unknown) => unknown;

/**
 * Indexed by the version upgraded **from**: `migrations[1]` turns v1 into v2.
 * Never edit a published migration: fix it by adding the next one.
 */
export const migrations: Readonly<Record<number, Migration>> = {};

export function toPersisted(library: Library): PersistedLibrary {
  return { ...library, version: CURRENT_SCHEMA_VERSION };
}

/** `steps` is a parameter so that the chaining can be tested before a real v2 exists. */
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Minimal structural checks only: validating the contents is Zod's job (phase 8). */
export function readPersisted(raw: unknown): Library {
  if (!isRecord(raw)) {
    throw new TypeError("stored data is not an object");
  }

  const version = raw["version"];

  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    throw new TypeError("stored data carries no usable schema version");
  }

  if (version > CURRENT_SCHEMA_VERSION) {
    // Written by a newer build: guessing would destroy fields this code does not know.
    throw new RangeError(
      `stored data is version ${version}, this build only understands ${CURRENT_SCHEMA_VERSION}`,
    );
  }

  const migrated = applyMigrations(raw, version, CURRENT_SCHEMA_VERSION);

  if (
    !isRecord(migrated) ||
    !Array.isArray(migrated["decks"]) ||
    !Array.isArray(migrated["pools"])
  ) {
    throw new TypeError("stored data has no decks or no pools");
  }

  return { decks: migrated["decks"], pools: migrated["pools"] };
}

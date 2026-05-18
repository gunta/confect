/**
 * Thin Effect-wrappers around Node's `fs/promises` so the Confect CLI can
 * stay agnostic of which platform layer ships with Effect 4.
 *
 * Effect 4 removed `@effect/platform-node`'s `NodeFileSystem.layer`; a v4
 * replacement under `effect/unstable/*` has not landed yet. The CLI's needs
 * are small (read/write/exists/mkdir/readdir/stat), so we bypass the
 * `FileSystem` service entirely here.
 */
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as fs from "node:fs/promises";

export class FsError extends Schema.TaggedErrorClass<FsError>()("FsError", {
  op: Schema.String,
  path: Schema.String,
  message: Schema.String,
}) {}

const wrap = <A>(
  op: string,
  path: string,
  thunk: () => Promise<A>,
): Effect.Effect<A, FsError> =>
  Effect.tryPromise({
    try: thunk,
    catch: (error) =>
      new FsError({
        op,
        path,
        message: error instanceof Error ? error.message : String(error),
      }),
  });

export const exists = (path: string): Effect.Effect<boolean> =>
  Effect.promise(() =>
    fs
      .access(path)
      .then(() => true)
      .catch(() => false),
  );

export const readFileString = (
  path: string,
  encoding: BufferEncoding = "utf8",
): Effect.Effect<string, FsError> =>
  wrap("readFileString", path, () => fs.readFile(path, { encoding }));

export const writeFileString = (
  path: string,
  contents: string,
): Effect.Effect<void, FsError> =>
  wrap("writeFileString", path, () => fs.writeFile(path, contents, "utf8"));

export const makeDirectory = (
  path: string,
  options?: { recursive?: boolean },
): Effect.Effect<void, FsError> =>
  wrap("makeDirectory", path, () =>
    fs.mkdir(path, { recursive: options?.recursive ?? true }).then(() => undefined),
  );

export const readDirectory = (
  path: string,
): Effect.Effect<ReadonlyArray<string>, FsError> =>
  wrap("readDirectory", path, () => fs.readdir(path));

export const stat = (path: string): Effect.Effect<{
  readonly isFile: boolean;
  readonly isDirectory: boolean;
}, FsError> =>
  wrap("stat", path, async () => {
    const s = await fs.stat(path);
    return { isFile: s.isFile(), isDirectory: s.isDirectory() };
  });

export const remove = (
  path: string,
  options?: { recursive?: boolean; force?: boolean },
): Effect.Effect<void, FsError> =>
  wrap("remove", path, () =>
    fs.rm(path, {
      recursive: options?.recursive ?? false,
      force: options?.force ?? false,
    }),
  );

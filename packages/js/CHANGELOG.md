# @confect/js

## 8.0.0-effect4.0

### Major Changes

- 9ea1951: Migrate from Effect 3.21 to Effect 4.0.0-beta.67

  **Breaking — peer dep**: All packages now require `effect@4.0.0-beta.67`. Old
  companion packages (`@effect/platform`, `@effect/platform-node`,
  `@effect/cluster`, `@effect/experimental`, `@effect/rpc`, `@effect/sql`,
  `@effect/workflow`, `@effect/vitest`) are no longer needed for these packages —
  their surface folded into `effect/unstable/*` in v4.

  ### Key API migrations applied

  **Schema:**
  - `Schema.Schema<A, I>` (2 generics) → `Schema.Codec<A, I, never, never>` (4
    generics, the latter two for DecodingServices/EncodingServices).
  - `Schema.Schema.AnyNoContext` → `Schema.Codec<any, any, never, never>`.
  - `Schema.encodedSchema(s).ast` → `Schema.toEncoded(s).ast`;
    `Schema.typeSchema(s)` → `Schema.toType(s)`.
  - `Schema.annotations({...})` → `Schema.annotate({...})`.
  - `Schema.encode(s)(x)` → `Schema.encodeEffect(s)(x)`;
    `Schema.decode(s)(x)` → `Schema.decodeEffect(s)(x)`.
  - `Schema.optionalWith(s, { exact: true })` → `Schema.optionalKey(s)`.
  - `Schema.extend(a, b)` removed → `a.pipe(Schema.fieldsAssign(b.fields))`.
  - Variadic `Schema.Union(a, b, c)` → array form `Schema.Union([a, b, c])`.
  - `Schema.TaggedError` → `Schema.TaggedErrorClass`.
  - `ParseResult.ParseError` → `Schema.SchemaError` (and the `ParseResult`
    module is no longer exported from `effect`).

  **SchemaAST:**
  - `TypeLiteral` → `Objects`, `TupleType` → `Arrays`.
  - All `*Keyword` tags collapsed to bare names (`StringKeyword` → `String`,
    `NumberKeyword` → `Number`, etc.).
  - `Enums` → `Enum`.
  - `SchemaAST.isUndefinedKeyword` → `SchemaAST.isUndefined`.
  - Annotation lookup: `SchemaAST.getAnnotation<T>(key)(ast)` (returning
    `Option`) → `Option.fromNullishOr(SchemaAST.resolveAt<T>(key)(ast))`. Note
    that annotation keys must be strings now, not Symbols. The internal
    ConvexId annotation key changed from `Symbol.for("ConvexId")` to
    `"@confect/core/ConvexId"`.

  **Effect/Stream/Layer/Result:**
  - `Context.GenericTag` → `Context.Service` (and `Effect.Tag` class blocks →
    `Context.Service<Self, Shape>()(name)` two-stage form).
  - `Effect.Effect.Success<T>` → `Effect.Success<T>`.
  - `Effect.either(eff)` → `Effect.result(eff)`.
  - `Effect.catchTag("ParseError", ...)` → `Effect.catchTag("SchemaError", ...)`.
  - `Effect.catchAll` removed → `Effect.matchEffect({ onFailure, onSuccess })`.
  - `Effect.withClock(clock)` → `Effect.provideService(Clock.Clock, clock)`.
  - `Effect.dieMessage` → `Effect.die`.
  - `Layer.scoped` → `Layer.effect` (v4 auto-manages Scope).
  - `Layer.setConfigProvider(p)` →
    `Layer.succeed(ConfigProvider.ConfigProvider, p)`.
  - `Layer.map(layer, f)` → `Layer.effect(tag, Effect.map(Effect.service(oldTag), f)).pipe(Layer.provide(layer))`.
  - `Stream.unwrapScoped(eff)` → `Stream.unwrap(eff)` (v4 handles scope in
    the type).
  - `Stream.{asyncScoped, async, asyncEffect, asyncPush}` → unified
    `Stream.callback((queue) => Effect)` using `Queue.offerUnsafe(queue, x)`
    and `Queue.failCauseUnsafe(queue, Cause.fail(e))`.
  - `Stream.runCollect` now returns `Array<A>` directly (was `Chunk<A>` in v3).
  - `Either` module renamed to `Result`; `Either.getOrThrow` →
    `Result.getOrThrow`; `Either.match({onLeft, onRight})` →
    `Result.match({onFailure, onSuccess})`.
  - `Option.fromNullable` → `Option.fromNullishOr`.
  - `Hash.cached(this, value)` removed → inline `Hash.combine(...)` without
    caching.
  - `Order.number` → `Order.Number`.
  - `Schema.URL` (was string-accepting in v3) → `Schema.URLFromString` (v4
    `Schema.URL` is `instanceOf<globalThis.URL>`).
  - `Ref.unsafeMake` → `Ref.makeUnsafe`.
  - `Array.isEmptyReadonlyArray` removed → use `arr.length === 0`.

  **ConvexConfigProvider:** rewritten. v3 used `ConfigError` + `ConfigProvider.makeFlat` + `ConfigProviderPathPatch` (all removed in v4). v4's `ConfigProvider.fromEnv({ env })` is much simpler; pass an explicit env snapshot to side-step [effect-smol#2143](https://github.com/Effect-TS/effect-smol/issues/2143) (Convex bundler can't analyze `import.meta.env`).

  **HttpApi:** moved to Effect 4's `HttpRouter.toWebHandler` /
  `HttpRouter.layer` runtime surface. `HttpApi.make` entries now carry both the
  `api` value and `apiLive` layer so Confect can register HTTP API routes and
  mount Scalar docs through the typed Effect 4 `HttpApiScalar.layer(api, options)`
  shape.

  ### Notes
  - `@confect/cli` is included in the Effect 4 prerelease and uses local Node
    shims for filesystem/path/child-process operations.
  - `apps/example` is included and builds against the Effect 4 package outputs.
  - Test suites have been swept for Effect 4 runtime and type-test compatibility.

### Minor Changes

- 4bb2722: Bump Effect ecosystem to latest. `@effect/platform` is now `^0.96.1` and `@effect/platform-node` is now `^0.106.0` in `@confect/server`'s peer dependencies; `effect` peer is now `^3.21.2` across packages. Consumers must upgrade `@effect/platform`, `@effect/platform-node`, and `effect` in lockstep when bumping `@confect/server`.
- 9ea1951: Bump Convex peer to `^1.39.0` and `convex-test` to `^0.0.53`

  **Peer dep change** — `convex` peer is now `^1.39.0` (was `^1.30.0`). Consumers
  must upgrade their `convex` to 1.39+.

  What's new in Convex since 1.30 that affects confect users:
  - **1.31 — explicit-table-id `db.get(table, id)`**: 4-arg variants of
    `db.{get, patch, replace, delete}` now accept an explicit table name. The
    old 1-arg form still works but is soft-deprecated. Confect's
    `DatabaseReader`/`DatabaseWriter` continue to pass-through to native APIs.
  - **1.32 — paginate row/byte limits**: `PaginationOptions.maximumRowsRead`
    and `maximumBytesRead` for fine-grained read-limit control. Already wired
    through confect's paginate wrapper.
  - **1.32 — pagination filter callback**: `OrderedQuery.paginate(opts, filter)`
    accepts a filter function (already supported by confect's `paginate`).
  - **1.36 — `ctx.meta`**: `getFunctionMetadata`, `getTransactionMetrics`.
    **1.37**: `getDeploymentMetadata`. **1.38**: `getRequestMetadata`. Exposed
    as `QueryMeta`, `MutationMeta`, and `ActionMeta` Effect services.
  - **1.39 — typed env vars in `defineApp`/`defineComponent`**: exposed through
    `ConvexConfigProvider.fromApp` / `fromComponent` key-safe `Config` helpers.

  `convex-test` jumped 0.0.41 → ^0.0.53 (12 patch versions). Two breaking
  changes between:
  - **0.0.45**: replaced global state with `AsyncLocalStorage`-scoped state.
    `TestConvex<SpecificSchema>` now supports union types in inline calls.
  - **0.0.47**: isolated function-stack tracking between parallel calls
    (component module resolution).

  Additional fixes picked up: 0.0.46 macrotask-queue scheduling, 0.0.49
  ID format normalization, 0.0.50 `ConvexError` deserialization in nested
  function calls, 0.0.48/0.0.52 `ctx.meta.*` stubs.

### Patch Changes

- 40c1cff: Switch sibling `@confect/*` peer-dependency specifiers from `workspace:*` to `workspace:^`. Published peer ranges are now caret-based (e.g. `^7.0.0`) instead of exact-pinned, so non-major upgrades of one `@confect/*` package no longer fall out of range for its peer dependents.

  Paired with the Changesets `onlyUpdatePeerDependentsWhenOutOfRange` flag, this prevents the entire `@confect/*` family from being promoted to a major bump on every release when only minor/patch changes are present.

  `@confect/cli` additionally moves `@effect/platform` from `peerDependencies` to `dependencies`, since the CLI consumes it as an internal implementation detail (for `FileSystem`/`Path`) rather than exposing it in its public API. Consumers no longer need to install `@effect/platform` themselves to use the CLI.

- Updated dependencies [4bb2722]
- Updated dependencies [9ea1951]
- Updated dependencies [9ea1951]
- Updated dependencies [40c1cff]
  - @confect/core@8.0.0-effect4.0

## 7.0.0

### Minor Changes

- 90094d0: Add typed errors to Confect functions (queries, mutations, and actions). Declare an optional `error` schema in `FunctionSpec` and recover it as a typed value at every call site—`useQuery`, `useMutation`, `useAction`, `HttpClient`, `WebSocketClient`, and `TestConfect`—without paying for it on functions that don't fail.

  Typed errors travel across the function boundary as Convex's native [`ConvexError`](https://docs.convex.dev/functions/error-handling/application-errors#throwing-application-errors): the encoded error sits in `ConvexError.data`, leaving the `returns` channel unsullied and preserving native Convex semantics for non-Confect callers of the same API.

  ### Authoring a function with typed errors

  `FunctionSpec` constructors now accept an optional `error` schema. To support multiple error shapes, combine them with `Schema.Union`.

  ```ts
  import { FunctionSpec, GenericId, GroupSpec } from "@confect/core";
  import { Schema } from "effect";

  export class NoteNotFound extends Schema.TaggedError<NoteNotFound>()(
    "NoteNotFound",
    { noteId: GenericId.GenericId("notes") },
  ) {}

  export const notes = GroupSpec.make("notes").addFunction(
    FunctionSpec.publicQuery({
      name: "getOrFail",
      args: Schema.Struct({ noteId: GenericId.GenericId("notes") }),
      returns: Notes.Doc,
      error: NoteNotFound,
    }),
  );
  ```

  The `FunctionImpl` for that ref can now `Effect.fail` (or `mapError` to) any value matching the declared schema. Whichever invocation path the caller takes—`useQuery`/`useMutation`/`useAction`, `HttpClient`, `WebSocketClient`, or `TestConfect`—Confect encodes the failure, transports it via `ConvexError`, and surfaces the decoded value in the appropriate channel for that call site.

  ```ts
  import { FunctionImpl } from "@confect/server";
  import { Effect } from "effect";
  import api from "../_generated/api";
  import { DatabaseReader } from "../_generated/services";
  import { NoteNotFound } from "./notes.spec";

  const getOrFail = FunctionImpl.make(api, "notes", "getOrFail", ({ noteId }) =>
    Effect.gen(function* () {
      const reader = yield* DatabaseReader;
      return yield* reader
        .table("notes")
        .get(noteId)
        .pipe(Effect.mapError(() => new NoteNotFound({ noteId })));
    }),
  );
  ```

  ### Consuming a typed error

  `@confect/js` (`HttpClient`, `WebSocketClient`) and `@confect/test` (`TestConfect`) surface the decoded error in the `Effect` error channel alongside the existing `HttpClientError`/`WebSocketClientError`/`ParseError`:

  ```ts
  HttpClient.query(refs.public.notes.getOrFail, { noteId });
  // Effect.Effect<Note, NoteNotFound | HttpClientError | ParseError>
  ```

  ### `@confect/react`—breaking changes

  `useQuery`, `useMutation`, and `useAction` now expose typed errors, and `useQuery` returns a tagged result type instead of `Returns | undefined`.

  **`useQuery` now returns `QueryResult<A, E>`.** Loading and (when an `error` schema is declared) failure are reified as variants alongside success. Match on the result with `QueryResult.match`:

  Before:

  ```tsx
  const notes = useQuery(refs.public.notes.list, {});
  if (notes === undefined) return <p>Loading…</p>;
  return <NoteList notes={notes} />;
  ```

  After:

  ```tsx
  import { QueryResult, useQuery } from "@confect/react";

  const notes = useQuery(refs.public.notes.list, {});
  return QueryResult.match(notes, {
    onLoading: (skipped) => (skipped ? null : <p>Loading…</p>),
    onSuccess: (notes) => <NoteList notes={notes} />,
  });
  ```

  The `Loading` variant carries a `skipped: boolean` flag, exposed as the argument to `onLoading`. It distinguishes a query that is genuinely in flight (`skipped: false`) from one that is sitting idle because `"skip"` was passed as its args (`skipped: true`)—a distinction `convex/react`'s plain `undefined` return value cannot make. Use it to render a loading indicator only when work is actually happening, and an empty/placeholder state otherwise.

  When the ref declares an `error` schema, `onFailure` becomes required and receives the decoded typed error:

  ```tsx
  const lookup = useQuery(refs.public.notes.getOrFail, { noteId });
  QueryResult.match(lookup, {
    onLoading: (skipped) => (skipped ? null : "Looking up…"),
    onSuccess: (note) => `Found: ${note.text}`,
    onFailure: (error) => `Note ${error.noteId} not found.`,
  });
  ```

  `QueryResult` is a Confect-native type exported from `@confect/react`.

  **`useMutation` and `useAction` return `Promise<Either<A, E>>` when the ref declares an `error` schema.** Refs without an `error` schema continue to resolve to `Promise<A>`, matching the prior shape and `convex/react`'s behavior.

  ```ts
  const deleteOrFail = useMutation(refs.public.notes.deleteOrFail);
  const result = await deleteOrFail({ noteId });
  // Either.Either<null, NoteNotFound | Forbidden>
  Either.match(result, {
    onLeft: (error) => /* typed error */,
    onRight: (value) => /* success */,
  });

  const deleteNote = useMutation(refs.public.notes.delete_); // no `error` schema
  await deleteNote({ noteId }); // Promise<null>, as before
  ```

  Unspecified failures continue to reject the promise.

  ### Migration
  - For each `useQuery` call site, replace `result === undefined` checks and direct property access with `QueryResult.match` (or the lower-level `QueryResult.isLoading`/`isSuccess`/`isFailure` predicates).
  - For each `useMutation`/`useAction` call site whose ref now declares an `error` schema, unwrap the resolved `Either` (e.g. with `Either.match`); call sites against refs without an `error` schema need no change.

### Patch Changes

- Updated dependencies [90094d0]
  - @confect/core@7.0.0

## 6.0.0

### Patch Changes

- df95ce7: Add `Ref.OptionalArgs` type utility to `@confect/core` for conditionally optional function args. `QueryRunner`, `MutationRunner`, and `ActionRunner` now accept optional args for no-arg Confect functions. `useQuery`, `useMutation`, and `useAction` now accept optional args for no-arg Confect functions. `TestConfect` `query`/`mutation`/`action` helpers now accept optional args for no-arg Confect functions.
- Updated dependencies [df95ce7]
- Updated dependencies [a8083e8]
  - @confect/core@6.0.0

## 5.0.0

### Minor Changes

- fb17b7e: Add `WebSocketClient`, a WebSocket-based client wrapping Convex's `ConvexClient`. Provides the same `query`, `mutation`, and `action` methods as `HttpClient`, plus `reactiveQuery` which returns a `Stream` of live query results.

### Patch Changes

- 2c4b0c9: Fix `HttpClient` to only accept public `Ref`s

  `HttpClient` query, mutation, and action methods now correctly reject internal `Ref`s at the type level, matching the runtime behavior of Convex browser clients which can only call public functions.
  - @confect/core@5.0.0

## 4.0.0

### Minor Changes

- dbefea8: Add `HttpClient`, an Effect service wrapping Convex's `ConvexHttpClient` with automatic schema encoding and decoding. Works in any JavaScript runtime that supports `fetch`.

### Patch Changes

- @confect/core@4.0.0

# @confect/cli

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
- 40c1cff: Switch sibling `@confect/*` peer-dependency specifiers from `workspace:*` to `workspace:^`. Published peer ranges are now caret-based (e.g. `^7.0.0`) instead of exact-pinned, so non-major upgrades of one `@confect/*` package no longer fall out of range for its peer dependents.

  Paired with the Changesets `onlyUpdatePeerDependentsWhenOutOfRange` flag, this prevents the entire `@confect/*` family from being promoted to a major bump on every release when only minor/patch changes are present.

  `@confect/cli` additionally moves `@effect/platform` from `peerDependencies` to `dependencies`, since the CLI consumes it as an internal implementation detail (for `FileSystem`/`Path`) rather than exposing it in its public API. Consumers no longer need to install `@effect/platform` themselves to use the CLI.

### Patch Changes

- f308edd: Fix `confect codegen` and `confect dev` failing with "Cannot find package '@confect/core'" / "'@confect/server'" when the user's spec or impl files are bundled. The internal esbuild plugin used `import.meta.resolve(specifier, parent)` to resolve external imports, but Node silently ignores the second argument, so resolution always walked up from the CLI's own bundled file instead of from the user's project. Switched to `createRequire` keyed on the importing file's directory so external packages resolve out of the user's `node_modules`.
- Updated dependencies [87b7207]
- Updated dependencies [4bb2722]
- Updated dependencies [f308edd]
- Updated dependencies [9ea1951]
- Updated dependencies [9ea1951]
- Updated dependencies [40c1cff]
  - @confect/server@8.0.0-effect4.0
  - @confect/core@8.0.0-effect4.0

## 7.0.0

### Patch Changes

- Updated dependencies [90094d0]
  - @confect/core@7.0.0
  - @confect/server@7.0.0

## 6.0.0

### Patch Changes

- Updated dependencies [df95ce7]
- Updated dependencies [a8083e8]
- Updated dependencies [228589b]
  - @confect/core@6.0.0
  - @confect/server@6.0.0

## 5.0.0

### Patch Changes

- Updated dependencies [8853cbf]
  - @confect/server@5.0.0
  - @confect/core@5.0.0

## 4.0.0

### Major Changes

- 60be7e6: Add Effect-native cron job support via new `CronJob` and `CronJobs` modules.

  Cron jobs are now defined using Effect's `Cron` (cron expressions) or `Duration` (fixed intervals) types instead of the vanilla Convex `cronJobs()` API. `CronJob.make` creates individual jobs with a unique identifier, schedule, and ref to an internal mutation or action. `CronJobs.make()` creates an empty collection with a chainable `.add()` method.

  Interval schedules are represented in the largest whole unit possible (hours > minutes > seconds) to avoid floating-point precision issues with large durations.

- 8ae4d51: Standardize all Effect service tags to a consistent `@confect/{package}/{ServiceName}` format.

  The `Storage` namespace export has been removed from `@confect/server`. `StorageReader`, `StorageWriter`, `StorageActionWriter`, and `BlobNotFoundError` are now exported as individual top-level namespaces. Replace `Storage.StorageReader` with `StorageReader.StorageReader`, etc. After upgrading, rerun `confect codegen` to regenerate the `services.ts` file.

### Patch Changes

- Updated dependencies [60be7e6]
- Updated dependencies [641fd99]
- Updated dependencies [8ae4d51]
  - @confect/server@4.0.0
  - @confect/core@4.0.0

## 3.0.0

### Minor Changes

- 5fb6a61: Add support for plain Convex functions. Plain Convex queries, mutations, and actions can now be included in your Confect spec and impl tree using new `FunctionSpec.convexPublic*` and `FunctionSpec.convexInternal*` constructors. This enables interop with Convex components and libraries (such as Workpool, Workflow, Migrations, and Better Auth) that require user-defined or -provided Convex functions.

### Patch Changes

- Updated dependencies [5fb6a61]
  - @confect/core@3.0.0
  - @confect/server@3.0.0

## 2.0.0

### Patch Changes

- Updated dependencies [69ce9c9]
- Updated dependencies [f78c58a]
  - @confect/server@2.0.0
  - @confect/core@2.0.0

## 1.0.3

### Patch Changes

- 12b465a: Confect no longer maintains an `app.ts` which maps to `convex.config.ts`. If you'd like to use Convex components, define a `convex.config.ts` file in your `convex/` folder directly.
  - @confect/server@1.0.3
  - @confect/core@1.0.3

## 1.0.2

### Patch Changes

- Updated dependencies [c4f9d67]
  - @confect/server@1.0.2
  - @confect/core@1.0.2

## 1.0.1

### Patch Changes

- d3ecdc7: Fix codegen failure in projects without `"type": "module"` in their `package.json`. Also dramatically improve codegen performance.
- Updated dependencies [00b12a0]
  - @confect/core@1.0.1
  - @confect/server@1.0.1

## 1.0.0

### Major Changes

- 2ff70a7: Initial release.

## 1.0.0-next.4

### Patch Changes

- 46109fb: Support Node actions
- Updated dependencies [46109fb]
  - @confect/server@1.0.0-next.4
  - @confect/core@1.0.0-next.4

## 1.0.0-next.3

### Patch Changes

- 9cd3cda: `confect/_generated/refs.ts` now default exports the `Refs` object, which now contains `public` and `internal` fields for each corresponding collection of Confect functions
- 186c130: `FunctionSpec.query` becomes `FunctionSpec.publicQuery`, same for mutations and actions
- Updated dependencies [9cd3cda]
- Updated dependencies [186c130]
  - @confect/server@1.0.0-next.3
  - @confect/core@1.0.0-next.3

## 1.0.0-next.2

### Patch Changes

- 071b6ed: Upgrade deps
- Updated dependencies [071b6ed]
- Updated dependencies [afc9fb4]
  - @confect/server@1.0.0-next.2
  - @confect/core@1.0.0-next.2

## 1.0.0-next.1

### Patch Changes

- Updated dependencies [5a4127f]
  - @confect/core@1.0.0-next.1
  - @confect/server@1.0.0-next.1

## 1.0.0-next.0

### Major Changes

- 2ff70a7: Initial release.

### Patch Changes

- Updated dependencies [2ff70a7]
  - @confect/server@1.0.0-next.0

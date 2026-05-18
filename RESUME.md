# Resume — Effect 4 modernization (PR #1)

Branch: `effect4-modernize` based on `upstream/main = dc131ae` (= post-v7.0.0).
PR: https://github.com/gunta/confect/pull/1
Old branch `patentradar-effect4-compat` deleted; preserved as `archive/patentradar-effect4-compat` tag → `92b37dc`.

## Final state

| Package | src typecheck | build | test typecheck |
|---|---|---|---|
| `@confect/core` | ✅ 0 errors | ✅ clean (151 kB / 59 files) | 5 (mechanical, follow-up) |
| `@confect/server` | ✅ 0 errors | ✅ clean (380 kB / 161 files) | ~243 (follow-up) |
| `@confect/js` | ✅ 0 errors | ✅ clean (29.5 kB) | ~57 (follow-up) |
| `@confect/react` | ✅ 0 errors | ✅ clean (26.3 kB) | ~9 (follow-up) |
| `@confect/test` | ✅ 0 errors | ✅ clean (18.6 kB / 7 files) | 0 |
| `@confect/cli` | excluded from workspace | — | — |
| `apps/example` | excluded from workspace | — | — |

## 25 commits on this PR

```
c622326 chore: rename @confect/* -> @gunta/confect-* and bump deps (later reverted by 2aff932)
2c767ee chore: regenerate pnpm-lock.yaml for Effect 4 + Convex 1.39 deps
31c98e3 wip(core): partial Effect 4 port
85cd13f feat(core): port @gunta/confect-core to Effect 4
68a8c66 chore(server): bulk Effect 4 mechanical sweep across packages/server/src
8308a71 feat(js): port @gunta/confect-js to Effect 4
4e2b653 feat(react): port @gunta/confect-react to Effect 4
2aff932 revert: keep @confect/* package names (drop @gunta/confect-* rename)
6c061b6 chore: add @effect/vitest@4.0.0-beta.67 dev dep to {core,js,react,server}
6ab7744 test(core): port Ref.test.ts and SystemFields.test.ts to Effect 4
9932d39 feat(server): port SchemaToValidator to Effect 4
f93a063 docs: add RESUME.md with full Effect 4 migration handoff
2f1da1e docs: update RESUME.md commit log
8cccfff feat(server): port Document.ts + RegisteredConvexFunction.ts
876d18f feat(server): port RegisteredFunction.ts + QueryInitializer.ts
a107e43 feat(server): port ConvexConfigProvider/Auth/Storage and friends
af9f951 feat(core,server): extendWithSystemFields supports Union<Struct[]>
71a2d1f feat(server): port RegisteredNodeFunction + loosen Table bounds
b30622a feat(server): port Registry/Runners/HttpApi to Effect 4
8afd493 feat(server): port Handler/Impl/StorageActionWriter to Effect 4
83d635e feat(server): @confect/server is fully Effect 4 typed and builds clean
4223559 feat: 5 of 6 packages green (core/js/react/server/test build clean)
48022af chore: exclude @confect/cli + apps/example from workspace (deferred)
3c93fb3 test: bulk Effect 4 sweep across all package test suites
674c685 chore: add changesets for Effect 4 + Convex 1.39 migrations
```

## Follow-up PRs (tracked as tasks #8–#12)

1. **`@confect/cli` port** — `@effect/cli` → `effect/unstable/cli`; `@effect/platform-node` → `effect/unstable/*` equivalents. Class-style `Effect.Service<Self>()(name, {effect, dependencies, accessors})` → `Context.Service<Self, Shape>()(name)` + `Layer.effect(tag, eff).pipe(Layer.provide(deps))`. Re-add to workspace + server devDeps when done.
2. **`apps/example` refresh** — depends on CLI port for codegen regen. Update imports for Effect 4 idioms.
3. **HttpApi.ts rewrite** — currently stubbed with `any` casts + `TODO(effect4)` markers. v4 reshaped HttpApi/HttpApp/HttpRouter/HttpApiBuilder/HttpApiScalar/HttpServer.
4. **Test suite cleanups** — ~310 mechanical test-level type fixes (`Either`→`Result` narrowing, polymorphic `TableInfo` inference, `Schema.TaggedErrorClass` vs `Codec` mismatches). Runtime is already ported.
5. **Tighten `as never` casts** in `Document.ts`/`DatabaseWriter.ts`/`OrderedQuery.ts`/`QueryInitializer.ts` once a polymorphic table-schema bound stabilizes.
6. **Expose Convex 1.36+ `ctx.meta.*`** as confect Effect services (function/transaction/deployment/request metadata).

## Effect 3 → 4 migration patterns applied (reference table)

### Schema API
| v3 | v4 |
|---|---|
| `Schema.Schema.AnyNoContext` | `Schema.Codec<any, any, never, never>` |
| `Schema.Schema<A, I>` | `Schema.Codec<A, I, never, never>` |
| `Schema.encodedSchema(s)` | `Schema.toEncoded(s)` |
| `Schema.typeSchema(s)` | `Schema.toType(s)` |
| `Schema.annotations({...})` | `Schema.annotate({...})` |
| `Schema.encode(s)(x)` | `Schema.encodeEffect(s)(x)` |
| `Schema.decode(s)(x)` | `Schema.decodeEffect(s)(x)` |
| `Schema.optionalWith(s, {exact:true})` | `Schema.optionalKey(s)` |
| `Schema.extend(a, b)` | `a.pipe(Schema.fieldsAssign(b.fields))` |
| `Schema.Union(a, b, c)` variadic | `Schema.Union([a, b, c])` array |
| `Schema.Literal(a, b)` multi | `Schema.Literals([a, b])` |
| `Schema.TaggedError` | `Schema.TaggedErrorClass` |
| `Schema.URL` (accepts string) | `Schema.URLFromString` (v4 `URL` is `instanceOf<globalThis.URL>`) |
| `ParseResult.ParseError` | `Schema.SchemaError` (`ParseResult` not exported) |
| `Symbol.for("X")` annotation key | string key `"@confect/<pkg>/X"` |
| `SchemaAST.getAnnotation<T>(key)` | `Option.fromNullishOr(SchemaAST.resolveAt<T>(key)(ast))` |

### SchemaAST tags
- `TypeLiteral` → `Objects`, `TupleType` → `Arrays`
- All `*Keyword` collapsed (`StringKeyword` → `String`, `NumberKeyword` → `Number`, `BooleanKeyword` → `Boolean`, `BigIntKeyword` → `BigInt`, `UnknownKeyword` → `Unknown`, `AnyKeyword` → `Any`, `SymbolKeyword` → `Symbol`, `UndefinedKeyword` → `Undefined`, `VoidKeyword` → `Void`, `NeverKeyword` → `Never`)
- `Enums` → `Enum`; `Null` is its own tag
- `SchemaAST.isUndefinedKeyword` → `SchemaAST.isUndefined`

### Effect / Stream / Layer / Result / Context
| v3 | v4 |
|---|---|
| `Context.GenericTag<T>(name)` | `Context.Service<Self, Shape>()(name)` (two-stage call) |
| `Effect.Service<Self>()(name, {...})` (class form) | `Context.Service<Self, Shape>()(name)` + `Layer.effect(tag, eff)` |
| `Context.Reference` class extension | `Context.Reference<Service>(key, { defaultValue })` function form |
| `Effect.Effect.Success<T>` | `Effect.Success<T>` |
| `Effect.either(eff)` | `Effect.result(eff)` |
| `Effect.catchAll(f)` | `Effect.matchEffect({onFailure, onSuccess})` |
| `Effect.catchTag("ParseError", ...)` | `Effect.catchTag("SchemaError", ...)` |
| `Effect.dieMessage(msg)` | `Effect.die(msg)` |
| `Effect.withClock(clock)` | `Effect.provideService(Clock.Clock, clock)` |
| `Clock.make()` | build custom Clock literal (no factory in v4); methods renamed `unsafeCurrentTimeMillis` → `currentTimeMillisUnsafe` etc |
| `Stream.unwrapScoped(eff)` | `Stream.unwrap(eff)` (scope handled in type) |
| `Stream.asyncScoped((emit) => eff)` | `Stream.callback((queue) => eff)` |
| `emit.single(x)` | `Queue.offerUnsafe(queue, x)` |
| `emit.fail(e)` | `Queue.failCauseUnsafe(queue, Cause.fail(e))` |
| `Stream.runCollect` (returns `Chunk<A>`) | returns `Array<A>` directly |
| `Layer.scoped(tag, eff)` | `Layer.effect(tag, eff)` |
| `Layer.setConfigProvider(p)` | `Layer.succeed(ConfigProvider.ConfigProvider, p)` |
| `Layer.map(layer, f)` | `Layer.effect(tag, Effect.map(Effect.service(oldTag), f)).pipe(Layer.provide(layer))` |
| `Either` (module) | `Result` |
| `Either.getOrThrow(e)` | `Result.getOrThrow(r)` |
| `Either.match({onLeft, onRight})` | `Result.match({onFailure, onSuccess})` |
| `Option.fromNullable` | `Option.fromNullishOr` |
| `Hash.cached(this, value)` | (removed; inline `Hash.combine(...)` without caching) |
| `Order.number` | `Order.Number` |
| `Ref.unsafeMake` | `Ref.makeUnsafe` |
| `Array.isEmptyReadonlyArray(arr)` / `Array.isEmptyArray` | `arr.length === 0` |

### Removed sub-packages (folded into `effect/unstable/*` in v4)
- `@effect/platform`, `@effect/platform-node`, `@effect/platform-bun`, `@effect/platform-node-shared`
- `@effect/cluster`, `@effect/experimental`, `@effect/rpc`, `@effect/sql`, `@effect/workflow`
- `@effect/typeclass`
- `@effect/cli`, `@effect/printer`, `@effect/printer-ansi` (cli package follow-up needs `effect/unstable/cli`)

### Dependency targets (current)
- `effect: 4.0.0-beta.67`
- `convex: ^1.39.0` peer, `1.39.1` dev
- `convex-test: ^0.0.53` dev
- `@effect/vitest: 4.0.0-beta.67`

## Resume commands

```bash
cd /Users/a12907/Documents/GitHub/confect
git checkout effect4-modernize
git pull
pnpm install

# Per-package src typecheck:
for pkg in core js react server test; do
  echo "=== @confect/$pkg ==="
  pnpm --filter "@confect/$pkg" typecheck 2>&1 | grep -c "^src/" || true
done

# Per-package build:
pnpm -r --filter='@confect/*' build
```

## Reference

- Effect v4 Schema migration guide: https://github.com/Effect-TS/effect-smol/blob/main/migration/schema.md
- Effect v4 d.ts ground truth: `node_modules/.pnpm/effect@4.0.0-beta.67/node_modules/effect/dist/{Schema,SchemaAST,Effect,Stream,Layer,Result,Cause,Queue,Hash,Option,Match,Array,Order,Ref,Context,ConfigProvider,Clock}.d.ts`
- Open Convex compat issue: https://github.com/Effect-TS/effect-smol/issues/2143 (`ConfigProvider.fromEnv` + `import.meta.env`; sidestepped by passing explicit env snapshot in `ConvexConfigProvider.ts`)

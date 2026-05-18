# Resume — Effect 4 modernization (PR #1)

Branch: `effect4-modernize` based on `upstream/main = dc131ae` (= post-v7.0.0).
Draft PR: https://github.com/gunta/confect/pull/1
Old branch `patentradar-effect4-compat` deleted; preserved as `archive/patentradar-effect4-compat` tag → `92b37dc`.

## Current state per package

| Package | src typecheck | build | test typecheck |
|---|---|---|---|
| `@confect/core` | ✅ 0 errors | ✅ clean (148 kB / 59 files) | 8 errors — `SystemFields.test.ts` Union<Struct[]> case |
| `@confect/js` | ✅ 0 errors | ✅ clean (29.5 kB) | ~70 errors — mostly mechanical `Either→Result`, `TaggedError→TaggedErrorClass` |
| `@confect/react` | ✅ 0 errors | ✅ clean (26.3 kB) | ~15 errors — same patterns + `Result.right/left` → narrow with `Result.isSuccess` and `.value` |
| `@confect/server` | 157 errors (down from 243). `SchemaToValidator.ts` fully done. Next: Document.ts (24), RegisteredConvexFunction.ts (20), RegisteredFunction.ts (14), QueryInitializer.ts (14) | blocked | pending |
| `@confect/test` | blocked on server build | blocked | pending |
| `@confect/cli` | unchanged — still on `@effect/cli` (Effect 3) | blocked | pending |
| `apps/example` | unchanged — references pre-Effect-4 confect | pending | pending |

## Commits on this PR (chronological)

```
c622326 chore: rename @confect/* -> @gunta/confect-* and bump deps (was reverted by 2aff932)
2c767ee chore: regenerate pnpm-lock.yaml
31c98e3 wip(core): partial Effect 4 port
85cd13f feat(core): complete Effect 4 port
68a8c66 chore(server): bulk Effect 4 mechanical sweep
8308a71 feat(js): port to Effect 4
4e2b653 feat(react): port to Effect 4
2aff932 revert: keep @confect/* package names (no rename)
6c061b6 chore: add @effect/vitest@4.0.0-beta.67 dev dep
6ab7744 test(core): port Ref.test.ts and SystemFields.test.ts
9932d39 feat(server): port SchemaToValidator to Effect 4
f93a063 docs: add RESUME.md handoff
<server agent wip commit if any>
```

## Effect 3 → 4 migration patterns established (apply mechanically to remaining files)

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
| `Schema.encodeSync/decodeSync` | (unchanged) |
| `Schema.optionalWith(s, {exact:true})` | `Schema.optionalKey(s)` |
| `Schema.optionalWith(s, {default:()=>v})` | `Schema.optional(s).pipe(Schema.withDecodingDefaultType(()=>Effect.succeed(v)))` |
| `Schema.extend(a, b)` | `a.pipe(Schema.fieldsAssign(b.fields))` (requires Struct) |
| `Schema.Union(a, b, c)` variadic | `Schema.Union([a, b, c])` array |
| `Schema.Tuple([...])`, `Schema.TemplateLiteral([...])` | (already array form) |
| `Schema.Literal(a, b)` multi | `Schema.Literals([a, b])` |
| `Schema.TaggedError` | `Schema.TaggedErrorClass` |
| `ParseResult.ParseError` | `Schema.SchemaError` (import removed) |
| `Symbol.for("X")` annotation key | string key `"@confect/<pkg>/X"` |
| `SchemaAST.getAnnotation<T>(key)` | `Option.fromNullishOr(SchemaAST.resolveAt<T>(key)(ast))` |

### SchemaAST tags
- `TypeLiteral` → `Objects`, `TupleType` → `Arrays`
- All `*Keyword` collapsed (`StringKeyword` → `String`, `NumberKeyword` → `Number`, `BooleanKeyword` → `Boolean`, `BigIntKeyword` → `BigInt`, `UnknownKeyword` → `Unknown`, `AnyKeyword` → `Any`, `SymbolKeyword` → `Symbol`, `UndefinedKeyword` → `Undefined`, `VoidKeyword` → `Void`, `NeverKeyword` → `Never`)
- `Enums` → `Enum`
- `Null` is now its own tag
- `SchemaAST.isUndefinedKeyword` → `SchemaAST.isUndefined`
- **Don't silently drop `Refinement`/`Transformation`** — they're still in v4 but their AST representation may differ. Mark with `// TODO(effect4)` if unclear.

### Effect / Stream / Layer / Result
| v3 | v4 |
|---|---|
| `Context.GenericTag<T>(name)` | `Context.Service<T>(name)` |
| `Effect.Effect.Success<T>` | `Effect.Success<T>` |
| `Effect.dieMessage(msg)` | `Effect.die(msg)` |
| `Effect.if(cond, {onTrue, onFalse})` | restructure with `if/else` returning Effects |
| `Effect.either(eff)` | `Effect.result(eff)` |
| `Effect.catchTag("ParseError", ...)` | `Effect.catchTag("SchemaError", ...)` |
| `Stream.unwrapScoped(eff)` | `Stream.unwrap(eff)` (scope handled in type) |
| `Stream.asyncScoped((emit) => eff)` | `Stream.callback((queue) => eff)` |
| `emit.single(x)` | `Queue.offerUnsafe(queue, x)` |
| `emit.fail(e)` | `Queue.failCauseUnsafe(queue, Cause.fail(e))` |
| `Layer.scoped(tag, eff)` | `Layer.effect(tag, eff)` |
| `Either` (module) | `Result` |
| `Either.getOrThrow(e)` | `Result.getOrThrow(r)` |
| `e.right` (Either accessor) | `r.value` after `Result.isSuccess(r)` narrowing |
| `e.left` | `r.value` after `Result.isFailure(r)` narrowing (or `Result.getFailure(r)` → Option) |
| `Array.isEmptyReadonlyArray(arr)` | `arr.length === 0` |
| `Hash.cached(this, value)` | (removed; inline `Hash.combine` without caching) |

### Removed sub-packages (folded into `effect/unstable/*` in v4)
- `@effect/platform`, `@effect/platform-node`, `@effect/platform-bun`, `@effect/platform-node-shared`
- `@effect/cluster`, `@effect/experimental`, `@effect/rpc`, `@effect/sql`, `@effect/workflow`
- `@effect/typeclass`
- `@effect/cli`, `@effect/printer`, `@effect/printer-ansi` (needs `effect/unstable/cli` for CLI port)

### Dependency targets
- `effect: 4.0.0-beta.67` (pinned; watch for new betas)
- `convex: ^1.39.0` peer, `1.39.1` dev
- `convex-test: ^0.0.53` dev
- `@effect/vitest: 4.0.0-beta.67` (for tests using `effect:` helpers)

## Resume commands

```bash
cd /Users/a12907/Documents/GitHub/confect
git checkout effect4-modernize
git pull
pnpm install

# Check overall state
for pkg in core js react server test cli; do
  echo "=== @confect/$pkg ==="
  pnpm --filter "@confect/$pkg" typecheck 2>&1 | grep -c "^src/" || true
done
```

## Next session priorities (suggested order)

1. **Finish server source port** — biggest unblocker. ~140-160 errors remain in `packages/server/src/`, mostly in `SchemaToValidator.ts`, `Document.ts`, `RegisteredConvexFunction.ts`. The bulk mechanical sweep is done; remaining errors need careful per-file work.
2. **Fix `extendWithSystemFields` to support `Schema.Union<readonly Schema.Struct[]>` again** (currently tightened to Struct only — breaks polymorphic tables). Use `.mapMembers(Tuple.map(Schema.fieldsAssign(SystemFields(tableName).fields)))` for the Union branch.
3. **`@confect/test` port** — depends on server building. `TestConfect.ts` only has ~10 errors after server's done.
4. **Port test suites in core/js/react** — mostly mechanical now that patterns are known.
5. **`@confect/cli` port** — biggest unknown. `@effect/cli` is Effect 3; needs migration to `effect/unstable/cli`. Check `effect/unstable/cli` API docs; the CLI surface (`Command`, `subcommand`, etc.) may have changed shape. May warrant a separate PR if it's too big.
6. **`apps/example` refresh** — update imports + Effect 4 API usage; regenerate `_generated/*` via the new CLI.
7. **Changesets** — one per meaningful change area:
   - `effect-4-migration.md` (major)
   - `convex-1.39-bump.md`
   - any breakage notes
8. **Convert PR from draft to ready**.

## Known semantic gaps (not just mechanical)

- **`SchemaToValidator` `Refinement`/`Transformation` tags**: dropped in old fork branch. The Effect 4 port (commit `9932d39`) addressed these — verify behavior by running tests when the test suite is ported. `Schema.Number.pipe(Schema.positive())` should still produce `v.float64()`.
- **Effect language-service plugin enforces `unnecessaryFailYieldableError` as error**: must use `yield* new TaggedError(...)` instead of `yield* Effect.fail(new TaggedError(...))` throughout server source. Watch for this pattern when porting remaining server files.
- **`SchemaAST.Declaration#run` typing leaks `unknown`**: Effect 4 returns `Effect<any, Issue.Issue, any>`. Server's SchemaToValidator now uses a local cast wrapper to `Effect<unknown, unknown>` (R defaults to `never`). Keep that pattern when porting other files that introspect Declarations.
- **`extendWithSystemFields` Union<Struct[]>**: see #2 above.
- **`SchemaAST.Declaration.decodeUnknown` usage** in `SchemaToValidator.ts`: Effect 4 changed declaration introspection. The ArrayBuffer/bytes detection may need rework.
- **`@effect/cli` → `effect/unstable/cli`**: structural rewrite, not rename. CLI tool currently can't build at all under Effect 4.
- **`apps/example/_generated/*`**: codegen artifacts; need the new CLI working to regenerate, or hand-write them temporarily.

## Reference

Full Effect v4 migration guide: https://github.com/Effect-TS/effect-smol/blob/main/migration/schema.md
Effect v4 d.ts ground truth: `node_modules/.pnpm/effect@4.0.0-beta.67/node_modules/effect/dist/{Schema,SchemaAST,Effect,Stream,Layer,Result,Cause,Queue,Hash,Option,Match,Array}.d.ts`

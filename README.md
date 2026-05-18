# Confect 🧁

Confect is a framework that deeply integrates Effect with Convex. It's more than just Effect bindings! Confect allows you to:

- Define your Convex database schema using Effect schemas.
- Write Convex function args and returns validators using Effect's schema library.
- Use Confect functions to automatically decode and encode your data according to your Effect schema definitions for end-to-end rich types, from client to function to database (and back).
- Use Effect's HTTP API modules to define your HTTP API(s). Includes interactive OpenAPI documentation powered by [Scalar](https://github.com/scalar/scalar).
- Access Convex platform capabilities via Effect services.

Want to learn more? Read the [docs](https://confect.dev)!

---

## Effect 4 prerelease (`next` channel)

This branch (`effect4-modernize`) tracks Confect's port to **Effect 4.0.0-beta** alongside the stable Effect 3 release on `main`. Both ship from the same npm packages, on different dist-tags:

| Channel | Effect | Convex | Install |
|---|---|---|---|
| stable (`latest`) | `^3.21.2` | `^1.30.0` | `pnpm add @confect/server` |
| prerelease (`next`) | `4.0.0-beta.67` | `^1.39.0` | `pnpm add @confect/server@next` |

The `next` releases come out of the `effect4-modernize` branch via [`.github/workflows/release-effect4.yml`](.github/workflows/release-effect4.yml), which uses changesets prerelease mode (see [`.changeset/pre.json`](.changeset/pre.json)) plus each package's `publishConfig.tag: "next"` to land versions like `@confect/server@8.0.0-next.X` without overwriting the stable `latest` tag.

When Effect 4 stabilizes, this branch will exit prerelease mode (`pnpm changeset pre exit`) and merge into `main` as the next major.

### What changed

Schema API, Effect/Stream/Layer/Result, and Context tag shape all changed. Full v3 → v4 rename tables and worked examples live in [**Migrating to Effect 4**](apps/docs/guides/migrating-to-effect-4.mdx). For the port log and commit-by-commit history, see [RESUME.md](RESUME.md).

The most common Confect-user touchpoint is the schema-type accessor:

```ts
// v3
const Args = Schema.Struct({ id: Schema.String });
const handler = (a: Schema.Schema.Type<typeof Args>) => Effect.succeed(null);

// v4
const Args = Schema.Struct({ id: Schema.String });
const handler = (a: typeof Args.Type) => Effect.succeed(null);
```

### Per-package status on `next`

| Package | Typecheck | Build | Notes |
|---|---|---|---|
| `@confect/core` | clean | 151 kB / 59 files | — |
| `@confect/server` | clean | 380 kB / 161 files | `HttpApi` stubbed pending follow-up |
| `@confect/js` | clean | 29.5 kB | `WebSocketClient` ported to `Stream.callback` |
| `@confect/react` | clean | 26.3 kB | — |
| `@confect/test` | clean | 18.6 kB / 7 files | — |
| `@confect/cli` | clean | 174.9 kB / 37 files | excluded from `next` workspace; depends on Effect 3 companions pending the `effect/unstable/cli` rewrite |

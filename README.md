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

For the full migration writeup and the v3 → v4 API rename table, see [RESUME.md](RESUME.md).

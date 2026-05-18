import { ConfigProvider } from "effect";

declare const process: { env: Record<string, string | undefined> };

/**
 * Build a `ConfigProvider` that reads from `process.env` at Convex function
 * runtime.
 *
 * Effect 4's `ConfigProvider.fromEnv` would normally use `import.meta.env`,
 * which the Convex bundler cannot statically analyze (see effect-smol#2143).
 * Pass an explicit env snapshot at construction time to side-step that.
 */
export const make = (options?: {
  readonly pathDelim?: string;
  readonly seqDelim?: string;
}): ConfigProvider.ConfigProvider => {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
  return ConfigProvider.fromEnv({ env });
};

import { HttpApi } from "@confect/server";
import { HttpMiddleware } from "effect/unstable/http";
import { flow } from "effect";
import { ApiLive } from "./http/path-prefix";

export default HttpApi.make({
  "/path-prefix/": {
    // TODO(effect4): @confect/server's `apiLive` type still expects the v3
    // shape (Layer<HttpApi.Api, never, runners>). v4's `HttpApiBuilder.layer`
    // returns a layer requiring `FileSystem | HttpPlatform | HttpRouter | …`
    // alongside the runners, which packages/server provides at runtime via
    // `(HttpServer as any).layerContext`. Drop this cast once
    // packages/server/src/HttpApi.ts is fully retyped to the v4 surface.
    apiLive: ApiLive as never,
    middleware: flow(HttpMiddleware.cors(), HttpMiddleware.logger),
  },
});

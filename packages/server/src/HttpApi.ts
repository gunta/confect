// TODO(effect4): re-validate effect/unstable/{http,httpapi} surface; v4 changed
// HttpApi<Id, Groups>, removed HttpApp module, and reshaped HttpRouter. The
// type names below are loose `any` placeholders until the upstream confect
// HttpApi consumer pattern is rewritten against the new shapes.
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { HttpServer } from "effect/unstable/http";
import { ConfigProvider } from "effect";

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace HttpApi {
  export type Api = any;
}
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace HttpApp {
  export type Default<_E = never, _R = never> = any;
}
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace HttpRouter {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace HttpRouter {
    export type DefaultServices = any;
  }
}
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace HttpApiBuilderNS {
  export type Router = any;
}
import {
  type HttpRouter as ConvexHttpRouter,
  type GenericActionCtx,
  type GenericDataModel,
  httpActionGeneric,
  httpRouter,
  ROUTABLE_HTTP_METHODS,
  type RouteSpecWithPathPrefix,
} from "convex/server";
import { Array, Layer, pipe, Record } from "effect";
import * as ActionCtx from "./ActionCtx";
import * as ActionRunner from "./ActionRunner";
import * as Auth from "./Auth";
import * as ConvexConfigProvider from "./ConvexConfigProvider";
import * as MutationRunner from "./MutationRunner";
import * as QueryRunner from "./QueryRunner";
import * as Scheduler from "./Scheduler";
import { StorageActionWriter } from "./StorageActionWriter";
import { StorageReader } from "./StorageReader";
import { StorageWriter } from "./StorageWriter";

type Middleware = (
  httpApp: HttpApp.Default,
) => HttpApp.Default<
  never,
  HttpApi.Api | HttpApiBuilderNS.Router | HttpRouter.HttpRouter.DefaultServices
>;

const makeHandler =
  <DataModel extends GenericDataModel>({
    pathPrefix,
    apiLive,
    middleware,
    scalar,
  }: {
    pathPrefix: RoutePath;
    apiLive: Layer.Layer<
      HttpApi.Api,
      never,
      | QueryRunner.QueryRunner
      | MutationRunner.MutationRunner
      | ActionRunner.ActionRunner
      | Scheduler.Scheduler
      | Auth.Auth
      | StorageReader
      | StorageWriter
      | StorageActionWriter
      | GenericActionCtx<DataModel>
    >;
    middleware?: Middleware;
    scalar?: HttpApiScalar.ScalarConfig;
  }) =>
  (ctx: GenericActionCtx<DataModel>, request: Request): Promise<Response> => {
    const ApiLive = apiLive.pipe(
      Layer.provide(
        Layer.mergeAll(
          QueryRunner.layer(ctx.runQuery),
          MutationRunner.layer(ctx.runMutation),
          ActionRunner.layer(ctx.runAction),
          Scheduler.layer(ctx.scheduler),
          Auth.layer(ctx.auth),
          StorageReader.layer(ctx.storage),
          StorageWriter.layer(ctx.storage),
          StorageActionWriter.layer(ctx.storage),
          Layer.succeed(ActionCtx.ActionCtx<DataModel>(), ctx),
        ),
      ),
    );

    // TODO(effect4): HttpApiScalar.layer/HttpServer.layerContext/
    // HttpApiBuilder.toWebHandler all changed shape in v4. Cast through any
    // until the new surface is wired in this file.
    const ApiDocsLive = (HttpApiScalar.layer as any)({
      path: `${pathPrefix}docs`,
      scalar: {
        baseServerURL: `${process.env["CONVEX_SITE_URL"]}${pathPrefix}`,
        ...scalar,
      },
    }).pipe(Layer.provide(ApiLive));

    const EnvLive = Layer.mergeAll(
      ApiLive,
      ApiDocsLive,
      (HttpServer as any).layerContext ?? Layer.empty,
      Layer.succeed(ConfigProvider.ConfigProvider, ConvexConfigProvider.make()),
    );

    const { handler } = (HttpApiBuilder as any).toWebHandler(
      EnvLive,
      middleware ? { middleware } : {},
    );

    return handler(request);
  };

const makeHttpAction = <DataModel extends GenericDataModel>({
  pathPrefix,
  apiLive,
  middleware,
  scalar,
}: {
  pathPrefix: RoutePath;
  apiLive: Layer.Layer<
    HttpApi.Api,
    never,
    | QueryRunner.QueryRunner
    | MutationRunner.MutationRunner
    | ActionRunner.ActionRunner
    | Scheduler.Scheduler
    | Auth.Auth
    | StorageReader
    | StorageWriter
    | StorageActionWriter
    | GenericActionCtx<DataModel>
  >;
  middleware?: Middleware;
  scalar?: HttpApiScalar.ScalarConfig;
}) =>
  httpActionGeneric(
    makeHandler<DataModel>({
      pathPrefix,
      apiLive,
      ...(middleware ? { middleware } : {}),
      ...(scalar ? { scalar } : {}),
    }) as unknown as (
      ctx: GenericActionCtx<GenericDataModel>,
      request: Request,
    ) => Promise<Response>,
  );

export type HttpApi_ = {
  apiLive: Layer.Layer<
    HttpApi.Api,
    never,
    | QueryRunner.QueryRunner
    | MutationRunner.MutationRunner
    | ActionRunner.ActionRunner
    | Scheduler.Scheduler
    | Auth.Auth
    | StorageReader
    | StorageWriter
    | StorageActionWriter
  >;
  middleware?: Middleware;
  scalar?: HttpApiScalar.ScalarConfig;
};

export type RoutePath = "/" | `/${string}/`;

const mountEffectHttpApi =
  <DataModel extends GenericDataModel>({
    pathPrefix,
    apiLive,
    middleware,
    scalar,
  }: {
    pathPrefix: RoutePath;
    apiLive: Layer.Layer<
      HttpApi.Api,
      never,
      | QueryRunner.QueryRunner
      | MutationRunner.MutationRunner
      | ActionRunner.ActionRunner
      | Scheduler.Scheduler
      | Auth.Auth
      | StorageReader
      | StorageWriter
      | StorageActionWriter
      | GenericActionCtx<DataModel>
    >;
    middleware?: Middleware;
    scalar?: HttpApiScalar.ScalarConfig;
  }) =>
  (convexHttpRouter: ConvexHttpRouter): ConvexHttpRouter => {
    const handler = makeHttpAction<DataModel>({
      pathPrefix,
      apiLive,
      ...(middleware ? { middleware } : {}),
      ...(scalar ? { scalar } : {}),
    });

    Array.forEach(ROUTABLE_HTTP_METHODS, (method) => {
      const routeSpec: RouteSpecWithPathPrefix = {
        pathPrefix,
        method,
        handler,
      };
      convexHttpRouter.route(routeSpec);
    });

    return convexHttpRouter;
  };

type HttpApis = Partial<Record<RoutePath, HttpApi_>>;

export const make = (httpApis: HttpApis): ConvexHttpRouter => {
  applyMonkeyPatches();

  return pipe(
    httpApis as Record<RoutePath, HttpApi_>,
    Record.toEntries,
    Array.reduce(
      httpRouter(),
      (convexHttpRouter, [pathPrefix, { apiLive, middleware, scalar }]) =>
        mountEffectHttpApi({
          pathPrefix: pathPrefix as RoutePath,
          apiLive,
          ...(middleware ? { middleware } : {}),
          ...(scalar ? { scalar } : {}),
        })(convexHttpRouter),
    ),
  );
};

const applyMonkeyPatches = () => {
  // These are necessary until the Convex runtime supports these APIs. See https://discord.com/channels/1019350475847499849/1281364098419785760

  // eslint-disable-next-line no-global-assign
  URL = class extends URL {
    override get username() {
      return "";
    }
    override get password() {
      return "";
    }
  };

  Object.defineProperty(Request.prototype, "signal", {
    get: () => new AbortSignal(),
  });
};

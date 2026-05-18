import { FunctionImpl, GroupImpl } from "@confect/server";
import { Console, Duration, Effect, Layer } from "effect";
import nodeApi from "../_generated/nodeApi";

// TODO(effect4): v3 invoked an `echo` subprocess via `@effect/platform`'s
// `Command.make` to demo shelling out from a Node action. v4 moved the
// process API to `effect/unstable/process/ChildProcess` and now requires a
// `ChildProcessSpawner` layer, which the Convex runtime doesn't expose. The
// demo's observable behavior is just a log line, so we inline it here. If
// the example ever needs real subprocess execution, wire ChildProcessSpawner
// at the runtime boundary in `@confect/server`.
const send = FunctionImpl.make(
  nodeApi,
  "email",
  "send",
  Effect.fn(function* ({ to, subject, body }) {
    yield* Console.log(
      `Sending email to ${to} with subject ${subject} and body ${body}…`,
    );

    yield* Effect.sleep(Duration.seconds(1));

    yield* Console.log("Email sent!");

    return null;
  }),
);

const getInbox = FunctionImpl.make(
  nodeApi,
  "email",
  "getInbox",
  Effect.fn(function* () {
    yield* Console.log("Getting inbox…");

    yield* Effect.sleep(Duration.seconds(1));

    yield* Console.log("Inbox retrieved!");

    return [
      {
        to: "test@example.com",
        subject: "Test email",
        body: "Test email body",
      },
    ];
  }),
);

export const email = GroupImpl.make(nodeApi, "email").pipe(
  Layer.provide(send),
  Layer.provide(getInbox),
);

import { LOCAL_WS, nats } from "../nats.ts";

const nc = await nats.connect({ servers: [LOCAL_WS] });

// this function makes a subscription, but associates
// the subscription with a queue group
function qsub(id: string) {
  const sub = nc.subscribe("Q", { queue: "q" });
  (async () => {
    for await (const m of sub) {
      // we print the id of the sub that got the message
      // to see the server distributing the load
      console.log(
        `[${id}: ${sub.getProcessed()}] - ${m.subject}: ${m.string()}`,
      );
    }
  })();
}

// make several subscriptions, server will treat as one
qsub("A");
qsub("B");
qsub("C");

// publish some requests
const te = new TextEncoder();
for (let i = 0; i < 10; i++) {
  nc.publish("Q", te.encode(i.toString()));
}
await nc.drain();

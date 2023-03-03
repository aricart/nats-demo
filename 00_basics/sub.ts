import { LOCAL_WS, nats } from "../nats.ts";

// we know this
const nc = await nats.connect({ servers: [LOCAL_WS]});

// register a subscription with the server
const sub = nc.subscribe("hello");
// messages will be sent and processed in an iterator or cb
(async () => {
  for await (const m of sub) {
    console.log(`>>> [${sub.getProcessed()}] ${m.subject}: ${m.string()}`);
  }
})();

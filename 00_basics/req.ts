import { LOCAL_WS, nats } from "../nats.ts";

const nc = await nats.connect({ servers: [LOCAL_WS], debug: true });
const sub = nc.subscribe("echo");
(async () => {
  for await (const m of sub) {
    // if the msg has a reply address, respond publishes
    // the provided payload to that subject
    // here we just echo back
    m.respond(m.data);
  }
})();

// here's the bit of the client making the request
const r = await nc.request("echo", new TextEncoder().encode("echoechoecho"));
console.log(`>>>> ${r.subject}: ${r.string()}`);
await nc.drain();

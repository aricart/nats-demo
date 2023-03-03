import { LOCAL_WS, nats } from "../nats.ts";

const jc = nats.JSONCodec();

// this looks the same as our queue sub example
// wot! we know how to make services already...

// the point here - is we can start 100 of these
// and scale up our service, cannot do that with the
// other example - it is bound to a host-port
const nc = await nats.connect({ servers: [LOCAL_WS] });
const sub1 = nc.subscribe("add", { queue: "q" });
(async () => {
  for await (const m of sub1) {
    m.respond(jc.encode({ hello: "world" }));
  }
})();

const r = await nc.request("add");
console.log(r.json());

nc.request("delete").catch((err) => {
  console.log(`${err.code}`);
});

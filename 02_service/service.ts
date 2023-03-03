import { LOCAL_WS, nats } from "../nats.ts";

import { parse } from "https://deno.land/std@0.177.0/flags/mod.ts";
import { Products } from "./products_service.ts";
const flags = parse(Deno.args, { default: { url: LOCAL_WS } });
const url = flags.url;

// we need a connection
const nc = await nats.connect({
  servers: [url],
  maxReconnectAttempts: -1,
});
console.log(nc.getServer());

// print some lifecycle - disconnect/reconnect/etc
(async () => {
  for await (const s of nc.status()) {
    console.log(s);
  }
})();

// our service is called "Products"
const srv = new Products(nc);
console.log("starting products");
await srv.start();
console.log(await srv.srv.stats());

srv.srv.stopped
  .then((err) => {
    if (err) {
      console.error(`products service stopped due to an error: ${err.message}`);
    } else {
      console.log(`products service stopped`);
    }
  });

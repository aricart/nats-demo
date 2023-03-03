import * as nats from "https://raw.githubusercontent.com/nats-io/nats.ws/dev/src/mod.ts";
import { Product } from "../02_service/products_service.ts";
import { LOCAL_WS } from "../nats.ts";

const nc = await nats.connect({ servers: [LOCAL_WS] });

const js = nc.jetstream();
const jc = nats.JSONCodec<Product>();

const kv = await js.views.kv("products");

const products = [
  { name: "pencil", price: 1.00 },
  { name: "pencil", price: 1.01 },
  { name: "pen", price: 2.00 },
  { name: "ruler", price: 1.50 },
];

await Promise.all(products.map((v) => {
  return kv.put(v.name, jc.encode(v));
}));

console.log(`kv contains ${(await kv.status()).values} entries`);

function printEntry(e: nats.KvEntry | null) {
  if (e === null) {
    console.log("entry not found!");
    return;
  }
  console.log(e.json());
  console.log(`bucket: ${e.bucket}`);
  console.log(`created: ${e.created}`);
  console.log(`revision: ${e.revision}`);
  console.log(`operation: ${e.operation}`);
}
const e = await kv.get("pencil");
printEntry(e);

// this is an update specifying what we think is the current revision
// if that doesn't match, the put is rejected
await kv.put("pencil", jc.encode({ name: "pencil", price: 2.0 }), {
  previousSeq: e?.revision,
});
printEntry(await kv.get("pencil"));

await nc.drain();

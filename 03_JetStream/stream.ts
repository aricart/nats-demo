import * as nats from "https://raw.githubusercontent.com/nats-io/nats.ws/dev/src/mod.ts";

import { Product } from "../02_service/products_service.ts";
import { LOCAL_WS } from "../nats.ts";

const nc = await nats.connect({ servers: [LOCAL_WS] });

const jsm = await nc.jetstreamManager();
jsm.streams.add({
  name: "products",
  subjects: ["products.>"],
  storage: nats.StorageType.Memory,
});

const js = nc.jetstream();
const jc = nats.JSONCodec<Product>();

const products = [
  { name: "pencil", price: 1.00 },
  { name: "pencil", price: 1.00 },
  { name: "pen", price: 2.00 },
  { name: "ruler", price: 1.50 },
];

const acks = await Promise.all(products.map((v) => {
  return js.publish(`products.${v.name}`, jc.encode(v));
}));

console.log(acks);

const si = await jsm.streams.info("products");
console.log(si);

await nc.drain();

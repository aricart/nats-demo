import { NatsServer } from "https://raw.githubusercontent.com/nats-io/nats.deno/dev/tests/helpers/mod.ts";
import { nats } from "../nats.ts";
import { Products } from "./products_service.ts";
import { ProductsClient } from "./products_client.ts";
import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";

const wsConfig = {
  websocket: {
    no_tls: true,
    port: -1,
  },
};

Deno.test("products - crud", async () => {
  const ns = await NatsServer.start(wsConfig);
  const nc = await nats.connect({
    servers: [`ws://127.0.0.1:${ns.websocket}`],
  });

  const products = new Products(nc);
  await products.start();

  const c = new ProductsClient(nc);
  assertEquals(await c.list(), []);
  assertEquals(await c.names(), []);

  await assertRejects(
    async () => {
      //@ts-ignore: test
      await c.add({ car: "mercedes" });
    },
    Error,
    "not a product",
  );

  await assertRejects(
    async () => {
      await c.get("pen");
    },
    Error,
    "not found",
  );

  await c.add({ name: "pencil", price: 0.02 });
  assertEquals(await c.list(), [{ name: "pencil", price: 0.02 }]);
  assertEquals(await c.names(), ["pencil"]);

  await c.add({ name: "pen", price: 1.00 });
  assertEquals(await c.list(), [{ name: "pencil", price: 0.02 }, {
    name: "pen",
    price: 1.00,
  }]);
  assertEquals(await c.names(), ["pencil", "pen"]);

  await c.delete("pen");

  await nc.close();
  await ns.stop();
});

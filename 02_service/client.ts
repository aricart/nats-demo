import { LOCAL_WS, nats } from "../nats.ts";

import { Product } from "./products_service.ts";
import { ProductsClient } from "./products_client.ts";
import { cli, Command, Flags } from "https://deno.land/x/cobra@v0.0.9/mod.ts";
import { collect } from "https://raw.githubusercontent.com/nats-io/nats.deno/dev/nats-base-client/util.ts";

const root = cli({ use: "client (add|list|delete)" });
root.addFlag({
  short: "n",
  name: "name",
  type: "string",
  usage: "product name",
  persistent: true,
});
root.addFlag({
  short: "p",
  name: "price",
  type: "number",
  usage: "product price",
  persistent: true,
});
root.addFlag({
  short: "s",
  name: "server",
  type: "string",
  usage: "nats server hostport",
  persistent: true,
  default: LOCAL_WS,
});

function createConnection(flags: Flags): Promise<nats.NatsConnection> {
  const servers = flags.value<string>("server");
  return nats.connect({ servers });
}

function parseProductFlags(flags: Flags): Product | null {
  const name = flags.value<string>("name");
  const price = flags.value<number>("price");
  if (name) {
    return { name, price };
  }
  return null;
}

async function list(
  _cmd: Command,
  _args: string[],
  flags: Flags,
): Promise<number> {
  const nc = await createConnection(flags);
  const pc = new ProductsClient(nc);
  console.log(await pc.list());
  return 0;
}

async function names(
  _cmd: Command,
  _args: string[],
  flags: Flags,
): Promise<number> {
  const nc = await createConnection(flags);
  const pc = new ProductsClient(nc);
  console.log(await pc.names());
  return 0;
}

async function get(
  cmd: Command,
  _args: string[],
  flags: Flags,
): Promise<number> {
  const p = parseProductFlags(flags);
  if (p === null) {
    cmd.stdout(`--name is required\n`);
    return 1;
  }
  const nc = await createConnection(flags);
  const pc = new ProductsClient(nc);
  console.log(await pc.get(p.name));
  return 0;
}

async function deleteH(
  cmd: Command,
  _args: string[],
  flags: Flags,
): Promise<number> {
  const p = parseProductFlags(flags);
  if (p === null) {
    cmd.stdout(`--name is required\n`);
    return 1;
  }
  const nc = await createConnection(flags);
  const pc = new ProductsClient(nc);
  console.log(await pc.delete(p.name));
  return 0;
}

async function add(
  cmd: Command,
  _args: string[],
  flags: Flags,
): Promise<number> {
  const p = parseProductFlags(flags);
  if (p === null) {
    cmd.stdout(`--name and --price are required\n`);
    return Promise.resolve(1);
  }
  const nc = await createConnection(flags);
  const pc = new ProductsClient(nc);
  await pc.add(p);
  return 0;
}

async function status(
  _cmd: Command,
  _args: string[],
  flags: Flags,
): Promise<number> {
  const nc = await createConnection(flags);
  const sc = nc.services.client();

  const stats: { num_requests: number }[] = [];
  (await collect(await sc.stats("w_demo"))).forEach(
    (s) => {
      const { name, id, version } = s;
      s.endpoints?.forEach((ne) => {
        const line = Object.assign(ne, {
          name,
          endpoint: ne.name,
          id,
          version,
        });
        line.processing_time = nats.millis(line.processing_time);
        line.average_processing_time = nats.millis(
          line.average_processing_time,
        );
        stats.push(line);
      });
    },
  );

  console.log(stats);
  return 0;
}
async function info(
  cmd: Command,
  _args: string[],
  flags: Flags,
): Promise<number> {
  const nc = await createConnection(flags);
  const mc = nc.services.client();

  const infos = (await collect(await mc.info("w_demo"))).sort(
    (a, b) => {
      const A = `${a.name} ${a.version}`;
      const B = `${b.name} ${b.version}`;
      return B.localeCompare(A);
    },
  );
  if (infos.length) {
    console.log(infos);
  } else {
    cmd.stdout("no services found");
  }
  await nc.close();
  return 0;
}

root.addCommand({
  use: "add --name n --price 1",
  short: "add a product",
  run: add,
});

root.addCommand({
  use: "list",
  short: "lists all products",
  run: list,
});

root.addCommand({
  use: "get --name n",
  short: "get a product",
  run: get,
});

root.addCommand({
  use: "delete --name n",
  short: "delete a product",
  run: deleteH,
});

root.addCommand({
  use: "names",
  short: "lists all product names",
  run: names,
});

root.addCommand({
  use: "stats",
  short: "services status",
  run: status,
});

root.addCommand({
  use: "info",
  short: "services info",
  run: info,
});

Deno.exit(await root.execute(Deno.args));

import * as nats from "https://raw.githubusercontent.com/nats-io/nats.deno/js-s2/src/mod.ts";

const nc = await nats.connect({ servers: "127.0.0.1" });

const id = nats.nuid.next();
const jsm = await nc.jetstreamManager();
await jsm.consumers.add("products", {
  durable_name: id,
  deliver_policy: nats.DeliverPolicy.All,
  ack_policy: nats.AckPolicy.Explicit,
  filter_subject: "products.pencil",
  mem_storage: true,
});

const js = nc.jetstream();
// this is a new version of the JetStream API that will be released soon
const consumer = await js.consumers.get("products", id);

// we want up to 10 messages and we are willing to wait 1s for them
const iter = await consumer.fetch({ max_messages: 10, expires: 1000 });
for await (const p of iter) {
  if (!p.hasError) {
    const m = p.value!;
    console.log(m.json());
    m.ack();
  }
}

console.log(await consumer.info());

await nc.drain();

import * as nats from "https://raw.githubusercontent.com/nats-io/nats.ws/dev/src/mod.ts";

const nc = await nats.connect({ servers: "ws://127.0.0.1:80" });
const js = nc.jetstream();

// create an object store
const os = await js.views.os("files");

// make a chunk of data - could have just read a large file or something
const data = await Deno.readFile(
  "/Users/aricart/Dropbox/code/src/github.com/aricart/w_demo/04_views/os.ts",
);
// put it in the object store, but make sure that the max chunk size is 1024 bytes
// the library will split all the data, generate a digest.
const oi = await os.put(
  { name: "/tmp/os.ts", options: { max_chunk_size: 50 } },
  readableStreamFrom(data),
);
console.log(oi);

// reading it is similar to the KV
const e = await os.get("/tmp/os.ts");
// but because we deal with large data types the value is returned as a reader
// giving the opportunity to the client to deal with the chunks
const reader = e?.data.getReader();
let bytes = 0;
try {
  await Deno.stat("/tmp/os.ts");
  await Deno.remove("/tmp/os.ts");
} catch (_err) {
  // doesn't exist
}

while (true) {
  //@ts-ignore: we will just count the bytes
  const { done, value } = await reader?.read();
  if (done) {
    break;
  }
  Deno.writeFile("/tmp/os.ts", value, { append: true, mode: 644 });
  bytes += value.length;
}
console.log(`read ${bytes} bytes`);

await nc.drain();

function readableStreamFrom(data: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.enqueue(data);
      controller.close();
    },
  });
}

import { LOCAL_WS, nats } from "../nats.ts";

// connect
const nc = await nats.connect({ servers: [LOCAL_WS], debug: true });
// publish
nc.publish("hello", new TextEncoder().encode("hi there"));

// close the connection safely (typically this is not done unless you are stopping
// your service or something).
await nc.drain();

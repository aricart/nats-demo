import { nats } from "../nats.ts";

export function isProduct(p: Product): p is Product {
  return typeof p.name === "string" && typeof p.price === "number";
}

export type Product = {
  name: string;
  price: number;
};

const jc = nats.JSONCodec();

export class Products {
  data: Map<string, Product>;
  nc: nats.NatsConnection;
  srv!: nats.Service;

  constructor(nc: nats.NatsConnection) {
    // create a map to hold our products
    this.data = new Map<string, Product>();
    // store our connection
    this.nc = nc;
  }
  // we have some async initialization
  async start(): Promise<void> {
    // this is really the services framework for NATS
    // we give some info that will be used in discovery/monitoring
    this.srv = await this.nc.services.add({
      name: "w_demo",
      version: "0.0.1",
      statsHandler: (): Promise<unknown> => {
        return Promise.resolve({ products: this.data.size });
      },
    });

    // then we build endpoints - this one will answer to "products"
    // this should be familiar now - we have a callback (but could have
    // been an iterator)
    // we get some message, and do something, and return a response
    this.srv.addEndpoint(
      "products",
      (err: nats.NatsError | null, msg: nats.ServiceMsg) => {
        if (!this._ok(err)) {
          return;
        }
        // we are simply going to return all the values held in the map
        const buf = [];
        for (const v of this.data.values()) {
          buf.push(v);
        }
        msg.respond(jc.encode(buf));
      },
    );

    // a group is a base subject, from which we hang other
    // subjects and endpoints
    const g = this.srv.addGroup("products");

    // this will be products.add
    g.addEndpoint("add", (err: nats.NatsError | null, msg: nats.ServiceMsg) => {
      if (!this._ok(err)) {
        return;
      }
      // this one adds a product to the map - does some testing
      // and sends an error if not happy
      const p = msg.json<Product>();
      if (isProduct(p)) {
        this.data.set(p.name, p);
        msg.respond();
      } else {
        msg.respondError(400, "not a product");
      }
    });

    // products.delete
    g.addEndpoint(
      "delete",
      (err: nats.NatsError | null, msg: nats.ServiceMsg) => {
        if (!this._ok(err)) {
          return;
        }
        const name = msg.string();
        if (name && name.length > 0) {
          const ok = this.data.delete(name);
          if (ok) {
            return msg.respond();
          } else {
            return msg.respondError(404, "not found");
          }
        }
      },
    );

    // products.get
    g.addEndpoint("get", (err: nats.NatsError | null, msg: nats.ServiceMsg) => {
      if (!this._ok(err)) {
        return;
      }
      const name = msg.string();
      if (name && name.length > 0) {
        const p = this.data.get(name);
        if (p) {
          return msg.respond(jc.encode(p));
        } else {
          return msg.respondError(404, "not found");
        }
      }
    });

    // products.name
    g.addEndpoint(
      "names",
      (err: nats.NatsError | null, msg: nats.ServiceMsg) => {
        if (!this._ok(err)) {
          return;
        }
        const buf = [];
        for (const v of this.data.values()) {
          buf.push(v.name);
        }
        msg.respond(jc.encode(buf));
      },
    );
  }

  _ok(err: nats.NatsError | null): boolean {
    if (err) {
      console.error(err);
      this.srv.stop(err);
      return false;
    }
    return true;
  }
}

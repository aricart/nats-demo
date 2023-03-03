import { nats } from "../nats.ts";
import { Product } from "./products_service.ts";

const jc = nats.JSONCodec();
const sc = nats.StringCodec();

// This is a "Products" service client - it takes a NatsConnection
// and provides an API that may be more friendly to our code
export class ProductsClient {
  nc: nats.NatsConnection;
  constructor(nc: nats.NatsConnection) {
    this.nc = nc;
  }

  // The NATS extra stuff is done here, we have a single method
  // that takes a subject, and a possible payload
  async _request<T>(subject: string, payload?: unknown): Promise<T> {
    let bytes = nats.Empty;
    if (typeof payload === "string") {
      // if the payload is a string, encode as such
      bytes = sc.encode(payload);
    } else if (typeof payload === "object") {
      // otherwise encode JSON
      bytes = jc.encode(payload);
    }
    // we make a request
    const r = await this.nc.request(subject, bytes);
    // test the response for an error - remember that `respondError()`...
    if (nats.ServiceError.isServiceError(r)) {
      return Promise.reject(nats.ServiceError.toServiceError(r));
    }
    // if we got some data, resolve the decoded JSON
    if (r.data.length) {
      return Promise.resolve(r.json<T>());
    }
    // otherwise just resolve a promise
    return Promise.resolve() as Promise<T>;
  }

  add(p: Product): Promise<void> {
    return this._request(`products.add`, p);
  }

  delete(n: string): Promise<void> {
    return this._request(`products.delete`, n);
  }

  get(n: string): Promise<Product> {
    return this._request<Product>(`products.get`, n);
  }

  list(): Promise<Product[]> {
    return this._request<Product[]>(`products`);
  }

  names(): Promise<string[]> {
    return this._request<string[]>(`products.names`);
  }
}

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const ADD_ROUTE = new URLPattern({ pathname: "/add" });

function handler(req: Request): Response {
  if (ADD_ROUTE.exec(req.url)) {
    return new Response(JSON.stringify({ hello: "world" }));
  }
  return new Response("not found", { status: 404 });
}
serve(handler);

let r = await fetch("http://localhost:8000/add");
if (r.ok) {
  const data = await r.json();
  console.log(data);
}

r = await fetch("http://localhost:8000/delete");
if (!r.ok) {
  console.log(`got error: ${r.status} ${r.statusText}`);
}

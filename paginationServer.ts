import { randomUUID } from "crypto";
import { setTimeout } from "timers/promises";

const tokens = generateUUIDs(10);
const server = Bun.serve({
  async fetch(req: Request) {
    const url = new URL(req.url);
    if (url.pathname === "/processItem") {
      await setTimeout(50);
      return new Response(JSON.stringify(randomUUID()));
    }
    if (url.pathname === "/getItems") {
      await setTimeout(200);
      const startToken = url.searchParams.get("startToken");
      const index = startToken ? tokens.indexOf(startToken) : -1;
      return new Response(
        JSON.stringify({
          items: generateUUIDs(10),
          nextToken: tokens[index + 1],
        })
      );
    }
    if (url.pathname === "/saveResult") {
      await setTimeout(25);
      return new Response(JSON.stringify(randomUUID()));
    }
    return new Response("404!");
  },
  port: 3001,
});

console.log("Pagination server listening on port", server.port);

function generateUUIDs(qty: number) {
  return Array(qty)
    .fill(null)
    .map(() => randomUUID() as string);
}

import { randomUUID } from "crypto";
import { setTimeout } from "timers/promises";

const TOTAL_ITEMS = 100;
const BATCH_SIZE = 10;

const items = generateUUIDs(TOTAL_ITEMS);
const tokens = generateUUIDs(TOTAL_ITEMS / BATCH_SIZE - 1);
const server = Bun.serve({
  async fetch(req: Request) {
    const url = new URL(req.url);
    if (url.pathname === "/processItem") {
      await setTimeout(50);
      return new Response(JSON.stringify(randomUUID()));
    }
    if (url.pathname === "/getItems") {
      await setTimeout(200);
      const startToken = url.searchParams.get("nextToken");
      const index = startToken ? tokens.indexOf(startToken) + 1 : 0;
      const startPosition = index * BATCH_SIZE;
      return new Response(
        JSON.stringify({
          items: items.slice(startPosition, startPosition + BATCH_SIZE),
          nextToken: tokens[index],
          page: index,
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

import { randomUUID, randomInt } from "crypto";
import { setTimeout } from "timers/promises";

const company = Bun.file("./data/company.json");
const tokens = generateUUIDs(10);
const server = Bun.serve({
  async fetch(req: Request) {
    // Bun.sleepSync(randomInt(5, 15));
    const url = new URL(req.url);
    if (url.pathname === "/user") {
      return new Response(
        JSON.stringify({
          userId: url.searchParams.get("userId"),
          userName: "Sample user",
        })
      );
    }
    if (url.pathname === "/posts") {
      return new Response(
        JSON.stringify({
          posts: Array(10)
            .fill(null)
            .map(() => randomUUID()),
          nextToken: randomUUID(),
        })
      );
    }
    if (url.pathname === "/company") {
      await setTimeout(randomInt(250, 750));
      return new Response(company);
    }
    if (url.pathname === "/processItem") {
      await setTimeout(50);
    }
    if (url.pathname === "/getItems") {
      await setTimeout(150);
      const startToken = url.searchParams.get("startToken");
      const index = startToken ? tokens.indexOf(startToken) : -1;
      return new Response(
        JSON.stringify({
          items: generateUUIDs(10),
          nextToken: tokens[index + 1],
        })
      );
    }

    return new Response("404!");
  },
  port: 3001,
});

console.log("Listening on port", server.port);

function generateUUIDs(qty: number) {
  return Array(qty)
    .fill(null)
    .map(() => randomUUID() as string);
}

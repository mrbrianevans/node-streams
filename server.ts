import { randomUUID, randomInt } from "crypto";
import { setTimeout } from "timers/promises";

const company = Bun.file("./data/company.json");
const server = Bun.serve({
  async fetch(req: Request) {
    Bun.sleepSync(randomInt(5, 15));
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
    return new Response("404!");
  },
  port: 3001,
});

console.log("Wrong server listening on port", server.port);

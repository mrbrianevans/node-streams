async function getItems(startToken) {
  return fetch("http://localhost:3001/getItems?startToken=" + startToken).then(
    (res) => res.json()
  );
}
async function processItem(itemId) {
  return fetch("http://localhost:3001/processItem?item=" + itemId);
}
async function saveResult(output) {
  return fetch("http://localhost:3001/saveResult", {
    method: "POST",
    body: JSON.stringify(output),
  });
}

async function* loopThroughItems() {
  let nextToken = "";
  do {
    process.stdout.write(".");
    const res = await getItems(nextToken);
    nextToken = res.nextToken;
    for (const item of res.items) {
      yield item;
    }
  } while (nextToken);
  console.log();
}

async function processItems(itemsSource) {
  for await (const items of itemsSource) {
    console.log(items);
    await Promise.all(items.map((item) => processItem(item)));
  }
}

async function saveItems(outputSource) {
  for await (const output of outputSource) {
    await Promise.all(output.map((item) => saveResult(item)));
  }
}

console.time("pagination");
import { finished } from "node:stream/promises";
import { compose, Readable } from "node:stream";

await Readable.from(loopThroughItems())
  .map((items) => processItem(items), { concurrency: 100 })
  .map((items) => saveResult(items), { concurrency: 100 })
  .toArray();

console.timeEnd("pagination");

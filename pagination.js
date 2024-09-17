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
    yield res.items;
  } while (nextToken);
  console.log();
}

async function* processItems(itemsSource) {
  for await (const items of itemsSource) {
    yield await Promise.all(items.map((item) => processItem(item)));
  }
}

async function saveItems(outputSource) {
  for await (const output of outputSource) {
    await Promise.all(output.map((item) => saveResult(item)));
  }
}

console.time("pagination");
import { finished } from "node:stream/promises";
import { compose } from "node:stream";

const itemsSource = compose(loopThroughItems());
const stream = compose(itemsSource, processItems, saveItems);
await finished(stream);

console.timeEnd("pagination");

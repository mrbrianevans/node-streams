async function getItems(nextToken) {
  return fetch("http://localhost:3001/getItems?nextToken=" + nextToken).then(
    (res) => res.json()
  );
}
async function processItem(itemId) {
  return fetch("http://localhost:3001/processItem?item=" + itemId);
}

async function* loopThroughItems() {
  let nextToken = "";
  do {
    console.log("getting items with token", nextToken);
    const res = await getItems(nextToken);
    nextToken = res.nextToken;
    yield res.items;
  } while (nextToken);
}

async function processItems(itemsSource) {
  for await (const items of itemsSource) {
    await Promise.all(items.map((item) => processItem(item)));
  }
}

console.time("pagination");
import { compose } from "node:stream";
import { finished } from "node:stream/promises";

const itemsSource = compose(loopThroughItems());
const stream = compose(itemsSource, processItems);
await finished(stream);
console.timeEnd("pagination");

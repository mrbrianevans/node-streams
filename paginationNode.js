import { pipeline, finished } from "stream/promises";
import { Readable, compose } from "stream";

async function getItems(startToken) {
  return fetch("http://localhost:3001/getItems?startToken=" + startToken).then(
    (res) => res.json()
  );
}
async function processItem(item) {
  return fetch("http://localhost:3001/processItem?item=" + item);
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

// const itemStream = loopThroughItems();
// const itemStream = compose(loopThroughItems(), processItems);
// const itemStream = compose(loopThroughItems());
const itemStream = Readable.from(loopThroughItems());

// await finished(itemStream);
await pipeline(itemStream, processItems);

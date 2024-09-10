import { pipeline, finished } from "stream/promises";
import { Readable, compose } from "stream";

async function getItems(startToken) {
  return fetch("http://localhost:3001/getItems?startToken=" + startToken).then(
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

async function* processItems(itemsSource) {
  for await (const items of itemsSource) {
    yield await Promise.all(items.map((item) => processItem(item)));
  }
}

async function saveResult(output) {
  return fetch("http://localhost:3001/saveResult", {
    method: "POST",
    body: JSON.stringify(output),
  });
}

async function saveItems(outputSource) {
  for await (const output of outputSource) {
    await Promise.all(output.map((item) => saveResult(item)));
  }
}

// const items = loopThroughItems();
// const itemStream = Readable.from(items); // convert iterator to stream
// await processItems(items);

// const itemStream = loopThroughItems();
// const itemStream = compose(loopThroughItems(), processItems);
// const itemStream = compose(loopThroughItems());
// const itemStream = Readable.from(loopThroughItems());

// await finished(itemStream.pipe(compose(processItems)));
// await pipeline(itemStream, processItems);

// const itemsSource = loopThroughItems();
const itemsSource = compose(loopThroughItems()); // get source as stream
const stream = compose(itemsSource, processItems, saveItems); // connect streams together
await finished(stream);

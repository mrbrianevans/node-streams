import { pipeline } from "stream/promises";
import { Readable } from "stream";

async function getItems(startToken: string) {
  return fetch("http://localhost:3001/getItems?startToken=" + startToken).then(
    (res) => res.json()
  );
}
async function processItem(item: any) {
  return fetch("http://localhost:3001/processItem?item=" + item);
}

// let nextToken = "";
// do {
//   console.log("getting items with token", nextToken);
//   const res = await getItems(nextToken);
//   nextToken = res.nextToken;
//   //   for (const item of res.items) {
//   //     // some async process
//   //     await processItem(item);
//   //   }
//   await Promise.all(res.items.map((item) => processItem(item)));
// } while (nextToken);

async function* loopThroughItems() {
  let nextToken = "";
  do {
    console.log("getting items with token", nextToken);
    const res = await getItems(nextToken);
    nextToken = res.nextToken;
    yield res.items;
  } while (nextToken);
}

// for await (const items of loopThroughItems()) {
//   await Promise.all(items.map((item) => processItem(item)));
// }

async function processItems(itemsSource: AsyncIterable) {
  for await (const items of itemsSource) {
    await Promise.all(items.map((item) => processItem(item)));
  }
}

// const itemStream = loopThroughItems();
const itemStream = Readable.from(loopThroughItems());

await pipeline(itemStream, processItems);

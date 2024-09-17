# Pagination using Node.js stream

Think of a service where you can get a limited number of items with each HTTP request, and a token to get the next batch. (this is how dynamodb works for example, but its a common pattern. same applies with page limit and start offset)

### Interface

Lets define functions for `getItems` and `processItem`, both asynchronous since they're accessing HTTP services.

```js
async function getItems(startToken) {
  return fetch("http://localhost:3001/getItems?startToken=" + startToken).then(
    (res) => res.json()
  );
}
async function processItem(itemId) {
  return fetch("http://localhost:3001/processItem?item=" + itemId).then((res) =>
    res.json()
  );
}
```

### Naive implementation

If we wanted to loop through (scan) all items available and process each one, we might write something simple like this:

```js
// stage 1
let nextToken = "";
do {
  console.log("getting items with token", nextToken);
  const res = await getItems(nextToken);
  nextToken = res.nextToken;
  for (const item of res.items) {
    await processItem(item);
  }
} while (nextToken);
```

This uses a `do-while` loop to call `getItems` repeatedly until there is no continuation token returned. As long as a `nextToken` is returned, it will keep making more requests until it reaches the end.
For each response it loops over the batch of items returned and processes them one by one.

### `Promise.all`

You might already see a quick-win for how to improve the performance of this. The processItems promises don't depend on each other within each batch, so we could use `Promise.all` instead of a sequential for loop.

```js
// stage 2
await Promise.all(res.items.map((item) => processItem(item)));
```

That means that the items in each batch will be processed in parallel.

### Async iterator

Let's write this using an async iterator and `for await` loop.

```js
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

async function processItems(itemsSource) {
  for await (const items of itemsSource) {
    await Promise.all(items.map((item) => processItem(item)));
  }
}
```

The first function `loopThroughItems` is an async generator function with the same logic as before, except instead of processing incoming items, it yields each batch to the caller.
The second function `processItems` takes the generator output as its input, and asynchronously loops over the item batches and processes the items in each batch in parallel.

Invoking these functions could be done like this:

```js
// stage 3
const itemsSource = loopThroughItems();
await processItems(itemsSource);
```

This would have the same performance as the previous example (stage 2), but seperates the logic of processing items from requesting items with a continuation token.

### `stream.Readable`

Node.js ships with a built-in `stream` module, that provides tools for working with data streams.
In the example shown, we have a "stream" of items coming in and being processed.
By converting our async iterator to a stream we can improve on performance.

Think about the critical path of processing: while the first batch of items is being processed (the `Promise.all`), the `getItems` function is not being called. If this was called for the second batch while the first batch was being processed (since those are independent), we could save the time it takes to call `getItems` each iteration (except the first one).

To convert our async iterator to a stream, let's use the `stream.Readable` construct, which has a `from` static method that takes an iterator as its argument.

```js
// stage 4
import { Readable } from "node:stream";
const itemsSource = loopThroughItems(); // calling our async generator
const itemStream = Readable.from(itemsSource); // convert iterator to stream
await processItems(itemStream);
```

This is now faster than all the previous examples.

### Multi-step stream processing

Up until now we've only had one processing function on each item in the stream, but in real world data streams, there are often more steps than this, such as enriching each item before processing, sending each item to multiple different systems, marking an item as processed when finished (eg removing from queue) etc.

Let's implement a function to save the output of processing each item in a database.

```js
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
```

We can turn `processItems` itself into an async generator so that the output can be used in further steps:

```js
async function* processItems(itemsSource) {
  for await (const items of itemsSource) {
    yield await Promise.all(items.map((item) => processItem(item)));
  }
}
```

Now our calling code would look like this to include saving each output:

```js
// stage 5
import { Readable } from "node:stream";

const itemsSource = loopThroughItems();
const itemStream = Readable.from(itemsSource);

const outputSource = await processItems(itemStream);
const outputStream = Readable.from(outputSource);

await saveItems(outputStream);
```

And you can imagine in a real world scenario there may be many more such steps. Node.js provides some helpers to make it easier to chain together multiple streams and processers.

### `stream.promises.pipeline`

One of which is the `stream.promises.pipeline` function, which links together multiple streams, like `producer -> transform -> transform -> destination` for example.

```js
// stage 6
import { pipeline } from "node:stream/promises";

const itemsSource = loopThroughItems();
const itemStream = Readable.from(itemsSource);
await pipeline(itemStream, processItems, saveItems);
// all items complete!
```

The `pipeline` function here will return whatever the last processer (`saveItems`) returns.

### `stream.compose` and `stream.promises.finished`

Another way of writing this would be to use the `compose` and `finished` functions from the stream module.

```js
// stage 7
import { compose } from "node:stream";
import { finished } from "node:stream/promises";

const itemsSource = compose(loopThroughItems()); // get source as stream
const stream = compose(itemsSource, processItems, saveItems); // connect streams together
await finished(stream);
// all items complete!
```

Calling `compose` will convert the item source to a stream, giving the same performance benefits of converting it to a `Readable` stream.
`compose` is a highly flexible function and allows converting many types of generators, iterables and processing functions to their stream equivalent.

### Conclusion

We've looked at a typical example of scanning through a data set, performing some asynchronous processing such as calling an API or database for each item, and shown how by using the built-in Node.js `stream` module, performance can be improved as well as readability and composability.

# Node.js `stream`

Node.js provides a module to help with buidling data streaming pipelines.

```js
import { pipeline } from "node:stream/promises";
```

> This repo was made to accompany a talk given at the London Node User Group in September 2024.

This repo gives examples of using Node.js streams in common scenarios.

- pagination on the backend
- file compression

## `compose` streams

The `compose` function is a very versatile helper to convert different types of data sources, transformers and destinations into their streaming equivalent and also to compose multiple streams together into a single stream.

```js
import { compose } from "node:stream";
const dataSource = [1, 2, 3]; // can be any iterator or async iterator / iterable
const sourceStream = compose(dataSource);

const transformer = compose(async function* (inputStream) {
  for await (const item of inputStream) {
    yield item * 2;
  }
});

const outputStream = compose(sourceStream, transformer);

import { Readable } from "node:stream";
const result = await Readable.from(outputStream).toArray(); // [2, 4, 6]
console.log("Result", result);
```

## Pagination

The pagination example uses a mock API server running in a separate process to simulate asynchronous data fetching and processing. To start up the mock server, run `bun mockServer.ts` in a terminal.

Then to run the pagination example, use `node pagination.js`.

## Compression

The compression example uses a 400MB CSV gzipped. To get a suitable file, see the multiple file parts on https://download.companieshouse.gov.uk/en_output.html (each one is around 400MB). After downloading and unzipping one of these, use the `gzip` command line tool to gzip it to `data/companies.csv.gz`.

Then to run the compression script, use `node compression.js` or `bun compression.js` for performance improvements.

# Compression

GZIP is a compression algorithm which can be used to save storage space of large files in S3 or reduce network bandwidth when transferring them.
You can make a file smaller by gzipping it, then gunzip it to get the original back.

For this example, I'm going to be using the bulk file of company data provided by Companies House. Its a big CSV file that I've gzipped with the gzip command line tool.

> Original size: 379M. Gzipped size 70M. Time to gzip with cli: 17s. Time to gunzip with cli: 4s.

## Sync implementation

Let's write a nodejs script to gunzip the file contents and loop over each line, just counting the number of rows.

```js
import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";

const rawContent = await readFile(input);
const unzippedContent = gunzipSync(rawContent).toString("utf8");
await writeFile(output, unzippedContent);
```

## Stream implementation

If we didn't want to load the entire file into memory (if it was a larger file for example), we could do the same operation using streams.

```js
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";

const inputStream = createReadStream(input);
const outputStream = createWriteStream(output);
await pipeline(inputStream, createGunzip(), outputStream);
```

Switching to streaming would allow it to be scalable to much bigger files with reduced memory consumption.

### Composable

Using the `compose` function provided by `node:stream` we can compose the output stream in stages, to allow for potential re-use if we had another destination to write the output to other than a local file. For example, we could pipeline the output to an S3 bucket instead.

```js
const rawContent = createReadStream(input);
const unzipper = createGunzip();
const writeOutput = createWriteStream(output);
const readAndGunzip = compose(rawContent, unzipper);
const gunzipPipeline = compose(readAndGunzip, writeOutput);
await finished(gunzipPipeline);
```

## Changing runtime

If we wanted to get even quicker, we could try using a different javascript runtime to Node.js. Bun for example.

Where on my laptop Node.js takes more than 5 seconds, Bun takes less than 2 seconds. More than double as fast.

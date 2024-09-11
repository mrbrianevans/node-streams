import { existsSync, createReadStream, createWriteStream } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { createGunzip, gunzipSync } from "node:zlib";

const input = "data/companies.csv.gz";
const output = "data/companies.csv";
if (existsSync(output)) await rm(output); // remove output if it exists before starting

console.time("gunzip");
// sync impl
// const rawContent = await readFile(input);
// const unzippedContent = gunzipSync(rawContent).toString("utf8");
// await writeFile(output, unzippedContent);

// sync method takes approx 7 seconds in node.js. 2-3 seconds in bun.

// stream impl
const inputStream = createReadStream(input);
const outputStream = createWriteStream(output);
await pipeline(inputStream, createGunzip(), outputStream);
// stream takes 5-6 seconds in node. 2 seconds in bun

console.timeEnd("gunzip");

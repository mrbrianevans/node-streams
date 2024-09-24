import { existsSync, createReadStream, createWriteStream } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { finished, pipeline } from "node:stream/promises";
import { createGunzip, gunzipSync } from "node:zlib";
import { compose } from "node:stream";

// setup
const input = "data/companies.csv.gz";
const output = "data/companies.csv";
if (existsSync(output)) await rm(output); // remove output if it exists before starting

console.time("gunzip");
const rawContent = createReadStream(input);
const unzipper = createGunzip();
const writeOutput = createWriteStream(output);
const readAndGunzip = compose(rawContent, unzipper);
const gunzipPipeline = compose(readAndGunzip, writeOutput);
await finished(gunzipPipeline);
console.timeEnd("gunzip");

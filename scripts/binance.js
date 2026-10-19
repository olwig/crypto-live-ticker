#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { binance } from '../src/lib/binance.js';
import { mkdir } from 'node:fs/promises';

/*
try {
  const body = await binance.ping();
  console.log(JSON.stringify(body));
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
}*/

binance.buildIndex().then(async () => {
  const symbols = binance.index;
  
  console.log(symbols);

  await mkdir('./tmp', { recursive: true });
  await writeFile('./tmp/symbols.json', `${JSON.stringify(symbols, null, 2)}\n`);
}).catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});

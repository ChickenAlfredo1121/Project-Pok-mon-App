// Shared helpers for the scheduled jobs
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient, ServerApiVersion } from 'mongodb';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

export const API = 'https://api.tcgdex.net/v2/en';
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const log = (...args) => console.log(new Date().toISOString(), ...args);

// connects to MongoDB with the same Stable API settings as mongo.js
export function connect() {
  const client = new MongoClient(process.env.MONGO_URI, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
  });
  return { client, db: client.db('pokedata') };
}

// GET a URL and return the parsed JSON. waits and retries on errors 
export async function getJson(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    let res = null;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    } catch { /* network error or timeout: fall through and retry */ }
    if (res?.ok) return res.json();
    if (res?.status === 404) return null;
    const retryAfter = Number(res?.headers.get('retry-after'));
    await sleep(retryAfter > 0 ? retryAfter * 1000 : Math.min(60000, 2000 * 2 ** i));   // 2s, 4s, 8s, ... up to 60s
  }
  throw new Error('gave up on ' + url);
}

// runs fn on every item, with at most `size` running at the same time
export async function runPool(items, size, fn) {
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) {
      const i = next++;
      await fn(items[i], i);
    }
  }));
}

// saves a note about a finished run in a "jobruns" collection, so you can check that the jobs are really running
export async function recordRun(db, job, startedAt, stats) {
  await db.collection('jobruns').insertOne({ job, startedAt, finishedAt: new Date(), stats });
}
// Daily job: refresh price of all cards
import { connect, API, getJson, runPool, sleep, log, recordRun } from './lib.js';

const ownedOnly = process.argv.includes('--owned');
const limit = Number(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1]) || 0;
const CONCURRENCY = 4;   
const PAUSE_MS = 100;    

const { client, db } = connect();
const cards = db.collection('cards');
const startedAt = new Date();
const stats = { checked: 0, updated: 0, unchanged: 0, noPrice: 0, notFound: 0, failed: 0 };

try {
  let filter = {};
  if (ownedOnly) {
    const owned = await db.collection('usercards').aggregate([{ $group: { _id: '$cardId' } }]).toArray();
    filter = { _id: { $in: owned.map(o => o._id) } };
  }
  let list = await cards.find(filter, { projection: { cardId: 1, cardPrice: 1 } }).toArray();
  list = list.filter(c => typeof c.cardId === 'string');
  if (limit) list = list.slice(0, limit);
  log('refreshing prices for', list.length, 'cards');

  const pending = [];   // database updates waiting to be written as a batch
  const flush = async () => {
    if (pending.length) await cards.bulkWrite(pending.splice(0), { ordered: false });
  };

  await runPool(list, CONCURRENCY, async (c) => {
    try {
      const d = await getJson(`${API}/cards/${encodeURIComponent(c.cardId)}`);
      stats.checked++;
      if (!d) { stats.notFound++; return; }

      // same shape as its already in DB
      const price = { cardmarket: d.pricing?.cardmarket ?? null, tcgplayer: d.pricing?.tcgplayer ?? null };
      if (!price.cardmarket && !price.tcgplayer) { stats.noPrice++; return; }   // keep the old price instead of wiping it
      if (JSON.stringify(price) === JSON.stringify(c.cardPrice)) { stats.unchanged++; return; }

      pending.push({ updateOne: { filter: { _id: c._id }, update: { $set: { cardPrice: price, priceUpdatedAt: new Date() } } } });
      stats.updated++;
      if (pending.length >= 200) await flush();
    } catch (err) {
      stats.failed++;
      log('failed:', c.cardId, err.message);
    } finally {
      await sleep(PAUSE_MS);
    }
  });
  await flush();

  log('done', stats);
  await recordRun(db, 'updatePrices', startedAt, stats);
  if (stats.failed > list.length * 0.05) process.exitCode = 1;   // more than 5% failed: mark the run as failed
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await client.close();
}
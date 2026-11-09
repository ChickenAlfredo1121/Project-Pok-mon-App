import 'dotenv/config';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient, ServerApiVersion } from 'mongodb';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = join(__dirname, '../pages/images');
const DATA_DIR = 'C:/Users/BakedPotato/Desktop/cardList/pokemon-tcg-data';   // <-- where you cloned it

const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});
const cards = client.db('pokedata').collection('cards');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// lowercase, letters and digits only, so "Poké Card" and "poke card" compare equal
const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// "001" -> "1", "H01" -> "H1", "CC008" -> "CC8"
const normNum = s => String(s ?? '').toUpperCase().replace(/^([A-Z]*)0+(?=\d)/, '$1');

// ---- load the whole dump into memory ----
const sets = JSON.parse(await fs.readFile(join(DATA_DIR, 'sets/en.json'), 'utf8'));
const setNameById = new Map(sets.map(s => [s.id, s.name]));

const byId = new Map();     // "base1-4" -> { img, setId }
const byName = new Map();   // normalized card name -> [{ setId, setName, setN, number, img }]

for (const file of await fs.readdir(join(DATA_DIR, 'cards/en'))) {
  if (!file.endsWith('.json')) continue;
  const setId = file.replace('.json', '');
  const list = JSON.parse(await fs.readFile(join(DATA_DIR, 'cards/en', file), 'utf8'));
  for (const c of list) {
    const img = c.images?.large ?? c.images?.small;
    if (!img) continue;

    byId.set(c.id, { img, setId });

    const key = norm(c.name);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push({
      setId,
      setName: setNameById.get(setId),
      setN: norm(setNameById.get(setId)),
      number: normNum(c.number),
      img
    });
  }
}
console.log(`Loaded ${byId.size} cards from the dump`);

// ---- matching ----
const learned = new Map();   // your cardSetName -> dump set id (filled in below)

function findImage(card) {
  // 1. exact id match (works for many older sets)
  const idHit = byId.get(card.cardId);
  if (idHit) return { url: idHit.img, setId: idHit.setId, how: 'id' };

  const hits = byName.get(norm(card.cardName)) ?? [];
  if (!hits.length) return { how: 'noName' };

  const num = normNum(card.cardLocalId);

  // 2. same set name + same number
  const exact = hits.find(h => h.setN === norm(card.cardSetName) && h.number === num);
  if (exact) return { url: exact.img, setId: exact.setId, how: 'setNumber' };

  // 3. set learned from other confident matches + same number
  const learnedId = learned.get(card.cardSetName);
  if (learnedId) {
    const viaMap = hits.find(h => h.setId === learnedId && h.number === num);
    if (viaMap) return { url: viaMap.img, setId: viaMap.setId, how: 'learnedSet' };
  }

  // 4. only one card has this name anywhere
  if (hits.length === 1) return { url: hits[0].img, setId: hits[0].setId, how: 'uniqueName' };

  return { how: 'ambiguous', hits };
}

// ---- learn set mappings from every card that already matches confidently ----
const everyCard = await cards.find({}, {
  projection: { cardId: 1, cardName: 1, cardSetName: 1, cardLocalId: 1 }
}).toArray();

const votes = new Map();   // cardSetName -> Map(setId -> count)
for (const c of everyCard) {
  const r = findImage(c);
  if (r.how === 'id' || r.how === 'setNumber') {
    const m = votes.get(c.cardSetName) ?? new Map();
    m.set(r.setId, (m.get(r.setId) ?? 0) + 1);
    votes.set(c.cardSetName, m);
  }
}
for (const [name, m] of votes) {
  learned.set(name, [...m.entries()].sort((a, b) => b[1] - a[1])[0][0]);
}
console.log('Learned set mappings:', Object.fromEntries(learned));

// ---- cards that still need an image ----
const missingFilter = {
  cardImageFull: { $exists: false },
  $or: [{ cardImage: null }, { cardImage: '' }, { cardImage: { $exists: false } }]
};
const missing = await cards.find(missingFilter).toArray();
console.log(`${missing.length} cards still need an image`);

await fs.mkdir(IMAGES_DIR, { recursive: true });
const tally = { saved: 0, noName: 0, ambiguous: 0, downloadFailed: 0 };
const unmatched = [];

for (const c of missing) {
  const { url, how, hits } = findImage(c);

  if (!url) {
    tally[how]++;
    const options = hits
      ? ' -> ' + hits.slice(0, 8).map(h => `${h.setName} #${h.number}`).join(' | ')
      : '';
    unmatched.push(`${how}: ${c.cardName} | ${c.cardSetName} #${c.cardLocalId}${options}`);
    continue;
  }

  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error('status ' + r.status);
    const file = `${c._id}.png`;
    await fs.writeFile(join(IMAGES_DIR, file), Buffer.from(await r.arrayBuffer()));
    await cards.updateOne({ _id: c._id }, { $set: { cardImageFull: `/images/${file}` } });
    tally.saved++;
    if (tally.saved % 25 === 0) console.log(`saved ${tally.saved}...`);
  } catch (err) {
    tally.downloadFailed++;
    unmatched.push(`downloadFailed: ${c.cardName} | ${c.cardSetName} #${c.cardLocalId} (${err.message}) ${url}`);
  }
  await sleep(250);
}

await fs.writeFile(join(__dirname, 'unmatched.txt'), unmatched.join('\n'));
console.log('Summary:', tally);
console.log('Unmatched cards listed in server/unmatched.txt');
await client.close();
// Weekly job to add cards and images
import { connect, API, getJson, sleep, log, recordRun } from './lib.js';

const dry = process.argv.includes('--dry');
const PAUSE_MS = 150;

const { client, db } = connect();
const cards = db.collection('cards');
const startedAt = new Date();
const stats = { setsChecked: 0, newCards: 0, imagesFilled: 0, failed: 0 };

// turns a TCGdex card into a doc like in the DB
function toCardDoc(c) {
  return {
    cardId: c.id,
    cardAttacks: c.attacks ?? null,
    cardCount: c.set?.cardCount?.official ?? null,
    cardDescription: c.description ?? null,
    cardEvolveFrom: c.evolveFrom ?? null,
    cardHp: c.hp ?? null,
    cardIll: c.illustrator ?? null,
    cardImage: c.image ?? null,
    cardLocalId: c.localId,
    cardName: c.name,
    cardPrice: { cardmarket: c.pricing?.cardmarket ?? null, tcgplayer: c.pricing?.tcgplayer ?? null },
    cardRarity: c.rarity ?? null,
    cardResistances: c.resistances ?? null,
    cardRetreat: c.retreat ?? null,
    cardSetName: c.set?.name ?? null,
    cardStage: c.stage ?? null,
    cardType: c.types ?? null,
    cardWeaknesses: c.weaknesses ?? null
  };
}

try {
  // what the database has now card_id and does it have an image
  const have = new Map();
  const countBySet = new Map();
  const setsMissingImages = new Set();
  const all = await cards.find({}, { projection: { cardId: 1, cardImage: 1 } }).toArray();
  for (const c of all) {
    if (typeof c.cardId !== 'string') continue;
    have.set(c.cardId, { _id: c._id, hasImage: !!c.cardImage });
    const setId = c.cardId.slice(0, c.cardId.lastIndexOf('-'));   // "swsh3-136" -> "swsh3"
    countBySet.set(setId, (countBySet.get(setId) ?? 0) + 1);
    if (!c.cardImage) setsMissingImages.add(setId);
  }

  // only open the sets that have more cards on TCGdex than we have, or that have cards without an image
  const sets = await getJson(`${API}/sets`);
  const toCheck = sets.filter(s =>
    (countBySet.get(s.id) ?? 0) < (s.cardCount?.total ?? 0) || setsMissingImages.has(s.id));
  log(`${sets.length} sets on TCGdex, checking ${toCheck.length}`);

  for (const s of toCheck) {
    try {
      const set = await getJson(`${API}/sets/${encodeURIComponent(s.id)}`);
      await sleep(PAUSE_MS);
      if (!set) continue;
      stats.setsChecked++;

      // compare the set's card list with the database
      const imageOps = [], fresh = [];
      for (const b of set.cards ?? []) {
        const mine = have.get(b.id);
        if (!mine) fresh.push(b);                                  // we don't have this card at all
        else if (!mine.hasImage && b.image) {                      // we have it, and TCGdex now has an image
          imageOps.push({ updateOne: { filter: { _id: mine._id }, update: { $set: { cardImage: b.image } } } });
        }
      }

      // images that TCGdex has added since last time
      if (imageOps.length) {
        log(set.name + ':', imageOps.length, 'new images');
        if (!dry) await cards.bulkWrite(imageOps, { ordered: false });
        stats.imagesFilled += imageOps.length;
      }

      // new card, fetch each one in full, then insert them together
      if (fresh.length) {
        log(set.name + ':', fresh.length, 'new cards:',
          fresh.slice(0, 5).map(b => b.name).join(', ') + (fresh.length > 5 ? ', ...' : ''));
        const docs = [];
        for (const b of fresh) {
          const full = await getJson(`${API}/cards/${encodeURIComponent(b.id)}`);
          if (full) docs.push(toCardDoc(full));
          await sleep(PAUSE_MS);
        }
        if (!dry && docs.length) await cards.insertMany(docs, { ordered: false });
        stats.newCards += docs.length;
      }
    } catch (err) {
      stats.failed++;
      log('failed on set', s.id, err.message);
    }
  }

  log(dry ? 'DRY RUN, nothing was written:' : 'done', stats);
  if (!dry) await recordRun(db, 'syncCards', startedAt, stats);
  if (stats.failed > 0) process.exitCode = 1;
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await client.close();
}
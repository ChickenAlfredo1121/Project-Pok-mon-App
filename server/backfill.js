import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});
const cards = client.db('pokedata').collection('cards');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// other languages to try if the English card has no image
const LANGS = ['fr', 'de', 'es', 'it', 'pt-br', 'ja'];

async function findImageAnyLanguage(id) {
  for (const lang of LANGS) {
    try {
      const r = await fetch(`https://api.tcgdex.net/v2/${lang}/cards/${encodeURIComponent(id)}`);
      if (!r.ok) continue;
      const d = await r.json();
      if (d.image) return d.image;
    } catch { }
    await sleep(150);
  }
  return null;
}

// cards missing an image or a price (skips ones this script already tried)
const missing = await cards.find({
  priceCheckedAt: { $exists: false },
  $or: [
    { cardImage: { $in: [null, ''] } },
    { cardImage: { $exists: false } },
    { cardPrice: null },
    { cardPrice: { $exists: false } },
    { 'cardPrice.cardmarket': null, 'cardPrice.tcgplayer': null }
  ]
}).toArray();

console.log(`${missing.length} cards to check`);

for (const c of missing) {
  try {
    const r = await fetch(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(c.cardId)}`);
    if (!r.ok) { console.log('skip', c.cardName, r.status); continue; }
    const d = await r.json();

    const set = { priceCheckedAt: new Date() };

    // image
    if (!c.cardImage) {
      if (d.image) {
        set.cardImage = d.image;
      } else {
        const img = await findImageAnyLanguage(c.cardId);
        if (img) set.cardImage = img;
      }
    }

    // price
    const noPrice = !c.cardPrice || (!c.cardPrice.cardmarket && !c.cardPrice.tcgplayer);
    if (noPrice && d.pricing) set.cardPrice = d.pricing;

    await cards.updateOne({ _id: c._id }, { $set: set });
    console.log('checked', c.cardName, '|', Object.keys(set).filter(k => k !== 'priceCheckedAt').join(', ') || 'nothing new');
  } catch (err) {
    console.error('error', c.cardName, err.message);
  }
  await sleep(150);
}

await client.close();
console.log('Done.');
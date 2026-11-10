// require('dotenv').config()
import 'dotenv/config';
// const { MongoClient, ServerApiVersion } = require('mongodb');
import { MongoClient, ServerApiVersion } from 'mongodb';
import express from 'express'
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ObjectId } from 'mongodb';
import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const uri = process.env.MONGO_URI;

app.use(express.static(join(__dirname, '../pages')));
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//accesses the database
const db = client.db('pokedata');
const collection = db.collection('cards');

const userCards = db.collection('usercards');
const DEMO_USER = 'stone'; //my first user, my roommate

await userCards.createIndex({ userId: 1, cardId: 1 }, { unique: true });

//helper function for the filter
function buildCardFilter({ name = '', set = '', type = '' }) {
  const filter = {};
  name = name.trim(); set = set.trim(); type = type.trim();

  //replaces all special characters
  if (name) {
    const safe = name
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/[\s-]+/g, '[\\s-]*');
    filter.cardName = { $regex: safe, $options: 'i' };
  }
  if (set) filter.cardSetName = set;
  if (type) filter.cardType = type;
  return filter;
}

//money conversion cached so its not pulled every time
let fxCache = { rate: null, fetchedAt: 0 };
const FX_TTL = 12 * 60 * 60 * 1000; //refreshed at most once every 12 hours


//fetches exchange rate from EUR to USD
async function getEurToUsd() {
  if (fxCache.rate && Date.now() - fxCache.fetchedAt < FX_TTL) return fxCache.rate;
  try {
    const r = await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD'); ///found this link for conversion from EUR to USD since API only had EUR prices
    if (!r.ok) throw new Error('FX status ' + r.status);
    const data = await r.json();
    const rate = data?.rates?.USD;
    if (typeof rate !== 'number') throw new Error('Unexpected FX response');
    fxCache = { rate, fetchedAt: Date.now() };
    return rate;
  } catch (err) {
    console.error('FX fetch failed:', err);
    return fxCache.rate; // last known rate if we have one, if not its null
  }
}

// one USD price per card or null if no price available
function cardPriceUsd(card, eurToUsd) {
  const cm = card.cardPrice?.cardmarket;
  const eur = cm?.trend ?? cm?.avg;
  if (typeof eur === 'number' && eurToUsd) {
    return Math.round(eur * eurToUsd * 100) / 100;
  }

  // fallback: use TCGDex USD prices (holo prices)
  const tcg = card.cardPrice?.tcgplayer;
  if (tcg) {
    for (const v of Object.values(tcg)) {
      if (v && typeof v === 'object' && typeof v.marketPrice === 'number') return v.marketPrice;
    }
  }
  return null;
}

//connects to the start file Home
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../pages', 'Home.html'));
})



//search function, checks if there is any type of match. if there is it sends it back as JSON
app.get('/api/cards/search', async (req, res) => {
  const name = (req.query.name ?? '').trim();
  const set = (req.query.set ?? '').trim();
  const type = (req.query.type ?? '').trim();

  if (!name && !set && !type) {
    return res.status(400).json({ error: 'at least one filter is required' });
  }

  const filter = {};
  if (name) {
    const safe = name
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') //can limit array amount for testing. took out during deployment
      .replace(/[\s-]+/g, '[\\s-]*');
    filter.cardName = { $regex: safe, $options: 'i' };
  }
  if (set) filter.cardSetName = set;   // matches if the array contains it
  if (type) filter.cardType = type;    // matches if the array contains it

  try {
    const cards = await collection.find(filter).toArray();
    const eurToUsd = await getEurToUsd(); //price conversion
    res.json(cards.map(c => ({ ...c, priceUsd: cardPriceUsd(c, eurToUsd) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

//this is used for the set filter
app.get('/api/cards/sets', async (req, res) => {
  try {
    const rows = await collection.aggregate([
      { $match: { cardSetName: { $type: 'string', $ne: '' } } },
      { $group: { _id: '$cardSetName' } },
      { $sort: { _id: 1 } }
    ]).toArray();

    res.json(rows.map(r => r._id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load sets' });
  }
});


// add one copy of a card to the user's collection
app.post('/api/user/cards', async (req, res) => {
  const { cardId } = req.body ?? {};
  if (!ObjectId.isValid(cardId)) {
    return res.status(400).json({ error: 'invalid cardId' });
  }

  try {
    const cardObjectId = new ObjectId(cardId);

    const card = await collection.findOne(
      { _id: cardObjectId },
      { projection: { cardName: 1, cardSetName: 1 } }
    );
    if (!card) return res.status(404).json({ error: 'card not found' });

    const doc = await userCards.findOneAndUpdate(
      { userId: DEMO_USER, cardId: cardObjectId },
      {
        $inc: { quantity: 1 },
        $set: { cardName: card.cardName, cardSetName: card.cardSetName },
        $setOnInsert: { addedAt: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({ quantity: doc.quantity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add card' });
  }
});

// get the user's cards, each with its quantity
app.get('/api/user/cards', async (req, res) => {
  try {
    const owned = await userCards.find({ userId: DEMO_USER }).toArray();
    const filter = buildCardFilter(req.query);
    filter._id = { $in: owned.map(o => o.cardId) };

    const cards = await collection.find(filter).sort({ cardName: 1 }).toArray();
    const eurToUsd = await getEurToUsd();

    const qty = new Map(owned.map(o => [String(o.cardId), o.quantity]));
    res.json(cards.map(c => ({
      ...c,
      quantity: qty.get(String(c._id)),
      priceUsd: cardPriceUsd(c, eurToUsd)
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load collection' });
  }
});

//for removing a card from a users account
app.delete('/api/user/cards/:cardId', async (req, res) => {
  const { cardId } = req.params;
  if (!ObjectId.isValid(cardId)) {
    return res.status(400).json({ error: 'invalid cardId' });
  }

  try {
    const id = new ObjectId(cardId);

    // more than one copy, decrement
    const updated = await userCards.findOneAndUpdate(
      { userId: DEMO_USER, cardId: id, quantity: { $gt: 1 } },
      { $inc: { quantity: -1 } },
      { returnDocument: 'after' }
    );
    if (updated) return res.json({ quantity: updated.quantity });

    // if last copy, delete row
    const del = await userCards.deleteOne({ userId: DEMO_USER, cardId: id, quantity: { $lte: 1 } });
    if (!del.deletedCount) return res.status(404).json({ error: 'card not in collection' });

    res.json({ quantity: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not remove card' });
  }
});

// every distinct card name, used by the scanner to snap OCR text to a real name
app.get('/api/cards/names', async (req, res) => {
  try {
    const rows = await collection.aggregate([
      { $match: { cardName: { $type: 'string' } } },
      { $group: { _id: '$cardName' } }
    ]).toArray();
    res.json(rows.map(r => r._id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load names' });
  }
});

//start up server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
}); 

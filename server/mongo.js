import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';
import express from 'express'
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ObjectId } from 'mongodb';
import dns from 'node:dns';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
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
const users = db.collection('users');
const sessions = db.collection('sessions');

await userCards.createIndex({ userId: 1, cardId: 1 }, { unique: true });
await users.createIndex({ usernameLower: 1 }, { unique: true });   // no two accounts with the same name
await sessions.createIndex({ tokenHash: 1 }, { unique: true });
// MongoDB deletes expired sessions
try { await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); }
catch (err) { console.error('Could not create the session cleanup index:', err.message); }

//helper function for the filter
function buildCardFilter({ name = '', set = '', type = '' }) {
  const filter = {};
  name = name.trim(); set = set.trim(); type = type.trim();

  //reads special characters as literals
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
    const r = await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD'); //found this link for conversion from EUR to USD since API only had EUR prices
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
// account and login
const scrypt = promisify(crypto.scrypt);
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;   // a login lasts 30 days
const COOKIE = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };
const USERNAME_RE = /^[A-Za-z0-9_]{3,24}$/;
const DUMMY_SALT = crypto.randomBytes(16);   

// a slow hash with salt
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return salt.toString('base64') + ':' + hash.toString('base64');
}

// hashes typed password and compare it
async function checkPassword(password, stored) {
  const [saltB64, hashB64] = String(stored).split(':');
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(password, salt, expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// the server stores a hash of the login token, so a copy of the database can't be used to log in
const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');

// reads one cookie from the request
function readCookie(req, name) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

// logs a browser in, makes a token and saves the hash
async function startSession(res, userId, username) {
  const token = crypto.randomBytes(32).toString('base64url');
  await sessions.insertOne({ tokenHash: hashToken(token), userId, username, expiresAt: new Date(Date.now() + SESSION_MS) });
  res.cookie('sid', token, { ...COOKIE, maxAge: SESSION_MS });
}

// runs before every /api route to find out who is logged in
async function attachUser(req, res, next) {
  try {
    const token = readCookie(req, 'sid');
    if (token) {
      const s = await sessions.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
      if (s) req.user = { userId: s.userId, username: s.username };
    }
  } catch (err) { console.error(err); }
  next();
}

// put this in front of any route that needs a logged-in user
function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'login required' });
  next();
}

// slows down password guessing, at most 10 tries per 15 minutes for each key
const attempts = new Map();
function tooManyAttempts(key) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || a.resetAt < now) { attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 }); return false; }
  a.count++;
  return a.count > 10;
}

app.use('/api', attachUser);

// create an account and log in
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Username must be 3 to 24 letters, numbers or underscores' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 200) {
    return res.status(400).json({ error: 'Password must be 8 to 200 characters' });
  }
  if (tooManyAttempts('register|' + req.ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  }

  try {
    const usernameLower = username.toLowerCase();
    await users.insertOne({ username, usernameLower, passwordHash: await hashPassword(password), createdAt: new Date() });
    await startSession(res, usernameLower, username);
    res.json({ username });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'That username is taken' });
    console.error(err);
    res.status(500).json({ error: 'Could not create the account' });
  }
});

// log in
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string' || password.length > 200) {
    return res.status(400).json({ error: 'Enter a username and password' });
  }
  const usernameLower = username.trim().toLowerCase();
  const key = 'login|' + req.ip + '|' + usernameLower;
  if (tooManyAttempts(key)) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });

  try {
    const user = await users.findOne({ usernameLower });
    // for an unknown username, still do the slow hash, so response time doesn't reveal which names exist
    const ok = user ? await checkPassword(password, user.passwordHash)
      : (await scrypt(password, DUMMY_SALT, 64), false);
    if (!ok) return res.status(401).json({ error: 'Wrong username or password' });

    attempts.delete(key);
    await startSession(res, user.usernameLower, user.username);
    res.json({ username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not log in' });
  }
});

// log out
app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = readCookie(req, 'sid');
    if (token) await sessions.deleteOne({ tokenHash: hashToken(token) });
  } catch (err) { console.error(err); }
  res.clearCookie('sid', COOKIE);
  res.json({ ok: true });
});

// who is logged in right now (username is null when nobody is)
app.get('/api/auth/me', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ username: req.user?.username ?? null });
});

//connects to the start file Home
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../pages', 'Home.html'));
})



//search function, checks if there is any type of match, needs at least one parameter. if there is it sends it back as JSON
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
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/[\s-]+/g, '[\\s-]*');
    filter.cardName = { $regex: safe, $options: 'i' };
  }
  if (set) filter.cardSetName = set;   // matches if the array contains it
  if (type) filter.cardType = type;

  try {
    const cards = await collection.find(filter).toArray();
    const eurToUsd = await getEurToUsd(); //price conversion
    res.json(cards.map(c => ({ ...c, priceUsd: cardPriceUsd(c, eurToUsd) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

//this is used for the set filter, returns set name once (A-Z)
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
app.post('/api/user/cards', requireUser, async (req, res) => {
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
      { userId: req.user.userId, cardId: cardObjectId },
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
app.get('/api/user/cards', requireUser, async (req, res) => {
  try {
    const owned = await userCards.find({ userId: req.user.userId }).toArray();
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
app.delete('/api/user/cards/:cardId', requireUser, async (req, res) => {
  const { cardId } = req.params;
  if (!ObjectId.isValid(cardId)) {
    return res.status(400).json({ error: 'invalid cardId' });
  }

  try {
    const id = new ObjectId(cardId);

    // more than one copy, decrement
    const updated = await userCards.findOneAndUpdate(
      { userId: req.user.userId, cardId: id, quantity: { $gt: 1 } },
      { $inc: { quantity: -1 } },
      { returnDocument: 'after' }
    );
    if (updated) return res.json({ quantity: updated.quantity });

    // if last copy, delete row
    const del = await userCards.deleteOne({ userId: req.user.userId, cardId: id, quantity: { $lte: 1 } });
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

// every card in compact form (name, printed number, set), so the scanner can check that a name and a number belong together
app.get('/api/cards/index', async (req, res) => {
  try {
    const rows = await collection
      .find({}, { projection: { cardName: 1, cardLocalId: 1, cardSetName: 1 } })
      .toArray();
    res.json(rows.map(r => ({ id: r._id, n: r.cardName, l: r.cardLocalId, s: r.cardSetName })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load card index' });
  }
});
// one card by id, with its USD price, for the scanner's result popup
app.get('/api/card/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'invalid id' });
  try {
    const card = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!card) return res.status(404).json({ error: 'card not found' });
    const eurToUsd = await getEurToUsd();
    res.json({ ...card, priceUsd: cardPriceUsd(card, eurToUsd) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load card' });
  }
});

//start up server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
}); 

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

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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




//connects to the start pahe Home
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../pages', 'Home.html'));
})


//search function, checks if there is a name. if there is it seraches for the card and prints the results in an array
app.get('/api/cards/search', async (req, res) => {
  const name = (req.query.name ?? '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });

  // escape regex characters so user input can't act as a pattern
  const safe = name
  .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')   
  .replace(/[\s-]+/g, '[\\s-]*');            

  try {
    const cards = await collection
      .find({ cardName: { $regex: safe, $options: 'i' } }) 
      .toArray();
    res.json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

//this is used for the set filter
app.get('/api/cards/sets', async (req, res) => {
  const sets = await collection.distinct('cardSetName');
  res.json(sets.filter(Boolean).sort());
});


//start up server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
}); 
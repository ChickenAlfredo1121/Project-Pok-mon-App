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

app.use(express.static(join(__dirname, '../public')));
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const db = client.db('pokedata');
const collection = db.collection('cards');





app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public', 'Home.html'));
})


//iss09. get one GET ONE
app.get('/api/items/:id', async function (req, res) {

  const id =
    new ObjectId(
      req.params.id
    );

  const record =
    await collection
      .findOne({
        _id: id
      });

  res.json(record);

}
);

//start up server

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
}); 
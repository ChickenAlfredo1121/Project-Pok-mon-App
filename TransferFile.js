const { Client } = require('pg')
const fs = require('node:fs');
const path = require('path');

//connection to server
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'pokedata',
  user: 'postgres',
  password: 'pass'
})


//obtains all cards and insert the data into the database
async function main() {
  try {
    //check if there is a connection
    await client.connect()
    const res = await client.query('SELECT $1::text as message', ['Hello world!'])
    console.log(res.rows[0].message)

    //--------------------------------------------------------------
    //get set IDs
    //set a default for the id and url so that way we can transverse the data
    const id = '';
    const url = `https://api.tcgdex.net/v2/en/sets/${id}`;
    //get a connection to the url
    const response = await fetch(url);
    //grab the data out of the url
    const data = await response.json();
    //----------------------------------------------------------
    //checking how many sets and cards it goes through when it displays
    //all cards to make sure it is running properly
    let setCount = 0
    let cardCounter = 0

    //need to get list of cards now that i know the sets
    //transverse through the data by each item ti get individual cards
    for (const set of data) {

      setCount++
      console.log(`Processing set ${setCount}/${data.length}: ${set.id}`)

      //get first sets name
      const setId = set.id; //the name we just got
      const setUrl = `https://api.tcgdex.net/v2/en/sets/${setId}`;

      const setResponse = await fetch(setUrl);
      const cardData = await setResponse.json();
      //now that we have the first set we need to transverse 
      // all of its cards before we go on to the next one
      for (const card of cardData.cards) {

        cardCounter++

        const cardId = card.id;
        const cardUrl = `https://api.tcgdex.net/v2/en/cards/${cardId}`;

        const cardResponse = await fetch(cardUrl);
        const cardInfo = await cardResponse.json();

        const cardIll = cardInfo.illustrator;
        const cardImage = cardInfo.image;
        const cardLocalId = cardInfo.localId;
        const cardName = cardInfo.name;
        const cardRarity = cardInfo.rarity;
        const cardCount = cardInfo.set?.cardCount?.total ?? null; 
        const cardSetName = cardInfo.set?.name ?? null;
        const cardHp = cardInfo.hp;
        const cardType = cardInfo.types;
        const cardEvolveFrom = cardInfo.evolveFrom;
        const cardDescription = cardInfo.description;
        const cardStage = cardInfo.stage;
        const cardAttacks = cardInfo.attacks; 
        const cardWeaknesses = cardInfo.weaknesses; 
        const cardResistances = cardInfo.resistances;
        const cardRetreat = cardInfo.retreat;
        const cardPrice = cardInfo.pricing; 
        
        console.log(cardName, "\n", cardImage, "|", cardLocalId, "|", cardIll, "|",cardRarity, "|", cardCount, "|", cardSetName, "|",
          cardHp, "|", cardType, "|", cardType, "|", cardEvolveFrom, "|", cardDescription, "|", cardStage, "|", cardAttacks, "|", 
          cardWeaknesses, "|", cardResistances, "|", cardRetreat, "|", cardPrice);

      }
      //displaying the test count
      console.log(`Done! Processed ${cardCounter} cards across ${setCount} sets`);


        //----------------------------------------------------
        //NEXT STEPS:
        //make database insertion statements
        //possibly add pricing as its own table

        //to add the images for later use in the live camera api: https://assets.tcgdex.net/en/swsh/swsh3/136/low.jpg
        //-------------------------------------------------------
        
    }

    await client.end()
  } catch (err) {
    console.error(err)
  } finally {
    await client.end()
  }
}


main()
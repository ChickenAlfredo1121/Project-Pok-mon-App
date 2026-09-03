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
    //change based on testing purposes
    let testMode = false;

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

        const cardIll = cardInfo.illustrator; //string varchar(80)
        const cardImage = cardInfo.image; //string
        const cardLocalId = cardInfo.localId; //string 
        const cardName = cardInfo.name; //string
        const cardRarity = cardInfo.rarity; //string
        const cardCount = cardInfo.set?.cardCount?.total ?? null; //int
        const cardSetName = cardInfo.set?.name ?? null;  //string
        const cardHp = cardInfo.hp; //int
        const cardType = cardInfo.types; //TEXT[]
        const cardEvolveFrom = cardInfo.evolveFrom; //string
        const cardDescription = cardInfo.description; //string
        const cardStage = cardInfo.stage; //string
        const cardAttacks = cardInfo.attacks ? JSON.stringify(cardInfo.attacks) : null;

        const cardWeaknesses = cardInfo.weaknesses ? JSON.stringify(
        cardInfo.weaknesses.map(weakness => ({
            ...weakness,
            value: weakness.value.replace("×", "x")
        }))
      ) : null; //JSONB


        const cardResistances = cardInfo.resistances ? JSON.stringify(
        cardInfo.resistances.map(resistances => ({
            ...resistances,
            value: resistances.value.replace("×", "x")
        }))
      ) : null; //JSONB
      
        const cardRetreat = cardInfo.retreat; //int
        const cardPrice = cardInfo.pricing ? JSON.stringify(cardInfo.pricing) : null;
        
        console.log(cardName, "\n", cardImage, "|", cardLocalId, "|", cardIll, "|",cardRarity, "|", cardCount, "|", cardSetName, "|",
          cardHp, "|", cardType, "|", cardEvolveFrom, "|", cardDescription, "|", cardStage, "|\n\n\nATTACKS:", cardAttacks, "|", 
          cardWeaknesses, "|", cardResistances, "|", cardRetreat, "|\n\n\n\nPRICE:", cardPrice);
        
      //displaying the test count
      console.log(`Done! Processed ${cardCounter} cards across ${setCount} sets`);

        //----------------------------------------------------
        //NEXT STEPS:

        //to add the images for later use in the live camera api: https://assets.tcgdex.net/en/swsh/swsh3/136/low.jpg
        //-------------------------------------------------------
        if (testMode) break;
    }

    await client.end()
  } catch (err) {
    console.error(err)
  } finally {
    await client.end()
  }
}


main()

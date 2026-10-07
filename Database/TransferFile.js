const { Client } = require('pg')
const fs = require('node:fs');
const path = require('path');
const TCGdexModule = require('@tcgdex/sdk')
const TCGdex = TCGdexModule.default || TCGdexModule
const tcgdex = new TCGdex('en')
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

    const data = await tcgdex.fetch('sets');
    //----------------------------------------------------------
    //checking how many sets and cards it goes through when it displays
    //all cards to make sure it is running properly
    let setCount = 0;
    let cardCounter = 0;

    //need to get list of cards now that i know the sets
    //transverse through the data by each item ti get individual cards'
    let setData
    
    for (const set of data) {
      
      try{
      setCount++
       setData = await tcgdex.fetch('sets', set.id);
      //now that we have the first set we need to transverse 
      // all of its cards before we go on to the next one
    } catch (setErr){
      console.error(`Skipping set ${set.id}:`, setErr.message)
    continue
      }
      for (const card of setData.cards) {
        try {

          cardCounter++

          const cardInfo = await tcgdex.fetch('cards', card.id);
          const cardId = card.id; //string varchar(80)
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
              value: weakness.value?.replace("×", "x") ?? weakness.value
            }))
          ) : null;

          const cardResistances = cardInfo.resistances ? JSON.stringify(
            cardInfo.resistances.map(resistances => ({
              ...resistances,
              value: resistances.value?.replace("×", "x") ?? resistances.value
            }))
          ) : null; //JSONB

          const cardRetreat = cardInfo.retreat; //int
          const cardPrice = cardInfo.pricing ? JSON.stringify(cardInfo.pricing) : null;

          //card insert statment with update statment for chance of possible breakage in code or update in data
          let psqlCard = `INSERT INTO card (cardid, card_ill, card_image, card_local_id, card_name, card_rarity, card_count, 
            card_set_name, card_hp, card_type, card_evolve_from, card_description, card_stage, card_weakness, card_resistance, 
            card_retreat) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
            ON CONFLICT (cardid)
            DO UPDATE SET 
            card_ill = EXCLUDED.card_ill,
            card_image = EXCLUDED.card_image,
            card_local_id = EXCLUDED.card_local_id,
            card_name = EXCLUDED.card_name,
            card_rarity = EXCLUDED.card_rarity,
            card_count = EXCLUDED.card_count,
            card_set_name = EXCLUDED.card_set_name,
            card_hp = EXCLUDED.card_hp,
            card_type = EXCLUDED.card_type,
            card_evolve_from = EXCLUDED.card_evolve_from,
            card_description = EXCLUDED.card_description,
            card_stage = EXCLUDED.card_stage,
            card_weakness = EXCLUDED.card_weakness,
            card_resistance = EXCLUDED.card_resistance,
            card_retreat = EXCLUDED.card_retreat`;

          await client.query(psqlCard, [
            cardId,
            cardIll,
            cardImage,
            cardLocalId,
            cardName,
            cardRarity,
            cardCount,
            cardSetName,
            cardHp,
            cardType,
            cardEvolveFrom,
            cardDescription,
            cardStage,
            cardWeaknesses,
            cardResistances,
            cardRetreat
          ]);


          //attacks insert statment with update statment for chance of possible breakage in code or update in data
          let psqlAttacks = `INSERT INTO attacks (card_id, attack_data) 
            VALUES ($1, $2) 
            ON CONFLICT (card_id)
            DO UPDATE SET 
            attack_data = EXCLUDED.attack_data `;

          await client.query(psqlAttacks, [
            cardId,
            cardAttacks
          ]);

          //pricing insert statment with update statment for chance of possible breakage in code or update in data
          let psqlPrice = `INSERT INTO pricing (card_id, pricing_data) 
            VALUES ($1, $2) 
            ON CONFLICT (card_id)
            DO UPDATE SET 
            pricing_data = EXCLUDED.pricing_data `;

          await client.query(psqlPrice, [
            cardId,
            cardPrice
          ]);
        } catch (cardErr) {
          console.error(`Skipping card ${card.id}:`, cardErr.message);
        }

        //----------------------------------------------------
        //NEXT STEPS:

        //to add the images for later use in the live camera api: https://assets.tcgdex.net/en/swsh/swsh3/136/low.jpg
        //-------------------------------------------------------

      }
      console.log(`Done! Processed ${cardCounter} cards across ${setCount} sets`);
    }
  } catch (err) {
    console.error(err)
  } finally {
    await client.end()
  }
}


main()


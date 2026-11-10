# Project Pokémon App
 
**Scan your Pokémon cards with your camera and see what they're worth.**
 
## The Problem
There are few apps that allow users to use their cameras to search the price of their Pokemon cards. Apps that offer Pokemon price charting usually have 1 of 3 problems:

1. They're **expensive**
2. They have **no camera support**
3. They're **not user friendly**

Users should be able to quickly and easily see the price of their cards, especially users with large collections, where searching for each card by hand can take a long time.
 
**This app was created to solve those problems.**
 
---
 
## layout
 
The app has three main pages:
 
| Page | File | What it does |
|---|---|---|
| Card Collection | `CardCollection.html` | Search every card and add cards to your collection |
| User | `User.html` | View your collection and its total value |
| Home | `Home.html` | Scan cards with your camera |
 
---
 
### 1. Card Collection
 
**Purpose:** Search for existing cards you want to look at or might want to buy, and add cards to your collection.
 
**Search by:**
 
- Set
- Pokémon type
- Name
Selecting a card shows its **image**, its **price**, and a button to **add it to your collection**.
 
#### Where the data comes from
 
All card results are sourced from [TCGdex](https://tcgdex.dev/) and stored in MongoDB. Each card document looks like this:
 
```js
{
  _id: ObjectId('6adce80e5d292c4b434feff9'),
  cardId: 'base1-1',
  cardAttacks: [
    {
      cost: ['Psychic', 'Psychic', 'Psychic'],
      name: 'Confuse Ray',
      effect: 'Flip a coin. If heads, the Defending Pokémon is now Confused.',
      damage: NumberInt('30')
    }
  ],
  cardCount: NumberInt('102'),
  cardDescription: 'Its brain can outperform a supercomputer. Its intelligence quotient is said to be 5000.',
  cardEvolveFrom: 'Kadabra',
  cardHp: NumberInt('80'),
  cardIll: 'Ken Sugimori',
  cardImage: 'https://assets.tcgdex.net/en/base/base1/1', // base image URL (see "Images" below)
  cardLocalId: '1',
  cardName: 'Alakazam',
  cardPrice: {
    cardmarket: {
      updated: '2026-10-23T22:54:32.843Z',
      unit: 'EUR',
      idProduct: NumberInt('273696'),
      avg: Double('48.3'),
      low: Double('9.99'),
      trend: Double('43.12'),
      avg1: Double('39.07'),
      avg7: Double('43.01'),
      avg30: Double('47.93'),
      'avg-holo': null,
      'low-holo': null,
      'trend-holo': Double('19.66'),
      'avg1-holo': Double('7.99'),
      'avg7-holo': Double('14.29'),
      'avg30-holo': Double('25.6')
    },
    tcgplayer: {
      unit: 'USD',
      updated: '2026-10-14T22:54:33.803Z',
      holofoil: {
        productId: NumberInt('42346'),
        lowPrice: Double('43.5'),
        midPrice: Double('59.99'),
        highPrice: NumberInt('9999'),
        marketPrice: Double('70.82'),
        directLowPrice: Double('52.9')
      }
    }
  },
  cardRarity: 'Rare',
  cardResistances: null,
  cardRetreat: NumberInt('3'),
  cardSetName: 'Base Set',
  cardStage: 'Stage2',
  cardType: ['Psychic'],
  cardWeaknesses: [
    { type: 'Psychic', value: '×2' }
  ]
}
```

#### Images
 
Card images are loaded by taking the card's image URL and adding `/high.webp` or `/low.webp`.
 
> **Example:** [`https://assets.tcgdex.net/en/base/base1/1/high.webp`](https://assets.tcgdex.net/en/base/base1/1/high.webp)
 
#### Prices and currency conversion
 
The card prices in the database are in **euros (EUR)**. To show US dollars, the back end converts it with [Frankfurter](https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD) exchange-rate API, which updates once a day.
 
See how it's done in the backend: [`server/mongo.js` (lines 96–123)](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/blob/9cba31be27cb2d57339acaf17cc1b073dfd2ee8c/server/mongo.js#L101-L129)
 
---
 
### 2. User
 
**Purpose:** See your own collection and what it's worth.
 
This page has the same filtered search as the Card Collection page, but it only searches **your** collection.
 
**Differences from the Card Collection page:**
 
- The **total price of your collection** is displayed
- Clicking a card lets you **remove it** from your collection
#### How a collection entry is stored
 
Each card in a user's collection is a small entry that correlates to a card using its `ObjectId`:
 
```js
{
  _id: ObjectId('6aee28297df31174ba7a22f4'),
  userId: 'stone',
  cardId: ObjectId('6adcea5f5d292c4b434ff2f6'), // links to the card document
  addedAt: ISODate('2026-11-06T19:18:57.532Z'),
  cardName: 'Alakazam',
  cardSetName: 'Base Set 2',
  quantity: NumberInt('1')
}
```
 
See how cards are removed from a collection: [`server/mongo.js` (lines 198–225)](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/blob/9cba31be27cb2d57339acaf17cc1b073dfd2ee8c/server/mongo.js#L203-L230)
 
---
 
### 3. Home
 
**Purpose:** Use your camera to look up cards and add them to your account.
 
Start the camera, then press **Scan**. This feature is still **in development**: right now a scan will, in most cases, return the card's **name**.
 
Text recognition uses **OCR** (optical character recognition) through [Tesseract.js](https://tesseract.projectnaptha.com/).

[outline](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/blob/9cba31be27cb2d57339acaf17cc1b073dfd2ee8c/pages/Home.html#L249-L257)

[matching name](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/blob/9cba31be27cb2d57339acaf17cc1b073dfd2ee8c/pages/Home.html#L346-L355)
 
> If the live demo doesn't work [demo video](https://youtu.be/vPXsmZBbln4).
 
---

## Reality Check
 
This is **not a finished product** and needs more development to be anywhere close to a fully developed app.
 
---
 
## What Comes Next
 
- [ ] Fill in missing **images and prices** (not all cards have them yet)
- [ ] Make the camera identify the **exact card**, not just the name
- [ ] Improve camera accuracy and make cards easier to read
- [ ] Read the **bottom card number** to match a scan to a specific card
- [ ] Support **multiple users** (currently only a default user)
- [ ] Show more information on cards (like set)
- [ ] Find a way to **update prices** and add **new cards**
- [ ] Fix mobile version's camera


## WHO --- user + project

### Project Pokémon App
> Quick and easy way to get up-to-date prices on your Pokémon cards 

### Authorship
 - Dev: [@ChickenAlfredo1121](https://github.com/ChickenAlfredo1121)
 - Version: 1.1 October 19th, 2026

### User Story
As a person who collects Pokémon cards and is learning back-end development. I want to make an app that easily read Pokémon cards, so that I can store my personal collection and increase my knowledge of various development processes. 

### Specific user/audience
This project is aimed towards card collectors that would like a free and simple solution to keeping track of their card collections value.

## WHY --- problem + project

### Problem / opportunity
My goal is to learn more about/how to implement AI, database management, and full stack development. Additionally I would like to learn more about the developer side of apps and potentially deploy this as my first app. 

### Value proposition
For card collectors, my application creates better solution to keeping up with personal collections because it is free and has camera capture capabilities avoiding time consuming manual searches for each card. 

## WHAT ALREADY EXISTS --- landscape

### Criteria for a good Pokémon card collector app: 
- low price / free
- camera capabilities
- user friendly design
- pricing cabilities

### Solutions that already exist
- [HoloDex](https://www.getholodex.com/)
  - Advantages: camera capabilities and pricing capabilities
  - Disadvantages: High price and only paid option
- [TCG Card Scanner](https://play.google.com/store/apps/details?id=com.tcgscanner.pokemon&hl=en_US&pli=1)
  - Advantages: camera capabilities and pricing capabilities
  - Disadvantages: Medium price, only allows 3 free camera captures, interface is sufficient 
- [PriceCharting.com](https://www.pricecharting.com/)
  - Advantages: pricing capabilities and free
  - Disadvantages: no camera capture
 
## DONE --- KILO success test
### Success
At KILO, a user should be able to use their web based camera to quickly and simply take a picture of their Pokémon card to add to their collection. They will also be able to see up to date prices on their collection.

## PLAN
### Starting point
- PostegreSQL: for the database
- OpenCV: image recognition API
- TCGdex: API with all Pokémon cards created to date (incudes prices)

### Direction
I hope that I can have live camera capture of cards that will be done within seconds. Additionally, having a pricing function that could be graphed to show statistics of how the price has changed.

### Capabilities
- Full database of cards that can be manually queried to add to a personal collection
- camera capture of cards that will prompt to add to collection
- pricing that will show individual and total collection worth with up-to-date prices

### Biggest Unknown
I currently don't know how to do the live camera capture. I have the database made, camera set up with OpenCV, and next working to train the AI.

### Project Links
1. [Database creation](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/issues?q=is%3Aissue%20state%3Aopen%20label%3Adatabase)
2. [Live card reading](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22card%20reading%22)
3. [Personal Collection storage](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22personal%20collection%22)
4. [Pricing functions](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22price%20charting%22)
5. [dev](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/tree/dev)
6. [database](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/tree/database)
7. [camera](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/tree/camera)

*This is an early-stage project — contributions, suggestions, and feedback are welcome.*

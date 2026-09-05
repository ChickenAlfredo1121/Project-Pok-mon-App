# Project Pokémon App

> Quick and easy way to get up-to-date prices on your Pokémon cards 

## Authorship
 - Dev: [@ChickenAlfredo1121](https://github.com/ChickenAlfredo1121)
 - Version: 1.1 September 2nd, 2026

## 📖 Project Description

### User Story

As a person who collects Pokémon cards and is learning back-end development. I want to make an app that easily read Pokémon cards, so that I can store my personal collection and increase my knowledge of various development processes. 

### Narrative

This project aims to build a working script for a database that contains all created Pokémon cards, sourced using the TCG live card collection API. The goal is to provide a solid backend foundation that any Pokémon-related app can be built on top of.

## 🛠 Requirements

- **VSCode** (or preferred code editor)
  - [Download VSCode](https://code.visualstudio.com/download?_exp_download=fb315fc982)
- **PostgreSQL** (or preferred database)
  - [Download PostgreSQL](https://www.postgresql.org/download/)
  - Use all default settings during installation, but remember the password — it will be needed for the client connection.
- **Node.js**
  - [Download Node.js](https://nodejs.org/en/download)
- **npm**
  - Typically installed automatically with Node.js.
  - Verify installation:
    ```bash
    node -v
    npm -v
    ```
  - If npm is not installed:
    ```bash
    sudo apt install npm
    ```

## 🚀 Setup Steps

1. Download `TransferFile.js`.
2. Create a database in PostgreSQL named `pokedata`.
   - If you use a different name, update the database name on line 9 of `TransferFile.js` to match.
3. Download the needed node modules
    ```bash
   npm i express
    ```
5. Run the script to display all card information to the console.

## 🔮 Future Development and Expansions

Currently I am working to take the projects in steps with milestones for each. The current milestone is the database. The goal is to incrementally make an entire working app. 

### Milestones:
1. [Database creation](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/issues?q=is%3Aissue%20state%3Aopen%20label%3Adatabase)
2. [Live card reading](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22card%20reading%22)
3. [Personal Collection storage](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22personal%20collection%22)
4. [Pricing functions](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22price%20charting%22)

### Expansions:

- [ ] Add full database setup steps
- [ ] Create live price charting
- [ ] Build an active diagram of past prices for monitoring
- [ ] Sample front-end app with personal collection functionality

---

*This is an early-stage project — contributions, suggestions, and feedback are welcome.*

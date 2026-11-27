# KILO artifact
[PROD app](https://project-pok-mon-app.onrender.com)

[Release](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/tree/main)

## Capabilities
The finished Pokemon Project App has live camera capture to price cards, support for multiple users, card gallary, and personal user collections. In addition to this, the app updates its card databsae once a week and prices once a day.

## Important Decisions
There was no one free API that housed all pokemon cards with images and prices. Sadly, I decided that not all cards will be provided prices and images, but hopefully with devlopment within TCGDex this will change through the cron job. Moreover, users can now choose what camera to use becuase of constant errors being found through default camera selection.

## What changed after Juliett
After Juliett there were numerous positive changes. This includes:
- Some missing images and prices being inputed
- Card reader can now read an entire card, both name and number
- Improved camera accuracy
- User account created
- Cards now show more information for easier identification
- Cron job implemented to update prices and add new cards

## Known Issues
There are 2 main issues known in the application. The first being that not all cards have prices and images, partialy defeating the purpose of the app. Although this is sadly due to no open source options being avaliable for what is missing. The second is that the camera does not have 100% accuracy, especially with full-art cards. When it comes to normal cards it almost always gets it right on the first try. Full-art cards on the other hand shine and have much more content, including words that can confuse the OCR.

## Next Steps
This is the current end of Version 1.0, but if there were to be future development, fixing camera captured card recognition would be the main priority. All other basic functions are working as intended, with only the 2 main issues being left to fix.

## Individual Report
The contents can be found in [individual-report.md](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/blob/main/docs/individual-report.md)

----------------------

### Handoff test


This is a full-stack web application called Project Pokémon App that can perform live Pokémon price grading and support user collections. The primary audience is Pokémon card collectors who would like to know the price of their cards. Project Pokémon App is built with a JavaScript backend, HTML frontend, and a Mongo database. With three main dependencies TCGDex's API, Frankfurter API, and Tesseract.js. There is no required env variables as they are kept as secrets and not in the GitHub Repository files. If a local version was desired a clone can be made by running mongo.js inside the server folder, but the proper .env would be needed to access the database. MongoDB as mentioned hosts all of the apps data. This includes all card information, sessions, users, and user cards as json files. The deployment end users see is through a GCP instance that deployed the app to [junior.barrycumbie.com](https://junior.barrycumbie.com/). The known limitations within this app are in two primary areas, camera accuracy and missing information. There is some cards that currently don't have images or prices and the OCR has trouble reading full-art cards at times. If there were to be work done to improve version 1.0, the next steps would be to find a free solution for missing card information. After that improving the accuracy of the camera capture to finish all known issues.


## Integration


### Ownership + Lifecycle
The entirety of Project Pokémon App is owned by me, except the subdomain which is owned by [@Barry Cumbie](https://github.com/barrycumbie). This includes the repo, GCP, MongoDB, and Render.

### Final Cleanup
All unnecessary content has been deleted. The content left that is a fragment of the finished 1.0 version is a personal side project where I would like to try making a local version that implements a different OCR possibly or test different avenues this project could potentially take.

The demo videos can be found here:

[First Demo Video](https://youtu.be/vPXsmZBbln4)

[Latest Demo Video](XXXXXX)










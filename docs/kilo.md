### KILO artifact
| persistent CRUD | [PROD app](https://project-pok-mon-app.onrender.com) |
| Final Release | [Release](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/tree/main) |

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
- mobile versions camera capture now works

## Known Issues
There are 2 main issues known in the application. The first being that not all cards have prices and images, partialy defeating the purpose of the app. Although this is sadly due to no open source options being avaliable for what is missing. The second is that the camera does not have 100% accuracy, especially with full-art cards. When it comes to normal cards it almost always gets it right on the first try. Full-art cards on the other hand shine and have much more content, including words that can confuse the OCR.

## Next Steps
This is the current end of Version 1.0, but if there were to be future development, fixing camera captured card recognition would be the main priority. All other basic functions are working as intended, with only the 2 main issues being left to fix.

## Individual Report
The contents can be found in [individual-report.md](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/blob/main/docs/individual-report.md)

----------------------

### Handoff test


### Ownership + Lifecycle


### Final Cleanup

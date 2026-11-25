# Individual Experience Report

### My Contribution
1. Created all 3 html documents that house the Home, CardCollection, and User pages. In additon to this I made the filter and navigation bar for page transversal and filtered searches.
2. Deployed production app to Render and GCP. This includes making the Cron job used to update prices and cards.
3. Developed backend that communicates with the MongoDB for all card queries and made script to add card database to the database.
4. Made the Live-camera capture capabilities using Tesseract OCR.

### Independent Learning
1. Learned how to create a working Cron job that can automate the updating process.
2. How to use OCR's to read Images.
3. The implementation process for user account that contains hashed passwords.
4. The power of API's. I never realized till using API's the power and versatility they hold.

### Challenges + Response

Problem:
The biggest challenge starting out was how to get Pokémon cards. I tried using URLs to TCGDex's cards, but it kept crashing after a few thousand cards. It was really frustrating and confusing not knowing how to get the cards.
Solution:
Then I found out how to properly use API's. I found out i was hitting the rate limit every time and that's why the job kept failing. Once I understood that and started using the API it worked almost perfectly, minus the missing cards.

Problem:
Once I had the database and the rough draft of all the pages I tried to make the Card Collection page to practice getting the cards from the database. Although, this was a lot harder than I imagined. I had the filter script but it would never give me back cards.
Solution:
After troubleshooting for a long while, I found out I had set the fetch path wrong. I had put "card" instead of "cards". It was a very simple mistake, but because of it I never had this issue again.

Problem:
I was almost done with the project and all I had left was the camera. I definitly underestimated the amount of code and understanding that goes into OCRs. While trying to get the camera to read the card name and number it would always fail at one of the two. It could never get both together and I couldnt understand why. 
Solution:
I created a debugging tool that shows me the image it took of the card with rectangles over the name. This showed me where it was actually reading a lot easier. Which caused me to notice that not all cards are the same. Trainer cards have the name lower than other cards and cards that are evolutions show names as odd places. After realizing this I changed the size of the name reading box and added in handling for the trainer and evolved cards, fixing my issue.

Problem:
On my desktop computer I could read cards with very high accuracy, but when it came to my phone it was right maybe 20% of the time. I couldn't understand why even with my debugging tool.
Solution:
I altered the debugging tool to show me what it is reading for the set number too and what camera it was using. I found that it was reading sets in the right place, but the camera quality was so low that it only saw fuzz. I then realized that the default camera was the issue. I created the ability to switch cameras when available and it worked.

### Decision + Judgment
Descision:
I had a few options for OCR's to use with all roughly the same capabilities.
Judgement:
I decided on Tesseract.js because it was best suited for my project. Its' ability to read fine text and how easy it was to alter made it an ideal choice.

Descision:
There are a decent amount of Pokémon APIs out there that would have worked for my project, but I needed the one best suited for my needs.
Judgement:
Ultimately the decision boiled down to price. Part of the reason for this project was because I thought apps charge too much for live Pokémon price grading, so free was the only way to go. I chose TCGDex because it had every Pokémon card, even thought it didn't have all the images and prices.

Descision:
I needed an API that could do price conversions from EUR to USD.
Judgement:
There were a couple options but I chose the Frankfurter API because of its simplicity. When fetching the price conversion it was very easy, making it ideal.

Descision:
There was and still is some issues with live camera capture and I was at a crossroad on how to read the cards. The user could either take one picture of the whole card or 2 quick pictures, one of the name and one of the set number. 
Judgement:
I decided to keep it as one full card picture for 2 reasons. One I like the concept of the full card scan because it looks better and saves time. The other reason was that it would be inconvenient for users to have to take 2 pictures when the point of the app is to make it convenient and easy. 

### Experience + Reflection
Experience:
Using an OCR for the first time was a lot more overwhelming and intricate than I originally thought it would be. There is math, word recognition, camera settings that need altered, areas it reads is picky, and so much more. I struggled the most with the OCR then anything the entire project. The time spent just on the camera is nearly equal to what it took for everything else combined.
Reflection:
Overall, looking back on it I had a lot of fun. While it was by no means easy, it provided a good challenge and allowed me to learn something new. There was a lot to it, and I know it has more functionality that I haven't even touched, but that just makes me want to learn it even more.

Experience:
Working with back-end post and get was challenging. While I have worked with it before, this took a new turn with things like the filter. It was difficult to figure out, but was a rewarding process.
Reflection:
I gained a better understanding of how the back-end works and even more into its capabilities. I especially liked the filter I mentioned above, knowing how it was working in the back-end while watching it on the front-end was really cool.

Experience:
I had never worked with APIs before this class so I had only known the definition of one, not as much the capabilities. Using multiple APIs throughout this project was fascinating to learn how they work and the capabilities they had.
Reflection:
I learned more about how APIs work and how useful they are for automation and retrieval. The ability to use an entire script with one API was a big help, especially with things like the Frankfurter API for price conversion.

Experience:
I have worked on VMs before but I've never had to use a Cron job with one before. It was a new experience learning how simple it really is to implement a Cron job to automate scripts.
Reflection:
In future development I will definitely be using Cron jobs. When i first started this project I dreaded getting to that part, but I found out how simple it really was. It was/is also a huge contributor to helping my app work.


## Evidence

My Issues:
[Cron Job Issue](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/issues/23)
[Milestones](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/milestones?state=closed)
[Dev to Main PR](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/pull/28)
[Commit History](https://github.com/ChickenAlfredo1121/Project-Pok-mon-App/compare/dev...main)


## AI


## Resume/Interview

### Resume Bullet


### 30-second Explanation

### My role

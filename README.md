# Custom Dink Webhook Handler

A custom webhook that takes in requests from Dink and constructs custom messages that are dependent on checks against the data from Dink.

## [killCountHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/killCountHandler.js)

Checks if a player's kill count for a boss is a notable milestone (every 100 kills, specific boss-defined intervals, or first kills of special bosses) and updates the message map with a formatted notification if applicable. It ensures the boss name is validated and retrieves interval data from constants before constructing and storing the message.

### Boss Map

For select NPCs, the milestone check follows a custom `killCount` interval instead of the default `100`.  

#### Example  
The following configuration triggers notifications every 5 kills for **TzKal-Zuk** and every 25 kills for **Phosani's Nightmare**:  

```javascript
[
  ['TzKal-Zuk', 5],
  ['Phosani’s Nightmare', 25]
]
```
## [petHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/petHandler.js)

Processes pet drop notifications by verifying the pet name and milestone before constructing a message. If either detail is missing, a fallback message is used. Differentiates between first-time and duplicate pet drops, formatting the message accordingly before updating the message map.

## [collectionLogHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/collectionLogHandler.js)

Handles collection log item notifications by validating the item name and calculating the player's total collection log completion percentage. If total or completed entries are missing, a fallback message is used to prompt the player to refresh their log. Supports rank-based icons for future updates.

## [combatTaskHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/combatTaskHandler.js)

Tracks combat achievement progress by formatting completion percentages and structuring notifications for newly completed combat tasks. If a player completes an entire tier, a specialized message highlights their achievement, while regular task completions update their progress within the current tier.

## [personalBestHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/personalBestHandler.js)

Processes and formats in-game ISO-8601 duration strings for personal best times, ensuring consistency in minute, second, and millisecond formatting. Updates the message map with a notification when a player achieves a new personal best for a boss kill.

## [clueScrollHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/clueScrollHandler.js)

Formats and constructs a message for a completed clue scroll, listing the type of clue, the number completed, and the rewards received. Each reward is displayed with its quantity, name, and formatted price.

## [chatHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/chatHandler.js)

Handles different types of chat messages by delegating the processing to the appropriate handler based on the message type (e.g., [Big Fish](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/bigFishHandler.js), [Vestige Drop](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/vestigeHandler.js), [Sepulchre Personal Best](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/sepulchreHandler.js)).

## [levelUpHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/levelUpHandler.js)

Constructs special messages for significant level-up milestones, including max total level, total level intervals of 25, and reaching level 99 in a skill. A key feature of this function is handling multiple level-ups in a single notification, ensuring all skills are listed in one message rather than separately.
#### Example of a single skill level-up:<br/>

> playerName has leveled Attack to 99!<br/>

#### Examples of multiple skill level-ups:<br/>

>playerName has leveled Attack and Strength to 99!<br/>
>playerName has leveled Attack, Strength, and Defence to 99!<br/>

## Credits

This handler wouldn't have been possible without the help from the team at [DinkPlugin](https://github.com/pajlads/DinkPlugin).

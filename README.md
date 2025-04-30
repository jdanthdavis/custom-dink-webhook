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

Processes pet-related notifications, particularly for incrementing and retrieving a player's pet count in a MongoDB database. The handler supports both first-time pet drops and duplicate pet drops, adjusting the format and message accordingly. It ensures that the pet name is validated, and provides a system for tracking the pet count. The handler also includes a route for directly updating pet counts, so players can modify their progress in real-time. 

### Pet Count Update Logic

- **Incrementing Pet Count**: The handler supports the ability to increment a player's pet count when a new pet is obtained, ensuring the pet's milestone is recognized.
- **Duplicate Pet Drops**: The handler differentiates between first-time and duplicate drops and updates the message map with appropriate notifications.

### Routes

#### **POST `/increment-pets`**

This endpoint allows the pet count for a given player to be incremented by 1. The player’s name is sent as part of the request body. It ensures that the pet count is updated in the database, and returns a success message if the operation is successful.

- **Parameters**:
  - `playername` (JSON body): The player whose pet count is to be incremented.

- **Response**:
  - `200 OK`: If the pet count was successfully incremented.
  - `400 Bad Request`: If no `playername` is provided.
  - `404 Not Found`: If the player is not found in the database.
  - `500 Internal Server Error`: If there is an error while updating the database.

#### Example Request

```bash
curl -X POST "http://localhost:3000/increment-pets" \
-H "Content-Type: application/json" \
-d '{"playername": "player1"}'
```
#### Example response
```json
{
  "success": true,
  "playername": "player1"
}
```

## [collectionLogHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/collectionLogHandler.js)

Handles collection log item notifications by validating the item name and calculating the player's total collection log completion percentage. If total or completed entries are missing, a fallback message is used to prompt the player to refresh their log. This handler now also supports rank-based icons and tracks rank milestones, such as completing a rank or reaching the highest possible rank in the collection log.

### Rank Support

- **Rank-based Icons**: Each rank in the collection log (from Bronze to Gilded) is represented with a unique emoji, displayed alongside the player's completion progress.
- **Rank Milestones**: The handler checks if the player has just completed a new rank and formats a special message to highlight this achievement.
- **Rank Format**: The ranks are displayed in a properly formatted, capitalized form (e.g., Bronze, Iron, etc.).

#### Example Workflow

1. **No Data Available**: If total and completed entries are unavailable (the player hasn’t cycled their collection log), a fallback message prompts them to refresh the log.

2. **Rank Completion**: If the player has just completed a rank, the message will highlight the new rank they’ve reached, along with their current collection progress.

3. **Normal Update**: For regular collection log additions, the handler provides an update that includes the item name and the player's progress (completed vs total entries).

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

## [deathHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/deathHandler.js)

Handles player death events by formatting and updating a death message based on whether the death occurred in PvP or PvM. If the player was killed by another player, the message includes the killer’s name and the amount of coins lost. Otherwise, it generates a standard death message. Random humorous emojis are appended to each death message for added flavor.

### Death Message Logic

- **PvP Death**: Includes the killer's name and the value of coins lost.
- **PvM or Other Death**: Displays a simple death message without financial loss or killer information.
- **Randomized Emojis**: Each message randomly selects an emoji from a predefined list to add character to the notification.

#### Example Workflow

1. **PvP Death**: If the death was player-vs-player (PvP), the message follows the format:

   > **playerName** has just been killed by **killerName** for **valueLost** coins 😄

2. **PvM Death**: If not PvP, the message follows the simpler format:

   > **playerName** has died 😄

3. **Randomized Humor**: Each death message is enhanced with a randomly selected emoji for humor and personalization.

## Credits

This handler wouldn't have been possible without the help from the team at [DinkPlugin](https://github.com/pajlads/DinkPlugin).

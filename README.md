# Custom Dink Webhook Handler

A custom webhook that takes in requests from Dink and constructs custom messages that are dependent on checks against the data from Dink.

## [killCountHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/killCountHandler.js)

Checks if a player's kill count for a boss is a notable milestone (every 100 kills, a boss-specific interval, or a first kill of certain "special" bosses) and updates the message map with a formatted notification if applicable. It ensures the boss name is validated and retrieves interval data from constants before constructing and storing the message. This handler is also invoked indirectly from the chat message flow — [crabHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/crabHandler.js) and [delveHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/delveHandler.js) report Gemstone Crab and Doom of Mokhaiotl kill counts (parsed from chat text) through this same function.

### Boss Map

For select bosses, the milestone check uses a custom `killCount` interval instead of the default every-100-kills check. Boss names are matched case-insensitively against `bossMap` in [constants.js](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/constants.js).

| Boss | Interval |
|---|---|
| TzKal-Zuk | 5 |
| Sol Heredit | 5 |
| Skotizo | 5 |
| Theatre of Blood: Hard Mode | 10 |
| Chambers of Xeric: Challenge Mode | 10 |
| Gemstone Crab | 10 |
| Demonic Brutus | 10 |
| Phosani's Nightmare | 25 |
| The Nightmare | 25 |
| Yama | 25 |
| Doom of Mokhaiotl | 25 |
| Corporeal Beast | 50 |
| Herbiboar | 150 |

### First-Kill Notifications

A first kill of any of the following "special" bosses always triggers a notification, regardless of interval: **Sol Heredit, TzKal-Zuk, TzTok-Jad, Doom of Mokhaiotl, Demonic Brutus, Brutus**. There's also a one-off case for a first Brutus kill outside that list — it only notifies if the player is `themildest1`.

## [petHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/petHandler.js)

Processes pet-related notifications, particularly for incrementing and retrieving a player's pet count in a MongoDB database. The handler supports both first-time pet drops and duplicate pet drops, adjusting the format and message accordingly. It ensures that the pet name is validated, and provides a system for tracking the pet count. The handler also includes a route for directly updating pet counts, so players can modify their progress in real-time. 

### Pet Count Update Logic

- **Incrementing Pet Count**: The handler supports the ability to increment a player's pet count when a new pet is obtained, ensuring the pet's milestone is recognized.
- **Duplicate Pet Drops**: The handler differentiates between first-time and duplicate drops and updates the message map with appropriate notifications.
- **The Grumbler Special Case**: For this specific pet, the word "killcount" in the milestone text is swapped for "grumbles" (e.g. "at 500 grumbles!" instead of "at 500 killcount!").
- **Missing Data Fallback**: If the pet name or milestone text can't be resolved, a fallback message is sent instead ("has a funny feeling like they're being followed!") noting that the pet name or milestone is missing.

### Routes

> **Note:** the routes below are served by the external pet-tracking middleware (`MONGO_MIDDLEWARE`) that `petHandler.js` calls out to, not by this Worker directly. This Worker's own `src/index.js` has no routing of its own — every request is treated as a Dink webhook. The same middleware also backs `/increment-crab` and `/get-crab` (used by [crabHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/crabHandler.js) for Gemstone Crab tracking) and `/get-pets` (also used by [petGraph](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/petGraph.js) for the `!Fetchpets` leaderboard).

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
-d '{"playername": "player1", "petName": "Baby mole", "dateGot": "07/19/2026"}'
```
#### Example response
```json
{
  "success": true,
  "playername": "player1"
}
```
> Note: the request body above reflects what `petHandler.js` actually sends (`playername`, `petName`, `dateGot`). The response shape is defined by the external middleware, which lives outside this repo.

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

## [lootHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/lootHandler.js)

Handles generic loot-drop notifications. Items are filtered down to only those whose total value (`quantity × priceEach`) exceeds a 1,000,000 gp threshold — if nothing clears that bar, no message is sent. Surviving items are formatted into a grammatical list with shorthand values (e.g. `1.2B`) and combined into a single "received from" message.

#### Example

> **playerName** has received **2x Twisted bow (1.2B) and 1x Elysian sigil (300M)** from **Vorkath!**

## [chatHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/chatHandler.js)

Handles different types of chat messages by delegating the processing to the appropriate handler based on the message type:

- [bigFishHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/bigFishHandler.js) — "You catch an enormous X!" catches.
- [sepulchreHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/sepulchreHandler.js) — Hallowed Sepulchre personal bests (overall and per-floor).
- [untradeableDropHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/untradeableDropHandler.js) — untradeable item drops (vestiges, Theatre of Blood ornament kits/dust, and other untradeables), mapped to their source boss.
- [crabHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/crabHandler.js) — increments and reports a player's Gemstone Crab kill count via the pet-tracking middleware, then formats the milestone through [killCountHandler](#killcounthandler).
- [delveHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/delveHandler.js) — reports a player's Doom of Mokhaiotl (Deep Delves) kill count through [killCountHandler](#killcounthandler).
- [petGraph](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/petGraph.js) — responds to the `!Fetchpets` chat command with either a single player's pet stats or a full leaderboard of all tracked players.

### Untradeable Drop Example

> **playerName** has received **x1 Ultor vestige (5M)** from **Vardorvis!**

### `!Fetchpets` Example

> **playerName** -> Total Pets: **12** -> Most Recent: **Baby mole** on **07/19/2026**

## [levelUpHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/levelUpHandler.js)

Constructs special messages for level-up milestones: a player's first-ever level 99, reaching level 99 in any skill thereafter, max total level (2376), total level intervals of 25, and XP thresholds for individual skills. A key feature of this function is handling multiple level-ups in a single notification, ensuring all skills are listed in one message rather than separately. Significant milestones (first 99, any 99, max total level) are wrapped in an `@everyone` ping with an animated dance-party emoji; a solo Fishing level-up gets a custom fish emoji appended instead.

Note: messages use British spelling ("levelled"), and XP amounts are formatted in shorthand (`1M`, `2M`), not full digits.

#### Example of a single skill reaching 99:

> -# @everyone
> :danseParty: **playerName** has levelled **Attack** to **99!** :danseParty:

#### Example of a player's first-ever 99:

> -# @everyone
> :danseParty: **playerName** has achieved their first **99** in **Attack!** :danseParty:

#### Example of multiple skill level-ups combined into one message:

> **playerName** has levelled **Attack** to **99!** and **Strength** to **99!**!

#### Example of max total level:

> -# @everyone
> :danseParty: **playerName** has reached the highest possible total level of **2376**, by reaching **99** in **Attack!** :danseParty:

#### Example of a total level milestone (every 25 levels):

> -# @everyone
> :danseParty: **playerName** has reached a new total level of **1500**, by reaching **99** in **Attack!** :danseParty:

#### Example of a solo Fishing level-up:

> **playerName** has levelled **Fishing** to **50!** :fishh:

#### Example of XP milestone messages for a skill:

> **playerName** has reached **1M XP** in **Attack!**
> **playerName** has reached **2M XP** in **Strength!**

## [deathHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/deathHandler.js)

Handles player death events by formatting and updating a death message based on whether the death occurred in PvP or PvM, or within a specific in-game region. If the player was killed by another player, the message includes the killer's name and the amount of coins lost. Otherwise, it generates a standard death message. Random humorous emojis are appended to each death message for added flavor.

### Death Message Logic

- **Grumbled Death**: Dying within a specific hardcoded region (region ID `11330`) always produces a special "has been grumbled" message, taking priority over the PvP/PvM checks below.
- **PvP Death**: Includes the killer's name and the value of coins lost.
- **PvM Death**: Displays a simple death message without financial loss or killer information.
- **Food Lost/Kept**: For both Grumbled and PvM deaths, any recognized food items from the player's kept/lost item lists (matched against a large hardcoded food list) are tallied and appended as a secondary line, sorted by quantity.
- **Randomized Emojis**: Each message randomly selects an emoji from a predefined list to add character to the notification.

#### Example Workflow

1. **Grumbled Death**: If the death occurred in The Grumbler's region, the message follows the format:

   > **playerName** has been grumbled 😄
   > -# 2x Shark, 1x Cake

2. **PvP Death**: If the death was player-vs-player (PvP), the message follows the format:

   > **playerName** has just been killed by **killerName** for **valueLost** coins 😄

3. **PvM Death**: If not PvP or Grumbled, the message follows the simpler format:

   > **playerName** has died 😄
   > -# 2x Shark, 1x Cake

4. **Randomized Humor**: Each death message is enhanced with a randomly selected emoji for humor and personalization.

## [tcgHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/tcgHandler.js)

Handles notifications for the Trading Card Game (TCG) pack-opening feature. When a player pulls a card that is new to their collection, the handler checks whether it meets the notification criteria and constructs a message with the player's overall collection progress and total packs opened.

### Card Notification Logic

- **New Cards Only**: Only cards that are new for the player's collection trigger a notification; duplicates are ignored.
- **Rarity Filtering**: Non-foil cards only trigger a notification if their rarity is **Mythic**, **Godly**, or **Legendary**. All foil cards trigger a notification regardless of rarity.
- **Collection Progress**: The message includes the player's unique card total against the game's total card count, along with the completion percentage.
- **Packs Opened**: The message includes the total number of packs the player has opened.

#### Example Workflow

1. **Non-Foil, Unqualified Rarity**: A new, non-foil card that isn't Mythic, Godly, or Legendary is ignored.

2. **Non-Foil, Qualified Rarity**:

   > **playerName** has pulled a **Legendary cardName** on pack **150 | 320/500 (64.0%)**

3. **Foil Card** (any rarity):

   > **playerName** has pulled a **Rare cardName** :sparkles: *foil* :sparkles: on pack **150 | 320/500 (64.0%)**

## Credits

This handler wouldn't have been possible without the help from the team at [DinkPlugin](https://github.com/pajlads/DinkPlugin).


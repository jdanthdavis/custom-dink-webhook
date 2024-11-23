# Custom Dink Webhook Handler

A custom webhook that takes in requests from Dink and constructs custom messages that are dependent on checks against the data from Dink.

## checkKC

Checks if the current `killCount` is divisible by `100`, included in the `bossMap`, or a player has achieved a _special occasion_ kill (e.g., their first Sol-Heredit, Tzkal-Zuk, or TzTok-Jad kill).

### Boss Map

For select NPCs, we check for a specific `killCount` value instead of defaulting to `100`.<br/><br/>
**Example**<br/>Here we would fire a notification for every 5th TzKal-Zuk kill and every 25th Phosani's Nightmare kill.</br>
`[['TzKal-Zuk', 5],
['Phosani's Nightmare', 25]]`

## petCheck

A check that constructs a message giving the `petName` and the `milestone` the pet was acquired on.

## collectionLogCheck

In this check we construct a message that gets the player's percentage of total completed collection logs and appends it to the end of the message. A fallback message in case the user hasn't cycled their collection is in place so that we can still send the default collection log message.

## checkCAProgress

A similar function to `collectionLogCheck()` that appends the user's completed percentage of `currentTier`. If a notification is fired because of a `justCompletedTier` then we append the user's overall completed percentage to the total possible CA points.

## checkForPB

We wanted a very specific time formatting so we take the incoming `time` which is in `ISO-8601` format and we clean the time to our requirements (e.g., `PT46M23.1S` would be formatted as `46:23:1s`)

## checkLevelUp

Constructs special messages depending on the occasion (e.g., max total level, a total level interval of 25, 99 in a skill). A special feature in this function is when a player achieves multiple level ups in one notification. We construct a message that lists every skill rather than one at a time.<br/></br>
**Example of a 1 skill level up**<br/>

> **playerName** has has levelled **Attack** to **99**!</br>

**Examples of a multi-skill level up**<br/>

> **playerName** has has levelled **Attack and Strength** to **99**!</br>
> **playerName** has has levelled **Attack, Strength, Defence** to **99**!</br>

## Credits

This handler wouldn't have been possible without the help from the team at [DinkPlugin](https://github.com/pajlads/DinkPlugin).

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
## [chatHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/chatHandler.js)

Handles different types of chat messages by delegating the processing to the appropriate handler based on the message type (e.g., [Vestige Drop](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/vestigeHandler.js), [Sepulchre Personal Best](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/sepulchreHandler.js)).

## Credits

This handler wouldn't have been possible without the help from the team at [DinkPlugin](https://github.com/pajlads/DinkPlugin).

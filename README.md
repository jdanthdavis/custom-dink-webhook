# Custom Dink Webhook Handler

A custom webhook that takes in requests from Dink and constructs custom messages that are dependent on checks against the data from Dink.

## checkKc

This function gives the ability to have "kill count exceptions" with Dink. Instead of having every NPC fire a notification at `interval x` I wanted to have the ability to define each NPC's interval. A map where the NPC's name is the `key` and the `value` being the kill count interval. These values are rarely, if ever updated so hardcoding these weren't a concern.

## Credits

This handler wouldn't have been needed if it wasn't for the [DinkPlugin](https://github.com/pajlads/DinkPlugin). The team was very helpful when it came to metadata and any questions I had along the way.

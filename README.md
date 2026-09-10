# Custom Dink Webhook Handler

A custom webhook that takes in requests from Dink and constructs custom messages that are dependent on checks against the data from Dink.

## [killCountHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/killCountHandler.js)

Checks if a player's kill count for a boss is a notable milestone (every 100 kills, a boss-specific interval, or a first kill of certain "special" bosses) and updates the message map with a formatted notification if applicable. It ensures the boss name is validated and retrieves interval data from constants before constructing and storing the message. This handler is also invoked indirectly from the chat message flow — [crabHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/crabHandler.js) and [delveHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/delveHandler.js) report Gemstone Crab and Doom of Mokhaiotl kill counts (parsed from chat text) through this same function.

### Boss Map

For select bosses, the milestone check uses a custom `killCount` interval instead of the default every-100-kills check. Boss names are matched case-insensitively against `bossMap` in [constants.js](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/constants.js).

| Boss                              | Interval |
| --------------------------------- | -------- |
| TzKal-Zuk                         | 5        |
| Sol Heredit                       | 5        |
| Skotizo                           | 5        |
| Theatre of Blood: Hard Mode       | 10       |
| Chambers of Xeric: Challenge Mode | 10       |
| Gemstone Crab                     | 10       |
| Demonic Brutus                    | 10       |
| Phosani's Nightmare               | 25       |
| The Nightmare                     | 25       |
| Yama                              | 25       |
| Doom of Mokhaiotl                 | 25       |
| Corporeal Beast                   | 50       |
| Herbiboar                         | 150      |

### First-Kill Notifications

A first kill of any of the following "special" bosses always triggers a notification, regardless of interval: **Sol Heredit, TzKal-Zuk, TzTok-Jad, Doom of Mokhaiotl, Demonic Brutus, Brutus**. There's also a one-off case for a first Brutus kill outside that list — it only notifies if the player is `themildest1`.

## [petHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/petHandler.js)

Processes pet-related notifications, particularly for incrementing and retrieving a player's pet count. The handler supports both first-time pet drops and duplicate pet drops, adjusting the format and message accordingly. It ensures that the pet name is validated, and provides a system for tracking the pet count.

### Pet Count Update Logic

- **Incrementing Pet Count**: The handler supports the ability to increment a player's pet count when a new pet is obtained, ensuring the pet's milestone is recognized.
- **Duplicate Pet Drops**: The handler differentiates between first-time and duplicate drops and updates the message map with appropriate notifications.
- **The Grumbler Special Case**: For this specific pet, the word "killcount" in the milestone text is swapped for "grumbles" (e.g. "at 500 grumbles!" instead of "at 500 killcount!").
- **Missing Data Fallback**: If the pet name or milestone text can't be resolved, a fallback message is sent instead ("has a funny feeling like they're being followed!") noting that the pet name or milestone is missing.

### Storage

Pet and Gemstone Crab counts are tracked in two Cloudflare D1 (SQLite) databases bound
directly to this Worker — no external service involved. `petHandler.js` uses the
`PETS_DB` binding:

```sql
CREATE TABLE pets (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  total_pets INTEGER NOT NULL DEFAULT 0,
  most_recent_pet_name TEXT,
  most_recent_pet_date TEXT,
  total_pets_baseline INTEGER
);
```

`total_pets_baseline` backs the pets section of the [Weekly Recap](#weekly-recap) — it
tracks each player's total as of the last recap run, so the recap can report pets gained
since then rather than a lifetime total. There's no chat command for pets anymore
(`!Fetchpets` was removed as redundant once the recap covered the same ground); the recap
is the only place this data surfaces.

[crabHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/crabHandler.js)
uses the separate `CRAB_DB` binding:

```sql
CREATE TABLE crab_kc (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  count INTEGER NOT NULL DEFAULT 0
);
```

Both are upserted (`INSERT ... ON CONFLICT DO UPDATE`) on each increment, so a player's
first pet/crab kill creates their row automatically. Migrations live in `migrations/pets`
and `migrations/crab_kc`; apply with `wrangler d1 migrations apply <db-name>`.

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

### Storage

Every collection log event also upserts a progress snapshot into the shared
`dink_weekly_recap` D1 database (`WEEKLY_RECAP_DB` binding), table `collection_log`:

```sql
CREATE TABLE collection_log (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  completed_entries INTEGER,
  total_entries INTEGER,
  current_rank TEXT,
  completed_entries_baseline INTEGER
);
```

A snapshot-replace domain (like `tcg_progress`), not a counter — `completed_entries`/
`total_entries`/`current_rank` are the account's current values on every event, not
deltas, so they're written via `COALESCE` (a missing value leaves the stored one
untouched). Dink's `0`/`0` sentinel for "log not yet cycled" is treated the same way —
never written over previously-known-good values. The write happens unconditionally, even
on the fallback-message path above, so a not-yet-cycled event doesn't skip tracking.
**Recap-only** — there's no chat command; this data only surfaces in the
[Weekly Recap](#weekly-recap).

## [combatTaskHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/combatTaskHandler.js)

Tracks combat achievement progress by formatting completion percentages and structuring notifications for newly completed combat tasks. If a player completes an entire tier, a specialized message highlights their achievement, while regular task completions update their progress within the current tier. Progress is reconciled per player via the `CA_PROGRESS` KV namespace, since Dink reports the same `tierProgress` for multiple combat tasks that complete in the same game tick.

## [personalBestHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/personalBestHandler.js)

Processes and formats in-game ISO-8601 duration strings for personal best times, ensuring consistency in minute, second, and millisecond formatting. Updates the message map with a notification when a player achieves a new personal best for a boss kill.

## [clueScrollHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/clueScrollHandler.js)

Formats and constructs a message for a completed clue scroll, listing the type of clue, the number completed, and the rewards received. Each reward is displayed with its quantity, name, and formatted price.

## [lootHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/lootHandler.js)

Handles generic loot-drop notifications. Items are filtered down to only those whose total value (`quantity × priceEach`) exceeds a 1,000,000 gp threshold — if nothing clears that bar, no message is sent. Surviving items are formatted into a grammatical list with shorthand values (e.g. `1.2B`) and combined into a single "received from" message.

#### Example

> **playerName** has received **2x Twisted bow (1.2B) and 1x Elysian sigil (300M)** from **Vorkath!**

### Storage

Qualifying drops (the same ones announced above) are also upserted into the shared
`dink_weekly_recap` D1 database (`WEEKLY_RECAP_DB` binding), table `loot_totals`:

```sql
CREATE TABLE loot_totals (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  total_value INTEGER NOT NULL DEFAULT 0,
  last_item_name TEXT,
  last_item_value INTEGER,
  last_source TEXT,
  last_drop_date TEXT,
  total_value_baseline INTEGER,
  weekly_top_item_name TEXT,
  weekly_top_item_value INTEGER
);
```

`total_value` accumulates across every qualifying drop; `last_item_*` records the
highest-value item from the most recent qualifying event (independent of the recap).
`total_value_baseline`/`weekly_top_item_*` back the weekly recap section: the former is
diffed like pets/TCG/deaths/collection log to show value gained since last time, while
the latter tracks the single highest-value drop since last time and is reset to `NULL`
(not diffed) after each recap run. Surfaced only via the
[Weekly Recap](#weekly-recap) — there's no chat command; see
[buildLootWeeklyChangeSection](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/lootRecap.js).

## [chatHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/chatHandler.js)

Handles different types of chat messages by delegating the processing to the appropriate handler based on the message type. Every domain that used to have a `!Fetch...`-style on-demand chat command (pets, loot) has had it removed — the [Weekly Recap](#weekly-recap) is the only place that data surfaces now, by design, so players can't manually trigger a fetch:

- [bigFishHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/bigFishHandler.js) — "You catch an enormous X!" catches.
- [sepulchreHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/sepulchreHandler.js) — Hallowed Sepulchre personal bests (overall and per-floor).
- [untradeableDropHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/untradeableDropHandler.js) — untradeable item drops (vestiges, Theatre of Blood ornament kits/dust, and other untradeables), mapped to their source boss.
- [crabHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/crabHandler.js) — increments and reports a player's Gemstone Crab kill count via D1 (`CRAB_DB` -> `dink_crab_kc`), then formats the milestone through [killCountHandler](#killcounthandler).
- [delveHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/delveHandler.js) — reports a player's Doom of Mokhaiotl (Deep Delves) kill count through [killCountHandler](#killcounthandler).

### Untradeable Drop Example

> **playerName** has received **x1 Ultor vestige (5M)** from **Vardorvis!**

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

### Notification threshold

Dink sends a `LEVEL` event for every level gained (not just 50+), so the weekly recap can
track true totals - but Discord notifications stay limited to level **50 and up**
(`LEVEL_NOTIFICATION_THRESHOLD` in `constants.js`), same as before. A level below the
threshold is still tracked in D1; it just doesn't produce a message. In a mixed event
(e.g. one skill reaches 45, another reaches 55 in the same tick), only the qualifying
skill(s) appear in the notification, while both are still recorded.

### Storage

Every levelled skill (regardless of the notification threshold above) is upserted into
the shared `dink_weekly_recap` D1 database (`WEEKLY_RECAP_DB` binding), table
`skill_levels` - **one row per player per skill**, not one row per player, so the recap
can tell which skill drove the gains:

```sql
CREATE TABLE skill_levels (
  playername TEXT NOT NULL COLLATE NOCASE,
  skill_name TEXT NOT NULL,
  level INTEGER,
  level_baseline INTEGER,
  PRIMARY KEY (playername, skill_name)
);
```

`level` is COALESCE-guarded like TCG/collection log's snapshot columns - a skill's current
level on every event, not a delta. Recap-only - there's no chat command; this data only
surfaces in the [Weekly Recap](#weekly-recap).

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

### Storage

Every death also upserts a counter into the shared `dink_weekly_recap` D1 database
(`WEEKLY_RECAP_DB` binding), table `deaths`:

```sql
CREATE TABLE deaths (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  death_count INTEGER NOT NULL DEFAULT 0,
  total_value_lost INTEGER NOT NULL DEFAULT 0,
  death_count_baseline INTEGER,
  total_value_lost_baseline INTEGER
);
```

Unlike TCG's snapshot-replace, this is a pure counter (like pets/loot/crab) — Dink reports
one death at a time, never a running total, so `death_count`/`total_value_lost` just
accumulate. Recap-only — there's no chat command; this data only surfaces in the
[Weekly Recap](#weekly-recap).

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

   > **playerName** has pulled a **Rare cardName** :sparkles: _foil_ :sparkles: on pack **150 | 320/500 (64.0%)**

### Storage

Every qualifying pull also upserts a progress snapshot into the shared `dink_weekly_recap`
D1 database (`WEEKLY_RECAP_DB` binding), table `tcg_progress`:

```sql
CREATE TABLE tcg_progress (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  collection_score INTEGER,
  unique_cards_owned INTEGER,
  unique_cards_total INTEGER,
  foil_cards_owned INTEGER,
  foil_cards_total INTEGER,
  opened_packs INTEGER,
  last_card_name TEXT,
  last_updated TEXT
);
```

Dupes count: `unique_cards_owned`/`foil_cards_owned` track every pull (the payload's `Total
cards`/`Total foil cards` fields), not just genuinely new cards — pulling a card or foil
you already own still moves these numbers. A stat missing from a given pull's `content`
(e.g. no `Collection score` line) leaves the stored value untouched rather than clearing
it. **Recap-only** — unlike pets/loot, there's no `!Fetchtcg` chat command; this data only
surfaces in the [Weekly Recap](#weekly-recap).

## [Weekly Recap](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/recapHandler.js)

Posts a combined recap to a dedicated Discord channel on a Cloudflare [Cron Trigger](https://developers.cloudflare.com/workers/configuration/cron-triggers/) (`[triggers]` in `wrangler.toml`, currently Monday 9am EST / 14:00 UTC — Cron Triggers run in UTC only with no DST awareness, so this drifts to 10am Eastern during EDT) — no external scheduler involved. `src/index.js` exports a `scheduled()` handler alongside `fetch()`; on each trigger it builds the recap and posts it to the `RECAP_URL` webhook (set via `wrangler secret put RECAP_URL`).

None of the tracked domains have a `!Fetch...`-style chat command — this recap is the only
place any of this data surfaces, by design, so players can't manually trigger a fetch. Every
section-builder function lives in `src/core/recap/`:

- [buildPetsWeeklyChangeSection](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/petsRecap.js), [buildLootWeeklyChangeSection](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/lootRecap.js), [buildTcgWeeklyChangeSection](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/tcgRecap.js), [buildDeathsWeeklyChangeSection](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/deathsRecap.js), and [buildCollectionLogWeeklyChangeSection](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/collectionLogRecap.js) — **week-over-week change**, not a running total, all five built on the shared [computeAndResetDeltas](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/deltaTracking.js) helper: it diffs each row's current value against a `*_baseline` column (a missing baseline counts as 0) and resets that baseline to the current value as a side effect every time it runs, so the next run's numbers are measured from there (see the `total_pets_baseline`/`loot_totals`/`tcg_progress`/`deaths`/`collection_log` baseline columns described above). Loot's `weekly_top_item_*` columns are the one exception — they track a single highest-value drop rather than a running total, so they're reset to `NULL` instead of diffed.
- [buildLevelsWeeklyChangeSection](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/levelsRecap.js) — also week-over-week, but hand-rolls the same fetch/diff/reset shape instead of using `computeAndResetDeltas`, since `skill_levels` has one row per player *per skill* rather than one row per player: it sums every skill's delta for a player (total levels gained) and tracks the single largest per-skill delta (skill most leveled).

A section that returns nothing (empty table, or nothing changed since last time) is omitted from the recap; if every section is empty, nothing is posted that week. Adding a new domain (clues, combat tasks, personal bests) is a two-step follow-up once that domain has its own D1 tracking table: add a file to `src/core/recap/` (via `computeAndResetDeltas` if it's a change-since-last-time section with one row per player, like pets/TCG/deaths/collection log), then add one line to the `RECAP_SECTIONS` list in `recapHandler.js`.

### D1 database budget

The Cloudflare account this Worker runs on caps out at 10 D1 databases. `pets`/`crab_kc`
each have their own dedicated database (`dink_pets`, `dink_crab_kc`) from when they were
built. `loot_totals` originally did too (`dink_loot`), but was merged into the shared
`dink_weekly_recap` database once loot became recap-only and fully weekly-scoped like
every other domain here - nothing technical distinguished it from tcg_progress/deaths/
collection_log anymore, so keeping it separate just spent a database slot for no reason.
Every domain added since TCG gets its own **table** inside `dink_weekly_recap`
(`WEEKLY_RECAP_DB` binding) — keep doing this for future domains rather than provisioning
a new database per domain, to stay well under the cap.

### Local testing

`wrangler dev --test-scheduled` exposes a `/__scheduled` endpoint to fire the cron handler on demand, without waiting for the real schedule:

```bash
curl "http://localhost:8787/__scheduled"
```

## Credits

This handler wouldn't have been possible without the help from the team at [DinkPlugin](https://github.com/pajlads/DinkPlugin).

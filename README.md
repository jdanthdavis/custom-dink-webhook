# Custom Dink Webhook Handler

A custom webhook that takes in requests from Dink and constructs custom messages that are dependent on checks against the data from Dink.

## [killCountHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/killCountHandler.js)

Checks if a player's kill count for a boss is a notable milestone (every 100 kills by default, or a boss-specific interval) and sends a notification if so. Also invoked indirectly from [crabHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/crabHandler.js) and [delveHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/delveHandler.js), which parse kill counts from chat text.

Per-boss intervals are matched case-insensitively against `bossMap` in [constants.js](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/constants.js):

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

A first kill of **Sol Heredit, TzKal-Zuk, TzTok-Jad, Doom of Mokhaiotl, Demonic Brutus, Brutus** always notifies regardless of interval.

## [petHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/petHandler.js)

Increments and reports a player's pet count on drop, differentiating first-time vs. duplicate drops. The Grumbler pet swaps "killcount" for "grumbles" in its milestone text. Missing pet name/milestone data falls back to a generic message.

### Storage

Pet and Gemstone Crab counts are tracked in two D1 databases bound directly to this Worker. `petHandler.js` uses `PETS_DB`:

```sql
CREATE TABLE pets (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  total_pets INTEGER NOT NULL DEFAULT 0,
  most_recent_pet_name TEXT,
  most_recent_pet_date TEXT,
  total_pets_baseline INTEGER
);
```

`total_pets_baseline` backs the pets section of the [Weekly Recap](#weekly-recap) — it's the total as of the last recap run, so the recap can report pets gained since then. Recap-only; no chat command.

[crabHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/crabHandler.js) uses the separate `CRAB_DB` binding:

```sql
CREATE TABLE crab_kc (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  count INTEGER NOT NULL DEFAULT 0
);
```

Both are upserted (`INSERT ... ON CONFLICT DO UPDATE`) on each increment. Migrations live in `migrations/pets` and `migrations/crab_kc`; apply with `wrangler d1 migrations apply <db-name>`.

## [collectionLogHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/collectionLogHandler.js)

Formats a collection log notification and tracks rank milestones (Bronze through Gilded, each with its own icon). Missing total/completed entries (log not yet cycled) falls back to a prompt message.

### Storage

Every collection log event upserts a snapshot into the shared `dink_weekly_recap` D1 database (`WEEKLY_RECAP_DB` binding), table `collection_log`:

```sql
CREATE TABLE collection_log (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  completed_entries INTEGER,
  total_entries INTEGER,
  current_rank TEXT,
  completed_entries_baseline INTEGER
);
```

Snapshot-replace (like `tcg_progress`), not a counter — current values on every event, written via `COALESCE` so a missing value doesn't clear a known-good one. Dink's `0`/`0` "not yet cycled" sentinel is treated the same way. The write happens unconditionally, even on the fallback-message path. Recap-only; see [Weekly Recap](#weekly-recap).

## [combatTaskHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/combatTaskHandler.js)

Formats combat achievement notifications, with a special message for completing an entire tier. Progress is reconciled per player via the `CA_PROGRESS` KV namespace, since Dink reports the same `tierProgress` for multiple tasks completing in one game tick.

## [personalBestHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/personalBestHandler.js)

Formats ISO-8601 personal-best duration strings and notifies on a new PB for a boss kill.

## [clueScrollHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/clueScrollHandler.js)

Formats a completed-clue notification listing the clue tier, count, and rewards.

## [lootHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/lootHandler.js)

Notifies on loot drops whose total value (`quantity × priceEach`) exceeds 1,000,000 gp.

### Storage

Qualifying drops also upsert into the shared `dink_weekly_recap` D1 database (`WEEKLY_RECAP_DB` binding), table `loot_totals`:

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

`total_value` accumulates across every qualifying drop; `last_item_*` is the most recent drop, independent of the recap. `total_value_baseline` is diffed for the recap's weekly gain; `weekly_top_item_*` tracks the single highest-value drop since last time and resets to `NULL` (not diffed) each run. Recap-only; see [buildLootWeeklyChangeSection](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/lootRecap.js).

## [chatHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/chatHandler.js)

Routes chat-message payloads to the appropriate sub-handler by message type:

- [bigFishHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/bigFishHandler.js) — "You catch an enormous X!" catches.
- [sepulchreHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/sepulchreHandler.js) — Hallowed Sepulchre personal bests (overall and per-floor).
- [untradeableDropHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/untradeableDropHandler.js) — untradeable item drops, mapped to their source boss.
- [crabHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/crabHandler.js) — Gemstone Crab kill count via `CRAB_DB` -> `dink_crab_kc`, formatted through [killCountHandler](#killcounthandler).
- [delveHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/chatMsgHandler/delveHandler.js) — Doom of Mokhaiotl kill count through [killCountHandler](#killcounthandler).

## [levelUpHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/levelUpHandler.js)

Formats level-up notifications: first-ever 99, any 99, max total level (2376), total-level intervals of 25, and XP milestones. Multiple skills leveling in one event are combined into a single message. Dink is configured to only send `LEVEL` events for level 50+ - there's no in-app gating (this handler notifies on whatever Dink sends), and no D1 write here at all; see below for how levels are actually tracked.

### Levels & XP tracking (OSRS Hiscores)

Dink only reports level-_up_ events, so it can't see XP gained without a level-up, and (now that it's back to 50+ only) it can't see levels below 50 either. The Levels Board instead polls the public [OSRS Hiscores API](https://secure.runescape.com/m=hiscore_oldschool/index_lite.json) once per recap run for every player in the `theBoys` allowlist (case-insensitive), upserting each skill's current level and XP — including the API's own "Overall" row — into the shared `dink_weekly_recap` D1 database (`WEEKLY_RECAP_DB` binding), table `skill_xp` - one row per player **per skill**, so the recap can tell which skill drove the gains:

```sql
CREATE TABLE skill_xp (
  playername TEXT NOT NULL COLLATE NOCASE,
  skill_name TEXT NOT NULL,
  level INTEGER,
  level_baseline INTEGER,
  xp INTEGER,
  xp_baseline INTEGER,
  PRIMARY KEY (playername, skill_name)
);
```

"Levels Gained" and "Total XP Gained" both come from the "Overall" row's own delta rather than summing individual skills, since a player can have a real level/XP in a skill they aren't ranked in yet (that skill's row is filtered out entirely). "Overall" is excluded from both "Skill Most Levelled"/"Top Skill (XP)" comparisons, since it isn't a real skill. An unranked skill (`xp: -1`) is filtered out. Since every row here comes from Hiscores (queried using `theBoys`' uppercase form), display names resolve through the hand-maintained `PLAYER_DISPLAY_NAMES` map in [constants.js](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/constants.js) rather than a live lookup.

## [deathHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/deathHandler.js)

Formats a death notification: PvP includes the killer and value lost, PvM is a simple message, and dying in the Grumbler's region (`11330`) always produces a "has been grumbled" message. Lost/kept food items are tallied as a secondary line.

### Storage

Every death upserts a counter into the shared `dink_weekly_recap` D1 database (`WEEKLY_RECAP_DB` binding), table `deaths`:

```sql
CREATE TABLE deaths (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  death_count INTEGER NOT NULL DEFAULT 0,
  total_value_lost INTEGER NOT NULL DEFAULT 0,
  death_count_baseline INTEGER,
  total_value_lost_baseline INTEGER
);
```

A pure counter (like pets/loot/crab), not a snapshot. Recap-only.

## [tcgHandler](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/tcgHandler.js)

Notifies on a Trading Card Game pull that's new to the player's collection and either a foil or Mythic/Godly/Legendary rarity, including collection progress and packs opened.

### Storage

Every qualifying pull upserts a snapshot into the shared `dink_weekly_recap` D1 database (`WEEKLY_RECAP_DB` binding), table `tcg_progress`:

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

Dupes count: `unique_cards_owned`/`foil_cards_owned` track every pull, not just new cards. A stat missing from a pull's `content` leaves the stored value untouched. Recap-only.

## [Weekly Recap](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/recapHandler.js)

Posts a combined recap to Discord on a Cloudflare [Cron Trigger](https://developers.cloudflare.com/workers/configuration/cron-triggers/) (`[triggers]` in `wrangler.toml`, Monday 9am EST / 14:00 UTC). `src/index.js`'s `scheduled()` handler builds the recap and posts it to the `RECAP_URL` webhook (`wrangler secret put RECAP_URL`).

None of the tracked domains have a chat command — the recap is the only place this data surfaces. Section builders live in `src/core/recap/`:

- [buildPetsWeeklyChangeSection](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/petsRecap.js), [buildLootWeeklyChangeSection](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/lootRecap.js), [buildTcgWeeklyChangeSection](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/tcgRecap.js), [buildDeathsWeeklyChangeSection](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/deathsRecap.js), and [buildCollectionLogWeeklyChangeSection](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/collectionLogRecap.js) — week-over-week change, built on the shared [computeAndResetDeltas](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/deltaTracking.js) helper: diffs each row against a `*_baseline` column and resets it after every run.
- [buildLevelsWeeklyChangeSection](https://github.com/jdanthdavis/custom-dink-webhook/blob/main/src/core/recap/levelsRecap.js) — hand-rolls the same fetch/diff/reset shape instead, since `skill_xp` has one row per player _per skill_. Levels and Total XP Gained are both sourced from the Hiscores poll; a player appears if they gained either.

A section returning nothing is omitted; if every section is empty, nothing posts that week. Adding a new domain: a file in `src/core/recap/` plus one line in `RECAP_SECTIONS` in `recapHandler.js`.

## Credits

This handler wouldn't have been possible without the help from the team at [DinkPlugin](https://github.com/pajlads/DinkPlugin).

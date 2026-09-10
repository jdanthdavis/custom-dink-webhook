-- Collection log progress, a snapshot-replace domain (like tcg_progress)
-- rather than a counter (like pets/loot/deaths) - Dink reports the
-- account's current completed/total entries on every event, not a delta.
CREATE TABLE collection_log (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  completed_entries INTEGER,
  total_entries INTEGER,
  current_rank TEXT,
  completed_entries_baseline INTEGER
);

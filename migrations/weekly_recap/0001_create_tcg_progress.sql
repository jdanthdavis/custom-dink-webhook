-- TCG collection progress, first table in the shared weekly-recap database
-- (collection log / combat achievements / clues / deaths follow as more
-- tables here rather than more databases, to stay under the account's D1 cap).
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

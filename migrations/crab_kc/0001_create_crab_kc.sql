-- Gemstone Crab kill count tracking, replacing the mongo-middleware/MongoDB `crabCount` collection.
CREATE TABLE crab_kc (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  count INTEGER NOT NULL DEFAULT 0
);

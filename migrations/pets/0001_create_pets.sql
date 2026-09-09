-- Pet tracking, replacing the mongo-middleware/MongoDB `pets` collection.
CREATE TABLE pets (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  total_pets INTEGER NOT NULL DEFAULT 0,
  most_recent_pet_name TEXT,
  most_recent_pet_date TEXT
);

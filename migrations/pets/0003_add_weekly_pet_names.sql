-- Comma-separated names of the pets each player got since the last recap run,
-- for the recap's "Pets Got" column. Appended on every new (non-duplicate)
-- named pet and reset to NULL by the recap - not diffed, like loot_totals'
-- weekly_top_item_*. No backfill: pets from before this ships aren't known
-- by week, so existing rows start empty.
ALTER TABLE pets ADD COLUMN weekly_pet_names TEXT;

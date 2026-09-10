-- "Value as of the last recap run" per player, so the recap can show value
-- gained since last time instead of a lifetime running total - same pattern
-- as pets/TCG/deaths/collection_log. Backfilled for existing rows so real
-- production history doesn't appear as "gained this week" on the first
-- recap after this ships.
ALTER TABLE loot_totals ADD COLUMN total_value_baseline INTEGER;
UPDATE loot_totals SET total_value_baseline = total_value;

-- The single highest-value qualifying drop since the last recap (not
-- lifetime) - reset to NULL after each recap run instead of being diffed
-- against a baseline, since "biggest drop" isn't a running total.
ALTER TABLE loot_totals ADD COLUMN weekly_top_item_name TEXT;
ALTER TABLE loot_totals ADD COLUMN weekly_top_item_value INTEGER;

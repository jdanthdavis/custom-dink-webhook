-- "Value as of the last recap run" per player, so the recap can show pets
-- gained since last time instead of a lifetime running total. Backfilled for
-- existing rows so their real production history doesn't appear as "gained
-- this week" on the first recap after this ships.
ALTER TABLE pets ADD COLUMN total_pets_baseline INTEGER;
UPDATE pets SET total_pets_baseline = total_pets;

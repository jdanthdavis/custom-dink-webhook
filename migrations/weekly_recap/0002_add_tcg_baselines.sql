-- "Value as of the last recap run" per player, so the recap can show the
-- change since last time instead of a lifetime running total.
ALTER TABLE tcg_progress ADD COLUMN collection_score_baseline INTEGER;
ALTER TABLE tcg_progress ADD COLUMN unique_cards_owned_baseline INTEGER;
ALTER TABLE tcg_progress ADD COLUMN foil_cards_owned_baseline INTEGER;

-- "Can It Worm" renamed their OSRS account to "Frosty Dad". Move their pet
-- history to the new name; if the new name already has a row, keep it.
UPDATE OR IGNORE pets SET playername = 'FROSTY DAD' WHERE playername = 'CAN IT WORM';

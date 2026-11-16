import { describe, expect, it } from 'vitest';
import getPlayerDisplayName from '../core/helperFunctions/getPlayerDisplayName';

describe('getPlayerDisplayName', () => {
  it.each(['FROSTYDAD', 'frostydad', 'FrostyDad'])(
    'maps %s to the display name regardless of stored casing',
    (stored) => {
      expect(getPlayerDisplayName(stored)).toBe('FrostyDad');
    }
  );

  it('keeps a similar-looking but different player distinct', () => {
    expect(getPlayerDisplayName('FROSTY DAD')).toBe('Frosty Dad');
  });

  it('falls back to the stored name for players not in the list', () => {
    expect(getPlayerDisplayName('Some Guest')).toBe('Some Guest');
  });
});

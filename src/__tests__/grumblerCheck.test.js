import { describe, expect, it } from 'vitest';
import customBossNames from '../core/helperFunctions/customBossNames';

describe('customBossNames', () => {
  it('maps Phantom Muspah to The Grumbler', () => {
    expect(customBossNames('Phantom Muspah')).toBe('The Grumbler');
  });

  it('maps Muphin to The Grumbler', () => {
    expect(customBossNames('muphin')).toBe('The Grumbler');
  });

  it('maps any Hallowed Sepulchre variant to Grand Hallowed Coffin', () => {
    expect(customBossNames('Hallowed Sepulchre')).toBe('Grand Hallowed Coffin');
    expect(customBossNames('hallowed sepulchre (floor 5)')).toBe(
      'Grand Hallowed Coffin'
    );
  });

  it('maps Dusk to Grotesque Guardians', () => {
    expect(customBossNames('dusk')).toBe('Grotesque Guardians');
  });

  it('returns the original name unchanged for anything else', () => {
    expect(customBossNames('Zulrah')).toBe('Zulrah');
  });
});

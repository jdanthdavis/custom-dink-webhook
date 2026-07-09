import { describe, expect, it } from 'vitest';
import grumblerCheck from './grumblerCheck';

describe('grumblerCheck', () => {
  it('maps Phantom Muspah to The Grumbler', () => {
    expect(grumblerCheck('Phantom Muspah')).toBe('The Grumbler');
  });

  it('maps Muphin to The Grumbler', () => {
    expect(grumblerCheck('muphin')).toBe('The Grumbler');
  });

  it('maps any Hallowed Sepulchre variant to Grand Hallowed Coffin', () => {
    expect(grumblerCheck('Hallowed Sepulchre')).toBe('Grand Hallowed Coffin');
    expect(grumblerCheck('hallowed sepulchre (floor 5)')).toBe(
      'Grand Hallowed Coffin'
    );
  });

  it('maps Dusk to Grotesque Guardians', () => {
    expect(grumblerCheck('dusk')).toBe('Grotesque Guardians');
  });

  it('returns the original name unchanged for anything else', () => {
    expect(grumblerCheck('Zulrah')).toBe('Zulrah');
  });
});

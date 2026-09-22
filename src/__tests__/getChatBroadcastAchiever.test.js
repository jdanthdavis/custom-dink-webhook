import { describe, expect, it } from 'vitest';
import getChatBroadcastAchiever from '../core/helperFunctions/getChatBroadcastAchiever';

describe('getChatBroadcastAchiever', () => {
  it('extracts the name from a "received a drop" broadcast', () => {
    expect(
      getChatBroadcastAchiever('Random Clanmate received a drop: Purifying sigil')
    ).toBe('Random Clanmate');
  });

  it('extracts the name from a "found something special" broadcast', () => {
    expect(
      getChatBroadcastAchiever(
        'Random Clanmate found something special: Holy ornament kit'
      )
    ).toBe('Random Clanmate');
  });

  it('extracts the name from a Barracuda Trial personal best broadcast', () => {
    expect(
      getChatBroadcastAchiever(
        'Random Clanmate has achieved a new Tempor Tantrum Marlin personal best: 4:18.60'
      )
    ).toBe('Random Clanmate');
  });

  it('returns null for private game messages with no embedded name', () => {
    expect(getChatBroadcastAchiever('You catch an enormous shark!')).toBeNull();
    expect(
      getChatBroadcastAchiever('Overall time: 5:30.20 (new personal best)')
    ).toBeNull();
    expect(getChatBroadcastAchiever('Deep delves: 25')).toBeNull();
    expect(
      getChatBroadcastAchiever('The gemstone crab burrows away')
    ).toBeNull();
  });

  it('returns null for nullish input', () => {
    expect(getChatBroadcastAchiever(undefined)).toBeNull();
  });
});

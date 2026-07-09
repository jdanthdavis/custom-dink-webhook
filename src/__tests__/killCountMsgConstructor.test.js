import { describe, expect, it } from 'vitest';
import killCountMsgConstructor from '../core/helperFunctions/killCountMsgConstructor';

describe('killCountMsgConstructor', () => {
  it('uses a special "grumble count" phrasing for The Grumbler', () => {
    const msg = killCountMsgConstructor(
      'Swap',
      'irrelevant',
      'The Grumbler',
      1234
    );
    expect(msg).toBe(
      '**Swap** has defeated **The Grumbler** with a grumble count of **1,234!**'
    );
  });

  it('extracts the type from the primary "kill count" phrasing', () => {
    const msg = killCountMsgConstructor(
      'Swap',
      'Your TzTok-Jad kill count is: 500',
      'TzTok-Jad',
      500
    );
    expect(msg).toBe(
      '**Swap** has defeated **TzTok-Jad** with a kill count of **500!**'
    );
  });

  it('extracts the type from the primary "chest count" phrasing', () => {
    const msg = killCountMsgConstructor(
      'Swap',
      'Your Barrows chest count is: 10',
      'Barrows',
      10
    );
    expect(msg).toContain('with a chest count of **10!**');
  });

  it('extracts the type from the secondary "completed" phrasing', () => {
    const msg = killCountMsgConstructor(
      'Swap',
      'Your completed Wintertodt count is: 20',
      'Wintertodt',
      20
    );
    expect(msg).toContain('with a completed count of **20!**');
  });

  it('falls back to "completion" when the game message does not match', () => {
    const msg = killCountMsgConstructor(
      'Swap',
      'some unrelated message',
      'Vorkath',
      42
    );
    expect(msg).toContain('with a completion count of **42!**');
  });

  it('formats the kill count with thousands separators', () => {
    const msg = killCountMsgConstructor(
      'Swap',
      'some unrelated message',
      'Vorkath',
      1234567
    );
    expect(msg).toContain('**1,234,567!**');
  });
});

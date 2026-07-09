import { describe, expect, it } from 'vitest';
import formatLists from './formatLists';

describe('formatLists', () => {
  it('returns an empty string for an empty list', () => {
    expect(formatLists([])).toBe('');
  });

  it('returns the item itself for a single-item list', () => {
    expect(formatLists(['Attack'])).toBe('Attack');
  });

  it('joins two items with "and"', () => {
    expect(formatLists(['Attack', 'Strength'])).toBe('Attack and Strength');
  });

  it('joins 3+ items with an Oxford comma', () => {
    expect(formatLists(['Attack', 'Strength', 'Defence'])).toBe(
      'Attack, Strength, and Defence'
    );
  });
});

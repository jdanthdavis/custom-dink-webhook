import { describe, expect, it } from 'vitest';
import formatValue from './formatValue';

describe('formatValue', () => {
  it('formats small values in parens', () => {
    expect(formatValue(500)).toBe('(500)');
  });

  it('formats thousands with one decimal, trimming .0', () => {
    expect(formatValue(1000)).toBe('(1K)');
    expect(formatValue(1500)).toBe('(1.5K)');
  });

  it('formats millions with two decimals, trimming .00', () => {
    expect(formatValue(1e6)).toBe('(1M)');
    expect(formatValue(1.5e6)).toBe('(1.50M)');
  });

  it('formats billions', () => {
    expect(formatValue(1e9)).toBe('(1B)');
  });

  it('treats values at or above 2.147B as "Very valuable!"', () => {
    expect(formatValue(2147e6)).toBe('Very valuable!');
    expect(formatValue(3000e6)).toBe('Very valuable!');
  });

  it('strips parens when xpInterval is true', () => {
    expect(formatValue(500, true)).toBe('500');
    expect(formatValue(1500, true)).toBe('1.5K');
  });
});

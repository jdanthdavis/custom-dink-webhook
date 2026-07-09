import { describe, expect, it } from 'vitest';
import formatAsPercentage from './formatAsPercentage';

describe('formatAsPercentage', () => {
  it('uses 2 decimal places for single-digit percentages', () => {
    expect(formatAsPercentage(5, 100)).toBe('5.00');
    expect(formatAsPercentage(0.5, 100)).toBe('0.50');
  });

  it('uses 1 decimal place for percentages from 10 up to and including 100', () => {
    expect(formatAsPercentage(50, 100)).toBe('50.0');
    expect(formatAsPercentage(100, 100)).toBe('100.0');
  });

  it('returns a literal "100%" when the percentage exceeds 100', () => {
    expect(formatAsPercentage(150, 100)).toBe('100%');
  });

  it('returns "Invalid percentage" for non-numeric or non-positive-total input', () => {
    expect(formatAsPercentage(NaN, 100)).toBe('Invalid percentage');
    expect(formatAsPercentage(5, 'a')).toBe('Invalid percentage');
    expect(formatAsPercentage(5, 0)).toBe('Invalid percentage');
    expect(formatAsPercentage(5, -10)).toBe('Invalid percentage');
  });
});

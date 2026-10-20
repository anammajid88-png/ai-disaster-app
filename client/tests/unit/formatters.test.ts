import { describe, expect, it } from 'vitest';
import {
  formatCount,
  formatCountDelta,
  formatDuration,
  formatPercent,
  formatPercentPoints,
  formatScore,
} from '../../src/features/intelligence/utils/formatters';

describe('formatters', () => {
  describe('formatPercent', () => {
    it('formats percentages with one decimal place', () => {
      expect(formatPercent(91.4)).toBe('91.4%');
      expect(formatPercent(79)).toBe('79.0%');
      expect(formatPercent(100)).toBe('100.0%');
      expect(formatPercent(0)).toBe('0.0%');
    });

    it('handles non-finite values safely', () => {
      expect(formatPercent(null)).toBe('—');
      expect(formatPercent(undefined)).toBe('—');
      expect(formatPercent(NaN)).toBe('—');
      expect(formatPercent(Infinity)).toBe('—');
    });

    it('supports 0 decimal digits when requested', () => {
      expect(formatPercent(91.4, 0)).toBe('91%');
      expect(formatPercent(79.8, 0)).toBe('80%');
    });
  });

  describe('formatPercentPoints', () => {
    it('eliminates IEEE 754 binary floating-point artifacts', () => {
      // 97.2 - 69.1 in raw JS is 28.10000000000001
      expect(formatPercentPoints(97.2, 69.1)).toBe('+28.1 pp');
      // 97.2 - 79.0 in raw JS is 18.200000000000003
      expect(formatPercentPoints(97.2, 79.0)).toBe('+18.2 pp');
    });

    it('formats negative deltas with minus sign', () => {
      expect(formatPercentPoints(70.0, 75.5)).toBe('-5.5 pp');
    });

    it('formats near-zero deltas without negative zero', () => {
      expect(formatPercentPoints(50.01, 50.02)).toBe('0.0 pp');
      expect(formatPercentPoints(50.0, 50.0)).toBe('0.0 pp');
    });

    it('handles non-finite and missing values', () => {
      expect(formatPercentPoints(null, 50)).toBe('—');
      expect(formatPercentPoints(50, undefined)).toBe('—');
      expect(formatPercentPoints(NaN, 50)).toBe('—');
    });
  });

  describe('formatCount and formatCountDelta', () => {
    it('formats counts with thousand separators', () => {
      expect(formatCount(244818)).toBe('244,818');
      expect(formatCount(0)).toBe('0');
      expect(formatCount(null)).toBe('—');
    });

    it('formats count deltas with sign and parity', () => {
      expect(formatCountDelta(50000, 30000)).toBe('+20,000');
      expect(formatCountDelta(30000, 50000)).toBe('-20,000');
      expect(formatCountDelta(50000, 50000)).toBe('Parity');
    });
  });

  describe('formatDuration and formatScore', () => {
    it('formats durations in hours and minutes', () => {
      expect(formatDuration(1.5)).toBe('1h 30m');
      expect(formatDuration(2.0)).toBe('2h');
      expect(formatDuration(0.5)).toBe('30 min');
      expect(formatDuration(null)).toBe('—');
    });

    it('formats scores out of max', () => {
      expect(formatScore(78)).toBe('78/100');
      expect(formatScore(null)).toBe('—');
    });
  });
});

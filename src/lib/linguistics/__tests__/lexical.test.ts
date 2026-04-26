import { describe, it, expect } from 'vitest';
import { countQuestions, questionRate, countGratitude, countHedging, positivityRatio, computeLexicalMetrics } from '../lexical';

describe('countQuestions', () => {
  it('counts question marks', () => {
    expect(countQuestions('How much? And when?')).toBe(2);
  });
  it('returns 0 for no questions', () => {
    expect(countQuestions('I offer 85 per unit.')).toBe(0);
  });
});

describe('questionRate', () => {
  it('computes rate across messages', () => {
    expect(questionRate(['How much?', 'I offer 85.', 'When can you deliver?'])).toBeCloseTo(2 / 3);
  });
  it('returns 0 for empty', () => {
    expect(questionRate([])).toBe(0);
  });
});

describe('countGratitude', () => {
  it('counts gratitude words', () => {
    expect(countGratitude('Thank you for the offer. I appreciate your flexibility.')).toBe(2);
  });
});

describe('countHedging', () => {
  it('counts hedging language', () => {
    expect(countHedging('Perhaps we could find a middle ground. I think that might work.')).toBe(4);
  });
});

describe('positivityRatio', () => {
  it('returns 1 for all positive', () => {
    expect(positivityRatio('Great offer, I agree this is fair and reasonable.')).toBe(1);
  });
  it('returns 0.5 for no sentiment words', () => {
    expect(positivityRatio('The unit price is 85.')).toBe(0.5);
  });
});

describe('computeLexicalMetrics', () => {
  it('computes all metrics', () => {
    const messages = [
      'Thank you for meeting today. How much per unit?',
      'I appreciate that. Perhaps 85 would work?',
    ];
    const metrics = computeLexicalMetrics(messages);
    expect(metrics.questionRate).toBeGreaterThan(0);
    expect(metrics.gratitudeCount).toBe(2);
    expect(metrics.hedgingCount).toBeGreaterThanOrEqual(1);
    expect(metrics.totalWords).toBeGreaterThan(0);
  });
});

/**
 * Lightweight lexical/regex-based process metrics.
 * No LLM calls — fast, deterministic.
 */

/**
 * Count questions in a text (sentences ending with ?).
 */
export function countQuestions(text: string): number {
  const matches = text.match(/\?/g);
  return matches ? matches.length : 0;
}

/**
 * Compute question rate: questions per message.
 */
export function questionRate(messages: string[]): number {
  if (messages.length === 0) return 0;
  const total = messages.reduce((sum, m) => sum + countQuestions(m), 0);
  return total / messages.length;
}

/**
 * Count gratitude expressions.
 */
export function countGratitude(text: string): number {
  const patterns = /\b(thank|thanks|grateful|appreciate|appreciation)\b/gi;
  const matches = text.match(patterns);
  return matches ? matches.length : 0;
}

/**
 * Count hedging language.
 */
export function countHedging(text: string): number {
  const patterns = /\b(perhaps|maybe|possibly|might|could|somewhat|slightly|I think|it seems)\b/gi;
  const matches = text.match(patterns);
  return matches ? matches.length : 0;
}

/**
 * Compute simple positivity score based on positive/negative word ratio.
 */
export function positivityRatio(text: string): number {
  const positive = /\b(good|great|excellent|happy|agree|fair|reasonable|pleased|willing|flexible|appreciate)\b/gi;
  const negative = /\b(bad|poor|unacceptable|refuse|reject|walk away|impossible|unfortunately|cannot|disappointed)\b/gi;

  const posCount = (text.match(positive) || []).length;
  const negCount = (text.match(negative) || []).length;
  const total = posCount + negCount;

  if (total === 0) return 0.5;
  return posCount / total;
}

/**
 * Compute all lexical metrics for a set of messages from one agent.
 */
export function computeLexicalMetrics(messages: string[]): {
  questionRate: number;
  gratitudeCount: number;
  hedgingCount: number;
  positivity: number;
  totalWords: number;
} {
  const allText = messages.join(' ');
  return {
    questionRate: questionRate(messages),
    gratitudeCount: messages.reduce((sum, m) => sum + countGratitude(m), 0),
    hedgingCount: messages.reduce((sum, m) => sum + countHedging(m), 0),
    positivity: positivityRatio(allText),
    totalWords: allText.trim().split(/\s+/).filter(Boolean).length,
  };
}

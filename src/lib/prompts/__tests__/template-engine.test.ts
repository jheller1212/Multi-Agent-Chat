import { describe, it, expect } from 'vitest';
import { renderTemplate, extractSlotNames, extractBlockNames, validateRendered } from '../template-engine';

describe('renderTemplate', () => {
  it('substitutes simple slots', () => {
    const template = 'Hello {NAME}, your budget is ${BUDGET}.';
    const result = renderTemplate(template, {
      slots: { NAME: 'Alice', BUDGET: '100' },
    });
    expect(result).toBe('Hello Alice, your budget is $100.');
  });

  it('activates conditional blocks when listed', () => {
    const template = 'Base text.\n\n[MULTI_ISSUE]\nExtra issues here.\n[/MULTI_ISSUE]\n\nEnd.';
    const result = renderTemplate(template, {
      slots: {},
      activeBlocks: ['MULTI_ISSUE'],
    });
    expect(result).toContain('Extra issues here.');
    expect(result).toContain('Base text.');
    expect(result).toContain('End.');
  });

  it('removes conditional blocks when not listed', () => {
    const template = 'Base text.\n\n[MULTI_ISSUE]\nExtra issues here.\n[/MULTI_ISSUE]\n\nEnd.';
    const result = renderTemplate(template, {
      slots: {},
      activeBlocks: [],
    });
    expect(result).not.toContain('Extra issues here.');
    expect(result).toContain('Base text.');
    expect(result).toContain('End.');
  });

  it('handles multiple blocks', () => {
    const template = '[A]\nBlock A\n[/A]\n[B]\nBlock B\n[/B]';
    const result = renderTemplate(template, {
      slots: {},
      activeBlocks: ['A'],
    });
    expect(result).toContain('Block A');
    expect(result).not.toContain('Block B');
  });

  it('substitutes slots inside active blocks', () => {
    const template = '[MANDATE]\n{MANDATE_TEXT}\n[/MANDATE]';
    const result = renderTemplate(template, {
      slots: { MANDATE_TEXT: 'Be warm and friendly.' },
      activeBlocks: ['MANDATE'],
    });
    expect(result).toBe('Be warm and friendly.');
  });

  it('handles the full buyer template pattern', () => {
    const template = 'Item: {ITEM_DESCRIPTION}\nBudget: ${BUDGET}\n\n[MULTI_ISSUE]\nPayment weight: {W_PAYMENT}/100\n[/MULTI_ISSUE]\n\n[CRITICALITY]\n{KRALJIC_QUADRANT}\n[/CRITICALITY]\n\nGuidelines here.';
    const result = renderTemplate(template, {
      slots: { ITEM_DESCRIPTION: 'desk chairs', BUDGET: '100' },
      activeBlocks: [],
    });
    expect(result).toContain('Item: desk chairs');
    expect(result).toContain('Budget: $100');
    expect(result).not.toContain('Payment weight');
    expect(result).toContain('Guidelines here.');
  });
});

describe('extractSlotNames', () => {
  it('extracts both {SLOT} and ${SLOT} patterns', () => {
    const template = 'Item: {ITEM_DESCRIPTION}, Price: ${LIST_PRICE}';
    const slots = extractSlotNames(template);
    expect(slots).toContain('ITEM_DESCRIPTION');
    expect(slots).toContain('LIST_PRICE');
  });

  it('deduplicates', () => {
    const template = '{A} and {A} again';
    expect(extractSlotNames(template)).toEqual(['A']);
  });
});

describe('extractBlockNames', () => {
  it('extracts block names', () => {
    const template = '[MULTI_ISSUE]content[/MULTI_ISSUE]\n[MANDATE]text[/MANDATE]';
    const blocks = extractBlockNames(template);
    expect(blocks).toContain('MULTI_ISSUE');
    expect(blocks).toContain('MANDATE');
  });
});

describe('validateRendered', () => {
  it('returns empty for fully rendered prompt', () => {
    expect(validateRendered('Hello Alice, budget is 100.')).toEqual([]);
  });

  it('returns unfilled slots', () => {
    expect(validateRendered('Hello {NAME}, budget is ${BUDGET}.')).toEqual(['NAME', 'BUDGET']);
  });
});

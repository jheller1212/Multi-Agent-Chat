import { describe, it, expect } from 'vitest';
import { extractAllowedValues, extractExpectedKeys } from '../schema-utils';
import { PROCUREMENT_SCENARIO, LEGAL_ADVOCACY_SCENARIO, MEDIATION_SCENARIO } from '../../scenario/templates';

describe('extractAllowedValues', () => {
  it('reads enum values from a JSON-Schema outputSchema (procurement judge)', () => {
    const schema = PROCUREMENT_SCENARIO.supervisors[0].outputSchema;
    expect(extractAllowedValues(schema)).toEqual(['ACCEPTANCE', 'REJECTION', 'CONTINUE']);
  });

  it('reads enum values for the legal advocacy verdict classifier', () => {
    const schema = LEGAL_ADVOCACY_SCENARIO.supervisors[0].outputSchema;
    expect(extractAllowedValues(schema)).toEqual(['PLAINTIFF', 'DEFENSE', 'CONTINUE']);
  });

  it('reads enum values for the mediation agreement checker', () => {
    const schema = MEDIATION_SCENARIO.supervisors[0].outputSchema;
    expect(extractAllowedValues(schema)).toEqual(['AGREEMENT', 'IMPASSE', 'CONTINUE']);
  });

  it('supports the legacy allowedValues shape', () => {
    expect(extractAllowedValues({ allowedValues: ['A', 'B'] })).toEqual(['A', 'B']);
  });

  it('supports the legacy values shape', () => {
    expect(extractAllowedValues({ values: ['X', 'Y'] })).toEqual(['X', 'Y']);
  });

  it('falls back to CONTINUE when no enum is found', () => {
    expect(extractAllowedValues({})).toEqual(['CONTINUE']);
    expect(extractAllowedValues({ type: 'object', properties: { status: { type: 'string' } } })).toEqual(['CONTINUE']);
  });

  it('ignores properties without an enum and uses the first property with one', () => {
    const schema = {
      type: 'object',
      properties: {
        note: { type: 'string' },
        status: { type: 'string', enum: ['CONTINUE', 'DONE'] },
      },
      required: ['status'],
    };
    expect(extractAllowedValues(schema)).toEqual(['CONTINUE', 'DONE']);
  });
});

describe('extractExpectedKeys', () => {
  it('reads property keys from a JSON-Schema outputSchema', () => {
    const schema = {
      type: 'object',
      properties: {
        deal: { type: 'integer' },
        final_price: { type: 'number' },
      },
      required: ['deal'],
    };
    expect(extractExpectedKeys(schema)).toEqual(['deal', 'final_price']);
  });

  it('reads property keys from the procurement judge schema', () => {
    const schema = PROCUREMENT_SCENARIO.supervisors[0].outputSchema;
    expect(extractExpectedKeys(schema)).toEqual(['status']);
  });

  it('supports the legacy flat shape (keys minus reserved)', () => {
    expect(extractExpectedKeys({ type: 'object', deal: 'integer', final_price: 'float' })).toEqual(['deal', 'final_price']);
  });

  it('returns an empty array for an empty schema', () => {
    expect(extractExpectedKeys({})).toEqual([]);
  });
});

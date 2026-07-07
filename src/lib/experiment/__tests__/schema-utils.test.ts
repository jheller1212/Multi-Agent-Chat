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

  it('reads the simple Studio classifier shape { allowedValues, terminalValues }', () => {
    // Exact serialization from the Scenario Studio (serializeClassifierSchema)
    const schema = {
      allowedValues: ['ACCEPTANCE', 'REJECTION', 'CONTINUE'],
      terminalValues: ['ACCEPTANCE', 'REJECTION'],
    };
    expect(extractAllowedValues(schema)).toEqual(['ACCEPTANCE', 'REJECTION', 'CONTINUE']);
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

  it('reads keys from the procurement outcome extractor schema (simple shape)', () => {
    const extractor = PROCUREMENT_SCENARIO.supervisors.find(s => s.name === 'outcome_extractor')!;
    expect(extractExpectedKeys(extractor.outputSchema)).toEqual([
      'deal', 'final_price', 'rounds', 'payment_terms_days', 'delivery_weeks', 'warranty_months',
    ]);
  });

  it('reads the simple Studio shape { keys: [{ name, type, nullable }] }', () => {
    const schema = {
      keys: [
        { name: 'deal', type: 'integer', nullable: false },
        { name: 'final_price', type: 'float', nullable: true },
        { name: 'rounds', type: 'integer', nullable: false },
      ],
    };
    expect(extractExpectedKeys(schema)).toEqual(['deal', 'final_price', 'rounds']);
  });

  it('ignores malformed entries in the simple Studio shape', () => {
    const schema = {
      keys: [
        { name: 'deal', type: 'integer', nullable: false },
        null,
        { type: 'float' },
        { name: '', type: 'string' },
      ],
    };
    expect(extractExpectedKeys(schema)).toEqual(['deal']);
  });

  it('does not leak the simple Studio classifier shape into expected keys', () => {
    expect(extractExpectedKeys({ allowedValues: ['A', 'B'], terminalValues: ['A'] })).toEqual([]);
  });

  it('supports the legacy flat shape (keys minus reserved)', () => {
    expect(extractExpectedKeys({ type: 'object', deal: 'integer', final_price: 'float' })).toEqual(['deal', 'final_price']);
  });

  it('returns an empty array for an empty schema', () => {
    expect(extractExpectedKeys({})).toEqual([]);
  });
});

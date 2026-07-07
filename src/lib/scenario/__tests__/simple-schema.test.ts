import { describe, expect, it } from 'vitest';

import {
  parseClassifierSchema,
  parseExtractorSchema,
  serializeClassifierSchema,
  serializeExtractorSchema,
} from '../simple-schema';

describe('parseClassifierSchema', () => {
  it('accepts the simple shape', () => {
    expect(
      parseClassifierSchema({ allowedValues: ['Cooperative', 'Stalled'], terminalValues: ['Stalled'] }),
    ).toEqual({ allowedValues: ['Cooperative', 'Stalled'], terminalValues: ['Stalled'] });
  });

  it('drops terminal values that are not allowed values', () => {
    expect(
      parseClassifierSchema({ allowedValues: ['A'], terminalValues: ['A', 'B'] }),
    ).toEqual({ allowedValues: ['A'], terminalValues: ['A'] });
  });

  it('accepts a legacy top-level enum', () => {
    expect(parseClassifierSchema({ enum: ['Deal', 'NoDeal'] })).toEqual({
      allowedValues: ['Deal', 'NoDeal'],
      terminalValues: [],
    });
  });

  it('accepts a legacy JSON-Schema properties enum', () => {
    expect(
      parseClassifierSchema({
        type: 'object',
        properties: { label: { type: 'string', enum: ['Cooperative', 'Competitive'] } },
      }),
    ).toEqual({ allowedValues: ['Cooperative', 'Competitive'], terminalValues: [] });
  });

  it('returns empty for null/empty/unknown shapes', () => {
    expect(parseClassifierSchema(null)).toEqual({ allowedValues: [], terminalValues: [] });
    expect(parseClassifierSchema({})).toEqual({ allowedValues: [], terminalValues: [] });
  });
});

describe('parseExtractorSchema', () => {
  it('accepts the simple shape and defaults invalid types to string', () => {
    expect(
      parseExtractorSchema({
        keys: [
          { name: 'price', type: 'float', nullable: true },
          { name: 'volume', type: 'weird', nullable: false },
        ],
      }),
    ).toEqual({
      keys: [
        { name: 'price', type: 'float', nullable: true },
        { name: 'volume', type: 'string', nullable: false },
      ],
    });
  });

  it('accepts legacy JSON-Schema properties + required', () => {
    expect(
      parseExtractorSchema({
        type: 'object',
        properties: {
          price: { type: 'number' },
          volume: { type: 'integer' },
          outcome: { type: 'string' },
        },
        required: ['outcome'],
      }),
    ).toEqual({
      keys: [
        { name: 'price', type: 'float', nullable: true },
        { name: 'volume', type: 'integer', nullable: true },
        { name: 'outcome', type: 'string', nullable: false },
      ],
    });
  });

  it('returns empty for null/empty shapes', () => {
    expect(parseExtractorSchema(null)).toEqual({ keys: [] });
    expect(parseExtractorSchema({})).toEqual({ keys: [] });
  });
});

describe('serialization round-trip', () => {
  it('classifier: serializes the simple shape and survives a round-trip', () => {
    const serialized = serializeClassifierSchema({
      allowedValues: ['Deal', ' NoDeal ', ''],
      terminalValues: ['Deal', 'Ghost'],
    });
    expect(serialized).toEqual({ allowedValues: ['Deal', 'NoDeal'], terminalValues: ['Deal'] });
    expect(parseClassifierSchema(serialized)).toEqual(serialized);
  });

  it('extractor: serializes the simple shape, trimming empty keys', () => {
    const serialized = serializeExtractorSchema({
      keys: [
        { name: ' price ', type: 'float', nullable: true },
        { name: '', type: 'string', nullable: true },
      ],
    });
    expect(serialized).toEqual({ keys: [{ name: 'price', type: 'float', nullable: true }] });
    expect(parseExtractorSchema(serialized)).toEqual(serialized);
  });
});

describe('v2 template compatibility', () => {
  it('parses union types like ["number","null"] as nullable float', () => {
    expect(
      parseExtractorSchema({
        type: 'object',
        properties: { final_price: { type: ['number', 'null'] }, rounds: { type: 'integer' } },
        required: ['final_price', 'rounds'],
      }),
    ).toEqual({
      keys: [
        { name: 'final_price', type: 'float', nullable: true },
        { name: 'rounds', type: 'integer', nullable: false },
      ],
    });
  });
});

/**
 * Simple supervisor output-schema shapes and tolerant parsing.
 *
 * New scenarios persist the SIMPLE shape:
 *   classifier: { allowedValues: string[], terminalValues: string[] }
 *   extractor / appraiser: { keys: [{ name, type, nullable }] }
 *
 * Existing scenarios may hold legacy JSON-Schema-ish shapes
 * ({ enum: [...] } / { properties: {...} }) — parsers accept both so old
 * rows keep loading. The runner is being updated in parallel to accept both.
 */
import type { OutcomeColumn } from '../../types/scenario';

export interface ClassifierSchema {
  allowedValues: string[];
  terminalValues: string[];
}

export interface ExtractorKey {
  name: string;
  type: OutcomeColumn['type'];
  nullable: boolean;
}

export interface ExtractorSchema {
  keys: ExtractorKey[];
}

const VALID_TYPES: ExtractorKey['type'][] = ['string', 'integer', 'float'];

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/** Parse any stored classifier schema (simple or legacy) into the simple shape. */
export function parseClassifierSchema(raw: Record<string, unknown> | null | undefined): ClassifierSchema {
  if (!raw) return { allowedValues: [], terminalValues: [] };

  // Simple shape
  if (Array.isArray(raw.allowedValues)) {
    const allowedValues = asStringArray(raw.allowedValues);
    const terminalValues = asStringArray(raw.terminalValues).filter(v => allowedValues.includes(v));
    return { allowedValues, terminalValues };
  }

  // Legacy JSON-Schema-ish: { enum: [...] } or { properties: { label: { enum: [...] } } }
  if (Array.isArray(raw.enum)) {
    return { allowedValues: asStringArray(raw.enum), terminalValues: [] };
  }
  if (raw.properties && typeof raw.properties === 'object') {
    for (const prop of Object.values(raw.properties as Record<string, unknown>)) {
      if (prop && typeof prop === 'object' && Array.isArray((prop as Record<string, unknown>).enum)) {
        return { allowedValues: asStringArray((prop as Record<string, unknown>).enum), terminalValues: [] };
      }
    }
  }

  return { allowedValues: [], terminalValues: [] };
}

/** Parse any stored extractor/appraiser schema (simple or legacy) into the simple shape. */
export function parseExtractorSchema(raw: Record<string, unknown> | null | undefined): ExtractorSchema {
  if (!raw) return { keys: [] };

  // Simple shape
  if (Array.isArray(raw.keys)) {
    const keys = (raw.keys as unknown[])
      .filter((k): k is Record<string, unknown> => !!k && typeof k === 'object')
      .filter(k => typeof k.name === 'string' && (k.name as string).length > 0)
      .map((k): ExtractorKey => ({
        name: k.name as string,
        type: VALID_TYPES.includes(k.type as ExtractorKey['type']) ? (k.type as ExtractorKey['type']) : 'string',
        nullable: k.nullable !== false,
      }));
    return { keys };
  }

  // Legacy JSON-Schema-ish: { properties: { price: { type: 'number' }, ... }, required: [...] }
  if (raw.properties && typeof raw.properties === 'object') {
    const required = asStringArray(raw.required);
    const keys = Object.entries(raw.properties as Record<string, unknown>).map(([name, prop]): ExtractorKey => {
      let jsonType = prop && typeof prop === 'object' ? (prop as Record<string, unknown>).type : undefined;
      let unionNullable = false;
      // Union types like ['number', 'null'] — take the first non-null member.
      if (Array.isArray(jsonType)) {
        unionNullable = jsonType.includes('null');
        jsonType = jsonType.find(t => t !== 'null');
      }
      const type: ExtractorKey['type'] =
        jsonType === 'integer' ? 'integer'
        : jsonType === 'number' ? 'float'
        : 'string';
      return { name, type, nullable: unionNullable || !required.includes(name) };
    });
    return { keys };
  }

  return { keys: [] };
}

/** Serialize a classifier schema to the simple persisted shape. */
export function serializeClassifierSchema(schema: ClassifierSchema): Record<string, unknown> {
  const allowedValues = schema.allowedValues.map(v => v.trim()).filter(Boolean);
  return {
    allowedValues,
    terminalValues: schema.terminalValues.filter(v => allowedValues.includes(v)),
  };
}

/** Serialize an extractor/appraiser schema to the simple persisted shape. */
export function serializeExtractorSchema(schema: ExtractorSchema): Record<string, unknown> {
  return {
    keys: schema.keys
      .filter(k => k.name.trim().length > 0)
      .map(k => ({ name: k.name.trim(), type: k.type, nullable: k.nullable })),
  };
}

/**
 * Helpers for reading supervisor output schemas.
 *
 * Scenario templates use JSON-Schema shapes:
 *   { type: 'object', properties: { status: { type: 'string', enum: ['CONTINUE', ...] } }, required: ['status'] }
 *
 * A legacy custom shape ({ allowedValues: [...] } / { values: [...] }) is still
 * supported for backward compatibility with older stored scenarios.
 */

/**
 * Extract the allowed classification values from a supervisor output schema.
 * Reads `properties.<key>.enum` (JSON-Schema), falling back to the legacy
 * `allowedValues` / `values` arrays. Defaults to ['CONTINUE'] if none found.
 */
export function extractAllowedValues(schema: Record<string, unknown>): string[] {
  // Legacy custom shapes
  if (Array.isArray(schema['allowedValues'])) {
    return (schema['allowedValues'] as unknown[]).map(String);
  }
  if (Array.isArray(schema['values'])) {
    return (schema['values'] as unknown[]).map(String);
  }

  // JSON-Schema: first property with an enum
  const properties = schema['properties'];
  if (properties && typeof properties === 'object') {
    for (const prop of Object.values(properties as Record<string, unknown>)) {
      if (prop && typeof prop === 'object') {
        const enumValues = (prop as Record<string, unknown>)['enum'];
        if (Array.isArray(enumValues) && enumValues.length > 0) {
          return enumValues.map(String);
        }
      }
    }
  }

  return ['CONTINUE'];
}

/**
 * Extract the expected output keys from a supervisor output schema.
 * Reads `Object.keys(properties)` (JSON-Schema), falling back to the legacy
 * shape where top-level keys (minus reserved ones) are the expected keys.
 */
export function extractExpectedKeys(schema: Record<string, unknown>): string[] {
  const properties = schema['properties'];
  if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
    return Object.keys(properties as Record<string, unknown>);
  }

  if (typeof schema === 'object' && schema !== null) {
    return Object.keys(schema).filter(
      k => k !== 'type' && k !== 'allowedValues' && k !== 'values' && k !== 'required',
    );
  }

  return [];
}

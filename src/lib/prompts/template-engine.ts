/**
 * Prompt template engine: loads markdown templates, substitutes slots,
 * activates/deactivates conditional blocks, and validates completeness.
 */

export interface TemplateContext {
  /** Slot values to substitute (e.g., { ITEM_DESCRIPTION: "office chairs", BUDGET: "100" }). */
  slots: Record<string, string | number>;
  /** Conditional blocks to activate (e.g., ["MULTI_ISSUE", "MANDATE"]). */
  activeBlocks?: string[];
}

/**
 * Render a prompt template with slot substitution and conditional blocks.
 *
 * Slots: {SLOT_NAME} → replaced with value from context.slots
 * Conditional blocks: [BLOCK_NAME]...[/BLOCK_NAME] → included only if blockName is in activeBlocks
 */
export function renderTemplate(template: string, context: TemplateContext): string {
  let result = template;

  // Process conditional blocks: [BLOCK_NAME]content[/BLOCK_NAME]
  const blockPattern = /\[([A-Z_]+)\]([\s\S]*?)\[\/\1\]/g;
  result = result.replace(blockPattern, (_match, blockName: string, blockContent: string) => {
    if (context.activeBlocks?.includes(blockName)) {
      return blockContent;
    }
    return '';
  });

  // Substitute slots: {SLOT_NAME} → value
  for (const [key, value] of Object.entries(context.slots)) {
    const pattern = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(pattern, String(value));
  }

  // Note: ${SLOT_NAME} in templates means literal "$" + slot value (e.g., "${LIST_PRICE}" → "$100").
  // The {SLOT_NAME} replacement above already handles this correctly — the "$" is preserved as literal currency.

  // Clean up extra blank lines from removed blocks
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

/**
 * Extract all slot names from a template (both {SLOT} and ${SLOT} patterns).
 */
export function extractSlotNames(template: string): string[] {
  const slots = new Set<string>();
  const pattern = /\$?\{([A-Z_][A-Z0-9_]*)\}/g;
  let match;
  while ((match = pattern.exec(template)) !== null) {
    slots.add(match[1]);
  }
  return Array.from(slots);
}

/**
 * Extract all conditional block names from a template.
 */
export function extractBlockNames(template: string): string[] {
  const blocks = new Set<string>();
  const pattern = /\[([A-Z_]+)\]/g;
  let match;
  while ((match = pattern.exec(template)) !== null) {
    blocks.add(match[1]);
  }
  return Array.from(blocks);
}

/**
 * Validate that all slots in a rendered template have been filled.
 * Returns unfilled slot names, or empty array if all filled.
 */
export function validateRendered(rendered: string): string[] {
  const unfilled: string[] = [];
  const pattern = /\$?\{([A-Z_][A-Z0-9_]*)\}/g;
  let match;
  while ((match = pattern.exec(rendered)) !== null) {
    unfilled.push(match[1]);
  }
  return unfilled;
}

You are extracting structured data from a procurement negotiation message.

Speaker role: {SPEAKER_ROLE}
Message: {MESSAGE_TEXT}

Extract any numerical values that the speaker has proposed in this message for the following issues. If the speaker did not propose a value for an issue, return null for that field.

Issues to extract:
- price: number or null (per unit, in USD)
- payment_terms_days: integer or null (only if multi-issue mode)
- delivery_weeks: integer or null (only if multi-issue mode)
- warranty_months: integer or null (only if multi-issue mode)

Distinguish between proposing a value (active offer or counter-offer) and merely mentioning a value (e.g., quoting the counterpart's prior offer). Only extract values the speaker is proposing.

Output a single JSON object with the fields above. Do not output any other text.

Example: {"price": 84.50, "payment_terms_days": 30, "delivery_weeks": 4, "warranty_months": 12}

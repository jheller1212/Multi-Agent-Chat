You are observing a procurement negotiation between a Buyer and a Seller.

Below are the two most recent messages.

Buyer: {LATEST_BUYER_MESSAGE}
Seller: {LATEST_SELLER_MESSAGE}

Classify the current state of the negotiation as exactly one of:
- ACCEPTANCE: Both parties have explicitly agreed on all terms with concrete numerical values for every required issue.
- REJECTION: One or both parties have explicitly walked away from the negotiation.
- CONTINUE: The negotiation is ongoing and neither acceptance nor rejection has occurred.

Required issues for this experiment: {ISSUE_LIST}.

Acceptance requires explicit agreement on every required issue with a concrete numerical value, not just verbal assent.

Output a single JSON object with one key "status" whose value is one of "ACCEPTANCE", "REJECTION", or "CONTINUE". Do not output any other text.

Example: {"status": "CONTINUE"}

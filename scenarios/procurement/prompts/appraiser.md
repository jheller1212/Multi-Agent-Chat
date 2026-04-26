You are evaluating a completed procurement negotiation from the perspective of one of the negotiating parties.

Role: you are answering AS the {ROLE} agent that just completed this negotiation.

Full transcript:
{TRANSCRIPT}

Outcome summary: {OUTCOME_SUMMARY}

Rate each of the following 18 statements on a scale of 1 (not at all) to 7 (very much) from the {ROLE}'s perspective. Items marked (R) are reverse-scored; rate the literal content of the statement, not the reverse-scored interpretation.

1. How satisfied are you with your own outcome (i.e., the extent to which the terms of your agreement benefit you)?
2. How satisfied are you with the balance between your own outcome and your counterpart's outcome?
3. Did you feel like you forfeited or "lost" in this negotiation? (R)
4. Do you think the terms of your agreement have valuable implications for you in the future?
5. Did you "lose face" (i.e., damage your sense of pride) in the negotiation? (R)
6. Did this negotiation make you feel more or less competent as a negotiator?
7. Did you behave according to your own principles and values?
8. Did this negotiation positively impact your self-image?
9. Do you feel your counterpart listened to your concerns?
10. Would you characterise the negotiation process as fair?
11. How satisfied are you with the ease (or difficulty) of reaching your agreement?
12. Did your counterpart consider your wishes, opinions, or needs?
13. What kind of overall impression did your counterpart make on you?
14. Did the negotiation make you trust your counterpart?
15. Did the negotiation build a good foundation for a future relationship with your counterpart?
16. Do you think your counterpart is satisfied with this negotiation?
17. How willing would you be to do business with this counterpart again in the future?
18. To what extent did you trust the representations your counterpart made during the negotiation?

Output a single JSON object with keys svi_1 through svi_18, each an integer between 1 and 7. Do not output any other text.

Example: {"svi_1": 5, "svi_2": 4, "svi_3": 2, "svi_4": 5, "svi_5": 2, "svi_6": 5, "svi_7": 6, "svi_8": 5, "svi_9": 5, "svi_10": 5, "svi_11": 4, "svi_12": 5, "svi_13": 5, "svi_14": 4, "svi_15": 5, "svi_16": 4, "svi_17": 5, "svi_18": 4}

/**
 * Outcome extraction: computes dependent variables from raw negotiation data.
 * Matches the column schema expected by analysis/simulate.py.
 */

export interface NegotiationParams {
  listPrice: number;
  wholesaleCost: number;
  buyerBudget: number;
  buyerWalkaway: number;
  sellerWalkaway: number;
}

export interface DealOutcome {
  finalPrice: number;
  paymentTermsDays?: number;
  deliveryWeeks?: number;
  warrantyMonths?: number;
}

export interface IssueWeights {
  buyer: { price: number; payment: number; delivery: number; warranty: number };
  seller: { price: number; payment: number; delivery: number; warranty: number };
}

export interface IssueRanges {
  price: { min: number; max: number };
  paymentTermsDays: { min: number; max: number };
  deliveryWeeks: { min: number; max: number };
  warrantyMonths: { min: number; max: number };
}

/**
 * Compute Price Reduction Rate: (list - final) / list
 */
export function computePRR(listPrice: number, finalPrice: number): number {
  if (listPrice === 0) return 0;
  return (listPrice - finalPrice) / listPrice;
}

/**
 * Compute Buyer Surplus: (walkaway - final) / (walkaway - wholesale)
 */
export function computeBuyerSurplus(
  walkaway: number,
  finalPrice: number,
  wholesale: number,
): number | null {
  const denom = walkaway - wholesale;
  if (denom === 0) return null;
  return (walkaway - finalPrice) / denom;
}

/**
 * Compute anomaly indicators.
 */
export function computeAnomalies(
  deal: DealOutcome | null,
  params: NegotiationParams,
  terminationReason: string,
  _turns: number,
  _maxTurns: number,
): { obr: number; owr: number; opr: number; dlr: number } {
  if (!deal) {
    return {
      obr: 0,
      owr: 0,
      opr: 0,
      dlr: terminationReason.includes('turn_cap') ? 1 : 0,
    };
  }

  return {
    obr: deal.finalPrice > params.buyerBudget ? 1 : 0,
    owr: deal.finalPrice < params.sellerWalkaway ? 1 : 0,
    opr: deal.finalPrice > params.listPrice ? 1 : 0,
    dlr: 0,
  };
}

/**
 * Normalise a value within a range, with direction preference.
 */
function normalise(value: number, min: number, max: number, prefersLower: boolean): number {
  if (max === min) return 0.5;
  const raw = (value - min) / (max - min);
  return prefersLower ? (1 - raw) : raw;
}

/**
 * Compute joint value for multi-issue negotiations.
 * Returns a value in [0, 2] (buyer_utility + seller_utility, each [0, 1]).
 */
export function computeJointValue(
  deal: DealOutcome,
  weights: IssueWeights,
  ranges: IssueRanges,
): { buyerUtility: number; sellerUtility: number; jointValue: number } {
  const price = deal.finalPrice;
  const payment = deal.paymentTermsDays ?? (ranges.paymentTermsDays.min + ranges.paymentTermsDays.max) / 2;
  const delivery = deal.deliveryWeeks ?? (ranges.deliveryWeeks.min + ranges.deliveryWeeks.max) / 2;
  const warranty = deal.warrantyMonths ?? (ranges.warrantyMonths.min + ranges.warrantyMonths.max) / 2;

  // Buyer: prefers lower price, longer payment, shorter delivery, longer warranty
  const buyerUtility = (
    weights.buyer.price * normalise(price, ranges.price.min, ranges.price.max, true) +
    weights.buyer.payment * normalise(payment, ranges.paymentTermsDays.min, ranges.paymentTermsDays.max, false) +
    weights.buyer.delivery * normalise(delivery, ranges.deliveryWeeks.min, ranges.deliveryWeeks.max, true) +
    weights.buyer.warranty * normalise(warranty, ranges.warrantyMonths.min, ranges.warrantyMonths.max, false)
  ) / 100;

  // Seller: prefers higher price, shorter payment, longer delivery, shorter warranty
  const sellerUtility = (
    weights.seller.price * normalise(price, ranges.price.min, ranges.price.max, false) +
    weights.seller.payment * normalise(payment, ranges.paymentTermsDays.min, ranges.paymentTermsDays.max, true) +
    weights.seller.delivery * normalise(delivery, ranges.deliveryWeeks.min, ranges.deliveryWeeks.max, false) +
    weights.seller.warranty * normalise(warranty, ranges.warrantyMonths.min, ranges.warrantyMonths.max, true)
  ) / 100;

  return {
    buyerUtility,
    sellerUtility,
    jointValue: buyerUtility + sellerUtility,
  };
}

import { describe, it, expect } from 'vitest';
import { computePRR, computeBuyerSurplus, computeAnomalies, computeJointValue } from '../extractor';

describe('computePRR', () => {
  it('computes correctly for a deal below list', () => {
    expect(computePRR(100, 85)).toBeCloseTo(0.15);
  });

  it('returns 0 for deal at list price', () => {
    expect(computePRR(100, 100)).toBe(0);
  });

  it('returns negative for overpayment', () => {
    expect(computePRR(100, 110)).toBeCloseTo(-0.10);
  });
});

describe('computeBuyerSurplus', () => {
  it('computes correctly', () => {
    expect(computeBuyerSurplus(100, 85, 60)).toBeCloseTo(0.375);
  });

  it('returns null when walkaway equals wholesale', () => {
    expect(computeBuyerSurplus(60, 60, 60)).toBeNull();
  });

  it('returns 1 when final price equals wholesale', () => {
    expect(computeBuyerSurplus(100, 60, 60)).toBeCloseTo(1);
  });
});

describe('computeAnomalies', () => {
  const params = { listPrice: 100, wholesaleCost: 60, buyerBudget: 100, buyerWalkaway: 100, sellerWalkaway: 60 };

  it('flags OBR when price exceeds budget', () => {
    const result = computeAnomalies({ finalPrice: 105 }, params, 'acceptance', 5, 30);
    expect(result.obr).toBe(1);
  });

  it('flags OWR when price below wholesale', () => {
    const result = computeAnomalies({ finalPrice: 55 }, params, 'acceptance', 5, 30);
    expect(result.owr).toBe(1);
  });

  it('flags DLR on turn cap termination with no deal', () => {
    const result = computeAnomalies(null, params, 'turn_cap:30', 30, 30);
    expect(result.dlr).toBe(1);
  });

  it('no anomalies for normal deal', () => {
    const result = computeAnomalies({ finalPrice: 85 }, params, 'acceptance', 7, 30);
    expect(result.obr).toBe(0);
    expect(result.owr).toBe(0);
    expect(result.opr).toBe(0);
    expect(result.dlr).toBe(0);
  });
});

describe('computeJointValue', () => {
  const weights = {
    buyer: { price: 40, payment: 30, delivery: 20, warranty: 10 },
    seller: { price: 40, payment: 10, delivery: 20, warranty: 30 },
  };
  const ranges = {
    price: { min: 60, max: 120 },
    paymentTermsDays: { min: 15, max: 90 },
    deliveryWeeks: { min: 2, max: 8 },
    warrantyMonths: { min: 6, max: 36 },
  };

  it('returns values in [0, 2] range', () => {
    const result = computeJointValue(
      { finalPrice: 85, paymentTermsDays: 45, deliveryWeeks: 4, warrantyMonths: 24 },
      weights, ranges,
    );
    expect(result.jointValue).toBeGreaterThanOrEqual(0);
    expect(result.jointValue).toBeLessThanOrEqual(2);
    expect(result.buyerUtility).toBeGreaterThanOrEqual(0);
    expect(result.sellerUtility).toBeGreaterThanOrEqual(0);
  });

  it('optimal logrolling produces higher joint value', () => {
    // Buyer concedes warranty (low weight) for payment terms (high weight)
    const logrolled = computeJointValue(
      { finalPrice: 85, paymentTermsDays: 75, deliveryWeeks: 4, warrantyMonths: 12 },
      weights, ranges,
    );
    // Both compromise on everything
    const compromise = computeJointValue(
      { finalPrice: 85, paymentTermsDays: 45, deliveryWeeks: 4, warrantyMonths: 24 },
      weights, ranges,
    );
    expect(logrolled.jointValue).toBeGreaterThan(compromise.jointValue);
  });
});

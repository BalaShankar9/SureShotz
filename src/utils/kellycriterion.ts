export interface KellyInput {
  predictedProbability: number;
  decimalOdds: number;
  bankroll: number;
  maxStakePercent?: number;
}

export interface KellyResult {
  kellyPercent: number;
  recommendedStake: number;
  edge: number;
  expectedValue: number;
  impliedProbability: number;
}

export function calculateKellyCriterion({
  predictedProbability,
  decimalOdds,
  bankroll,
  maxStakePercent = 1.0
}: KellyInput): KellyResult {
  const impliedProbability = 1 / decimalOdds;
  const edge = predictedProbability - impliedProbability;

  const b = decimalOdds - 1;
  const kellyFraction = (predictedProbability * b - (1 - predictedProbability)) / b;

  let kellyPercent = Math.max(0, kellyFraction * 100);

  kellyPercent = Math.min(kellyPercent, maxStakePercent);

  const recommendedStake = (bankroll * kellyPercent) / 100;

  const expectedValue = (predictedProbability * (decimalOdds - 1) - (1 - predictedProbability)) * recommendedStake;

  return {
    kellyPercent: Number(kellyPercent.toFixed(2)),
    recommendedStake: Number(recommendedStake.toFixed(2)),
    edge: Number((edge * 100).toFixed(2)),
    expectedValue: Number(expectedValue.toFixed(2)),
    impliedProbability: Number((impliedProbability * 100).toFixed(2))
  };
}

export function oddsToImpliedProbability(decimalOdds: number): number {
  return (1 / decimalOdds) * 100;
}

export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

export function calculateEdge(predictedProb: number, impliedProb: number): number {
  return (predictedProb - impliedProb) * 100;
}

export function calculateExpectedValue(
  stake: number,
  predictedProb: number,
  decimalOdds: number
): number {
  return stake * (predictedProb * (decimalOdds - 1) - (1 - predictedProb));
}

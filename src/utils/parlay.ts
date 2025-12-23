import { ParlayLegSelection } from './correlation';

export interface RoundRobinConfig {
  legs: ParlayLegSelection[];
  parlaySize: number;
}

export interface RoundRobinResult {
  totalCombinations: number;
  combinations: ParlayLegSelection[][];
  totalStake: number;
  potentialReturn: number;
  breakEvenWins: number;
}

export function generateRoundRobin(config: RoundRobinConfig, stakePerCombo: number): RoundRobinResult {
  const combinations = getCombinations(config.legs, config.parlaySize);

  const totalCombinations = combinations.length;
  const totalStake = totalCombinations * stakePerCombo;

  let potentialReturn = 0;
  combinations.forEach(combo => {
    const comboOdds = combo.reduce((acc, leg) => acc * leg.odds, 1);
    potentialReturn += stakePerCombo * comboOdds;
  });

  const avgOdds = potentialReturn / totalStake;
  const breakEvenWins = Math.ceil(totalStake / (stakePerCombo * avgOdds));

  return {
    totalCombinations,
    combinations,
    totalStake: Number(totalStake.toFixed(2)),
    potentialReturn: Number(potentialReturn.toFixed(2)),
    breakEvenWins
  };
}

function getCombinations<T>(arr: T[], size: number): T[][] {
  if (size > arr.length) return [];
  if (size === 1) return arr.map(item => [item]);

  const result: T[][] = [];

  function combine(start: number, combo: T[]) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }

  combine(0, []);
  return result;
}

export interface TeaserConfig {
  legs: ParlayLegSelection[];
  points: number;
  sport: 'NFL' | 'NBA';
}

export interface TeaserResult {
  adjustedLegs: ParlayLegSelection[];
  adjustedOdds: number;
  adjustedProbability: number;
  recommendation: string;
}

export function applyTeaser(config: TeaserConfig): TeaserResult {
  const adjustedLegs = config.legs.map(leg => {
    if (leg.type !== 'spread' && leg.type !== 'total') {
      return leg;
    }

    const adjustedLine = leg.line! + (leg.selection.includes('under') || leg.selection.includes('-') ? config.points : -config.points);

    const probabilityBoost = config.sport === 'NFL' ? 15 : 10;
    const adjustedProbability = Math.min(95, leg.probability + probabilityBoost);

    const oddsReduction = config.sport === 'NFL' ? 0.6 : 0.65;
    const adjustedOdds = 1 + ((leg.odds - 1) * oddsReduction);

    return {
      ...leg,
      line: adjustedLine,
      probability: adjustedProbability,
      odds: Number(adjustedOdds.toFixed(2))
    };
  });

  const adjustedOdds = adjustedLegs.reduce((acc, leg) => acc * leg.odds, 1);
  const adjustedProbability = adjustedLegs.reduce((acc, leg) => acc * (leg.probability / 100), 1) * 100;

  const recommendation = adjustedProbability > 60
    ? `Strong teaser with ${adjustedProbability.toFixed(1)}% win probability`
    : `Moderate teaser - consider adding more key numbers`;

  return {
    adjustedLegs,
    adjustedOdds: Number(adjustedOdds.toFixed(2)),
    adjustedProbability: Number(adjustedProbability.toFixed(2)),
    recommendation
  };
}

export interface ProgressiveParlayConfig {
  legs: ParlayLegSelection[];
  allowedLosses: number;
}

export interface ProgressiveParlayResult {
  fullWinPayout: number;
  partialPayouts: Array<{ hitsRequired: number; payout: number }>;
  recommendation: string;
}

export function calculateProgressiveParlay(
  config: ProgressiveParlayConfig,
  stake: number
): ProgressiveParlayResult {
  const fullOdds = config.legs.reduce((acc, leg) => acc * leg.odds, 1);
  const fullWinPayout = stake * fullOdds;

  const partialPayouts: Array<{ hitsRequired: number; payout: number }> = [];

  const totalLegs = config.legs.length;
  for (let hits = totalLegs - config.allowedLosses; hits < totalLegs; hits++) {
    const payoutMultiplier = Math.pow(fullOdds, hits / totalLegs) * 0.7;
    partialPayouts.push({
      hitsRequired: hits,
      payout: Number((stake * payoutMultiplier).toFixed(2))
    });
  }

  const recommendation = config.allowedLosses > 0
    ? `Progressive parlay provides insurance - ${config.allowedLosses} loss(es) allowed with partial payout`
    : 'Standard parlay - all legs must hit';

  return {
    fullWinPayout: Number(fullWinPayout.toFixed(2)),
    partialPayouts,
    recommendation
  };
}

export function calculateParlayProbability(legs: ParlayLegSelection[]): {
  independent: number;
  conservative: number;
  optimistic: number;
} {
  const independent = legs.reduce((acc, leg) => acc * (leg.probability / 100), 1) * 100;

  const conservative = independent * 0.85;

  const optimistic = independent * 1.15;

  return {
    independent: Number(independent.toFixed(2)),
    conservative: Number(conservative.toFixed(2)),
    optimistic: Number(Math.min(95, optimistic).toFixed(2))
  };
}

export function calculateExpectedValueForParlay(
  legs: ParlayLegSelection[],
  stake: number
): {
  ev: number;
  roi: number;
  recommendation: string;
} {
  const combinedOdds = legs.reduce((acc, leg) => acc * leg.odds, 1);
  const winProbability = legs.reduce((acc, leg) => acc * (leg.probability / 100), 1);

  const expectedReturn = winProbability * (stake * combinedOdds);
  const expectedLoss = (1 - winProbability) * stake;
  const ev = expectedReturn - expectedLoss;
  const roi = (ev / stake) * 100;

  let recommendation = '';
  if (roi > 20) {
    recommendation = 'Excellent +EV opportunity - strong bet';
  } else if (roi > 10) {
    recommendation = 'Good +EV - recommended bet';
  } else if (roi > 0) {
    recommendation = 'Slight +EV - marginal bet';
  } else {
    recommendation = 'Negative EV - avoid this bet';
  }

  return {
    ev: Number(ev.toFixed(2)),
    roi: Number(roi.toFixed(2)),
    recommendation
  };
}

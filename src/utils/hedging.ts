export interface HedgeInput {
  originalStake: number;
  currentOdds: number;
  legsHit: number;
  totalLegs: number;
  currentLiveValue: number;
  finalLegOdds: number;
}

export interface HedgeRecommendation {
  shouldHedge: boolean;
  hedgeAmount: number;
  hedgeOdds: number;
  guaranteedProfitMin: number;
  guaranteedProfitMax: number;
  noHedgePotential: number;
  recommendation: string;
  breakdownIfWin: { profit: number; description: string };
  breakdownIfLoss: { profit: number; description: string };
}

export function calculateHedge(input: HedgeInput): HedgeRecommendation {
  const potentialPayout = input.originalStake * input.currentOdds;

  if (input.legsHit < input.totalLegs - 1) {
    return {
      shouldHedge: false,
      hedgeAmount: 0,
      hedgeOdds: 0,
      guaranteedProfitMin: 0,
      guaranteedProfitMax: 0,
      noHedgePotential: potentialPayout - input.originalStake,
      recommendation: `Wait until ${input.totalLegs - 1}/${input.totalLegs} legs hit before hedging`,
      breakdownIfWin: { profit: 0, description: 'Not applicable yet' },
      breakdownIfLoss: { profit: -input.originalStake, description: 'Original stake lost' }
    };
  }

  const profitIfNoHedge = potentialPayout - input.originalStake;

  const oppositeOdds = input.finalLegOdds;

  const hedgeAmount = potentialPayout / oppositeOdds;

  const profitIfOriginalWins = potentialPayout - input.originalStake - hedgeAmount;

  const hedgePayout = hedgeAmount * oppositeOdds;
  const profitIfOriginalLoses = hedgePayout - input.originalStake - hedgeAmount;

  const guaranteedProfitMin = Math.min(profitIfOriginalWins, profitIfOriginalLoses);
  const guaranteedProfitMax = Math.max(profitIfOriginalWins, profitIfOriginalLoses);

  const shouldHedge = potentialPayout >= input.originalStake * 5;

  let recommendation = '';
  if (shouldHedge) {
    const guaranteedPercent = (guaranteedProfitMin / input.originalStake) * 100;
    recommendation = `HEDGE RECOMMENDED: Lock in ${guaranteedPercent.toFixed(0)}% guaranteed profit (${guaranteedProfitMin.toFixed(2)}). This represents ${((guaranteedProfitMin / profitIfNoHedge) * 100).toFixed(0)}% of max potential.`;
  } else {
    recommendation = `Consider letting it ride - potential profit of ${profitIfNoHedge.toFixed(2)} vs guaranteed ${guaranteedProfitMin.toFixed(2)}`;
  }

  return {
    shouldHedge,
    hedgeAmount: Number(hedgeAmount.toFixed(2)),
    hedgeOdds: oppositeOdds,
    guaranteedProfitMin: Number(guaranteedProfitMin.toFixed(2)),
    guaranteedProfitMax: Number(guaranteedProfitMax.toFixed(2)),
    noHedgePotential: Number(profitIfNoHedge.toFixed(2)),
    recommendation,
    breakdownIfWin: {
      profit: Number(profitIfOriginalWins.toFixed(2)),
      description: `Original parlay wins: Payout ${potentialPayout.toFixed(2)} - Stake ${input.originalStake} - Hedge ${hedgeAmount.toFixed(2)}`
    },
    breakdownIfLoss: {
      profit: Number(profitIfOriginalLoses.toFixed(2)),
      description: `Original parlay loses: Hedge wins ${hedgePayout.toFixed(2)} - Stake ${input.originalStake} - Hedge ${hedgeAmount.toFixed(2)}`
    }
  };
}

export interface PartialHedgeInput {
  originalStake: number;
  potentialPayout: number;
  desiredGuaranteedProfit: number;
  oppositeOdds: number;
}

export interface PartialHedgeResult {
  hedgeAmount: number;
  profitIfOriginalWins: number;
  profitIfOriginalLoses: number;
  hedgePercent: number;
}

export function calculatePartialHedge(input: PartialHedgeInput): PartialHedgeResult {
  const hedgeAmount = (input.desiredGuaranteedProfit + input.originalStake) / (input.oppositeOdds - 1);

  const profitIfOriginalWins = input.potentialPayout - input.originalStake - hedgeAmount;

  const hedgePayout = hedgeAmount * input.oppositeOdds;
  const profitIfOriginalLoses = hedgePayout - input.originalStake - hedgeAmount;

  const hedgePercent = (hedgeAmount / input.potentialPayout) * 100;

  return {
    hedgeAmount: Number(hedgeAmount.toFixed(2)),
    profitIfOriginalWins: Number(profitIfOriginalWins.toFixed(2)),
    profitIfOriginalLoses: Number(profitIfOriginalLoses.toFixed(2)),
    hedgePercent: Number(hedgePercent.toFixed(2))
  };
}

export interface MiddleOpportunity {
  leg1: { selection: string; line: number; odds: number };
  leg2: { selection: string; line: number; odds: number };
  middleRange: { low: number; high: number };
  bothWinProb: number;
  expectedValue: number;
}

export function findMiddleOpportunities(
  availableLines: Array<{ selection: string; line: number; odds: number }>
): MiddleOpportunity[] {
  const opportunities: MiddleOpportunity[] = [];

  for (let i = 0; i < availableLines.length; i++) {
    for (let j = i + 1; j < availableLines.length; j++) {
      const line1 = availableLines[i];
      const line2 = availableLines[j];

      if (
        (line1.selection.includes('over') && line2.selection.includes('under')) ||
        (line1.selection.includes('under') && line2.selection.includes('over'))
      ) {
        const overLine = line1.selection.includes('over') ? line1 : line2;
        const underLine = line1.selection.includes('over') ? line2 : line1;

        if (underLine.line > overLine.line) {
          const middleRange = {
            low: overLine.line,
            high: underLine.line
          };

          const rangeWidth = middleRange.high - middleRange.low;
          const bothWinProb = Math.min(30, rangeWidth * 3);

          const avgOdds = (overLine.odds + underLine.odds) / 2;
          const expectedValue = (bothWinProb / 100) * avgOdds * 2 - 2;

          if (rangeWidth >= 4 && rangeWidth <= 8) {
            opportunities.push({
              leg1: overLine,
              leg2: underLine,
              middleRange,
              bothWinProb: Number(bothWinProb.toFixed(2)),
              expectedValue: Number(expectedValue.toFixed(2))
            });
          }
        }
      }
    }
  }

  return opportunities.sort((a, b) => b.expectedValue - a.expectedValue);
}

export function calculateLiveHedgeAdjustment(
  originalOdds: number,
  liveOdds: number,
  legsRemaining: number
): {
  adjustment: 'increase' | 'decrease' | 'hold';
  reason: string;
  newHedgeAmount?: number;
} {
  const oddsChange = ((liveOdds - originalOdds) / originalOdds) * 100;

  if (oddsChange > 20) {
    return {
      adjustment: 'increase',
      reason: `Live odds increased by ${oddsChange.toFixed(1)}% - opponent weakening, consider larger hedge`,
      newHedgeAmount: undefined
    };
  } else if (oddsChange < -20) {
    return {
      adjustment: 'decrease',
      reason: `Live odds decreased by ${Math.abs(oddsChange).toFixed(1)}% - opponent strengthening, reduce hedge`,
      newHedgeAmount: undefined
    };
  } else {
    return {
      adjustment: 'hold',
      reason: 'Live odds stable - maintain hedge strategy',
      newHedgeAmount: undefined
    };
  }
}

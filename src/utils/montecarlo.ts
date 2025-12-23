export interface MonteCarloInput {
  initialBankroll: number;
  numBets: number;
  avgStakePercent: number;
  winRate: number;
  avgWinOdds: number;
  avgLossOdds: number;
  iterations: number;
}

export interface MonteCarloResult {
  outcomes: number[];
  meanFinalBankroll: number;
  medianFinalBankroll: number;
  ruinRisk: number;
  percentile25: number;
  percentile75: number;
  percentile95: number;
  expectedROI: number;
  maxDrawdown: number;
}

export function runMonteCarloSimulation(input: MonteCarloInput): MonteCarloResult {
  const outcomes: number[] = [];

  for (let i = 0; i < input.iterations; i++) {
    let bankroll = input.initialBankroll;
    let peak = bankroll;
    let maxDrawdown = 0;

    for (let bet = 0; bet < input.numBets; bet++) {
      const stake = bankroll * (input.avgStakePercent / 100);

      if (stake <= 0 || bankroll <= 0) {
        bankroll = 0;
        break;
      }

      const rand = Math.random();

      if (rand < input.winRate) {
        bankroll += stake * (input.avgWinOdds - 1);
      } else {
        bankroll -= stake;
      }

      if (bankroll > peak) {
        peak = bankroll;
      }

      const drawdown = ((peak - bankroll) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    outcomes.push(bankroll);
  }

  outcomes.sort((a, b) => a - b);

  const ruinCount = outcomes.filter(b => b <= input.initialBankroll * 0.01).length;
  const ruinRisk = (ruinCount / input.iterations) * 100;

  const meanFinalBankroll = outcomes.reduce((sum, val) => sum + val, 0) / input.iterations;
  const medianFinalBankroll = outcomes[Math.floor(input.iterations / 2)];

  const percentile25 = outcomes[Math.floor(input.iterations * 0.25)];
  const percentile75 = outcomes[Math.floor(input.iterations * 0.75)];
  const percentile95 = outcomes[Math.floor(input.iterations * 0.95)];

  const expectedROI = ((meanFinalBankroll - input.initialBankroll) / input.initialBankroll) * 100;

  const maxDrawdown = outcomes.reduce((max, bankroll) => {
    const dd = ((input.initialBankroll - bankroll) / input.initialBankroll) * 100;
    return Math.max(max, dd);
  }, 0);

  return {
    outcomes,
    meanFinalBankroll: Number(meanFinalBankroll.toFixed(2)),
    medianFinalBankroll: Number(medianFinalBankroll.toFixed(2)),
    ruinRisk: Number(ruinRisk.toFixed(2)),
    percentile25: Number(percentile25.toFixed(2)),
    percentile75: Number(percentile75.toFixed(2)),
    percentile95: Number(percentile95.toFixed(2)),
    expectedROI: Number(expectedROI.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2))
  };
}

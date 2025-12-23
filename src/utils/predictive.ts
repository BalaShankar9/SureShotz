export interface GameContext {
  sport: 'NFL' | 'NBA' | 'MLB';
  homeTeam: string;
  awayTeam: string;
  homeStats: TeamStats;
  awayStats: TeamStats;
  weather?: WeatherConditions;
  injuries?: InjuryReport[];
  pace?: number;
  restDays?: { home: number; away: number };
}

export interface TeamStats {
  offensiveRating: number;
  defensiveRating: number;
  avgPointsScored: number;
  avgPointsAllowed: number;
  homeAdvantage?: number;
  recentForm?: number[];
  ats?: number;
}

export interface WeatherConditions {
  windSpeed: number;
  temperature: number;
  precipitation: boolean;
}

export interface InjuryReport {
  player: string;
  position: string;
  impactRating: number;
}

export interface PredictionOutput {
  predictedWinner: string;
  winProbability: number;
  predictedScore: { home: number; away: number };
  predictedTotal: number;
  confidence: number;
  factors: string[];
}

export function generatePrediction(context: GameContext): PredictionOutput {
  let homeWinProb = 50;
  const factors: string[] = [];

  if (context.homeStats.homeAdvantage) {
    homeWinProb += context.homeStats.homeAdvantage;
    factors.push(`Home advantage: +${context.homeStats.homeAdvantage}%`);
  }

  const offensiveDiff = context.homeStats.offensiveRating - context.awayStats.offensiveRating;
  const defensiveDiff = context.awayStats.defensiveRating - context.homeStats.defensiveRating;

  homeWinProb += (offensiveDiff * 0.3) + (defensiveDiff * 0.3);

  if (offensiveDiff > 0) {
    factors.push(`Home offensive edge: +${offensiveDiff.toFixed(1)}`);
  } else if (offensiveDiff < 0) {
    factors.push(`Away offensive edge: +${Math.abs(offensiveDiff).toFixed(1)}`);
  }

  if (context.homeStats.recentForm && context.awayStats.recentForm) {
    const homeFormAvg = context.homeStats.recentForm.reduce((a, b) => a + b, 0) / context.homeStats.recentForm.length;
    const awayFormAvg = context.awayStats.recentForm.reduce((a, b) => a + b, 0) / context.awayStats.recentForm.length;
    const formDiff = homeFormAvg - awayFormAvg;
    homeWinProb += formDiff * 5;
    factors.push(`Form difference: ${formDiff > 0 ? 'Home' : 'Away'} +${Math.abs(formDiff).toFixed(1)}`);
  }

  if (context.weather && context.sport === 'NFL') {
    if (context.weather.windSpeed > 15) {
      homeWinProb -= 2;
      factors.push(`High wind (${context.weather.windSpeed}mph): -2% confidence`);
    }
    if (context.weather.precipitation) {
      homeWinProb -= 1;
      factors.push('Precipitation: -1% confidence');
    }
  }

  if (context.injuries && context.injuries.length > 0) {
    const homeInjuryImpact = context.injuries
      .filter(i => i.player.includes(context.homeTeam))
      .reduce((sum, i) => sum + i.impactRating, 0);
    const awayInjuryImpact = context.injuries
      .filter(i => i.player.includes(context.awayTeam))
      .reduce((sum, i) => sum + i.impactRating, 0);

    homeWinProb -= homeInjuryImpact;
    homeWinProb += awayInjuryImpact;

    if (homeInjuryImpact > 0) {
      factors.push(`Home injuries: -${homeInjuryImpact}%`);
    }
    if (awayInjuryImpact > 0) {
      factors.push(`Away injuries: +${awayInjuryImpact}%`);
    }
  }

  if (context.restDays) {
    if (context.sport === 'NBA') {
      const restDiff = context.restDays.home - context.restDays.away;
      if (Math.abs(restDiff) >= 2) {
        const restAdvantage = restDiff > 0 ? 3 : -3;
        homeWinProb += restAdvantage;
        factors.push(`Rest advantage: ${restDiff > 0 ? 'Home' : 'Away'} (${Math.abs(restDiff)} days)`);
      }

      if (context.restDays.away === 0) {
        homeWinProb += 5;
        factors.push('Away team on back-to-back: +5%');
      }
    }
  }

  homeWinProb = Math.max(5, Math.min(95, homeWinProb));

  let predictedHomeScore = context.homeStats.avgPointsScored;
  let predictedAwayScore = context.awayStats.avgPointsScored;

  predictedHomeScore = (predictedHomeScore + context.awayStats.avgPointsAllowed) / 2;
  predictedAwayScore = (predictedAwayScore + context.homeStats.avgPointsAllowed) / 2;

  if (context.pace) {
    const paceMultiplier = context.pace / 100;
    predictedHomeScore *= paceMultiplier;
    predictedAwayScore *= paceMultiplier;
  }

  const predictedWinner = homeWinProb > 50 ? context.homeTeam : context.awayTeam;
  const winProbability = homeWinProb > 50 ? homeWinProb : 100 - homeWinProb;

  const confidence = Math.abs(homeWinProb - 50) * 2;

  return {
    predictedWinner,
    winProbability: Number(winProbability.toFixed(2)),
    predictedScore: {
      home: Number(predictedHomeScore.toFixed(1)),
      away: Number(predictedAwayScore.toFixed(1))
    },
    predictedTotal: Number((predictedHomeScore + predictedAwayScore).toFixed(1)),
    confidence: Number(confidence.toFixed(2)),
    factors
  };
}

export function calculatePlusEVOpportunities(
  prediction: PredictionOutput,
  marketOdds: { ml: number; spread: number; total: number; over: number; under: number }
): Array<{ type: string; edge: number; ev: number; recommended: boolean }> {
  const opportunities = [];

  const mlImpliedProb = (1 / marketOdds.ml) * 100;
  const mlEdge = prediction.winProbability - mlImpliedProb;
  const mlEV = (prediction.winProbability / 100) * (marketOdds.ml - 1) - ((100 - prediction.winProbability) / 100);

  if (mlEdge > 2) {
    opportunities.push({
      type: 'Moneyline',
      edge: Number(mlEdge.toFixed(2)),
      ev: Number(mlEV.toFixed(4)),
      recommended: mlEdge > 5
    });
  }

  const overImpliedProb = (1 / marketOdds.over) * 100;
  const overPredictedProb = prediction.predictedTotal > marketOdds.total ? 60 : 40;
  const overEdge = overPredictedProb - overImpliedProb;
  const overEV = (overPredictedProb / 100) * (marketOdds.over - 1) - ((100 - overPredictedProb) / 100);

  if (overEdge > 2) {
    opportunities.push({
      type: 'Over',
      edge: Number(overEdge.toFixed(2)),
      ev: Number(overEV.toFixed(4)),
      recommended: overEdge > 5
    });
  }

  const underImpliedProb = (1 / marketOdds.under) * 100;
  const underPredictedProb = prediction.predictedTotal < marketOdds.total ? 60 : 40;
  const underEdge = underPredictedProb - underImpliedProb;
  const underEV = (underPredictedProb / 100) * (marketOdds.under - 1) - ((100 - underPredictedProb) / 100);

  if (underEdge > 2) {
    opportunities.push({
      type: 'Under',
      edge: Number(underEdge.toFixed(2)),
      ev: Number(underEV.toFixed(4)),
      recommended: underEdge > 5
    });
  }

  return opportunities.sort((a, b) => b.edge - a.edge);
}

export function adjustForSportSpecifics(
  context: GameContext,
  basePrediction: PredictionOutput
): PredictionOutput {
  const adjusted = { ...basePrediction };

  if (context.sport === 'NFL') {
    if (context.weather?.windSpeed && context.weather.windSpeed > 15) {
      adjusted.predictedTotal *= 0.9;
      adjusted.factors.push('Wind >15mph: Under bias applied');
    }
  }

  if (context.sport === 'NBA') {
    if (context.pace && context.pace > 105) {
      adjusted.predictedTotal *= 1.05;
      adjusted.factors.push('High pace: Over bias applied');
    } else if (context.pace && context.pace < 95) {
      adjusted.predictedTotal *= 0.95;
      adjusted.factors.push('Low pace: Under bias applied');
    }
  }

  if (context.sport === 'MLB') {
    if (context.weather?.windSpeed && context.weather.windSpeed > 10) {
      adjusted.predictedTotal *= 1.1;
      adjusted.factors.push('Wind favorable for offense');
    }
  }

  return adjusted;
}

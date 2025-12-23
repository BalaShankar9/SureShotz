import { RealMatch, TeamStats } from './sportsDataService';
import { supabase } from '../lib/supabase';

export interface QEAPrediction {
  matchId: string;
  predictedWinner: string;
  homeWinProbability: number;
  awayWinProbability: number;
  confidenceScore: number;
  edgePercentage: number;
  expectedValue: number;
  keyFactors: string[];
  bettingOpportunities: BettingOpportunity[];
}

export interface BettingOpportunity {
  betType: string;
  selection: string;
  odds: number;
  fairOdds: number;
  edge: number;
  expectedValue: number;
  kellyStake: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  reasoning: string;
}

class QEAAlgorithm {
  private readonly VERSION = 'QEA-v1.0';
  private readonly BANKROLL_PERCENTAGE = 0.02;

  async generatePrediction(match: RealMatch): Promise<QEAPrediction> {
    const homeProb = this.calculateWinProbability(
      match.teamStats.home,
      match.teamStats.away,
      true
    );
    const awayProb = 100 - homeProb;

    const predictedWinner = homeProb > awayProb ? match.homeTeam : match.awayTeam;

    const confidenceScore = this.calculateConfidence(match.teamStats.home, match.teamStats.away);

    const fairOdds = {
      homeML: this.probabilityToOdds(homeProb),
      awayML: this.probabilityToOdds(awayProb),
    };

    const bettingOpportunities = this.identifyBettingOpportunities(
      match,
      homeProb,
      awayProb,
      fairOdds,
      confidenceScore
    );

    const bestEdge = Math.max(...bettingOpportunities.map(o => o.edge), 0);
    const avgEV = bettingOpportunities.length > 0
      ? bettingOpportunities.reduce((sum, o) => sum + o.expectedValue, 0) / bettingOpportunities.length
      : 0;

    const keyFactors = this.generateKeyFactors(match, homeProb, awayProb, confidenceScore);

    const prediction: QEAPrediction = {
      matchId: match.id,
      predictedWinner,
      homeWinProbability: Number(homeProb.toFixed(1)),
      awayWinProbability: Number(awayProb.toFixed(1)),
      confidenceScore: Number(confidenceScore.toFixed(1)),
      edgePercentage: Number(bestEdge.toFixed(2)),
      expectedValue: Number(avgEV.toFixed(2)),
      keyFactors,
      bettingOpportunities: bettingOpportunities.sort((a, b) => b.edge - a.edge),
    };

    await this.savePrediction(match, prediction);

    return prediction;
  }

  private calculateWinProbability(homeStats: TeamStats, awayStats: TeamStats, isHome: boolean): number {
    let homeScore = 50;

    const offensiveAdv = ((homeStats.offensiveRating - awayStats.defensiveRating) / awayStats.defensiveRating) * 100;
    homeScore += offensiveAdv * 0.25;

    const defensiveAdv = ((awayStats.offensiveRating - homeStats.defensiveRating) / homeStats.defensiveRating) * 100;
    homeScore -= defensiveAdv * 0.25;

    const homeFormScore = (homeStats.recentForm.reduce((a, b) => a + b, 0) / homeStats.recentForm.length) * 100;
    const awayFormScore = (awayStats.recentForm.reduce((a, b) => a + b, 0) / awayStats.recentForm.length) * 100;
    homeScore += (homeFormScore - awayFormScore) * 0.15;

    const scoringDiff = homeStats.avgPointsScored - awayStats.avgPointsAllowed;
    const allowingDiff = awayStats.avgPointsScored - homeStats.avgPointsAllowed;
    homeScore += (scoringDiff - allowingDiff) * 0.5;

    if (homeStats.homeAdvantage) {
      homeScore += homeStats.homeAdvantage;
    }

    const restDiff = homeStats.restDays - awayStats.restDays;
    if (Math.abs(restDiff) >= 2) {
      homeScore += restDiff > 0 ? 2 : -2;
    }

    if (homeStats.injuries && homeStats.injuries.length > 0) {
      homeScore -= homeStats.injuries.length * 3;
    }
    if (awayStats.injuries && awayStats.injuries.length > 0) {
      homeScore += awayStats.injuries.length * 3;
    }

    homeScore = Math.max(5, Math.min(95, homeScore));

    return homeScore;
  }

  private calculateConfidence(homeStats: TeamStats, awayStats: TeamStats): number {
    let confidence = 50;

    const recentGames = homeStats.recentForm.length + awayStats.recentForm.length;
    confidence += Math.min(recentGames * 2, 20);

    const ratingDiff = Math.abs(homeStats.offensiveRating - awayStats.offensiveRating);
    if (ratingDiff > 10) confidence += 10;
    if (ratingDiff > 20) confidence += 10;

    const formVariance = this.calculateVariance(homeStats.recentForm) +
                         this.calculateVariance(awayStats.recentForm);
    confidence -= formVariance * 5;

    confidence = Math.max(40, Math.min(98, confidence));

    return confidence;
  }

  private calculateVariance(form: number[]): number {
    const mean = form.reduce((a, b) => a + b, 0) / form.length;
    const variance = form.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / form.length;
    return variance;
  }

  private probabilityToOdds(probability: number): number {
    const decimal = 100 / probability;
    return Number(decimal.toFixed(2));
  }

  private identifyBettingOpportunities(
    match: RealMatch,
    homeProb: number,
    awayProb: number,
    fairOdds: { homeML: number; awayML: number },
    confidence: number
  ): BettingOpportunity[] {
    const opportunities: BettingOpportunity[] = [];

    const homeMLEdge = this.calculateEdge(homeProb, match.oddsData.homeML);
    if (homeMLEdge > 3) {
      const ev = ((homeProb / 100) * match.oddsData.homeML - 1) * 100;
      opportunities.push({
        betType: 'Moneyline',
        selection: `${match.homeTeam} ML`,
        odds: match.oddsData.homeML,
        fairOdds: fairOdds.homeML,
        edge: homeMLEdge,
        expectedValue: ev,
        kellyStake: this.calculateKellyCriterion(homeProb, match.oddsData.homeML),
        priority: this.determinePriority(homeMLEdge, ev, confidence),
        confidence,
        reasoning: `Model predicts ${homeProb.toFixed(1)}% win probability vs implied ${(100 / match.oddsData.homeML).toFixed(1)}%. Edge: +${homeMLEdge.toFixed(1)}%`
      });
    }

    const awayMLEdge = this.calculateEdge(awayProb, match.oddsData.awayML);
    if (awayMLEdge > 3) {
      const ev = ((awayProb / 100) * match.oddsData.awayML - 1) * 100;
      opportunities.push({
        betType: 'Moneyline',
        selection: `${match.awayTeam} ML`,
        odds: match.oddsData.awayML,
        fairOdds: fairOdds.awayML,
        edge: awayMLEdge,
        expectedValue: ev,
        kellyStake: this.calculateKellyCriterion(awayProb, match.oddsData.awayML),
        priority: this.determinePriority(awayMLEdge, ev, confidence),
        confidence,
        reasoning: `Model predicts ${awayProb.toFixed(1)}% win probability vs implied ${(100 / match.oddsData.awayML).toFixed(1)}%. Edge: +${awayMLEdge.toFixed(1)}%`
      });
    }

    const totalProb = this.predictTotalProbability(match);
    const overEdge = this.calculateEdge(totalProb.over, match.oddsData.total.overOdds);
    if (overEdge > 3) {
      const ev = ((totalProb.over / 100) * match.oddsData.total.overOdds - 1) * 100;
      opportunities.push({
        betType: 'Total',
        selection: `Over ${match.oddsData.total.line}`,
        odds: match.oddsData.total.overOdds,
        fairOdds: this.probabilityToOdds(totalProb.over),
        edge: overEdge,
        expectedValue: ev,
        kellyStake: this.calculateKellyCriterion(totalProb.over, match.oddsData.total.overOdds),
        priority: this.determinePriority(overEdge, ev, confidence),
        confidence,
        reasoning: `Offensive ratings and pace suggest over. Model: ${totalProb.over.toFixed(1)}% probability`
      });
    }

    const underEdge = this.calculateEdge(totalProb.under, match.oddsData.total.underOdds);
    if (underEdge > 3) {
      const ev = ((totalProb.under / 100) * match.oddsData.total.underOdds - 1) * 100;
      opportunities.push({
        betType: 'Total',
        selection: `Under ${match.oddsData.total.line}`,
        odds: match.oddsData.total.underOdds,
        fairOdds: this.probabilityToOdds(totalProb.under),
        edge: underEdge,
        expectedValue: ev,
        kellyStake: this.calculateKellyCriterion(totalProb.under, match.oddsData.total.underOdds),
        priority: this.determinePriority(underEdge, ev, confidence),
        confidence,
        reasoning: `Defensive strength and pace favor under. Model: ${totalProb.under.toFixed(1)}% probability`
      });
    }

    return opportunities;
  }

  private calculateEdge(trueProbability: number, odds: number): number {
    const impliedProbability = (100 / odds);
    return trueProbability - impliedProbability;
  }

  private calculateKellyCriterion(probability: number, odds: number): number {
    const p = probability / 100;
    const q = 1 - p;
    const b = odds - 1;

    const kelly = (p * b - q) / b;

    const fractionalKelly = Math.max(0, kelly * 0.25);

    return Number((fractionalKelly * 100).toFixed(2));
  }

  private determinePriority(edge: number, ev: number, confidence: number): 'critical' | 'high' | 'medium' | 'low' {
    const score = edge * 0.5 + ev * 0.3 + (confidence - 70) * 0.2;

    if (score > 20 && confidence > 80) return 'critical';
    if (score > 12 && confidence > 70) return 'high';
    if (score > 6) return 'medium';
    return 'low';
  }

  private predictTotalProbability(match: RealMatch): { over: number; under: number } {
    const avgScoring = (match.teamStats.home.avgPointsScored + match.teamStats.away.avgPointsScored) / 2;
    const avgAllowing = (match.teamStats.home.avgPointsAllowed + match.teamStats.away.avgPointsAllowed) / 2;

    const predictedTotal = (avgScoring + avgAllowing) / 2;

    const diff = Math.abs(predictedTotal - match.oddsData.total.line);

    let overProb = 50;
    if (predictedTotal > match.oddsData.total.line) {
      overProb = 50 + Math.min(diff * 3, 30);
    } else {
      overProb = 50 - Math.min(diff * 3, 30);
    }

    return {
      over: Number(overProb.toFixed(1)),
      under: Number((100 - overProb).toFixed(1))
    };
  }

  private generateKeyFactors(match: RealMatch, homeProb: number, awayProb: number, confidence: number): string[] {
    const factors: string[] = [];

    const winner = homeProb > awayProb ? match.homeTeam : match.awayTeam;
    factors.push(`${winner} projected to win with ${Math.max(homeProb, awayProb).toFixed(1)}% probability`);

    const homeForm = (match.teamStats.home.recentForm.reduce((a, b) => a + b, 0) / match.teamStats.home.recentForm.length) * 100;
    const awayForm = (match.teamStats.away.recentForm.reduce((a, b) => a + b, 0) / match.teamStats.away.recentForm.length) * 100;

    if (homeForm > 70) factors.push(`${match.homeTeam} strong recent form (${homeForm.toFixed(0)}% win rate)`);
    if (awayForm > 70) factors.push(`${match.awayTeam} strong recent form (${awayForm.toFixed(0)}% win rate)`);

    if (match.teamStats.home.offensiveRating > match.teamStats.away.defensiveRating * 1.2) {
      factors.push(`${match.homeTeam} offensive advantage vs ${match.awayTeam} defense`);
    }
    if (match.teamStats.away.offensiveRating > match.teamStats.home.defensiveRating * 1.2) {
      factors.push(`${match.awayTeam} offensive advantage vs ${match.homeTeam} defense`);
    }

    if (match.teamStats.home.homeAdvantage && match.teamStats.home.homeAdvantage > 0) {
      factors.push(`Home court advantage: +${match.teamStats.home.homeAdvantage} points expected`);
    }

    const restDiff = Math.abs(match.teamStats.home.restDays - match.teamStats.away.restDays);
    if (restDiff >= 2) {
      const betterRested = match.teamStats.home.restDays > match.teamStats.away.restDays ? match.homeTeam : match.awayTeam;
      factors.push(`${betterRested} has ${restDiff} more rest days`);
    }

    factors.push(`Model confidence: ${confidence.toFixed(0)}%`);

    return factors.slice(0, 5);
  }

  private async savePrediction(match: RealMatch, prediction: QEAPrediction): Promise<void> {
    if (!supabase) return;

    try {
      const { data: predData, error: predError } = await supabase
        .from('predictions')
        .upsert({
          match_id: match.id,
          predicted_winner: prediction.predictedWinner,
          home_win_probability: prediction.homeWinProbability,
          away_win_probability: prediction.awayWinProbability,
          confidence_score: prediction.confidenceScore,
          edge_percentage: prediction.edgePercentage,
          expected_value: prediction.expectedValue,
          key_factors: prediction.keyFactors,
          algorithm_version: this.VERSION,
        })
        .select()
        .maybeSingle();

      if (predError || !predData) return;

      for (const opp of prediction.bettingOpportunities) {
        await supabase.from('betting_opportunities').insert({
          match_id: match.id,
          prediction_id: predData.id,
          bet_type: opp.betType,
          selection: opp.selection,
          odds: opp.odds,
          fair_odds: opp.fairOdds,
          edge: opp.edge,
          expected_value: opp.expectedValue,
          kelly_stake: opp.kellyStake,
          priority: opp.priority,
          confidence: opp.confidence,
          reasoning: opp.reasoning,
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        });
      }
    } catch (error) {
      console.error('Error saving prediction:', error);
    }
  }
}

export const qeaAlgorithm = new QEAAlgorithm();

export function calculatePrediction(
  homeTeam: string,
  awayTeam: string,
  homeOdds: number,
  drawOdds?: number,
  awayOdds?: number
) {
  const homeImpliedProb = (1 / homeOdds) * 100;
  const awayImpliedProb = (1 / (awayOdds || 2.0)) * 100;
  const drawImpliedProb = drawOdds ? (1 / drawOdds) * 100 : 0;

  const totalProb = homeImpliedProb + awayImpliedProb + drawImpliedProb;

  const homeWin = (homeImpliedProb / totalProb) * 100;
  const awayWin = (awayImpliedProb / totalProb) * 100;
  const draw = drawOdds ? (drawImpliedProb / totalProb) * 100 : undefined;

  const margin = totalProb - 100;

  let recommendedBet = 'No Value';
  let maxEdge = 0;

  if (homeWin > 55) {
    const edge = homeWin - homeImpliedProb + margin;
    if (edge > maxEdge) {
      maxEdge = edge;
      recommendedBet = `Home (${homeTeam})`;
    }
  }

  if (awayWin > 55) {
    const edge = awayWin - awayImpliedProb + margin;
    if (edge > maxEdge) {
      maxEdge = edge;
      recommendedBet = `Away (${awayTeam})`;
    }
  }

  if (draw && draw > 30) {
    const edge = draw - drawImpliedProb + margin;
    if (edge > maxEdge) {
      maxEdge = edge;
      recommendedBet = 'Draw';
    }
  }

  const confidence = Math.max(homeWin, awayWin, draw || 0);

  return {
    homeWin,
    draw,
    awayWin,
    recommendedBet,
    edge: maxEdge,
    confidence,
  };
}

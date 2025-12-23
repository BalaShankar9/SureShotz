import { TeamStats } from './sportsDataService';

interface HistoricalMatch {
  date: string;
  opponent: string;
  homeAway: 'home' | 'away';
  result: 'W' | 'L' | 'D';
  goalsFor: number;
  goalsAgainst: number;
}

class TeamStatsService {
  private cache: Map<string, { stats: TeamStats; timestamp: number }> = new Map();
  private CACHE_DURATION = 3600000;

  async getTeamStats(
    teamName: string,
    sport: string,
    league: string,
    isHome: boolean,
    opponentName: string,
    odds: { home: number; away: number; draw?: number }
  ): Promise<TeamStats> {
    const cacheKey = `${teamName}-${league}-${Date.now() - (Date.now() % 86400000)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.stats;
    }

    const stats = await this.calculateComprehensiveStats(
      teamName,
      sport,
      league,
      isHome,
      opponentName,
      odds
    );

    this.cache.set(cacheKey, { stats, timestamp: Date.now() });

    return stats;
  }

  private async calculateComprehensiveStats(
    teamName: string,
    sport: string,
    league: string,
    isHome: boolean,
    opponentName: string,
    odds: { home: number; away: number; draw?: number }
  ): Promise<TeamStats> {
    const impliedProb = isHome ? 1 / odds.home : 1 / odds.away;
    const opponentImpliedProb = isHome ? 1 / odds.away : 1 / odds.home;

    const marketConfidence = this.calculateMarketConfidence(odds);

    const offensiveRating = this.estimateOffensiveRating(
      teamName,
      sport,
      impliedProb,
      isHome
    );

    const defensiveRating = this.estimateDefensiveRating(
      teamName,
      sport,
      opponentImpliedProb,
      isHome
    );

    const recentForm = this.estimateRecentForm(impliedProb, marketConfidence);

    const avgPointsScored = this.estimateAvgPoints(
      offensiveRating,
      sport,
      isHome
    );

    const avgPointsAllowed = this.estimateAvgPoints(
      defensiveRating,
      sport,
      !isHome
    );

    const homeAdvantage = isHome ? this.calculateHomeAdvantage(sport, league) : 0;

    const restDays = 3 + Math.floor(Math.random() * 4);

    const injuryImpact = this.assessInjuryImpact(impliedProb, marketConfidence);

    const motivation = this.assessMotivation(league, teamName);

    const headToHead = this.estimateHeadToHead(
      teamName,
      opponentName,
      impliedProb
    );

    return {
      offensiveRating,
      defensiveRating,
      avgPointsScored,
      avgPointsAllowed,
      recentForm,
      homeAdvantage,
      restDays,
      injuryImpact,
      motivation,
      headToHead,
    };
  }

  private calculateMarketConfidence(odds: { home: number; away: number; draw?: number }): number {
    const margin = odds.draw
      ? (1 / odds.home + 1 / odds.away + 1 / odds.draw) - 1
      : (1 / odds.home + 1 / odds.away) - 1;

    const avgOdds = odds.draw
      ? (odds.home + odds.away + odds.draw) / 3
      : (odds.home + odds.away) / 2;

    const confidenceFromMargin = 100 - (margin * 100);
    const confidenceFromOdds = Math.min(100, (10 / avgOdds) * 100);

    return (confidenceFromMargin * 0.6 + confidenceFromOdds * 0.4);
  }

  private estimateOffensiveRating(
    teamName: string,
    sport: string,
    impliedProb: number,
    isHome: boolean
  ): number {
    const baseRating = impliedProb * 50;

    const sportMultiplier = this.getSportMultiplier(sport, 'offense');

    const homeBonus = isHome ? 2 : 0;

    const teamNameFactor = this.getTeamNameFactor(teamName, 'offense');

    return Math.max(5, Math.min(50, baseRating + sportMultiplier + homeBonus + teamNameFactor));
  }

  private estimateDefensiveRating(
    teamName: string,
    sport: string,
    opponentImpliedProb: number,
    isHome: boolean
  ): number {
    const baseRating = (1 - opponentImpliedProb) * 50;

    const sportMultiplier = this.getSportMultiplier(sport, 'defense');

    const homeBonus = isHome ? 2 : 0;

    const teamNameFactor = this.getTeamNameFactor(teamName, 'defense');

    return Math.max(5, Math.min(50, baseRating + sportMultiplier + homeBonus + teamNameFactor));
  }

  private getSportMultiplier(sport: string, type: 'offense' | 'defense'): number {
    const multipliers: Record<string, { offense: number; defense: number }> = {
      'Soccer': { offense: 0, defense: 0 },
      'Football': { offense: 2, defense: 1 },
      'Basketball': { offense: 3, defense: 2 },
      'Ice Hockey': { offense: 1, defense: 1 },
      'Baseball': { offense: 1, defense: 2 },
      'Tennis': { offense: 2, defense: 0 },
      'MMA': { offense: 3, defense: 2 },
      'Boxing': { offense: 3, defense: 2 },
    };

    return multipliers[sport]?.[type] || 0;
  }

  private getTeamNameFactor(teamName: string, type: 'offense' | 'defense'): number {
    const lowerName = teamName.toLowerCase();

    const eliteKeywords = ['united', 'city', 'real', 'barcelona', 'bayern', 'juventus', 'patriots', 'chiefs', 'lakers', 'warriors'];
    const strongKeywords = ['athletic', 'sporting', 'inter', 'milan', 'arsenal', 'liverpool', 'steelers', 'packers', 'celtics', 'heat'];
    const defensiveKeywords = ['athletic', 'athletic club', 'atletico'];

    if (eliteKeywords.some(keyword => lowerName.includes(keyword))) {
      return type === 'offense' ? 3 : 2;
    }

    if (strongKeywords.some(keyword => lowerName.includes(keyword))) {
      return type === 'offense' ? 2 : 2;
    }

    if (type === 'defense' && defensiveKeywords.some(keyword => lowerName.includes(keyword))) {
      return 3;
    }

    return 0;
  }

  private estimateRecentForm(impliedProb: number, marketConfidence: number): number[] {
    const formQuality = (impliedProb * 0.7 + (marketConfidence / 100) * 0.3);

    const form: number[] = [];
    for (let i = 0; i < 5; i++) {
      const randomness = (Math.random() - 0.5) * 0.3;
      const matchProb = formQuality + randomness;
      form.push(matchProb > 0.5 ? 1 : 0);
    }

    return form;
  }

  private estimateAvgPoints(rating: number, sport: string, isHome: boolean): number {
    const sportScaling: Record<string, number> = {
      'Soccer': 0.06,
      'Football': 0.8,
      'Basketball': 3.5,
      'Ice Hockey': 0.1,
      'Baseball': 0.15,
      'Tennis': 0.5,
      'MMA': 0.02,
      'Boxing': 0.02,
    };

    const scale = sportScaling[sport] || 0.1;
    const base = rating * scale;
    const homeBonus = isHome ? base * 0.1 : 0;

    return base + homeBonus;
  }

  private calculateHomeAdvantage(sport: string, league: string): number {
    const sportAdvantages: Record<string, number> = {
      'Soccer': 3,
      'Football': 2.5,
      'Basketball': 3.5,
      'Ice Hockey': 2,
      'Baseball': 2,
      'Tennis': 0,
      'MMA': 1,
      'Boxing': 1,
    };

    const baseAdvantage = sportAdvantages[sport] || 2;

    const leagueFactor = league.toLowerCase().includes('champions') ? 1.2 : 1.0;

    return baseAdvantage * leagueFactor;
  }

  private assessInjuryImpact(impliedProb: number, marketConfidence: number): number {
    if (marketConfidence < 60) {
      return -2 - Math.random() * 3;
    }

    if (impliedProb < 0.3) {
      return -1 - Math.random() * 2;
    }

    return -Math.random() * 1;
  }

  private assessMotivation(league: string, teamName: string): number {
    const leagueLower = league.toLowerCase();

    if (leagueLower.includes('champions') || leagueLower.includes('europa')) {
      return 3 + Math.random() * 2;
    }

    if (leagueLower.includes('playoff') || leagueLower.includes('final')) {
      return 4 + Math.random() * 2;
    }

    if (leagueLower.includes('cup')) {
      return 2 + Math.random() * 2;
    }

    return 1 + Math.random() * 2;
  }

  private estimateHeadToHead(
    teamName: string,
    opponentName: string,
    impliedProb: number
  ): { wins: number; losses: number; draws: number } {
    const totalMatches = 5 + Math.floor(Math.random() * 5);

    const winProb = impliedProb + (Math.random() - 0.5) * 0.2;

    let wins = 0;
    let draws = 0;
    let losses = 0;

    for (let i = 0; i < totalMatches; i++) {
      const outcome = Math.random();
      if (outcome < winProb) {
        wins++;
      } else if (outcome < winProb + 0.2) {
        draws++;
      } else {
        losses++;
      }
    }

    return { wins, losses, draws };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const teamStatsService = new TeamStatsService();

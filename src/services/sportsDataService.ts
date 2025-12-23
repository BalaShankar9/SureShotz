import { supabase } from '../lib/supabase';

export interface RealMatch {
  id: string;
  externalId: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'scheduled' | 'live' | 'completed';
  homeScore: number;
  awayScore: number;
  period?: string;
  oddsData: {
    homeML: number;
    awayML: number;
    drawML?: number;
    spread: { line: number; homeOdds: number; awayOdds: number };
    total: { line: number; overOdds: number; underOdds: number };
  };
  teamStats: {
    home: TeamStats;
    away: TeamStats;
  };
}

export interface TeamStats {
  offensiveRating: number;
  defensiveRating: number;
  avgPointsScored: number;
  avgPointsAllowed: number;
  recentForm: number[];
  homeAdvantage?: number;
  injuries?: string[];
  restDays: number;
}

class SportsDataService {
  private fetchInterval?: number;

  async fetchLiveMatches(): Promise<RealMatch[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or('status.eq.scheduled,status.eq.live')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching matches:', error);
      return this.getMockMatches();
    }

    if (!data || data.length === 0) {
      return this.getMockMatches();
    }

    return data.map(m => this.mapDatabaseMatch(m));
  }

  private mapDatabaseMatch(dbMatch: any): RealMatch {
    return {
      id: dbMatch.id,
      externalId: dbMatch.external_id,
      sport: dbMatch.sport,
      league: dbMatch.league,
      homeTeam: dbMatch.home_team,
      awayTeam: dbMatch.away_team,
      startTime: dbMatch.start_time,
      status: dbMatch.status,
      homeScore: dbMatch.home_score || 0,
      awayScore: dbMatch.away_score || 0,
      period: dbMatch.period,
      oddsData: dbMatch.odds_data,
      teamStats: dbMatch.team_stats,
    };
  }

  private getMockMatches(): RealMatch[] {
    const now = new Date();
    const sports: Array<'NFL' | 'NBA' | 'MLB' | 'NHL' | 'SOCCER'> = ['NFL', 'NBA', 'MLB', 'NHL', 'SOCCER'];
    const teams: Record<string, string[]> = {
      NFL: ['Chiefs', 'Bills', 'Eagles', '49ers', 'Cowboys', 'Ravens', 'Dolphins', 'Lions'],
      NBA: ['Lakers', 'Celtics', 'Warriors', 'Bucks', 'Nuggets', 'Heat', 'Suns', 'Mavs'],
      MLB: ['Yankees', 'Dodgers', 'Astros', 'Braves', 'Mets', 'Red Sox', 'Cardinals', 'Cubs'],
      NHL: ['Bruins', 'Avalanche', 'Panthers', 'Rangers', 'Oilers', 'Lightning', 'Maple Leafs', 'Golden Knights'],
      SOCCER: ['Man City', 'Liverpool', 'Arsenal', 'Chelsea', 'Barcelona', 'Real Madrid', 'Bayern', 'PSG']
    };

    const matches: RealMatch[] = [];

    for (let i = 0; i < 15; i++) {
      const sport = sports[i % sports.length];
      const sportTeams = teams[sport];
      const homeIdx = Math.floor(Math.random() * sportTeams.length);
      let awayIdx = Math.floor(Math.random() * sportTeams.length);
      while (awayIdx === homeIdx) awayIdx = Math.floor(Math.random() * sportTeams.length);

      const homeTeam = sportTeams[homeIdx];
      const awayTeam = sportTeams[awayIdx];

      const isLive = i < 3;
      const status = isLive ? 'live' : 'scheduled';

      matches.push({
        id: `match_${i}`,
        externalId: `ext_${i}`,
        sport,
        league: sport === 'SOCCER' ? 'Premier League' : sport,
        homeTeam,
        awayTeam,
        startTime: new Date(now.getTime() + (isLive ? -3600000 : (i - 3) * 7200000)).toISOString(),
        status,
        homeScore: isLive ? Math.floor(Math.random() * 4) : 0,
        awayScore: isLive ? Math.floor(Math.random() * 4) : 0,
        period: isLive ? ['Q1', 'Q2', 'Q3', 'Q4', '1st Half', '2nd Half'][Math.floor(Math.random() * 6)] : undefined,
        oddsData: {
          homeML: Number((1.6 + Math.random() * 1.8).toFixed(2)),
          awayML: Number((1.6 + Math.random() * 1.8).toFixed(2)),
          drawML: sport === 'SOCCER' ? Number((3 + Math.random() * 1.5).toFixed(2)) : undefined,
          spread: {
            line: Number((-7 + Math.random() * 14).toFixed(1)),
            homeOdds: Number((1.85 + Math.random() * 0.2).toFixed(2)),
            awayOdds: Number((1.85 + Math.random() * 0.2).toFixed(2))
          },
          total: {
            line: Number((45 + Math.random() * 20).toFixed(1)),
            overOdds: Number((1.85 + Math.random() * 0.2).toFixed(2)),
            underOdds: Number((1.85 + Math.random() * 0.2).toFixed(2))
          }
        },
        teamStats: {
          home: this.generateTeamStats(homeTeam, true),
          away: this.generateTeamStats(awayTeam, false)
        }
      });
    }

    return matches;
  }

  private generateTeamStats(team: string, isHome: boolean): TeamStats {
    const baseRating = 20 + Math.random() * 15;
    return {
      offensiveRating: baseRating + (isHome ? 2 : 0),
      defensiveRating: baseRating + Math.random() * 5,
      avgPointsScored: 22 + Math.random() * 10,
      avgPointsAllowed: 20 + Math.random() * 8,
      recentForm: Array.from({ length: 5 }, () => Math.random() > 0.45 ? 1 : 0),
      homeAdvantage: isHome ? 3 : 0,
      injuries: Math.random() > 0.7 ? ['Key Player Out'] : [],
      restDays: Math.floor(2 + Math.random() * 5)
    };
  }

  startAutoFetch(callback: (matches: RealMatch[]) => void) {
    this.fetchLiveMatches().then(callback);

    this.fetchInterval = window.setInterval(() => {
      this.fetchLiveMatches().then(callback);
    }, 30000);
  }

  stopAutoFetch() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = undefined;
    }
  }
}

export const sportsDataService = new SportsDataService();

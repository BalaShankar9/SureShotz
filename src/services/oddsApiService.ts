import { supabase } from '../lib/supabase';

const API_KEY = import.meta.env.VITE_ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4';

export interface OddsApiMatch {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

interface ProcessedMatch {
  id: string;
  externalId: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'scheduled';
  odds: {
    home: number;
    draw?: number;
    away: number;
  };
  bookmaker: string;
}

const SPORT_MAPPING: Record<string, string> = {
  'soccer_epl': 'Soccer',
  'soccer_spain_la_liga': 'Soccer',
  'soccer_germany_bundesliga': 'Soccer',
  'soccer_italy_serie_a': 'Soccer',
  'soccer_france_ligue_one': 'Soccer',
  'soccer_uefa_champs_league': 'Soccer',
  'soccer_uefa_europa_league': 'Soccer',
  'soccer_brazil_campeonato': 'Soccer',
  'soccer_argentina_primera_division': 'Soccer',
  'soccer_usa_mls': 'Soccer',
  'americanfootball_nfl': 'Football',
  'americanfootball_ncaaf': 'Football',
  'basketball_nba': 'Basketball',
  'basketball_ncaab': 'Basketball',
  'basketball_euroleague': 'Basketball',
  'icehockey_nhl': 'Ice Hockey',
  'baseball_mlb': 'Baseball',
  'tennis_atp_french_open': 'Tennis',
  'tennis_wta_french_open': 'Tennis',
  'mma_mixed_martial_arts': 'MMA',
  'boxing_boxing': 'Boxing',
};

class OddsApiService {
  private cache: Map<string, { data: ProcessedMatch[]; timestamp: number }> = new Map();
  private CACHE_DURATION = 60000;
  private sportsCache: { data: string[]; timestamp: number } | null = null;

  async fetchUpcomingMatches(sportKey?: string): Promise<ProcessedMatch[]> {
    const cacheKey = sportKey || 'all';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`Using cached data for ${cacheKey}`);
      return cached.data;
    }

    if (!API_KEY) {
      console.error('VITE_ODDS_API_KEY is not configured');
      return [];
    }

    try {
      const sports = sportKey ? [sportKey] : Object.keys(SPORT_MAPPING);
      const allMatches: ProcessedMatch[] = [];

      console.log(`Fetching odds from ${sports.length} sports...`);

      for (const sport of sports) {
        try {
          const url = `${BASE_URL}/sports/${sport}/odds/?apiKey=${API_KEY}&regions=us,uk,eu&markets=h2h&oddsFormat=decimal&dateFormat=iso`;

          const response = await fetch(url);

          if (!response.ok) {
            if (response.status === 401) {
              console.error('Invalid API key');
              return [];
            }
            console.log(`No odds for ${sport}`);
            continue;
          }

          const data: OddsApiMatch[] = await response.json();

          if (data.length > 0) {
            console.log(`Found ${data.length} matches for ${sport}`);
            const processed = data.map(match => this.processMatch(match));
            allMatches.push(...processed);
          }
        } catch (error) {
          console.error(`Error fetching ${sport}:`, error);
        }
      }

      console.log(`Total matches fetched: ${allMatches.length}`);

      allMatches.sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      await this.saveMatchesToDatabase(allMatches);

      this.cache.set(cacheKey, { data: allMatches, timestamp: Date.now() });

      return allMatches;
    } catch (error) {
      console.error('Error fetching odds:', error);
      return this.getMatchesFromDatabase();
    }
  }

  private processMatch(match: OddsApiMatch): ProcessedMatch {
    const bookmaker = match.bookmakers[0];
    const h2hMarket = bookmaker?.markets.find(m => m.key === 'h2h');

    let homeOdds = 2.0;
    let awayOdds = 2.0;
    let drawOdds: number | undefined;

    if (h2hMarket) {
      const homeOutcome = h2hMarket.outcomes.find(o => o.name === match.home_team);
      const awayOutcome = h2hMarket.outcomes.find(o => o.name === match.away_team);
      const drawOutcome = h2hMarket.outcomes.find(o => o.name === 'Draw');

      homeOdds = homeOutcome?.price || 2.0;
      awayOdds = awayOutcome?.price || 2.0;
      drawOdds = drawOutcome?.price;
    }

    return {
      id: match.id,
      externalId: match.id,
      sport: SPORT_MAPPING[match.sport_key] || match.sport_title,
      league: match.sport_title,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      startTime: match.commence_time,
      status: 'scheduled',
      odds: {
        home: homeOdds,
        away: awayOdds,
        draw: drawOdds,
      },
      bookmaker: bookmaker?.title || 'Unknown',
    };
  }

  private async saveMatchesToDatabase(matches: ProcessedMatch[]): Promise<void> {
    if (!supabase) return;

    try {
      for (const match of matches) {
        await supabase.from('matches').upsert({
          external_id: match.externalId,
          sport: match.sport,
          league: match.league,
          home_team: match.homeTeam,
          away_team: match.awayTeam,
          start_time: match.startTime,
          status: match.status,
          odds_data: {
            homeML: match.odds.home,
            awayML: match.odds.away,
            drawML: match.odds.draw,
            spread: { line: 0, homeOdds: 1.91, awayOdds: 1.91 },
            total: { line: 2.5, overOdds: 1.91, underOdds: 1.91 },
          },
          team_stats: {},
        }, {
          onConflict: 'external_id',
          ignoreDuplicates: false,
        });
      }
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  }

  private async getMatchesFromDatabase(): Promise<ProcessedMatch[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true })
        .limit(50);

      if (error || !data) return [];

      return data.map(m => ({
        id: m.id,
        externalId: m.external_id,
        sport: m.sport,
        league: m.league,
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        startTime: m.start_time,
        status: 'scheduled' as const,
        odds: {
          home: m.odds_data.homeML,
          away: m.odds_data.awayML,
          draw: m.odds_data.drawML,
        },
        bookmaker: 'Various',
      }));
    } catch (error) {
      console.error('Error loading from database:', error);
      return [];
    }
  }

  async fetchAllSports(): Promise<string[]> {
    if (this.sportsCache && Date.now() - this.sportsCache.timestamp < 300000) {
      return this.sportsCache.data;
    }

    try {
      const response = await fetch(`${BASE_URL}/sports/?apiKey=${API_KEY}`);

      if (!response.ok) {
        console.error('Failed to fetch sports list');
        return this.getDefaultSports();
      }

      const sports = await response.json();
      const sportKeys = sports.map((s: any) => s.key);

      this.sportsCache = {
        data: sportKeys,
        timestamp: Date.now(),
      };

      return sportKeys;
    } catch (error) {
      console.error('Error fetching sports:', error);
      return this.getDefaultSports();
    }
  }

  private getDefaultSports(): string[] {
    return Object.keys(SPORT_MAPPING);
  }

  async fetchAllUpcomingMatches(): Promise<ProcessedMatch[]> {
    return this.fetchUpcomingMatches();
  }

  async getSportsList(): Promise<string[]> {
    return ['Soccer', 'Football', 'Basketball', 'Ice Hockey', 'Baseball', 'Tennis', 'MMA', 'Boxing'];
  }
}

export const oddsApiService = new OddsApiService();

// API-Sports service with intelligent caching to preserve daily API calls
// Free plan: 100 calls per day - use wisely!

interface CachedData {
  data: any;
  timestamp: number;
  callsUsed: number;
}

interface ApiCallStats {
  today: number;
  lastReset: string;
}

const CACHE_KEY = 'apisports_cache';
const STATS_KEY = 'apisports_stats';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

class ApiSportsService {
  private apiKey: string;
  private baseUrl = 'https://v3.football.api-sports.io';

  constructor() {
    this.apiKey = import.meta.env.VITE_API_SPORTS_KEY || '';
  }

  // Get today's API call count
  getCallStats(): ApiCallStats {
    const stored = localStorage.getItem(STATS_KEY);
    if (!stored) {
      return { today: 0, lastReset: new Date().toDateString() };
    }

    const stats: ApiCallStats = JSON.parse(stored);
    const today = new Date().toDateString();

    // Reset counter if it's a new day
    if (stats.lastReset !== today) {
      const newStats = { today: 0, lastReset: today };
      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
      return newStats;
    }

    return stats;
  }

  // Increment API call counter
  private incrementCalls(count: number = 1) {
    const stats = this.getCallStats();
    stats.today += count;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    console.log(`📊 API Calls used today: ${stats.today}/100`);
  }

  // Get cached data if valid
  private getCache(key: string): any | null {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${key}`);
      if (!cached) return null;

      const { data, timestamp }: CachedData = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age < CACHE_DURATION) {
        console.log(`✅ Using cached data (${Math.round(age / 1000 / 60)} minutes old)`);
        return data;
      }

      console.log('❌ Cache expired');
      return null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  // Save data to cache
  private setCache(key: string, data: any, callsUsed: number = 1) {
    try {
      const cacheData: CachedData = {
        data,
        timestamp: Date.now(),
        callsUsed
      };
      localStorage.setItem(`${CACHE_KEY}_${key}`, JSON.stringify(cacheData));
      console.log(`💾 Data cached successfully`);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  // Make API call with headers
  private async apiCall(endpoint: string): Promise<any> {
    const stats = this.getCallStats();
    if (stats.today >= 100) {
      throw new Error(`Daily API limit reached (${stats.today}/100 calls used). Resets at midnight.`);
    }

    const url = `${this.baseUrl}${endpoint}`;
    console.log(`🌐 Calling API: ${endpoint}`);

    const startTime = Date.now();
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': this.apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // API-Sports includes request info in response
    const callsUsed = result.requests?.current || 1;
    this.incrementCalls(callsUsed);

    console.log(`✅ API call successful (${responseTime}ms, ${callsUsed} calls used)`);

    return result;
  }

  // Get upcoming football matches with caching
  async getUpcomingMatches(forceRefresh: boolean = false): Promise<any[]> {
    const cacheKey = 'upcoming_matches';

    // Try cache first unless forced refresh
    if (!forceRefresh) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('✅ Returning cached upcoming matches:', cached.length);
        return cached;
      }
    }

    // Fetch from API
    console.log('🔄 Fetching fresh data from API...');

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const from = today.toISOString().split('T')[0];
    const to = nextWeek.toISOString().split('T')[0];

    console.log(`📅 Date range: ${from} to ${to}`);

    // Fetch fixtures from major leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1)
    const leagues = [39, 140, 78, 135, 61];
    const allMatches: any[] = [];
    let totalCalls = 0;

    for (const leagueId of leagues) {
      try {
        console.log(`📥 Fetching league ${leagueId} fixtures from ${from} to ${to}...`);
        const result = await this.apiCall(`/fixtures?league=${leagueId}&from=${from}&to=${to}&timezone=UTC`);
        const fixtures = result.response || [];
        console.log(`✅ League ${leagueId}: ${fixtures.length} fixtures found`);
        if (fixtures.length > 0) {
          console.log(`   📊 First fixture:`, fixtures[0]);
        }
        allMatches.push(...fixtures);
        totalCalls += result.requests?.current || 1;
      } catch (error) {
        console.error(`❌ Error fetching league ${leagueId}:`, error);
      }
    }

    console.log(`✅ Total matches fetched: ${allMatches.length} from ${leagues.length} leagues`);
    console.log(`📊 API calls used: ${totalCalls}`);

    // Cache the results
    this.setCache(cacheKey, allMatches, totalCalls);

    return allMatches;
  }

  // Get specific league fixtures
  async getLeagueFixtures(leagueId: number, season: number, forceRefresh: boolean = false): Promise<any[]> {
    const cacheKey = `league_${leagueId}_${season}`;

    if (!forceRefresh) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    console.log(`🔄 Fetching ${leagueId} fixtures...`);
    const result = await this.apiCall(`/fixtures?league=${leagueId}&season=${season}`);

    const matches = result.response || [];
    this.setCache(cacheKey, matches);

    return matches;
  }

  // Get team statistics
  async getTeamStats(teamId: number, season: number, leagueId: number): Promise<any> {
    const cacheKey = `team_${teamId}_${season}_${leagueId}`;

    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    console.log(`🔄 Fetching team ${teamId} stats...`);
    const result = await this.apiCall(`/teams/statistics?team=${teamId}&season=${season}&league=${leagueId}`);

    const stats = result.response || null;
    this.setCache(cacheKey, stats);

    return stats;
  }

  // Clear all cached data
  clearCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ Cache cleared');
  }

  // Get popular leagues (major European leagues)
  getMajorLeagues() {
    const currentYear = new Date().getFullYear();
    const season = new Date().getMonth() >= 7 ? currentYear : currentYear - 1;

    return [
      { id: 39, name: 'Premier League', country: 'England', season },
      { id: 140, name: 'La Liga', country: 'Spain', season },
      { id: 78, name: 'Bundesliga', country: 'Germany', season },
      { id: 135, name: 'Serie A', country: 'Italy', season },
      { id: 61, name: 'Ligue 1', country: 'France', season },
      { id: 2, name: 'UEFA Champions League', country: 'World', season },
      { id: 3, name: 'UEFA Europa League', country: 'World', season },
    ];
  }
}

export const apiSportsService = new ApiSportsService();

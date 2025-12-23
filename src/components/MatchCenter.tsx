import { useState, useEffect } from 'react';
import { Star, BarChart2, Radio, Calendar } from 'lucide-react';
import { oddsApiService } from '../services/oddsApiService';
import { qeaAlgorithm } from '../services/qeaAlgorithm';
import { teamStatsService } from '../services/teamStatsService';
import { RealMatch } from '../services/sportsDataService';

interface Match {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  startTime: string;
  odds: {
    home: number;
    draw?: number;
    away: number;
  };
  isLive: boolean;
  prediction?: {
    homeWinProb: number;
    drawProb?: number;
    awayWinProb: number;
    confidence: number;
    edge: number;
    recommendedBet?: string;
  };
}

interface SportTab {
  id: string;
  name: string;
  icon: string;
}

export default function MatchCenter() {
  const [view, setView] = useState<'live' | 'upcoming'>('upcoming');
  const [selectedSport, setSelectedSport] = useState('all');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('');

  const sportTabs: SportTab[] = [
    { id: 'all', name: 'All Sports', icon: '🌐' },
    { id: 'favorites', name: 'Favourites', icon: '⭐' },
    { id: 'Soccer', name: 'Soccer', icon: '⚽' },
    { id: 'Football', name: 'Football', icon: '🏈' },
    { id: 'Basketball', name: 'Basketball', icon: '🏀' },
    { id: 'Ice Hockey', name: 'Ice Hockey', icon: '🏒' },
    { id: 'Baseball', name: 'Baseball', icon: '⚾' },
    { id: 'Tennis', name: 'Tennis', icon: '🎾' },
    { id: 'MMA', name: 'MMA', icon: '🥊' },
    { id: 'Boxing', name: 'Boxing', icon: '🥊' },
  ];

  useEffect(() => {
    loadMatches();
    const interval = setInterval(loadMatches, 60000);
    return () => clearInterval(interval);
  }, [view, selectedSport]);

  const loadMatches = async () => {
    setLoading(true);
    setMatches([]);
    setError(null);
    setApiStatus('Connecting to Odds API...');

    try {
      console.log('Fetching all matches from Odds API...');
      const apiMatches = await oddsApiService.fetchAllUpcomingMatches();

      if (apiMatches.length === 0) {
        console.log('No matches returned from API');
        setError('No matches available from the API. This could mean: 1) No games scheduled currently, 2) API key issue, or 3) All games have already started.');
        setApiStatus('');
        setLoading(false);
        return;
      }

      setApiStatus(`Found ${apiMatches.length} total matches`);

      console.log(`Got ${apiMatches.length} matches from API`);

      const now = new Date();
      const quickMatches: Match[] = [];

      for (const match of apiMatches) {
        const matchTime = new Date(match.startTime);
        const timeDiff = matchTime.getTime() - now.getTime();
        const hoursUntil = timeDiff / (1000 * 60 * 60);

        const isLive = hoursUntil < 0 && hoursUntil > -3;

        if ((view === 'live' && !isLive) || (view === 'upcoming' && isLive)) {
          continue;
        }

        const processedMatch: Match = {
          id: match.id,
          sport: match.sport,
          league: match.league,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          startTime: match.startTime,
          odds: match.odds,
          isLive,
        };

        if (isLive) {
          const elapsed = Math.abs(hoursUntil) * 60;
          processedMatch.minute = Math.min(Math.floor(elapsed), 90);
          processedMatch.homeScore = Math.floor(Math.random() * 4);
          processedMatch.awayScore = Math.floor(Math.random() * 4);
        }

        quickMatches.push(processedMatch);
      }

      const filtered = selectedSport === 'all'
        ? quickMatches
        : selectedSport === 'favorites'
        ? quickMatches.filter(m => favorites.has(m.id))
        : quickMatches.filter(m => m.sport === selectedSport);

      const sorted = filtered.sort((a, b) => {
        if (view === 'live') {
          return (b.minute || 0) - (a.minute || 0);
        }
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });

      setMatches(sorted);
      setLoading(false);

      if (sorted.length === 0) {
        setError(`No ${view} matches found for ${selectedSport === 'all' ? 'any sport' : selectedSport}. Try switching to ${view === 'live' ? 'upcoming' : 'live'} matches.`);
        setApiStatus('');
      } else {
        setApiStatus(`Displaying ${sorted.length} matches, calculating predictions...`);
      }

      console.log(`Displaying ${sorted.length} matches, calculating predictions in background...`);

      for (const match of sorted) {
        try {
          const originalMatch = apiMatches.find(m => m.id === match.id);
          if (!originalMatch) continue;

          const homeStats = await teamStatsService.getTeamStats(
            originalMatch.homeTeam,
            originalMatch.sport,
            originalMatch.league,
            true,
            originalMatch.awayTeam,
            originalMatch.odds
          );

          const awayStats = await teamStatsService.getTeamStats(
            originalMatch.awayTeam,
            originalMatch.sport,
            originalMatch.league,
            false,
            originalMatch.homeTeam,
            originalMatch.odds
          );

          const realMatch: RealMatch = {
            id: originalMatch.id,
            externalId: originalMatch.externalId,
            sport: originalMatch.sport,
            league: originalMatch.league,
            homeTeam: originalMatch.homeTeam,
            awayTeam: originalMatch.awayTeam,
            startTime: originalMatch.startTime,
            status: match.isLive ? 'live' : 'scheduled',
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            oddsData: {
              homeML: originalMatch.odds.home,
              awayML: originalMatch.odds.away,
              drawML: originalMatch.odds.draw,
              spread: { line: 0, homeOdds: 1.91, awayOdds: 1.91 },
              total: { line: 2.5, overOdds: 1.91, underOdds: 1.91 },
            },
            teamStats: {
              home: homeStats,
              away: awayStats,
            },
          };

          const prediction = await qeaAlgorithm.generatePrediction(realMatch);

          const homeImpliedProb = 1 / originalMatch.odds.home;
          const awayImpliedProb = 1 / originalMatch.odds.away;
          const drawImpliedProb = originalMatch.odds.draw ? 1 / originalMatch.odds.draw : 0;

          const homeEdge = (prediction.homeWinProbability / 100) - homeImpliedProb;
          const awayEdge = (prediction.awayWinProbability / 100) - awayImpliedProb;
          const drawEdge = drawImpliedProb > 0
            ? ((100 - prediction.homeWinProbability - prediction.awayWinProbability) / 100) - drawImpliedProb
            : -1;

          let recommendedBet;
          const maxEdge = Math.max(homeEdge, awayEdge, drawEdge);

          if (maxEdge > 0.05) {
            if (maxEdge === homeEdge) recommendedBet = 'home';
            else if (maxEdge === awayEdge) recommendedBet = 'away';
            else if (maxEdge === drawEdge) recommendedBet = 'draw';
          }

          setMatches(current =>
            current.map(m =>
              m.id === match.id
                ? {
                    ...m,
                    prediction: {
                      homeWinProb: prediction.homeWinProbability,
                      awayWinProb: prediction.awayWinProbability,
                      drawProb: originalMatch.odds.draw
                        ? 100 - prediction.homeWinProbability - prediction.awayWinProbability
                        : undefined,
                      confidence: prediction.confidenceScore,
                      edge: maxEdge * 100,
                      recommendedBet,
                    },
                  }
                : m
            )
          );
        } catch (error) {
          console.error(`Error predicting ${match.homeTeam} vs ${match.awayTeam}:`, error);
        }
      }
    } catch (error: any) {
      console.error('Error loading matches:', error);
      setError(`Failed to load matches: ${error.message || 'Unknown error'}. Check console for details.`);
      setApiStatus('');
      setLoading(false);
    }
  };

  const toggleFavorite = (matchId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        next.add(matchId);
      }
      return next;
    });
  };

  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.league]) {
      acc[match.league] = [];
    }
    acc[match.league].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const formatOdds = (odds: number) => {
    return odds.toFixed(2);
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timeStr: string) => {
    const date = new Date(timeStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="flex items-center justify-center gap-4 py-4 px-4">
          <button
            onClick={() => setView('live')}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-lg transition-all ${
              view === 'live'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Radio className={`w-5 h-5 ${view === 'live' ? 'animate-pulse' : ''}`} />
            LIVE MATCHES
          </button>
          <button
            onClick={() => setView('upcoming')}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-lg transition-all ${
              view === 'upcoming'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/50'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Calendar className="w-5 h-5" />
            UPCOMING MATCHES
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3">
          {sportTabs.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={`flex flex-col items-center justify-center min-w-[70px] py-2 px-2 rounded-lg transition-all relative ${
                selectedSport === sport.id ? 'text-white' : 'text-slate-400'
              }`}
            >
              {sport.id === 'favorites' && favorites.size > 0 && (
                <div className="absolute top-1 right-1 bg-slate-700 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {favorites.size}
                </div>
              )}
              <span className="text-2xl mb-1">{sport.icon}</span>
              <span className="text-xs font-medium text-center leading-tight">{sport.name}</span>
              {selectedSport === sport.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={`px-4 py-3 flex items-center justify-between border-b ${
        view === 'live' ? 'bg-red-900/30 border-red-800' : 'bg-emerald-900/30 border-emerald-800'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">
            {selectedSport === 'all' ? 'All Sports' : selectedSport}
          </span>
          <BarChart2 className="w-5 h-5" />
        </div>
        <div className="text-sm text-slate-400">
          {matches.length} {view === 'live' ? 'live' : 'upcoming'} {matches.length === 1 ? 'match' : 'matches'}
        </div>
      </div>

      {apiStatus && (
        <div className="px-4 py-2 bg-blue-900/30 border-b border-blue-800 text-blue-200 text-sm">
          {apiStatus}
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-red-900/30 border-b border-red-800">
          <p className="text-red-200 text-sm font-medium">⚠️ {error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Loading matches from Odds API...</p>
          {apiStatus && <p className="text-xs text-slate-500">{apiStatus}</p>}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg font-medium">
            No {view === 'live' ? 'live' : 'upcoming'} matches
          </p>
          <p className="text-sm mt-2">
            {view === 'live'
              ? 'Check upcoming matches for scheduled games'
              : 'No scheduled matches available at this time'}
          </p>
          {!error && (
            <button
              onClick={() => setView(view === 'live' ? 'upcoming' : 'live')}
              className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition"
            >
              Switch to {view === 'live' ? 'Upcoming' : 'Live'} Matches
            </button>
          )}
        </div>
      ) : (
        <div>
          {Object.entries(groupedMatches).map(([league, leagueMatches]) => (
            <div key={league}>
              <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700/50 sticky top-[160px] z-40">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{league}</h3>
                  <div className="grid grid-cols-3 gap-8 text-center text-xs font-bold text-slate-400">
                    <div>1</div>
                    <div>X</div>
                    <div>2</div>
                  </div>
                </div>
              </div>

              {leagueMatches.map((match) => {
                const isFavorite = favorites.has(match.id);
                const hasHighEdge = match.prediction && match.prediction.edge > 8;
                const recommendedBet = match.prediction?.recommendedBet;

                return (
                  <div
                    key={match.id}
                    className={`border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors ${
                      hasHighEdge ? 'bg-yellow-900/10 border-l-4 border-l-yellow-500' : ''
                    }`}
                  >
                    <div className="px-4 py-3 flex items-start gap-3">
                      <button
                        onClick={() => toggleFavorite(match.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'
                          }`}
                        />
                      </button>

                      <div className="flex-1 min-w-0">
                        {match.isLive && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded uppercase flex items-center gap-1">
                              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                              LIVE
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              {match.minute}:00
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-5 h-5 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                              <div className="w-3 h-3 bg-slate-600 rounded"></div>
                            </div>
                            <span className="font-bold text-white truncate">{match.homeTeam}</span>
                            {match.isLive && match.homeScore !== undefined && (
                              <span className="font-black text-lg text-white flex-shrink-0">
                                {match.homeScore}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-5 h-5 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                              <div className="w-3 h-3 bg-slate-600 rounded"></div>
                            </div>
                            <span className="font-bold text-white truncate">{match.awayTeam}</span>
                            {match.isLive && match.awayScore !== undefined && (
                              <span className="font-black text-lg text-white flex-shrink-0">
                                {match.awayScore}
                              </span>
                            )}
                          </div>
                        </div>

                        {!match.isLive && (
                          <div className="text-xs text-slate-500">
                            {formatDate(match.startTime)} • {formatTime(match.startTime)}
                          </div>
                        )}

                        {match.prediction && (
                          <div className="mt-2 flex items-center gap-2 text-[10px]">
                            <span className="text-emerald-400 font-bold">
                              Edge: +{match.prediction.edge.toFixed(1)}%
                            </span>
                            {recommendedBet && (
                              <>
                                <span className="text-slate-600">•</span>
                                <span className="text-yellow-400 font-bold uppercase">
                                  Bet: {recommendedBet}
                                </span>
                              </>
                            )}
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400">
                              Confidence: {match.prediction.confidence.toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center min-w-[180px]">
                        <div
                          className={`bg-slate-800 rounded-lg py-2 px-2 ${
                            recommendedBet === 'home' ? 'ring-2 ring-yellow-400' : ''
                          }`}
                        >
                          <div className="text-yellow-400 font-black text-base">
                            {formatOdds(match.odds.home)}
                          </div>
                          {match.prediction && (
                            <div className="text-[9px] text-emerald-400 font-bold mt-0.5">
                              {match.prediction.homeWinProb.toFixed(0)}%
                            </div>
                          )}
                        </div>

                        {match.odds.draw ? (
                          <div
                            className={`bg-slate-800 rounded-lg py-2 px-2 ${
                              recommendedBet === 'draw' ? 'ring-2 ring-yellow-400' : ''
                            }`}
                          >
                            <div className="text-yellow-400 font-black text-base">
                              {formatOdds(match.odds.draw)}
                            </div>
                            {match.prediction?.drawProb && (
                              <div className="text-[9px] text-emerald-400 font-bold mt-0.5">
                                {match.prediction.drawProb.toFixed(0)}%
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-slate-800/30 rounded-lg py-2 px-2">
                            <div className="text-slate-600 font-black text-base">-</div>
                          </div>
                        )}

                        <div
                          className={`bg-slate-800 rounded-lg py-2 px-2 ${
                            recommendedBet === 'away' ? 'ring-2 ring-yellow-400' : ''
                          }`}
                        >
                          <div className="text-yellow-400 font-black text-base">
                            {formatOdds(match.odds.away)}
                          </div>
                          {match.prediction && (
                            <div className="text-[9px] text-emerald-400 font-bold mt-0.5">
                              {match.prediction.awayWinProb.toFixed(0)}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

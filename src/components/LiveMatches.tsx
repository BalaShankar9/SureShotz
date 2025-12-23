import { useState, useEffect } from 'react';
import { Star, BarChart2, Play } from 'lucide-react';
import { oddsApiService } from '../services/oddsApiService';
import { qeaAlgorithm } from '../services/qeaAlgorithm';
import { RealMatch } from '../services/sportsDataService';

interface LiveMatch {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  odds: {
    home: number;
    draw?: number;
    away: number;
  };
  specialMarket?: {
    name: string;
    options: Array<{ name: string; odds: number }>;
  };
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

export default function LiveMatches() {
  const [selectedSport, setSelectedSport] = useState('Soccer');
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultFilter, setResultFilter] = useState<'all' | 'fulltime' | 'halftime'>('fulltime');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const sportTabs: SportTab[] = [
    { id: 'favorites', name: 'Favourites', icon: '⭐' },
    { id: 'Soccer', name: 'Soccer', icon: '⚽' },
    { id: 'Tennis', name: 'Tennis', icon: '🎾' },
    { id: 'Football', name: 'American Fo...', icon: '🏈' },
    { id: 'Badminton', name: 'Badminton', icon: '🏸' },
  ];

  useEffect(() => {
    loadLiveMatches();
    const interval = setInterval(loadLiveMatches, 5000);
    return () => clearInterval(interval);
  }, [selectedSport]);

  const loadLiveMatches = async () => {
    setLoading(true);
    try {
      let allMatches = await oddsApiService.fetchUpcomingMatches();

      console.log('Fetched matches:', allMatches.length);

      if (allMatches.length === 0) {
        allMatches = [
          {
            id: 'mock-1',
            externalId: 'mock-1',
            sport: 'Soccer',
            league: 'Brazil Serie A',
            homeTeam: 'Fluminense',
            awayTeam: 'Flamengo',
            startTime: new Date().toISOString(),
            status: 'scheduled' as const,
            odds: { home: 2.0, draw: 3.4, away: 20.0 },
            bookmaker: 'Mock',
          },
          {
            id: 'mock-2',
            externalId: 'mock-2',
            sport: 'Soccer',
            league: 'Brazil Serie A',
            homeTeam: 'Gremio',
            awayTeam: 'Vasco da Gama',
            startTime: new Date().toISOString(),
            status: 'scheduled' as const,
            odds: { home: 21.0, draw: 7.0, away: 15.0 },
            bookmaker: 'Mock',
          },
          {
            id: 'mock-3',
            externalId: 'mock-3',
            sport: 'Soccer',
            league: 'Argentina Torneo Regional',
            homeTeam: 'Racing Club de Teodelina',
            awayTeam: 'Studebaker de Villa Amelia',
            startTime: new Date().toISOString(),
            status: 'scheduled' as const,
            odds: { home: 11.0, draw: 13.0, away: 13.0 },
            bookmaker: 'Mock',
          },
          {
            id: 'mock-4',
            externalId: 'mock-4',
            sport: 'Soccer',
            league: 'Aruba Division Di Honor',
            homeTeam: 'SV Sporting Aruba',
            awayTeam: 'Racing Club Aruba',
            startTime: new Date().toISOString(),
            status: 'scheduled' as const,
            odds: { home: 13.0, draw: 7.0, away: 6.0 },
            bookmaker: 'Mock',
          },
          {
            id: 'mock-5',
            externalId: 'mock-5',
            sport: 'Soccer',
            league: 'Brazil Serie A',
            homeTeam: 'Santos',
            awayTeam: 'Mirassol',
            startTime: new Date().toISOString(),
            status: 'scheduled' as const,
            odds: { home: 3.0, draw: 15.0, away: 15.0 },
            bookmaker: 'Mock',
          },
        ];
      }

      const simulatedLive = allMatches.slice(0, 8).map((match, idx) => {
        const minute = Math.floor(Math.random() * 90) + 1;
        const homeScore = Math.floor(Math.random() * 5);
        const awayScore = Math.floor(Math.random() * 5);

        const specialMarkets = [
          {
            name: 'To Score 5th Goal',
            options: [
              { name: 'No Goal', odds: 1 + Math.random() },
            ],
          },
          {
            name: 'Next Goal',
            options: [
              { name: 'Home', odds: 2 + Math.random() * 2 },
              { name: 'Away', odds: 2 + Math.random() * 2 },
            ],
          },
        ];

        return {
          id: match.id,
          sport: match.sport,
          league: match.league,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          homeScore,
          awayScore,
          minute,
          odds: {
            home: match.odds.home * (0.8 + Math.random() * 0.4),
            draw: match.odds.draw ? match.odds.draw * (0.8 + Math.random() * 0.4) : undefined,
            away: match.odds.away * (0.8 + Math.random() * 0.4),
          },
          specialMarket: idx % 2 === 0 ? specialMarkets[idx % 2] : undefined,
        };
      });

      const withPredictions = await Promise.all(
        simulatedLive.map(async (match) => {
          try {
            const realMatch: RealMatch = {
              id: match.id,
              externalId: match.id,
              sport: match.sport,
              league: match.league,
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              startTime: new Date().toISOString(),
              status: 'live',
              homeScore: match.homeScore,
              awayScore: match.awayScore,
              oddsData: {
                homeML: match.odds.home,
                awayML: match.odds.away,
                drawML: match.odds.draw,
                spread: { line: 0, homeOdds: 1.91, awayOdds: 1.91 },
                total: { line: 2.5, overOdds: 1.91, underOdds: 1.91 },
              },
              teamStats: {
                home: {
                  offensiveRating: 22 + Math.random() * 10 + match.homeScore * 2,
                  defensiveRating: 20 + Math.random() * 8 - match.awayScore,
                  avgPointsScored: match.homeScore / (match.minute / 90),
                  avgPointsAllowed: match.awayScore / (match.minute / 90),
                  recentForm: Array.from({ length: 5 }, () => Math.random() > 0.4 ? 1 : 0),
                  homeAdvantage: 3,
                  restDays: 3,
                },
                away: {
                  offensiveRating: 20 + Math.random() * 10 + match.awayScore * 2,
                  defensiveRating: 22 + Math.random() * 8 - match.homeScore,
                  avgPointsScored: match.awayScore / (match.minute / 90),
                  avgPointsAllowed: match.homeScore / (match.minute / 90),
                  recentForm: Array.from({ length: 5 }, () => Math.random() > 0.45 ? 1 : 0),
                  restDays: 3,
                },
              },
            };

            const prediction = await qeaAlgorithm.generatePrediction(realMatch);

            console.log(`Prediction for ${match.homeTeam} vs ${match.awayTeam}:`, {
              homeWin: prediction.homeWinProbability,
              awayWin: prediction.awayWinProbability,
              confidence: prediction.confidenceScore,
            });

            const homeImpliedProb = 1 / match.odds.home;
            const awayImpliedProb = 1 / match.odds.away;
            const drawImpliedProb = match.odds.draw ? 1 / match.odds.draw : 0;

            const homeEdge = (prediction.homeWinProbability / 100) - homeImpliedProb;
            const awayEdge = (prediction.awayWinProbability / 100) - awayImpliedProb;
            const drawEdge = drawImpliedProb > 0 ? ((100 - prediction.homeWinProbability - prediction.awayWinProbability) / 100) - drawImpliedProb : -1;

            let recommendedBet;
            const maxEdge = Math.max(homeEdge, awayEdge, drawEdge);

            if (maxEdge > 0.05) {
              if (maxEdge === homeEdge) recommendedBet = 'home';
              else if (maxEdge === awayEdge) recommendedBet = 'away';
              else if (maxEdge === drawEdge) recommendedBet = 'draw';
            }

            return {
              ...match,
              prediction: {
                homeWinProb: prediction.homeWinProbability,
                awayWinProb: prediction.awayWinProbability,
                drawProb: match.odds.draw ? 100 - prediction.homeWinProbability - prediction.awayWinProbability : undefined,
                confidence: prediction.confidenceScore,
                edge: maxEdge * 100,
                recommendedBet,
              },
            };
          } catch (error) {
            return match;
          }
        })
      );

      const filtered = selectedSport === 'favorites'
        ? withPredictions.filter(m => favorites.has(m.id))
        : selectedSport === 'all'
        ? withPredictions
        : withPredictions.filter(m => m.sport === selectedSport);

      setMatches(filtered);
    } catch (error) {
      console.error('Error loading live matches:', error);
    } finally {
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
  }, {} as Record<string, LiveMatch[]>);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-slate-800 px-4 py-3 sticky top-0 z-50 border-b border-slate-700">
        <div className="flex items-center gap-2 overflow-x-auto">
          {sportTabs.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={`flex flex-col items-center justify-center min-w-[70px] py-2 px-2 rounded-lg transition-all relative ${
                selectedSport === sport.id
                  ? 'text-white'
                  : 'text-slate-400'
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

      <div className="bg-emerald-800 px-4 py-3 flex items-center justify-between border-b border-emerald-700">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">{selectedSport}</span>
          <BarChart2 className="w-5 h-5" />
        </div>
        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value as any)}
          className="bg-emerald-900 text-white px-3 py-1.5 rounded text-sm font-medium border border-emerald-700"
        >
          <option value="fulltime">Fulltime Result</option>
          <option value="halftime">Halftime Result</option>
          <option value="all">All Markets</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg font-medium">No live matches</p>
          <p className="text-sm mt-2">Check back soon for live action</p>
        </div>
      ) : (
        <div>
          {Object.entries(groupedMatches).map(([league, leagueMatches]) => (
            <div key={league}>
              <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700/50 sticky top-[120px] z-40">
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
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-5 h-5 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                              <div className="w-3 h-3 bg-slate-600 rounded"></div>
                            </div>
                            <span className="font-bold text-white truncate">{match.homeTeam}</span>
                            <span className="font-black text-lg text-white flex-shrink-0">{match.homeScore}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-5 h-5 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                              <div className="w-3 h-3 bg-slate-600 rounded"></div>
                            </div>
                            <span className="font-bold text-white truncate">{match.awayTeam}</span>
                            <span className="font-black text-lg text-white flex-shrink-0">{match.awayScore}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="font-bold">{match.minute}:00</span>
                          {match.specialMarket && (
                            <Play className="w-3 h-3" />
                          )}
                          <BarChart2 className="w-3.5 h-3.5" />
                        </div>

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
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 min-w-[180px]">
                        {match.specialMarket ? (
                          <div className="bg-slate-800 rounded-lg py-2 px-3">
                            <div className="text-[10px] text-slate-400 mb-1 text-center">
                              {match.specialMarket.name}
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-center">
                              {match.specialMarket.options.map((opt, idx) => (
                                <div key={idx}>
                                  <div className="text-yellow-400 font-black text-sm">
                                    {opt.odds.toFixed(1).replace('.', '/')}
                                  </div>
                                  {idx === 1 && (
                                    <div className="text-[9px] text-slate-500">{opt.name}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className={`bg-slate-800 rounded-lg py-2 px-2 ${recommendedBet === 'home' ? 'ring-2 ring-yellow-400' : ''}`}>
                              <div className="text-yellow-400 font-black text-base">
                                {match.odds.home.toFixed(1).replace('.', '/')}
                              </div>
                              {match.prediction && (
                                <div className="text-[9px] text-emerald-400 font-bold mt-0.5">
                                  {match.prediction.homeWinProb.toFixed(0)}%
                                </div>
                              )}
                            </div>

                            {match.odds.draw && (
                              <div className={`bg-slate-800 rounded-lg py-2 px-2 ${recommendedBet === 'draw' ? 'ring-2 ring-yellow-400' : ''}`}>
                                <div className="text-yellow-400 font-black text-base">
                                  {match.odds.draw.toFixed(1).replace('.', '/')}
                                </div>
                                {match.prediction?.drawProb && (
                                  <div className="text-[9px] text-emerald-400 font-bold mt-0.5">
                                    {match.prediction.drawProb.toFixed(0)}%
                                  </div>
                                )}
                              </div>
                            )}

                            <div className={`bg-slate-800 rounded-lg py-2 px-2 ${recommendedBet === 'away' ? 'ring-2 ring-yellow-400' : ''}`}>
                              <div className="text-yellow-400 font-black text-base">
                                {match.odds.away.toFixed(1).replace('.', '/')}
                              </div>
                              {match.prediction && (
                                <div className="text-[9px] text-emerald-400 font-bold mt-0.5">
                                  {match.prediction.awayWinProb.toFixed(0)}%
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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

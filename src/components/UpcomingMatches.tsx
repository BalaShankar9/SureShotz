import { useState, useEffect } from 'react';
import { ArrowLeft, User, BarChart2, RefreshCw } from 'lucide-react';
import { apiSportsService } from '../services/apiSportsService';
import { calculatePrediction } from '../services/qeaAlgorithm';

interface Match {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  odds: {
    home: number;
    draw?: number;
    away: number;
  };
  prediction?: {
    homeWinProb: number;
    drawProb?: number;
    awayWinProb: number;
    confidence: number;
    edge: number;
  };
}

export default function UpcomingMatches() {
  const [selectedSport, setSelectedSport] = useState('Soccer');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [apiStats, setApiStats] = useState({ today: 0, lastReset: '' });

  const sports = ['Soccer'];

  useEffect(() => {
    loadMatches();
    updateApiStats();
  }, [selectedSport]);

  const updateApiStats = () => {
    const stats = apiSportsService.getCallStats();
    setApiStats(stats);
  };

  const loadMatches = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const fixturesData = await apiSportsService.getUpcomingMatches(forceRefresh);
      updateApiStats();

      console.log('📥 Raw fixtures data:', fixturesData);
      console.log('📊 Total fixtures:', fixturesData.length);

      const notStartedFixtures = fixturesData.filter((f: any) => {
        const status = f.fixture?.status?.short;
        console.log(`   Status for ${f.teams?.home?.name} vs ${f.teams?.away?.name}: ${status}`);
        return status === 'NS' || status === 'TBD';
      });

      console.log('✅ Not started fixtures:', notStartedFixtures.length);

      const transformedMatches: Match[] = notStartedFixtures.map((f: any) => {
        const bookmakers = f.bookmakers || [];
        let odds = { home: 2.0, draw: 3.0, away: 2.5 };

        if (bookmakers.length > 0) {
          const homeDrawAway = bookmakers[0].bets?.find((b: any) => b.name === 'Match Winner');
          if (homeDrawAway) {
            const values = homeDrawAway.values;
            odds = {
              home: values.find((v: any) => v.value === 'Home')?.odd || 2.0,
              draw: values.find((v: any) => v.value === 'Draw')?.odd || 3.0,
              away: values.find((v: any) => v.value === 'Away')?.odd || 2.5,
            };
          }
        }

        return {
          id: f.fixture.id.toString(),
          sport: 'Soccer',
          league: f.league.name,
          homeTeam: f.teams.home.name,
          awayTeam: f.teams.away.name,
          startTime: f.fixture.date,
          odds
        };
      });

      console.log('🔄 Transformed matches:', transformedMatches.length);

      transformedMatches.sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      const withPredictions = transformedMatches.map(match => {
        try {
          const pred = calculatePrediction(
            match.homeTeam,
            match.awayTeam,
            match.odds.home,
            match.odds.draw,
            match.odds.away
          );

          return {
            ...match,
            prediction: {
              homeWinProb: pred.homeWin,
              drawProb: pred.draw,
              awayWinProb: pred.awayWin,
              confidence: pred.confidence,
              edge: pred.edge,
            }
          };
        } catch (error) {
          return match;
        }
      });

      console.log('✅ Final matches with predictions:', withPredictions.length);
      setMatches(withPredictions);
    } catch (error) {
      console.error('❌ Error loading matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (apiStats.today >= 95) {
      if (!confirm(`You've used ${apiStats.today}/100 API calls today. Refresh anyway?`)) {
        return;
      }
    }
    loadMatches(true);
  };

  const getNextMatchTime = () => {
    if (matches.length === 0) return 'No matches';
    const next = new Date(matches[0].startTime);
    const now = new Date();
    const diff = next.getTime() - now.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Next ${mins} mins`;
    const hours = Math.floor(mins / 60);
    return `Next ${hours} hours`;
  };

  const filteredMatches = matches.filter(match => {
    const matchTime = new Date(match.startTime);
    const now = new Date();
    const diffMins = (matchTime.getTime() - now.getTime()) / 60000;

    if (timeFilter === 'all') return true;
    if (timeFilter === '15') return diffMins <= 15;
    if (timeFilter === '60') return diffMins <= 60;
    if (timeFilter === '180') return diffMins <= 180;
    return true;
  });

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    }
    return (a.odds.home + a.odds.away) - (b.odds.home + b.odds.away);
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-slate-800 px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <ArrowLeft className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Next to Start</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-400">
            {apiStats.today}/100 calls
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <User className="w-6 h-6" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-2 px-4 py-4 min-w-max">
          {sports.map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                selectedSport === sport
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 bg-slate-800/50 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">{selectedSport}</span>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm border border-slate-600"
          >
            <option value="all">All matches</option>
            <option value="15">Next 15 mins</option>
            <option value="60">Next 1 hour</option>
            <option value="180">Next 3 hours</option>
          </select>
        </div>
        <div className="text-sm text-slate-400">{getNextMatchTime()}</div>
      </div>

      <div className="px-4 py-3 flex items-center gap-4 text-sm border-b border-slate-700/50">
        <span className="text-slate-500 italic">Sort by</span>
        <button
          onClick={() => setSortBy('date')}
          className={`px-4 py-1.5 rounded-lg font-bold transition-colors ${
            sortBy === 'date'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Date
        </button>
        <button
          onClick={() => setSortBy('price')}
          className={`px-4 py-1.5 rounded-lg font-bold transition-colors ${
            sortBy === 'price'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Price
        </button>
      </div>

      <div className="px-4 py-3 grid grid-cols-3 gap-2 text-center text-sm font-bold text-slate-400 border-b border-slate-700/50">
        <div>1</div>
        <div>X</div>
        <div>2</div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : sortedMatches.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg font-medium">No upcoming matches found</p>
          <p className="text-sm mt-2">Try refreshing data or check back later</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-700/50">
          {sortedMatches.map((match) => {
            const matchDate = new Date(match.startTime);
            const hasHighEdge = match.prediction && match.prediction.edge > 8;

            return (
              <div
                key={match.id}
                className={`px-4 py-4 hover:bg-slate-800/50 transition-colors ${
                  hasHighEdge ? 'bg-yellow-900/10 border-l-4 border-yellow-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                        <div className="w-4 h-4 bg-slate-600 rounded"></div>
                      </div>
                      <span className="font-bold text-base truncate">{match.homeTeam}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                        <div className="w-4 h-4 bg-slate-600 rounded"></div>
                      </div>
                      <span className="font-bold text-base truncate">{match.awayTeam}</span>
                    </div>

                    <div className="text-xs text-slate-400 mb-1">{match.league}</div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>
                        {matchDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                      <span>
                        {matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                      <BarChart2 className="w-3.5 h-3.5" />
                    </div>

                    {match.prediction && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-emerald-400 font-bold">
                          Edge: +{match.prediction.edge.toFixed(1)}%
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-blue-400 font-bold">
                          Conf: {match.prediction.confidence.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-800 rounded-lg py-2 px-3">
                        <div className="text-yellow-400 font-black text-lg">
                          {match.odds.home.toFixed(2).replace('.', '/')}
                        </div>
                        {match.prediction && (
                          <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                            {match.prediction.homeWinProb.toFixed(0)}%
                          </div>
                        )}
                      </div>

                      {match.odds.draw && (
                        <div className="bg-slate-800 rounded-lg py-2 px-3">
                          <div className="text-yellow-400 font-black text-lg">
                            {match.odds.draw.toFixed(2).replace('.', '/')}
                          </div>
                          {match.prediction?.drawProb && (
                            <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                              {match.prediction.drawProb.toFixed(0)}%
                            </div>
                          )}
                        </div>
                      )}

                      <div className="bg-slate-800 rounded-lg py-2 px-3">
                        <div className="text-yellow-400 font-black text-lg">
                          {match.odds.away.toFixed(2).replace('.', '/')}
                        </div>
                        {match.prediction && (
                          <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                            {match.prediction.awayWinProb.toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

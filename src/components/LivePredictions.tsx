import { useState, useEffect } from 'react';
import { Radio, TrendingUp, Clock, AlertCircle, Target } from 'lucide-react';
import { liveDataService } from '../services/liveDataService';
import { LiveMatch, PersonalizedRecommendation, MarketMovement } from '../types/live';

export default function LivePredictions() {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [movements, setMovements] = useState<MarketMovement[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('ALL');

  useEffect(() => {
    liveDataService.startLiveMonitoring();

    const unsubMatches = liveDataService.subscribe('matches_loaded', (matches: LiveMatch[]) => {
      setLiveMatches(matches.filter(m => m.status === 'live'));
    });

    const unsubMatchUpdate = liveDataService.subscribe('match_update', (match: LiveMatch) => {
      setLiveMatches(prev => {
        const filtered = prev.filter(m => m.id !== match.id);
        if (match.status === 'live') {
          return [...filtered, match].sort((a, b) => a.homeTeam.localeCompare(b.homeTeam));
        }
        return filtered;
      });
    });

    const unsubRec = liveDataService.subscribe('recommendation', (rec: PersonalizedRecommendation) => {
      setRecommendations(prev => [rec, ...prev].slice(0, 10));
    });

    const unsubMovement = liveDataService.subscribe('market_movement', (movement: MarketMovement) => {
      setMovements(prev => [movement, ...prev].slice(0, 15));
    });

    return () => {
      unsubMatches();
      unsubMatchUpdate();
      unsubRec();
      unsubMovement();
    };
  }, []);

  const filteredMatches = selectedSport === 'ALL'
    ? liveMatches
    : liveMatches.filter(m => m.sport === selectedSport);

  const sports = ['ALL', 'NFL', 'NBA', 'MLB', 'NHL', 'SOCCER'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Live Match Predictions</h2>
            <p className="text-sm text-slate-400">Real-time analysis updating every 3 seconds</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedSport === sport
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filteredMatches.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
              <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No live matches currently. Check upcoming sure shots.</p>
            </div>
          ) : (
            filteredMatches.map(match => (
              <div
                key={match.id}
                className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-emerald-600/50 transition-all"
              >
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-3 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded uppercase">
                        LIVE
                      </span>
                      <span className="text-slate-400 text-sm">{match.sport} • {match.period || 'In Progress'}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Updated {new Date(match.lastUpdate).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white mb-1">{match.homeTeam}</div>
                      <div className="text-4xl font-black text-emerald-400">
                        {match.score?.home ?? '-'}
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="text-2xl font-bold text-slate-600">VS</div>
                    </div>

                    <div className="text-center">
                      <div className="text-xl font-bold text-white mb-1">{match.awayTeam}</div>
                      <div className="text-4xl font-black text-blue-400">
                        {match.score?.away ?? '-'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-slate-900/50 rounded-lg p-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Home ML</div>
                      <div className="text-lg font-bold text-white">{match.liveOdds.homeML}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Total</div>
                      <div className="text-lg font-bold text-white">
                        O/U {match.liveOdds.total.line}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Away ML</div>
                      <div className="text-lg font-bold text-white">{match.liveOdds.awayML}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-emerald-700/50">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-white">Live Recommendations</h3>
            </div>

            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <p className="text-sm text-slate-400">Waiting for opportunities...</p>
              ) : (
                recommendations.slice(0, 5).map(rec => (
                  <div
                    key={rec.id}
                    className={`bg-slate-900/50 rounded-lg p-4 border ${
                      rec.urgency === 'immediate'
                        ? 'border-red-500/50 bg-red-900/10'
                        : rec.urgency === 'soon'
                        ? 'border-yellow-500/50'
                        : 'border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                          rec.urgency === 'immediate'
                            ? 'bg-red-600 text-white'
                            : rec.urgency === 'soon'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {rec.type}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(rec.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-white mb-1">{rec.action}</div>
                    <div className="text-xs text-slate-400 mb-2">{rec.reasoning}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400">EV: +{rec.expectedValue}%</span>
                      <span className="text-slate-400">Stake: ${rec.stake}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-bold text-white">Market Movements</h3>
            </div>

            <div className="space-y-2">
              {movements.length === 0 ? (
                <p className="text-sm text-slate-400">Monitoring markets...</p>
              ) : (
                movements.slice(0, 8).map((movement, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm bg-slate-900/50 rounded p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          movement.significance === 'major'
                            ? 'bg-red-500'
                            : movement.significance === 'moderate'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                      ></span>
                      <span className="text-slate-300 text-xs">{movement.betType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">
                        {movement.previousOdds} → {movement.currentOdds}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          movement.direction === 'up' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {movement.direction === 'up' ? '↑' : '↓'} {Math.abs(movement.changePercent)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, Target, Zap, Activity } from 'lucide-react';
import { sportsDataService, RealMatch } from '../services/sportsDataService';
import { qeaAlgorithm, QEAPrediction } from '../services/qeaAlgorithm';

interface MatchWithPrediction {
  match: RealMatch;
  prediction: QEAPrediction;
}

export default function MatchList() {
  const [view, setView] = useState<'upcoming' | 'live'>('upcoming');
  const [matches, setMatches] = useState<MatchWithPrediction[]>([]);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();

    sportsDataService.startAutoFetch(async (fetchedMatches) => {
      await processMatches(fetchedMatches);
    });

    return () => {
      sportsDataService.stopAutoFetch();
    };
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    const fetchedMatches = await sportsDataService.fetchLiveMatches();
    await processMatches(fetchedMatches);
    setLoading(false);
  };

  const processMatches = async (fetchedMatches: RealMatch[]) => {
    const withPredictions: MatchWithPrediction[] = [];

    for (const match of fetchedMatches) {
      const prediction = await qeaAlgorithm.generatePrediction(match);
      withPredictions.push({ match, prediction });
    }

    withPredictions.sort((a, b) => {
      if (a.match.status === 'live' && b.match.status !== 'live') return -1;
      if (a.match.status !== 'live' && b.match.status === 'live') return 1;
      return new Date(a.match.startTime).getTime() - new Date(b.match.startTime).getTime();
    });

    setMatches(withPredictions);
  };

  const displayMatches = matches.filter(m =>
    view === 'upcoming' ? m.match.status === 'scheduled' : m.match.status === 'live'
  );

  const highProbMatches = displayMatches.filter(m =>
    m.prediction.homeWinProbability >= 65 ||
    m.prediction.awayWinProbability >= 65 ||
    m.prediction.bettingOpportunities.some(b => b.priority === 'critical' || b.priority === 'high')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500">
              QEA STRATEGY PLATFORM
            </h1>
            <p className="text-sm text-slate-400 font-medium tracking-wide mt-1">
              Quantum Edge Accumulator • Real-Time Analysis
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur rounded-xl px-5 py-3 border border-emerald-600/30">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
            <span className="text-sm font-bold text-white uppercase tracking-wider">System Active</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setView('upcoming')}
            className={`group relative overflow-hidden rounded-2xl p-8 transition-all duration-300 ${
              view === 'upcoming'
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-2xl shadow-emerald-600/40 scale-105'
                : 'bg-slate-800/50 hover:bg-slate-800 border-2 border-slate-700 hover:border-emerald-600/50'
            }`}
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="text-left">
                <div className={`text-2xl font-black mb-2 ${view === 'upcoming' ? 'text-white' : 'text-slate-300'}`}>
                  UPCOMING MATCHES
                </div>
                <div className={`text-sm font-medium ${view === 'upcoming' ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {matches.filter(m => m.match.status === 'scheduled').length} scheduled games
                </div>
              </div>
              <Activity className={`w-10 h-10 ${view === 'upcoming' ? 'text-white' : 'text-slate-600'}`} />
            </div>
          </button>

          <button
            onClick={() => setView('live')}
            className={`group relative overflow-hidden rounded-2xl p-8 transition-all duration-300 ${
              view === 'live'
                ? 'bg-gradient-to-br from-red-600 to-red-700 shadow-2xl shadow-red-600/40 scale-105'
                : 'bg-slate-800/50 hover:bg-slate-800 border-2 border-slate-700 hover:border-red-600/50'
            }`}
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="text-left">
                <div className={`text-2xl font-black mb-2 ${view === 'live' ? 'text-white' : 'text-slate-300'}`}>
                  LIVE MATCHES
                </div>
                <div className={`text-sm font-medium ${view === 'live' ? 'text-red-100' : 'text-slate-500'}`}>
                  {matches.filter(m => m.match.status === 'live').length} in progress
                </div>
              </div>
              <Zap className={`w-10 h-10 ${view === 'live' ? 'text-white animate-pulse' : 'text-slate-600'}`} />
            </div>
          </button>
        </div>

        {highProbMatches.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-900/40 via-orange-900/40 to-yellow-900/40 rounded-2xl p-5 border-2 border-yellow-600/50 backdrop-blur">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
              <span className="font-black text-xl text-white uppercase tracking-wide">High Probability Detected</span>
              <span className="bg-yellow-500 text-black text-sm font-black px-3 py-1 rounded-full">
                {highProbMatches.length}
              </span>
            </div>
            <p className="text-yellow-100 font-medium">
              {highProbMatches.length} match{highProbMatches.length !== 1 ? 'es' : ''} with 65%+ win probability or critical +EV opportunities
            </p>
          </div>
        )}

        {loading ? (
          <div className="bg-slate-800/50 rounded-2xl p-16 border border-slate-700 text-center backdrop-blur">
            <div className="inline-block w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-medium">Loading matches and generating predictions...</p>
          </div>
        ) : displayMatches.length === 0 ? (
          <div className="bg-slate-800/50 rounded-2xl p-16 border border-slate-700 text-center backdrop-blur">
            <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-medium">
              {view === 'upcoming' ? 'No upcoming matches available' : 'No live matches currently'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayMatches.map(({ match, prediction }) => {
              const isExpanded = expandedMatch === match.id;
              const isHighProb = prediction.homeWinProbability >= 65 || prediction.awayWinProbability >= 65;
              const hasCritical = prediction.bettingOpportunities.some(b => b.priority === 'critical' || b.priority === 'high');

              return (
                <div
                  key={match.id}
                  className={`rounded-2xl border-2 overflow-hidden transition-all backdrop-blur ${
                    isHighProb || hasCritical
                      ? 'bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-600/60 shadow-xl shadow-yellow-600/20'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedMatch(isExpanded ? null : match.id)}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3 flex-wrap">
                        {match.status === 'live' && (
                          <span className="bg-red-600 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase animate-pulse shadow-lg shadow-red-600/50">
                            ● LIVE
                          </span>
                        )}
                        <span className="bg-slate-700 text-slate-200 px-4 py-1.5 rounded-full text-sm font-bold">
                          {match.sport} • {match.league}
                        </span>
                        <span className="text-slate-500 text-sm font-medium">
                          {match.status === 'scheduled'
                            ? new Date(match.startTime).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })
                            : match.period || 'In Progress'
                          }
                        </span>
                        {isHighProb && (
                          <span className="bg-yellow-500 text-black text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                            <Zap className="w-3 h-3" />
                            HIGH PROB
                          </span>
                        )}
                      </div>

                      <button className="text-slate-400 hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                      </button>
                    </div>

                    <div className="grid grid-cols-12 gap-8 items-center">
                      <div className="col-span-5">
                        <div className="text-3xl font-black text-white mb-2">{match.homeTeam}</div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {prediction.predictedWinner === match.homeTeam && (
                            <Target className="w-5 h-5 text-emerald-400" />
                          )}
                          <span className="text-sm text-slate-400 font-medium">
                            ML: {match.oddsData.homeML.toFixed(2)}
                          </span>
                          <span className="text-sm text-emerald-400 font-bold">
                            {prediction.homeWinProbability}% prob
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 flex flex-col items-center">
                        {match.status === 'live' ? (
                          <>
                            <div className="flex items-center gap-4 mb-2">
                              <span className="text-4xl font-black text-emerald-400">{match.homeScore}</span>
                              <span className="text-slate-600 text-2xl font-bold">-</span>
                              <span className="text-4xl font-black text-blue-400">{match.awayScore}</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-3xl font-black text-slate-700">VS</div>
                        )}
                        <div className="text-xs text-slate-500 text-center mt-1 font-medium">
                          O/U {match.oddsData.total.line}
                        </div>
                      </div>

                      <div className="col-span-5 text-right">
                        <div className="text-3xl font-black text-white mb-2">{match.awayTeam}</div>
                        <div className="flex items-center gap-3 justify-end flex-wrap">
                          {prediction.predictedWinner === match.awayTeam && (
                            <Target className="w-5 h-5 text-emerald-400" />
                          )}
                          <span className="text-sm text-slate-400 font-medium">
                            ML: {match.oddsData.awayML.toFixed(2)}
                          </span>
                          <span className="text-sm text-emerald-400 font-bold">
                            {prediction.awayWinProbability}% prob
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isExpanded && (
                      <div className="mt-5 pt-5 border-t border-slate-700/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div>
                              <span className="text-xs text-slate-500 uppercase tracking-wide">Predicted Winner</span>
                              <div className="font-black text-white text-lg">{prediction.predictedWinner}</div>
                            </div>
                            <div>
                              <span className="text-xs text-slate-500 uppercase tracking-wide">Confidence</span>
                              <div className="font-black text-blue-400 text-lg">{prediction.confidenceScore}%</div>
                            </div>
                            <div>
                              <span className="text-xs text-slate-500 uppercase tracking-wide">Best Edge</span>
                              <div className="font-black text-emerald-400 text-lg">+{prediction.edgePercentage}%</div>
                            </div>
                          </div>

                          {prediction.bettingOpportunities.length > 0 && (
                            <div className="flex items-center gap-2 bg-emerald-900/30 px-4 py-2 rounded-lg">
                              <TrendingUp className="w-5 h-5 text-emerald-400" />
                              <span className="text-sm font-bold text-white">{prediction.bettingOpportunities.length} +EV Opportunities</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-700/50 bg-slate-900/70 backdrop-blur">
                      <div className="p-6 space-y-6">
                        <div>
                          <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                            <Target className="w-6 h-6 text-emerald-500" />
                            QEA Prediction Analysis
                          </h3>
                          <div className="grid grid-cols-4 gap-4 mb-5">
                            <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700">
                              <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Winner</div>
                              <div className="text-xl font-black text-white">{prediction.predictedWinner}</div>
                            </div>
                            <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700">
                              <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Confidence</div>
                              <div className="text-xl font-black text-blue-400">{prediction.confidenceScore}%</div>
                            </div>
                            <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700">
                              <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Best Edge</div>
                              <div className="text-xl font-black text-emerald-400">+{prediction.edgePercentage}%</div>
                            </div>
                            <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700">
                              <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Exp. Value</div>
                              <div className="text-xl font-black text-purple-400">+{prediction.expectedValue.toFixed(1)}%</div>
                            </div>
                          </div>

                          <div className="bg-slate-800/70 rounded-xl p-5 border border-slate-700">
                            <div className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide">Key Factors</div>
                            <div className="space-y-2">
                              {prediction.keyFactors.map((factor, idx) => (
                                <div key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                                  <span className="text-emerald-500 mt-1 font-bold">•</span>
                                  <span className="font-medium">{factor}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {prediction.bettingOpportunities.length > 0 && (
                          <div>
                            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                              <TrendingUp className="w-6 h-6 text-emerald-500" />
                              +EV Betting Opportunities
                            </h3>
                            <div className="space-y-3">
                              {prediction.bettingOpportunities.map((opp, idx) => (
                                <div
                                  key={idx}
                                  className={`rounded-xl p-5 border-2 ${
                                    opp.priority === 'critical'
                                      ? 'bg-red-900/30 border-red-600/60'
                                      : opp.priority === 'high'
                                      ? 'bg-yellow-900/30 border-yellow-600/60'
                                      : 'bg-blue-900/30 border-blue-600/60'
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-3">
                                        <span
                                          className={`text-xs font-black px-3 py-1 rounded-full uppercase ${
                                            opp.priority === 'critical'
                                              ? 'bg-red-600 text-white'
                                              : opp.priority === 'high'
                                              ? 'bg-yellow-500 text-black'
                                              : 'bg-blue-600 text-white'
                                          }`}
                                        >
                                          {opp.priority}
                                        </span>
                                        <span className="text-slate-400 text-sm font-medium">{opp.betType}</span>
                                      </div>
                                      <div className="text-2xl font-black text-white mb-3">{opp.selection}</div>
                                      <div className="flex items-center gap-6 text-sm mb-3">
                                        <div>
                                          <span className="text-slate-500 font-medium">Odds: </span>
                                          <span className="text-white font-bold">{opp.odds.toFixed(2)}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 font-medium">Edge: </span>
                                          <span className="text-emerald-400 font-black">+{opp.edge.toFixed(1)}%</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 font-medium">EV: </span>
                                          <span className="text-emerald-400 font-black">+{opp.expectedValue.toFixed(1)}%</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 font-medium">Kelly: </span>
                                          <span className="text-purple-400 font-black">{opp.kellyStake.toFixed(1)}%</span>
                                        </div>
                                      </div>
                                      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                                        <p className="text-sm text-slate-300 font-medium">{opp.reasoning}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

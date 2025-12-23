import { useState } from 'react';
import { Plus, Trash2, TrendingUp, AlertCircle } from 'lucide-react';
import { ParlayLegSelection, buildCorrelatedParlay, generateSGPRecommendations } from '../utils/correlation';
import { generateRoundRobin, applyTeaser, calculateExpectedValueForParlay } from '../utils/parlay';

export default function ParlayBuilder() {
  const [legs, setLegs] = useState<ParlayLegSelection[]>([]);
  const [parlayType, setParlayType] = useState<'standard' | 'roundrobin' | 'teaser'>('standard');
  const [stake, setStake] = useState(10);
  const [sport, setSport] = useState<'NFL' | 'NBA' | 'MLB'>('NFL');

  const [newLeg, setNewLeg] = useState({
    selection: '',
    team: '',
    odds: 2.0,
    probability: 50,
    type: 'ML' as 'ML' | 'spread' | 'total' | 'prop',
  });

  const addLeg = () => {
    if (!newLeg.selection || !newLeg.team) return;

    const leg: ParlayLegSelection = {
      id: Math.random().toString(36),
      type: newLeg.type,
      selection: newLeg.selection,
      team: newLeg.team,
      odds: newLeg.odds,
      probability: newLeg.probability,
    };

    setLegs([...legs, leg]);
    setNewLeg({
      selection: '',
      team: '',
      odds: 2.0,
      probability: 50,
      type: 'ML',
    });
  };

  const removeLeg = (id: string) => {
    setLegs(legs.filter(leg => leg.id !== id));
  };

  const parlayAnalysis = legs.length >= 2 ? buildCorrelatedParlay(legs) : null;
  const evAnalysis = legs.length >= 2 ? calculateExpectedValueForParlay(legs, stake) : null;

  const roundRobinResult = parlayType === 'roundrobin' && legs.length >= 3
    ? generateRoundRobin({ legs, parlaySize: 2 }, stake)
    : null;

  const teaserResult = parlayType === 'teaser' && legs.length >= 2
    ? applyTeaser({ legs, points: 6, sport: sport as 'NFL' | 'NBA' })
    : null;

  const recommendations = generateSGPRecommendations(sport, 'offensive');

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Parlay Type & Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Parlay Type</label>
            <select
              value={parlayType}
              onChange={(e) => setParlayType(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="standard">Standard / SGP</option>
              <option value="roundrobin">Round Robin</option>
              <option value="teaser">Teaser (6pts)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Sport</label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="NFL">NFL</option>
              <option value="NBA">NBA</option>
              <option value="MLB">MLB</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Stake Amount ($)</label>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
              min="1"
              step="1"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-6 h-6 text-emerald-500" />
          Add Parlay Leg
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
            <select
              value={newLeg.type}
              onChange={(e) => setNewLeg({ ...newLeg, type: e.target.value as any })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white"
            >
              <option value="ML">Moneyline</option>
              <option value="spread">Spread</option>
              <option value="total">Total</option>
              <option value="prop">Prop</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Team</label>
            <input
              type="text"
              value={newLeg.team}
              onChange={(e) => setNewLeg({ ...newLeg, team: e.target.value })}
              placeholder="Team name"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Selection</label>
            <input
              type="text"
              value={newLeg.selection}
              onChange={(e) => setNewLeg({ ...newLeg, selection: e.target.value })}
              placeholder="e.g. Chiefs ML, Over 48.5"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Odds (Decimal)</label>
            <input
              type="number"
              value={newLeg.odds}
              onChange={(e) => setNewLeg({ ...newLeg, odds: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white"
              step="0.01"
              min="1.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Win Prob (%)</label>
            <input
              type="number"
              value={newLeg.probability}
              onChange={(e) => setNewLeg({ ...newLeg, probability: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white"
              min="1"
              max="99"
            />
          </div>
        </div>

        <button
          onClick={addLeg}
          className="mt-4 w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Leg to Parlay
        </button>
      </div>

      {legs.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Current Legs ({legs.length})</h2>

          <div className="space-y-3">
            {legs.map((leg) => (
              <div key={leg.id} className="bg-slate-900 rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded">
                      {leg.type}
                    </span>
                    <span className="text-white font-medium">{leg.selection}</span>
                    <span className="text-slate-400 text-sm">({leg.team})</span>
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    Odds: {leg.odds.toFixed(2)} | Win Prob: {leg.probability}%
                  </div>
                </div>
                <button
                  onClick={() => removeLeg(leg.id)}
                  className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {parlayAnalysis && (
        <div className="bg-gradient-to-br from-blue-900/30 to-emerald-900/30 rounded-xl p-6 border border-blue-700/50">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Parlay Analysis
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Combined Odds</div>
              <div className="text-2xl font-bold text-white">{parlayAnalysis.combinedOdds.toFixed(2)}x</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Win Probability</div>
              <div className="text-2xl font-bold text-emerald-400">{parlayAnalysis.totalProbability}%</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Potential Payout</div>
              <div className="text-2xl font-bold text-white">${(stake * parlayAnalysis.combinedOdds).toFixed(2)}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Correlation Score</div>
              <div className={`text-2xl font-bold ${parlayAnalysis.correlationScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {parlayAnalysis.correlationScore.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
            <div className="text-sm font-medium text-slate-300 mb-2">Narrative</div>
            <p className="text-slate-400">{parlayAnalysis.narrative}</p>
          </div>

          {parlayAnalysis.warnings.length > 0 && (
            <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-orange-300 mb-1">Warnings</div>
                  {parlayAnalysis.warnings.map((warning, idx) => (
                    <div key={idx} className="text-sm text-orange-200">{warning}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {evAnalysis && (
        <div className={`rounded-xl p-6 border ${evAnalysis.roi > 0 ? 'bg-green-900/20 border-green-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
          <h2 className="text-xl font-bold text-white mb-4">Expected Value Analysis</h2>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Expected Value</div>
              <div className={`text-2xl font-bold ${evAnalysis.ev > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${evAnalysis.ev}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">ROI</div>
              <div className={`text-2xl font-bold ${evAnalysis.roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {evAnalysis.roi}%
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Stake</div>
              <div className="text-2xl font-bold text-white">${stake}</div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className={evAnalysis.roi > 0 ? 'text-green-300' : 'text-red-300'}>{evAnalysis.recommendation}</p>
          </div>
        </div>
      )}

      {roundRobinResult && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Round Robin Analysis</h2>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Total Parlays</div>
              <div className="text-2xl font-bold text-white">{roundRobinResult.totalCombinations}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Total Stake</div>
              <div className="text-2xl font-bold text-white">${roundRobinResult.totalStake}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Potential Return</div>
              <div className="text-2xl font-bold text-emerald-400">${roundRobinResult.potentialReturn}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Break Even</div>
              <div className="text-2xl font-bold text-white">{roundRobinResult.breakEvenWins} wins</div>
            </div>
          </div>
        </div>
      )}

      {teaserResult && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">6-Point Teaser Analysis</h2>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Adjusted Odds</div>
              <div className="text-2xl font-bold text-white">{teaserResult.adjustedOdds.toFixed(2)}x</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Win Probability</div>
              <div className="text-2xl font-bold text-emerald-400">{teaserResult.adjustedProbability}%</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Potential Payout</div>
              <div className="text-2xl font-bold text-white">${(stake * teaserResult.adjustedOdds).toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-slate-300">{teaserResult.recommendation}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">SGP Recommendations ({sport})</h2>

        <div className="space-y-2">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="bg-slate-900 rounded-lg p-3 text-slate-300 text-sm">
              {rec}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

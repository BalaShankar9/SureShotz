import { useState } from 'react';
import { Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { generatePrediction, calculatePlusEVOpportunities, adjustForSportSpecifics, GameContext } from '../utils/predictive';

export default function PredictionEngine() {
  const [sport, setSport] = useState<'NFL' | 'NBA' | 'MLB'>('NFL');
  const [homeTeam, setHomeTeam] = useState('Kansas City Chiefs');
  const [awayTeam, setAwayTeam] = useState('Buffalo Bills');

  const [homeOffensive, setHomeOffensive] = useState(28.5);
  const [homeDefensive, setHomeDefensive] = useState(21.2);
  const [awayOffensive, setAwayOffensive] = useState(27.3);
  const [awayDefensive, setAwayDefensive] = useState(22.1);

  const [windSpeed, setWindSpeed] = useState(0);
  const [homeRest, setHomeRest] = useState(7);
  const [awayRest, setAwayRest] = useState(7);

  const [mlOdds, setMlOdds] = useState(1.91);
  const [totalLine, setTotalLine] = useState(48.5);
  const [overOdds, setOverOdds] = useState(1.91);
  const [underOdds, setUnderOdds] = useState(1.91);

  const context: GameContext = {
    sport,
    homeTeam,
    awayTeam,
    homeStats: {
      offensiveRating: homeOffensive,
      defensiveRating: homeDefensive,
      avgPointsScored: homeOffensive,
      avgPointsAllowed: homeDefensive,
      homeAdvantage: 3,
      recentForm: [1, 1, 0, 1, 1],
    },
    awayStats: {
      offensiveRating: awayOffensive,
      defensiveRating: awayDefensive,
      avgPointsScored: awayOffensive,
      avgPointsAllowed: awayDefensive,
      recentForm: [1, 0, 1, 1, 0],
    },
    weather: windSpeed > 0 ? { windSpeed, temperature: 45, precipitation: false } : undefined,
    restDays: { home: homeRest, away: awayRest },
  };

  const basePrediction = generatePrediction(context);
  const prediction = adjustForSportSpecifics(context, basePrediction);

  const opportunities = calculatePlusEVOpportunities(prediction, {
    ml: mlOdds,
    spread: 3.5,
    total: totalLine,
    over: overOdds,
    under: underOdds,
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-emerald-500" />
          Game Prediction Setup
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Home Team</label>
            <input
              type="text"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Away Team</label>
            <input
              type="text"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-bold text-white mb-3">{homeTeam} Stats</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Offensive Rating (Avg Points)</label>
                <input
                  type="number"
                  value={homeOffensive}
                  onChange={(e) => setHomeOffensive(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Defensive Rating (Avg Allowed)</label>
                <input
                  type="number"
                  value={homeDefensive}
                  onChange={(e) => setHomeDefensive(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Rest Days</label>
                <input
                  type="number"
                  value={homeRest}
                  onChange={(e) => setHomeRest(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-bold text-white mb-3">{awayTeam} Stats</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Offensive Rating (Avg Points)</label>
                <input
                  type="number"
                  value={awayOffensive}
                  onChange={(e) => setAwayOffensive(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Defensive Rating (Avg Allowed)</label>
                <input
                  type="number"
                  value={awayDefensive}
                  onChange={(e) => setAwayDefensive(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Rest Days</label>
                <input
                  type="number"
                  value={awayRest}
                  onChange={(e) => setAwayRest(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {sport === 'NFL' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Wind Speed (mph)</label>
            <input
              type="number"
              value={windSpeed}
              onChange={(e) => setWindSpeed(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
              min="0"
            />
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-emerald-900/30 to-blue-900/30 rounded-xl p-6 border border-emerald-700/50">
        <h2 className="text-xl font-bold text-white mb-4">Model Prediction</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">Predicted Winner</div>
            <div className="text-lg font-bold text-white">{prediction.predictedWinner}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">Win Probability</div>
            <div className="text-lg font-bold text-emerald-400">{prediction.winProbability}%</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">Predicted Score</div>
            <div className="text-lg font-bold text-white">
              {prediction.predictedScore.home} - {prediction.predictedScore.away}
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">Predicted Total</div>
            <div className="text-lg font-bold text-white">{prediction.predictedTotal}</div>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="text-sm font-medium text-slate-300 mb-2">Key Factors</div>
          <div className="space-y-1">
            {prediction.factors.map((factor, idx) => (
              <div key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Market Odds Input</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Moneyline Odds</label>
            <input
              type="number"
              value={mlOdds}
              onChange={(e) => setMlOdds(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Total Line</label>
            <input
              type="number"
              value={totalLine}
              onChange={(e) => setTotalLine(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Over Odds</label>
            <input
              type="number"
              value={overOdds}
              onChange={(e) => setOverOdds(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Under Odds</label>
            <input
              type="number"
              value={underOdds}
              onChange={(e) => setUnderOdds(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {opportunities.length > 0 && (
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-6 border border-green-700/50">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            +EV Opportunities Detected
          </h2>

          <div className="space-y-3">
            {opportunities.map((opp, idx) => (
              <div
                key={idx}
                className={`bg-slate-900/50 rounded-lg p-4 border ${
                  opp.recommended ? 'border-green-500/50' : 'border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-white">{opp.type}</div>
                    <div className="text-sm text-slate-400">Edge: +{opp.edge}% | EV: {opp.ev.toFixed(4)}</div>
                  </div>
                  {opp.recommended && (
                    <div className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      RECOMMENDED
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {opportunities.length === 0 && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 text-slate-400">
            <AlertTriangle className="w-5 h-5" />
            <span>No +EV opportunities found with current odds. Adjust market odds or predictions.</span>
          </div>
        </div>
      )}
    </div>
  );
}

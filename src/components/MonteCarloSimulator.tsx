import { useState, useMemo } from 'react';
import { Activity, TrendingUp, AlertTriangle, BarChart } from 'lucide-react';
import { runMonteCarloSimulation } from '../utils/montecarlo';

export default function MonteCarloSimulator() {
  const [initialBankroll, setInitialBankroll] = useState(1000);
  const [numBets, setNumBets] = useState(100);
  const [avgStakePercent, setAvgStakePercent] = useState(1.0);
  const [winRate, setWinRate] = useState(0.3);
  const [avgWinOdds, setAvgWinOdds] = useState(5.0);
  const [iterations, setIterations] = useState(10000);

  const simulationResult = useMemo(() => {
    return runMonteCarloSimulation({
      initialBankroll,
      numBets,
      avgStakePercent,
      winRate,
      avgWinOdds,
      avgLossOdds: 1.0,
      iterations,
    });
  }, [initialBankroll, numBets, avgStakePercent, winRate, avgWinOdds, iterations]);

  const outcomeDistribution = useMemo(() => {
    const bins = 20;
    const min = Math.min(...simulationResult.outcomes);
    const max = Math.max(...simulationResult.outcomes);
    const binSize = (max - min) / bins;

    const distribution = Array(bins).fill(0);
    simulationResult.outcomes.forEach(outcome => {
      const binIndex = Math.min(Math.floor((outcome - min) / binSize), bins - 1);
      distribution[binIndex]++;
    });

    return distribution.map((count, idx) => ({
      range: `$${Math.round(min + idx * binSize)}-${Math.round(min + (idx + 1) * binSize)}`,
      count,
      percent: ((count / iterations) * 100).toFixed(1),
    }));
  }, [simulationResult, iterations]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-purple-500" />
          Monte Carlo Simulation Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Initial Bankroll ($)
            </label>
            <input
              type="number"
              value={initialBankroll}
              onChange={(e) => setInitialBankroll(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              min="100"
              step="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Number of Bets
            </label>
            <input
              type="number"
              value={numBets}
              onChange={(e) => setNumBets(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              min="10"
              step="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Avg Stake (% of Bankroll)
            </label>
            <input
              type="number"
              value={avgStakePercent}
              onChange={(e) => setAvgStakePercent(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              min="0.1"
              max="5"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Win Rate (0-1)
            </label>
            <input
              type="number"
              value={winRate}
              onChange={(e) => setWinRate(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              min="0.01"
              max="0.99"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Avg Win Odds (Decimal)
            </label>
            <input
              type="number"
              value={avgWinOdds}
              onChange={(e) => setAvgWinOdds(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              min="1.1"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Iterations
            </label>
            <input
              type="number"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              min="1000"
              max="50000"
              step="1000"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-100">Mean Bankroll</span>
            <TrendingUp className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="text-3xl font-bold">${simulationResult.meanFinalBankroll}</div>
          <div className="text-sm text-emerald-100 mt-1">
            {simulationResult.expectedROI > 0 ? '+' : ''}{simulationResult.expectedROI}% ROI
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100">Median Bankroll</span>
            <BarChart className="w-5 h-5 text-blue-200" />
          </div>
          <div className="text-3xl font-bold">${simulationResult.medianFinalBankroll}</div>
        </div>

        <div className={`rounded-xl p-6 text-white ${
          simulationResult.ruinRisk < 5 ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gradient-to-br from-red-600 to-red-700'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={simulationResult.ruinRisk < 5 ? 'text-green-100' : 'text-red-100'}>
              Ruin Risk
            </span>
            <AlertTriangle className={`w-5 h-5 ${simulationResult.ruinRisk < 5 ? 'text-green-200' : 'text-red-200'}`} />
          </div>
          <div className="text-3xl font-bold">{simulationResult.ruinRisk}%</div>
          <div className={`text-sm mt-1 ${simulationResult.ruinRisk < 5 ? 'text-green-100' : 'text-red-100'}`}>
            {simulationResult.ruinRisk < 5 ? 'Low Risk' : 'High Risk'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-100">Max Drawdown</span>
            <AlertTriangle className="w-5 h-5 text-orange-200" />
          </div>
          <div className="text-3xl font-bold">{simulationResult.maxDrawdown}%</div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Confidence Intervals</h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">25th Percentile</div>
            <div className="text-2xl font-bold text-white">${simulationResult.percentile25}</div>
            <div className="text-xs text-slate-500 mt-1">Worst-case scenario (25%)</div>
          </div>

          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">75th Percentile</div>
            <div className="text-2xl font-bold text-white">${simulationResult.percentile75}</div>
            <div className="text-xs text-slate-500 mt-1">Good outcome (75%)</div>
          </div>

          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">95th Percentile</div>
            <div className="text-2xl font-bold text-emerald-400">${simulationResult.percentile95}</div>
            <div className="text-xs text-slate-500 mt-1">Best-case scenario (95%)</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Outcome Distribution</h2>

        <div className="space-y-2">
          {outcomeDistribution.slice(0, 10).map((bin, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="text-sm text-slate-400 w-32">{bin.range}</div>
              <div className="flex-1 bg-slate-900 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-full flex items-center justify-end pr-2 transition-all"
                  style={{ width: `${Math.min(100, (bin.count / Math.max(...outcomeDistribution.map(b => b.count))) * 100)}%` }}
                >
                  {bin.count > 0 && (
                    <span className="text-xs text-white font-medium">{bin.percent}%</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-xl p-6 border ${
        simulationResult.expectedROI > 5 && simulationResult.ruinRisk < 5
          ? 'bg-green-900/20 border-green-700/50'
          : simulationResult.expectedROI < 0 || simulationResult.ruinRisk > 10
          ? 'bg-red-900/20 border-red-700/50'
          : 'bg-yellow-900/20 border-yellow-700/50'
      }`}>
        <h2 className="text-xl font-bold text-white mb-3">Strategy Assessment</h2>

        {simulationResult.expectedROI > 5 && simulationResult.ruinRisk < 5 ? (
          <div className="text-green-200 space-y-2">
            <p><strong>Excellent Strategy:</strong> High expected ROI with low ruin risk.</p>
            <p>Over {numBets} bets, you have a strong probability of growing your bankroll significantly.</p>
            <p>Expected growth: {simulationResult.expectedROI}% with only {simulationResult.ruinRisk}% risk of ruin.</p>
          </div>
        ) : simulationResult.expectedROI < 0 || simulationResult.ruinRisk > 10 ? (
          <div className="text-red-200 space-y-2">
            <p><strong>High Risk Strategy:</strong> Negative expected value or excessive ruin risk.</p>
            <p>This strategy has a {simulationResult.ruinRisk}% chance of depleting your bankroll.</p>
            <p>Consider reducing stake size, improving win rate, or finding better odds.</p>
          </div>
        ) : (
          <div className="text-yellow-200 space-y-2">
            <p><strong>Moderate Strategy:</strong> Positive expected value but moderate risk.</p>
            <p>Expected ROI: {simulationResult.expectedROI}% with {simulationResult.ruinRisk}% ruin risk.</p>
            <p>Consider optimizing stake sizing or improving edge to reduce volatility.</p>
          </div>
        )}
      </div>

      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Monte Carlo Analysis Guide</h3>
        <div className="space-y-2 text-sm text-slate-300">
          <p><strong>Ruin Risk:</strong> Probability of losing 99% of bankroll. Target: &lt;5%</p>
          <p><strong>Expected ROI:</strong> Average return on investment. Target: &gt;5% for sustainable betting</p>
          <p><strong>Max Drawdown:</strong> Largest peak-to-trough decline. Prepare for 30-50% swings</p>
          <p><strong>Confidence Intervals:</strong> Range of likely outcomes across percentiles</p>
          <p><strong>Iterations:</strong> More iterations = more accurate simulation (10,000+ recommended)</p>
        </div>
      </div>
    </div>
  );
}

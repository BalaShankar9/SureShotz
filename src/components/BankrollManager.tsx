import { useState } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Shield } from 'lucide-react';
import { calculateKellyCriterion } from '../utils/kellycriterion';

export default function BankrollManager() {
  const [bankroll, setBankroll] = useState(1000);
  const [maxStake, setMaxStake] = useState(1.0);
  const [dailyLossCap, setDailyLossCap] = useState(5.0);
  const [profitTarget, setProfitTarget] = useState(10.0);

  const [predictedProb, setPredictedProb] = useState(55);
  const [odds, setOdds] = useState(2.0);

  const kellyResult = calculateKellyCriterion({
    predictedProbability: predictedProb / 100,
    decimalOdds: odds,
    bankroll,
    maxStakePercent: maxStake,
  });

  const allocations = {
    core: (bankroll * 0.7).toFixed(2),
    hedge: (bankroll * 0.2).toFixed(2),
    variant: (bankroll * 0.1).toFixed(2),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-100">Total Bankroll</span>
            <DollarSign className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="text-3xl font-bold">${bankroll.toFixed(2)}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100">Max Stake</span>
            <Shield className="w-5 h-5 text-blue-200" />
          </div>
          <div className="text-3xl font-bold">{maxStake}%</div>
          <div className="text-sm text-blue-100 mt-1">${(bankroll * maxStake / 100).toFixed(2)}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-100">Daily Loss Cap</span>
            <AlertCircle className="w-5 h-5 text-orange-200" />
          </div>
          <div className="text-3xl font-bold">{dailyLossCap}%</div>
          <div className="text-sm text-orange-100 mt-1">${(bankroll * dailyLossCap / 100).toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Bankroll Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Total Bankroll ($)
            </label>
            <input
              type="number"
              value={bankroll}
              onChange={(e) => setBankroll(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min="100"
              step="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Stake Per Bet (%)
            </label>
            <input
              type="number"
              value={maxStake}
              onChange={(e) => setMaxStake(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min="0.1"
              max="5"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Daily Loss Cap (%)
            </label>
            <input
              type="number"
              value={dailyLossCap}
              onChange={(e) => setDailyLossCap(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min="1"
              max="20"
              step="0.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Profit Target (%)
            </label>
            <input
              type="number"
              value={profitTarget}
              onChange={(e) => setProfitTarget(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min="5"
              max="50"
              step="1"
            />
          </div>
        </div>

        <div className="mt-6 bg-slate-900 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Allocation Strategy (70/20/10)</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">Core Parlays</div>
              <div className="text-lg font-bold text-white">${allocations.core}</div>
              <div className="text-xs text-slate-400">70%</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Hedges</div>
              <div className="text-lg font-bold text-white">${allocations.hedge}</div>
              <div className="text-xs text-slate-400">20%</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Variants</div>
              <div className="text-lg font-bold text-white">${allocations.variant}</div>
              <div className="text-xs text-slate-400">10%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Kelly Criterion Calculator</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Your Predicted Probability (%)
            </label>
            <input
              type="number"
              value={predictedProb}
              onChange={(e) => setPredictedProb(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min="1"
              max="99"
              step="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Decimal Odds
            </label>
            <input
              type="number"
              value={odds}
              onChange={(e) => setOdds(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min="1.01"
              step="0.01"
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-900/50 to-blue-900/50 rounded-lg p-6 border border-emerald-700/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">Recommended Stake</div>
              <div className="text-2xl font-bold text-white">${kellyResult.recommendedStake}</div>
              <div className="text-xs text-emerald-400">{kellyResult.kellyPercent}% of bankroll</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Edge</div>
              <div className={`text-2xl font-bold ${kellyResult.edge > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {kellyResult.edge > 0 ? '+' : ''}{kellyResult.edge}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Expected Value</div>
              <div className={`text-2xl font-bold ${kellyResult.expectedValue > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${kellyResult.expectedValue}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Implied Prob</div>
              <div className="text-2xl font-bold text-white">{kellyResult.impliedProbability}%</div>
            </div>
          </div>

          {kellyResult.edge > 0 ? (
            <div className="mt-4 flex items-start gap-2 text-sm text-emerald-300">
              <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Positive edge detected! This is a +EV opportunity. Kelly recommends staking ${kellyResult.recommendedStake}.
              </span>
            </div>
          ) : (
            <div className="mt-4 flex items-start gap-2 text-sm text-red-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Negative edge detected. Avoid this bet as it has negative expected value.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Shield, TrendingUp, AlertCircle } from 'lucide-react';
import { calculateHedge, calculatePartialHedge, findMiddleOpportunities } from '../utils/hedging';

export default function HedgeCalculator() {
  const [originalStake, setOriginalStake] = useState(10);
  const [currentOdds, setCurrentOdds] = useState(20.0);
  const [legsHit, setLegsHit] = useState(2);
  const [totalLegs, setTotalLegs] = useState(3);
  const [finalLegOdds, setFinalLegOdds] = useState(2.0);

  const hedgeRecommendation = calculateHedge({
    originalStake,
    currentOdds,
    legsHit,
    totalLegs,
    currentLiveValue: originalStake * currentOdds,
    finalLegOdds,
  });

  const [partialDesiredProfit, setPartialDesiredProfit] = useState(50);

  const partialHedge = calculatePartialHedge({
    originalStake,
    potentialPayout: originalStake * currentOdds,
    desiredGuaranteedProfit: partialDesiredProfit,
    oppositeOdds: finalLegOdds,
  });

  const sampleLines = [
    { selection: 'Over 48.5', line: 48.5, odds: 1.91 },
    { selection: 'Under 52.5', line: 52.5, odds: 1.91 },
    { selection: 'Over 45.5', line: 45.5, odds: 2.0 },
    { selection: 'Under 51.5', line: 51.5, odds: 1.87 },
  ];

  const middleOpportunities = findMiddleOpportunities(sampleLines);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-500" />
          Full Hedge Calculator
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Original Stake ($)</label>
            <input
              type="number"
              value={originalStake}
              onChange={(e) => setOriginalStake(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Current Odds</label>
            <input
              type="number"
              value={currentOdds}
              onChange={(e) => setCurrentOdds(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              min="1.01"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Legs Hit</label>
            <input
              type="number"
              value={legsHit}
              onChange={(e) => setLegsHit(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Total Legs</label>
            <input
              type="number"
              value={totalLegs}
              onChange={(e) => setTotalLegs(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              min="2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Final Leg Odds</label>
            <input
              type="number"
              value={finalLegOdds}
              onChange={(e) => setFinalLegOdds(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              min="1.01"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {hedgeRecommendation.shouldHedge ? (
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-6 border border-green-700/50">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            Hedge Recommendation
          </h2>

          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 mb-6">
            <p className="text-green-200 font-medium">{hedgeRecommendation.recommendation}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Hedge Amount</div>
              <div className="text-2xl font-bold text-white">${hedgeRecommendation.hedgeAmount}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Hedge Odds</div>
              <div className="text-2xl font-bold text-white">{hedgeRecommendation.hedgeOdds.toFixed(2)}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Min Guaranteed</div>
              <div className="text-2xl font-bold text-green-400">${hedgeRecommendation.guaranteedProfitMin}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Max Guaranteed</div>
              <div className="text-2xl font-bold text-green-400">${hedgeRecommendation.guaranteedProfitMax}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="text-sm font-medium text-slate-300 mb-2">If Original Parlay Wins</div>
              <div className="text-2xl font-bold text-white mb-2">${hedgeRecommendation.breakdownIfWin.profit}</div>
              <div className="text-xs text-slate-400">{hedgeRecommendation.breakdownIfWin.description}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="text-sm font-medium text-slate-300 mb-2">If Original Parlay Loses</div>
              <div className="text-2xl font-bold text-white mb-2">${hedgeRecommendation.breakdownIfLoss.profit}</div>
              <div className="text-xs text-slate-400">{hedgeRecommendation.breakdownIfLoss.description}</div>
            </div>
          </div>

          <div className="mt-4 bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <div className="text-sm text-blue-200">
              <strong>No Hedge Potential:</strong> ${hedgeRecommendation.noHedgePotential} (if you let it ride and win)
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 text-slate-400">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium text-white mb-1">Hedging Not Recommended Yet</p>
              <p className="text-sm">{hedgeRecommendation.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Partial Hedge Calculator</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Desired Guaranteed Profit ($)
          </label>
          <input
            type="number"
            value={partialDesiredProfit}
            onChange={(e) => setPartialDesiredProfit(Number(e.target.value))}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
            min="1"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">Hedge Amount</div>
            <div className="text-lg font-bold text-white">${partialHedge.hedgeAmount}</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">If Original Wins</div>
            <div className="text-lg font-bold text-green-400">${partialHedge.profitIfOriginalWins}</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">If Original Loses</div>
            <div className="text-lg font-bold text-green-400">${partialHedge.profitIfOriginalLoses}</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">Hedge %</div>
            <div className="text-lg font-bold text-white">{partialHedge.hedgePercent}%</div>
          </div>
        </div>
      </div>

      {middleOpportunities.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Middle Opportunities</h2>

          <div className="space-y-3">
            {middleOpportunities.map((opp, idx) => (
              <div key={idx} className="bg-slate-900 rounded-lg p-4 border border-emerald-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white font-medium">
                    {opp.leg1.selection} ({opp.leg1.odds}) + {opp.leg2.selection} ({opp.leg2.odds})
                  </div>
                  <div className="text-emerald-400 font-bold">EV: {opp.expectedValue.toFixed(2)}</div>
                </div>
                <div className="text-sm text-slate-400">
                  Middle Range: {opp.middleRange.low} - {opp.middleRange.high} |
                  Both Win Prob: {opp.bothWinProb}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Hedging Strategy Guide</h3>
        <div className="space-y-2 text-sm text-slate-300">
          <p><strong>When to Hedge:</strong> Hedge when potential profit exceeds 5x your original stake (20x+ odds).</p>
          <p><strong>Full Hedge:</strong> Lock in guaranteed profit on both outcomes.</p>
          <p><strong>Partial Hedge:</strong> Set a minimum guaranteed profit while keeping upside.</p>
          <p><strong>Middle Strategy:</strong> Bet both sides with different lines to potentially win both.</p>
          <p><strong>Live Hedging:</strong> Monitor odds changes during games for optimal hedge timing.</p>
        </div>
      </div>
    </div>
  );
}

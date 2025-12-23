import { useState } from 'react';
import { TrendingUp, DollarSign, Target, Activity } from 'lucide-react';
import BankrollManager from './BankrollManager';
import PredictionEngine from './PredictionEngine';
import ParlayBuilder from './ParlayBuilder';
import HedgeCalculator from './HedgeCalculator';
import MonteCarloSimulator from './MonteCarloSimulator';

type Tab = 'bankroll' | 'predictions' | 'parlay' | 'hedge' | 'analytics';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('predictions');

  const tabs = [
    { id: 'bankroll' as Tab, label: 'Bankroll', icon: DollarSign },
    { id: 'predictions' as Tab, label: 'Predictions', icon: Target },
    { id: 'parlay' as Tab, label: 'Parlay Builder', icon: TrendingUp },
    { id: 'hedge' as Tab, label: 'Hedge Calculator', icon: Activity },
    { id: 'analytics' as Tab, label: 'Analytics', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Quantum Edge Accumulator
          </h1>
          <p className="text-slate-400 text-lg">
            Professional-Grade Parlay Strategy System with +EV Detection
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-1 mb-6 border border-slate-700">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="transition-all duration-300">
          {activeTab === 'bankroll' && <BankrollManager />}
          {activeTab === 'predictions' && <PredictionEngine />}
          {activeTab === 'parlay' && <ParlayBuilder />}
          {activeTab === 'hedge' && <HedgeCalculator />}
          {activeTab === 'analytics' && <MonteCarloSimulator />}
        </div>
      </div>

      <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">Risk Disclaimer</p>
        <p className="text-xs text-slate-500 max-w-xs">
          Educational tool only. Always bet responsibly. Never wager more than you can afford to lose.
        </p>
      </div>
    </div>
  );
}

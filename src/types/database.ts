export interface BankrollAccount {
  id: string;
  user_id: string;
  total_bankroll: number;
  initial_bankroll: number;
  daily_loss_cap_percent: number;
  weekly_loss_cap_percent: number;
  profit_target_percent: number;
  max_stake_percent: number;
  core_allocation_percent: number;
  hedge_allocation_percent: number;
  variant_allocation_percent: number;
  created_at: string;
  updated_at: string;
}

export interface PredictiveModel {
  id: string;
  user_id: string;
  sport: string;
  model_type: 'poisson' | 'logistic' | 'regression';
  parameters: Record<string, any>;
  accuracy_rate: number;
  edge_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  id: string;
  model_id: string;
  sport: string;
  event_date: string;
  event_description: string;
  prediction_type: 'ML' | 'spread' | 'total' | 'prop';
  team_home: string | null;
  team_away: string | null;
  predicted_outcome: string;
  predicted_probability: number;
  market_odds: number;
  implied_probability: number;
  edge_percent: number;
  is_plus_ev: boolean;
  confidence_score: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ParlayConstruction {
  id: string;
  user_id: string;
  parlay_type: 'sgp' | 'multi_game' | 'round_robin' | 'teaser' | 'progressive';
  total_legs: number;
  combined_odds: number;
  combined_probability: number;
  expected_value: number;
  correlation_score: number;
  narrative: string | null;
  stake_amount: number;
  potential_payout: number;
  status: 'pending' | 'active' | 'won' | 'lost' | 'hedged';
  placed_at: string | null;
  settled_at: string | null;
  actual_return: number;
  created_at: string;
}

export interface ParlayLeg {
  id: string;
  parlay_id: string;
  prediction_id: string | null;
  leg_order: number;
  selection: string;
  odds: number;
  probability: number;
  edge_percent: number;
  correlation_type: 'positive' | 'negative' | 'neutral';
  result: 'pending' | 'won' | 'lost' | 'pushed';
  created_at: string;
}

export interface HedgePosition {
  id: string;
  parlay_id: string;
  hedge_trigger: string;
  legs_hit_count: number;
  current_live_value: number;
  hedge_amount: number;
  hedge_odds: number;
  guaranteed_profit_min: number;
  guaranteed_profit_max: number;
  executed: boolean;
  executed_at: string | null;
  final_outcome: string | null;
  actual_profit: number | null;
  created_at: string;
}

export interface MonteCarloSimulation {
  id: string;
  user_id: string;
  simulation_type: 'bankroll_projection' | 'variance_analysis';
  iterations: number;
  parameters: Record<string, any>;
  results: Record<string, any>;
  ruin_risk_percent: number;
  expected_roi: number;
  confidence_intervals: Record<string, any>;
  created_at: string;
}

export interface PerformanceMetrics {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  total_bets: number;
  total_staked: number;
  total_returned: number;
  net_profit: number;
  roi_percent: number;
  win_rate: number;
  avg_odds: number;
  plus_ev_hit_rate: number;
  best_sport: string | null;
  bankroll_growth: number;
  created_at: string;
}

export interface SportSpecificFactor {
  id: string;
  sport: string;
  factor_type: 'weather' | 'pace' | 'injury' | 'schedule';
  factor_name: string;
  factor_value: Record<string, any>;
  impact_on_prediction: string | null;
  adjustment_multiplier: number;
  created_at: string;
  updated_at: string;
}

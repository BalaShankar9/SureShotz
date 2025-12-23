export interface ParlayLegSelection {
  id: string;
  type: 'ML' | 'spread' | 'total' | 'prop';
  selection: string;
  team?: string;
  line?: number;
  odds: number;
  probability: number;
}

export interface CorrelationAnalysis {
  correlationType: 'positive' | 'negative' | 'neutral';
  correlationStrength: number;
  rationale: string;
  adjustedProbability: number;
  synergy: boolean;
}

export function analyzeCorrelation(
  leg1: ParlayLegSelection,
  leg2: ParlayLegSelection
): CorrelationAnalysis {
  const isSameGame = leg1.team === leg2.team;

  if (!isSameGame) {
    return {
      correlationType: 'neutral',
      correlationStrength: 0,
      rationale: 'Different games - independent outcomes',
      adjustedProbability: leg1.probability * leg2.probability,
      synergy: false
    };
  }

  if (leg1.type === 'ML' && leg2.type === 'spread') {
    return {
      correlationType: 'positive',
      correlationStrength: 0.74,
      rationale: 'Team win strongly correlates with covering spread',
      adjustedProbability: leg1.probability * leg2.probability * 1.15,
      synergy: true
    };
  }

  if (leg1.type === 'ML' && leg2.type === 'total' && leg2.selection.includes('over')) {
    return {
      correlationType: 'positive',
      correlationStrength: 0.65,
      rationale: 'Winning teams often contribute to high-scoring games',
      adjustedProbability: leg1.probability * leg2.probability * 1.1,
      synergy: true
    };
  }

  if (leg1.type === 'spread' && leg2.type === 'total' && leg2.selection.includes('over')) {
    return {
      correlationType: 'positive',
      correlationStrength: 0.55,
      rationale: 'Large spread covers often occur in high-scoring games',
      adjustedProbability: leg1.probability * leg2.probability * 1.08,
      synergy: true
    };
  }

  if (leg1.type === 'ML' && leg2.type === 'total' && leg2.selection.includes('under')) {
    return {
      correlationType: 'negative',
      correlationStrength: -0.3,
      rationale: 'Winning teams may conflict with defensive low-scoring games',
      adjustedProbability: leg1.probability * leg2.probability * 0.92,
      synergy: false
    };
  }

  if (leg1.type === 'prop' && leg2.type === 'ML' && leg1.selection.includes('TD')) {
    return {
      correlationType: 'positive',
      correlationStrength: 0.7,
      rationale: 'Player TDs strongly correlate with team wins',
      adjustedProbability: leg1.probability * leg2.probability * 1.12,
      synergy: true
    };
  }

  if (leg1.type === 'prop' && leg2.type === 'total' && leg2.selection.includes('over')) {
    return {
      correlationType: 'positive',
      correlationStrength: 0.6,
      rationale: 'High player performance correlates with game totals',
      adjustedProbability: leg1.probability * leg2.probability * 1.09,
      synergy: true
    };
  }

  if (leg1.type === 'prop' && leg2.type === 'prop' && leg1.team === leg2.team) {
    return {
      correlationType: 'negative',
      correlationStrength: -0.5,
      rationale: 'Multiple props from same team compete for finite stats',
      adjustedProbability: leg1.probability * leg2.probability * 0.85,
      synergy: false
    };
  }

  return {
    correlationType: 'neutral',
    correlationStrength: 0,
    rationale: 'Weak or unclear correlation',
    adjustedProbability: leg1.probability * leg2.probability,
    synergy: false
  };
}

export function buildCorrelatedParlay(legs: ParlayLegSelection[]): {
  totalProbability: number;
  combinedOdds: number;
  correlationScore: number;
  narrative: string;
  warnings: string[];
} {
  if (legs.length < 2) {
    return {
      totalProbability: legs[0]?.probability || 0,
      combinedOdds: legs[0]?.odds || 1,
      correlationScore: 0,
      narrative: 'Single leg - no correlation',
      warnings: ['Parlays require at least 2 legs']
    };
  }

  let adjustedProbability = 1;
  let correlationScore = 0;
  const narrativeParts: string[] = [];
  const warnings: string[] = [];
  let positiveCorrelations = 0;
  let negativeCorrelations = 0;

  for (let i = 0; i < legs.length; i++) {
    for (let j = i + 1; j < legs.length; j++) {
      const correlation = analyzeCorrelation(legs[i], legs[j]);

      if (correlation.correlationType === 'positive') {
        positiveCorrelations++;
        correlationScore += correlation.correlationStrength;
        narrativeParts.push(correlation.rationale);
      } else if (correlation.correlationType === 'negative') {
        negativeCorrelations++;
        correlationScore += correlation.correlationStrength;
        warnings.push(`${legs[i].selection} and ${legs[j].selection}: ${correlation.rationale}`);
      }
    }
  }

  const baseProb = legs.reduce((acc, leg) => acc * (leg.probability / 100), 1);

  const correlationAdjustment = 1 + (correlationScore * 0.1);
  adjustedProbability = baseProb * correlationAdjustment * 100;

  adjustedProbability = Math.max(1, Math.min(95, adjustedProbability));

  const combinedOdds = legs.reduce((acc, leg) => acc * leg.odds, 1);

  const avgCorrelation = correlationScore / ((legs.length * (legs.length - 1)) / 2);

  let narrative = '';
  if (positiveCorrelations > negativeCorrelations) {
    narrative = `Strong correlated parlay with ${positiveCorrelations} positive synergies. ${narrativeParts.slice(0, 2).join('. ')}.`;
  } else if (negativeCorrelations > positiveCorrelations) {
    narrative = `Parlay contains ${negativeCorrelations} negative correlations. Consider adjusting legs.`;
  } else {
    narrative = 'Mixed correlation parlay - moderate synergy between legs.';
  }

  if (legs.filter(l => l.team === legs[0].team).length === legs.length) {
    warnings.push('All legs from same game/team - high correlation risk');
  }

  return {
    totalProbability: Number(adjustedProbability.toFixed(2)),
    combinedOdds: Number(combinedOdds.toFixed(2)),
    correlationScore: Number(avgCorrelation.toFixed(2)),
    narrative,
    warnings
  };
}

export function generateSGPRecommendations(
  sport: 'NFL' | 'NBA' | 'MLB',
  dominanceNarrative: 'offensive' | 'defensive' | 'balanced'
): string[] {
  const recommendations: string[] = [];

  if (sport === 'NFL') {
    if (dominanceNarrative === 'offensive') {
      recommendations.push('Team ML + Spread Cover + Over Total');
      recommendations.push('QB Passing TDs 2+ + Team ML + Over');
      recommendations.push('Team ML + Player Anytime TD + Over Total');
    } else if (dominanceNarrative === 'defensive') {
      recommendations.push('Team ML + Spread Cover + Under Total');
      recommendations.push('Team ML + Under Total + Opponent Under Passing Yards');
    } else {
      recommendations.push('Team ML + Spread Cover');
      recommendations.push('First Half Spread + Full Game Spread');
    }
  }

  if (sport === 'NBA') {
    if (dominanceNarrative === 'offensive') {
      recommendations.push('Team ML + Over Total + Player Points Over');
      recommendations.push('Team Spread + Over Total + Player Assists Over');
    } else if (dominanceNarrative === 'defensive') {
      recommendations.push('Team ML + Under Total + Player Steals Over');
    } else {
      recommendations.push('Team ML + Spread Cover + Player Rebounds Over');
    }
  }

  if (sport === 'MLB') {
    if (dominanceNarrative === 'offensive') {
      recommendations.push('Team ML + Over Total + Player Home Run');
      recommendations.push('Team ML + Over Total + Team Total Runs Over');
    } else if (dominanceNarrative === 'defensive') {
      recommendations.push('Team ML + Under Total + Pitcher Strikeouts Over');
    }
  }

  return recommendations;
}

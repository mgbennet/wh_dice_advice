import { uwCombatDef } from "../underworlds";

// All possible outcomes of a 1st edition combat
export enum CombatResult1E {
  CritHit = "critical-hit",
  Hit = "hit",
  Draw = "draw",
  Miss = "miss",
}

export interface uw1ECombatDef extends uwCombatDef {
  trapped: boolean;
  attackInnate: number;
  defenderInnate: number;
}

export interface uw1ECombatSim extends uw1ECombatDef {
  simulations: number;
}

// Counts of outcomes for a batch of simulations
export interface simulationResults1E {
  critHits: number;
  hits: number;
  draws: number;
  misses: number;
  numSimulations: number;
}

// Odds for each possibility of a given UWs combat.
// Each number is between 0 and 1.0. success + tie + failure = 1.0
export interface uw1ECombatCalcResult {
  critHit: number;
  hit: number;
  draw: number;
  miss: number;
}

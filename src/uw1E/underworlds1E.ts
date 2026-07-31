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

// Odds for each possibility of a given UWs combat.
// Each number is between 0 and 1.0. success + tie + failure = 1.0
export interface calcResult1E {
  critHits: number;
  hits: number;
  draws: number;
  misses: number;
}

// Counts of outcomes for a batch of simulations
export interface simResults1E extends calcResult1E {
  numSimulations: number;
}

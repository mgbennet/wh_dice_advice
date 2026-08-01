import { changeDiceResults, dicePool, reroll } from "../dice";
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

/**
 * Runs a Monte Carlo simulation of an Underworlds combat.
 */
export function simulateUWAttacks(simulation: uw1ECombatSim): simResults1E {
  // roll the dice
  const results: CombatResult1E[] = [];
  for (let i = 0; i < simulation.simulations; i++) {
    let attackDice = reroll(dicePool(simulation.atkDice), simulation.atkSuccess, simulation.atkRerolls);
    if (simulation.atkHitsToCrit) {
      attackDice = changeDiceResults(
        attackDice,
        n => n >= simulation.atkSuccess && n !== 6,
        6,
        simulation.atkHitsToCrit,
      );
    }
    if (simulation.atkMissesToHits) {
      attackDice = changeDiceResults(
        attackDice,
        n => n < simulation.atkSuccess,
        simulation.atkSuccess,
        simulation.atkMissesToHits,
      );
    }
    const defenseDice = reroll(dicePool(simulation.defDice), simulation.defSuccess, simulation.defRerolls);
    results.push(evaluateCombat(attackDice, simulation.atkSuccess, defenseDice, simulation.defSuccess));
  }

  // summarize the results
  const critHits = results.filter(val => val === CombatResult1E.CritHit).length;
  const hits = results.filter(val => val === CombatResult1E.Hit).length + critHits;
  const misses = results.filter(val => val === CombatResult1E.Miss).length;
  const draws = results.filter(val => val === CombatResult1E.Draw).length;
  return {
    hits,
    misses,
    draws,
    critHits,
    numSimulations: simulation.simulations,
  };
}

/**
 * Given the dice rolls of an attacker and defender and the success requirements, determines
 * the outcome of an attack, for the 1st edition rules of Underworlds. Crits trump regular attacks,
 * and the attacker must roll at least one attack to draw or succeed.
 * @param atkDice Dice rolls of the attacker
 * @param atkSuccess Hit requirement for the attacker
 * @param defDice Dice rolls of the defender
 * @param defSuccess Hit requirement for the defender
 * @returns
 */
function evaluateCombat(
  atkDice: number[],
  atkSuccess: number,
  defDice: number[],
  defSuccess: number,
): CombatResult1E {
  const atkSuccesses = atkDice.reduce((count, d) => d >= atkSuccess ? count + 1 : count, 0);
  const atkCrits = atkDice.reduce((count, d) => d === 6 ? count + 1 : count, 0);
  const defSuccesses = defDice.reduce((count, d) => d >= defSuccess ? count + 1 : count, 0);
  const defCrits = defDice.reduce((count, d) => d === 6 ? count + 1 : count, 0);
  if (atkCrits > defCrits) {
    return CombatResult1E.CritHit;
  } else if (atkCrits < defCrits) {
    return CombatResult1E.Miss;
  } else {
    if (atkSuccesses > defSuccesses) {
      return atkCrits > 0 ? CombatResult1E.CritHit : CombatResult1E.Hit;
    } else if (atkSuccesses < defSuccesses || atkSuccesses === 0) {
      return CombatResult1E.Miss;
    } else {
      return CombatResult1E.Draw;
    }
  }
}

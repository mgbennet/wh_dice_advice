import { changeDiceResults, dicePool, reroll } from "../dice";
import { critProbDist } from "../probCalc";
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
  atkInnates: number;
  defInnates: number;
}

export interface uw1ECombatSim extends uw1ECombatDef {
  simulations: number;
}

export interface uw1ESavedCombat extends uw1ECombatDef {
  label: string;
  pieChart?: d3.Selection<SVGSVGElement, undefined, null, undefined>;
  simulations?: number;
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
    results.push(evaluateCombat(attackDice, defenseDice, simulation));
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
 * @returns The result of the attack
 */
function evaluateCombat(
  atkDice: number[],
  defDice: number[],
  simulation: uw1ECombatSim,
): CombatResult1E {
  let atkSuccesses = atkDice.reduce((count, d) => d >= simulation.atkSuccess ? count + 1 : count, 0);
  const atkCrits = atkDice.reduce((count, d) => d === 6 ? count + 1 : count, 0);
  let defSuccesses = defDice.reduce((count, d) => d >= simulation.defSuccess ? count + 1 : count, 0);
  const defCrits = defDice.reduce((count, d) => d === 6 ? count + 1 : count, 0);
  if (simulation.trapped && atkSuccesses >= 1) {
    atkSuccesses += 1;
  }
  atkSuccesses += simulation.atkInnates;
  defSuccesses += simulation.defInnates;
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

/**
 * Precisly calculates the probable outcomes for an UWs combat.
 * @param combatDef Object containing all parameters of an UWs combat
 * @returns Odds for each possible outcome of the combat
 */
export function calculateUWAttack(combatDef: uw1ECombatDef): calcResult1E {
  const atkCritsOdds = critProbDist(
    combatDef.atkDice,
    combatDef.atkSuccess,
    combatDef.atkRerolls,
    combatDef.atkHitsToCrit,
    combatDef.atkMissesToHits,
  );
  const defCritsOdds = critProbDist(
    combatDef.defDice,
    combatDef.defSuccess,
    combatDef.defRerolls,
    0,
  );
  let critHits = 0, hits = 0, draws = 0, misses = 0;
  for (let atkCrits = 0; atkCrits < atkCritsOdds.length; atkCrits++) {
    for (let atkHits = 0; atkHits < atkCritsOdds[atkCrits].length; atkHits++) {
      for (let defCrits = 0; defCrits < defCritsOdds.length; defCrits++) {
        for (let defHits = 0; defHits < defCritsOdds[defCrits].length; defHits++) {
          const odds = atkCritsOdds[atkCrits][atkHits] * defCritsOdds[defCrits][defHits];
          let atkSuccesses = atkHits + atkCrits + combatDef.atkInnates;
          if (combatDef.trapped && atkHits + atkCrits >= 1) {
            atkSuccesses += 1;
          }
          const defSuccesses = defHits + defCrits + combatDef.defInnates;

          if (atkCrits > defCrits) {
            critHits += odds;
            hits += odds;
          } else if (atkCrits < defCrits) {
            misses += odds;
          } else {
            if (atkSuccesses > defSuccesses) {
              hits += odds;
              if (atkCrits > 0) {
                critHits += odds;
              }
            } else if (atkSuccesses < defSuccesses || atkSuccesses === 0) {
              misses += odds;
            } else {
              draws += odds;
            }
          }
        }
      }
    }
  }

  return {
    critHits,
    hits,
    draws,
    misses,
  };
}

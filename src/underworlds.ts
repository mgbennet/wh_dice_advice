import { changeDiceResults, dicePool, reroll } from "./dice";
import { critProbDist } from "./probCalc";

// All requirements for defining a UWs combat
export interface uwCombatDef {
  atkDice: number;
  atkSuccess: number;
  atkRerolls: number;
  atkCritAbilities: number;
  atkHitsToCrit: number;
  atkMissesToHits: number;
  atkNoCrits?: boolean;
  defDice: number;
  defSuccess: number;
  defRerolls: number;
  defNoCrits?: boolean;
}

export interface uwCombatSim extends uwCombatDef {
  simulations: number;
}

export interface savedCombat extends uwCombatDef {
  label: string;
  pieChart?: d3.Selection<SVGSVGElement, undefined, null, undefined>;
  simulations?: number;
}

// Odds for each possibility of a given UWs combat.
// Each number is between 0 and 1.0. success + tie + failure = 1.0
export interface uwCombatCalcResult {
  success: number;
  successOverrun: number;
  successStandfast: number;
  tie: number;
  tieOverrun: number;
  tieStandfast: number;
  failure: number;
}

// All possibilities results for a UWs combat
export enum CombatWinner {
  Attacker = "attacker",
  Defender = "defender",
  Tie = "tie",
}

// Relevant results of a single UWs combat
export interface uwCombatResult {
  winner: CombatWinner;
  critWinner: CombatWinner;
}

// Counts of outcomes for a batch of simulations
export interface simulationResults {
  attackerWins: {
    count: number;
    attackerCritWins: number;
    defenderCritWins: number;
  };
  defenderWins: {
    count: number;
    attackerCritWins: number;
    defenderCritWins: number;
  };
  ties: {
    count: number;
    attackerCritWins: number;
    defenderCritWins: number;
  };
  numSimulations: number;
}

/**
 * Runs a Monte Carlo simulation of an Underworlds combat.
 */
export function simulateUWAttacks(simulation: uwCombatSim): simulationResults {
  // roll the dice
  const results: uwCombatResult[] = [];
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
    const modifiedDefSuccess = attackDice.indexOf(6) >= 0 && !simulation.atkNoCrits
      ? simulation.defSuccess + simulation.atkCritAbilities
      : simulation.defSuccess;
    const defenseDice = reroll(dicePool(simulation.defDice), modifiedDefSuccess, simulation.defRerolls);
    results.push(evaluateCombat(attackDice, defenseDice, simulation));
  }

  // summarize the results
  const attackerWins = results.filter(val => val.winner === CombatWinner.Attacker);
  const defenderWins = results.filter(val => val.winner === CombatWinner.Defender);
  const ties = results.filter(val => val.winner === CombatWinner.Tie);
  const summary = {
    attackerWins: {
      count: attackerWins.length,
      attackerCritWins: attackerWins.filter(val => val.critWinner === CombatWinner.Attacker).length,
      defenderCritWins: attackerWins.filter(val => val.critWinner === CombatWinner.Defender).length,
    },
    defenderWins: {
      count: defenderWins.length,
      attackerCritWins: defenderWins.filter(val => val.critWinner === CombatWinner.Attacker).length,
      defenderCritWins: defenderWins.filter(val => val.critWinner === CombatWinner.Defender).length,
    },
    ties: {
      count: ties.length,
      attackerCritWins: ties.filter(val => val.critWinner === CombatWinner.Attacker).length,
      defenderCritWins: ties.filter(val => val.critWinner === CombatWinner.Defender).length,
    },
    numSimulations: simulation.simulations,
  };
  return summary;
}

/**
 * Given the dice rolls of a combat and the success requirements, computes the result of the combat.
 * Whichever side rolls more dice above their success target wins. Attack must roll at least one success
 * to earn a tie; if both players roll zero successes the defender wins. Rolling more crits also matters.
 * @param atkDice Dice rolls of the attacker
 * @param atkSuccess Hit requirement of the attacker
 * @param defDice Dice rolls of the defender
 * @param defSuccess Hit requirements of the defender
 * @returns {uwCombatResult} Computed result of the combat
 */
function evaluateCombat(
  atkDice: number[],
  defDice: number[],
  simulation: uwCombatSim,
): uwCombatResult {
  const atkSuccesses = atkDice.reduce((count, d) => d >= simulation.atkSuccess ? count + 1 : count, 0);
  const atkCrits = simulation.atkNoCrits
    ? 0
    : atkDice.reduce((count, d) => d === 6 ? count + 1 : count, 0);
  const modifiedDefSuccess = atkCrits > 0
    ? simulation.defSuccess + simulation.atkCritAbilities
    : simulation.defSuccess;
  const defSuccesses = defDice.reduce((count, d) => d >= modifiedDefSuccess ? count + 1 : count, 0);
  const defCrits = simulation.defNoCrits
    ? 0
    : defDice.reduce((count, d) => d === 6 ? count + 1 : count, 0);
  return {
    winner: atkSuccesses == defSuccesses && atkSuccesses > 0
      ? CombatWinner.Tie
      : atkSuccesses > defSuccesses
        ? CombatWinner.Attacker
        : CombatWinner.Defender,
    critWinner: atkCrits == defCrits
      ? CombatWinner.Tie
      : atkCrits > defCrits
        ? CombatWinner.Attacker
        : CombatWinner.Defender,
  };
}

export function addSimulationResults(
  a: simulationResults,
  b: simulationResults,
): simulationResults {
  return {
    attackerWins: {
      count: a.attackerWins.count + b.attackerWins.count,
      attackerCritWins:
        a.attackerWins.attackerCritWins
        + b.attackerWins.attackerCritWins,
      defenderCritWins:
        a.attackerWins.defenderCritWins
        + b.attackerWins.defenderCritWins,
    },
    defenderWins: {
      count: a.defenderWins.count + b.defenderWins.count,
      attackerCritWins:
        a.defenderWins.attackerCritWins
        + b.defenderWins.attackerCritWins,
      defenderCritWins:
        a.defenderWins.defenderCritWins
        + b.defenderWins.defenderCritWins,
    },
    ties: {
      count: a.ties.count + b.ties.count,
      attackerCritWins:
        a.ties.attackerCritWins + b.ties.attackerCritWins,
      defenderCritWins:
        a.ties.defenderCritWins + b.ties.defenderCritWins,
    },
    numSimulations: a.numSimulations + b.numSimulations,
  };
}

/**
 * Precisly calculates the probable outcomes for an UWs combat.
 * @param combatDef Object containing all parameters of an UWs combat
 * @returns Odds for each possible outcome of the combat
 */
export function calculateUWAttack(combatDef: uwCombatDef): uwCombatCalcResult {
  const attackerCritsOdds = critProbDist(
    combatDef.atkDice,
    combatDef.atkSuccess,
    combatDef.atkRerolls,
    combatDef.atkHitsToCrit,
    combatDef.atkMissesToHits,
  );
  const defenderCritsOdds = critProbDist(
    combatDef.defDice,
    combatDef.defSuccess,
    combatDef.defRerolls,
    0,
  );
  const defenderCritsOddsCritted = critProbDist(
    combatDef.defDice,
    combatDef.defSuccess + combatDef.atkCritAbilities,
    combatDef.defRerolls,
    0,
  );

  let successOdds = 0, tieOdds = 0, failureOdds = 0;
  let successOverrun = 0, successStandfast = 0, tieOverrun = 0, tieStandfast = 0;
  for (let attackCrits = 0; attackCrits < attackerCritsOdds.length; attackCrits++) {
    for (let attackHits = 0; attackHits < attackerCritsOdds[attackCrits].length; attackHits++) {
      const tempAtkCrits = combatDef.atkNoCrits ? 0 : attackCrits;
      const defenderOddsTable = tempAtkCrits < 1 ? defenderCritsOdds : defenderCritsOddsCritted;
      for (let defendCrits = 0; defendCrits < defenderOddsTable.length; defendCrits++) {
        for (let defendHits = 0; defendHits < defenderOddsTable[defendCrits].length; defendHits++) {
          const odds = attackerCritsOdds[attackCrits][attackHits] * defenderOddsTable[defendCrits][defendHits];
          const tempDefCrits = combatDef.defNoCrits ? 0 : defendCrits;
          if (attackCrits + attackHits > defendCrits + defendHits) {
            successOdds += odds;
          } else if (
            attackCrits + attackHits == defendCrits + defendHits
            && attackCrits + attackHits > 0
          ) {
            tieOdds += odds;
          } else {
            failureOdds += odds;
          }
          if (tempAtkCrits > tempDefCrits) {
            if (tempAtkCrits + attackHits > tempDefCrits + defendHits) {
              successOverrun += odds;
            } else if (tempAtkCrits + attackHits === tempDefCrits + defendHits) {
              tieOverrun += odds;
            }
          } else if (tempAtkCrits < tempDefCrits) {
            if (tempAtkCrits + attackHits > tempDefCrits + defendHits) {
              successStandfast += odds;
            } else if (tempAtkCrits + attackHits === tempDefCrits + defendHits) {
              tieStandfast += odds;
            }
          }
        }
      }
    }
  }

  return {
    success: successOdds,
    successOverrun,
    successStandfast,
    tie: tieOdds,
    tieOverrun,
    tieStandfast,
    failure: failureOdds,
  };
}

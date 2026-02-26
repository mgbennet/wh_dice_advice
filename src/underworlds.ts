import { dicePool, reroll } from "./dice";
import { arrayMult, critProbDist, diceProbDist } from "./probCalc";

// All requirements for defining a UWs combat
export interface uwCombatDef {
  atkDice: number;
  atkSuccess: number;
  atkRerolls: number;
  atkHitsToCrit: number;
  atkMissesToHits: number;
  defDice: number;
  defSuccess: number;
  defRerolls: number;
}

export interface uwCombatSim extends uwCombatDef {
  simulations: number;
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
  const results = [];
  for (let i = 0; i < simulation.simulations; i++) {
    const attackDice = reroll(dicePool(simulation.atkDice), simulation.atkSuccess, simulation.atkRerolls);
    if (simulation.atkHitsToCrit) {
      let changedCount = 0;
      for (let i = 0; i < attackDice.length; i++) {
        if (attackDice[i] >= simulation.atkSuccess && attackDice[i] !== 6) {
          attackDice[i] = 6;
          if (++changedCount >= simulation.atkHitsToCrit)
            break;
        }
      }
    }
    if (simulation.atkMissesToHits) {
      let changedCount = 0;
      for (let i = 0; i < attackDice.length; i++) {
        if (attackDice[i] < simulation.atkSuccess) {
          attackDice[i] = simulation.atkSuccess;
          if (++changedCount >= simulation.atkMissesToHits)
            break;
        }
      }
    }
    const defenseDice = reroll(dicePool(simulation.defDice), simulation.defSuccess, simulation.defRerolls);
    results.push(evaluateCombat(attackDice, simulation.atkSuccess, defenseDice, simulation.defSuccess));
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
  atkSuccess: number,
  defDice: number[],
  defSuccess: number,
): uwCombatResult {
  const atkSuccesses = atkDice.reduce((wins, cur) => cur >= atkSuccess ? wins + 1 : wins, 0);
  const atkCrits = atkDice.reduce((wins, cur) => cur === 6 ? wins + 1 : wins, 0);
  const defSuccesses = defDice.reduce((wins, cur) => cur >= defSuccess ? wins + 1 : wins, 0);
  const defCrits = defDice.reduce((wins, cur) => cur === 6 ? wins + 1 : wins, 0);
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

/**
 * Precisly calculates the probable outcomes for an UWs combat.
 * @param combatDef Object containing all parameters of an UWs combat
 * @returns Odds for each possible outcome of the combat
 */
export function calculateUWAttack(combatDef: uwCombatDef): uwCombatCalcResult {
  const attackerOdds = diceProbDist(combatDef.atkDice, combatDef.atkSuccess, combatDef.atkRerolls, combatDef.atkMissesToHits);
  const defenderOdds = diceProbDist(combatDef.defDice, combatDef.defSuccess, combatDef.defRerolls, 0);
  const outcomeOdds = arrayMult(attackerOdds, defenderOdds);
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

  let successOdds = 0, tieOdds = 0, failureOdds = 0;
  for (let attackerHits = 0; attackerHits < outcomeOdds.length; attackerHits++) {
    for (let defenderHits = 0; defenderHits < outcomeOdds[attackerHits].length; defenderHits++) {
      if (attackerHits < defenderHits || attackerHits === 0) {
        failureOdds += outcomeOdds[attackerHits][defenderHits];
      } else if (attackerHits > defenderHits) {
        successOdds += outcomeOdds[attackerHits][defenderHits];
      } else {
        tieOdds += outcomeOdds[attackerHits][defenderHits];
      }
    }
  }

  let successOverrun = 0, successStandfast = 0, tieOverrun = 0, tieStandfast = 0;
  for (let attackCrits = 0; attackCrits < attackerCritsOdds.length; attackCrits++) {
    for (let attackHits = 0; attackHits < attackerCritsOdds[attackCrits].length; attackHits++) {
      for (let defendCrits = 0; defendCrits < defenderCritsOdds.length; defendCrits++) {
        for (let defendHits = 0; defendHits < defenderCritsOdds[defendCrits].length; defendHits++) {
          const odds = attackerCritsOdds[attackCrits][attackHits] * defenderCritsOdds[defendCrits][defendHits];
          if (attackCrits > defendCrits) {
            if (attackCrits + attackHits > defendCrits + defendHits) {
              successOverrun += odds;
            } else if (attackCrits + attackHits === defendCrits + defendHits) {
              tieOverrun += odds;
            }
          } else if (attackCrits < defendCrits) {
            if (attackCrits + attackHits > defendCrits + defendHits) {
              successStandfast += odds;
            } else if (attackCrits + attackHits === defendCrits + defendHits) {
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

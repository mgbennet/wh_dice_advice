import { dicePool, reroll } from "./dice";
import { arrayMult, diceProbDist } from "./probCalc";

// All requirements for defining a UWs combat
export interface uwCombatDef {
  attackerDice: number;
  attackerSuccess: number;
  attackerRerolls: number;
  defenderDice: number;
  defenderSuccess: number;
  defenderRerolls: number;
}

export interface uwCombatSim extends uwCombatDef {
  simulations: number;
}

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

// Relevant results of a UWs combat
export interface uwCombatResult {
  winner: CombatWinner;
  critWinner: CombatWinner;
}

// Counts of outcomes for a batch of simluations
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
 * Does a Monte Carlo simulation of an Underworlds combat.
 */
export function simulateUWAttacks(simulation: uwCombatSim): simulationResults {
  // roll the dice
  const results = [];
  for (let i = 0; i < simulation.simulations; i++) {
    const attackDice = reroll(dicePool(simulation.attackerDice), simulation.attackerSuccess, simulation.attackerRerolls);
    const defenseDice = reroll(dicePool(simulation.defenderDice), simulation.defenderSuccess, simulation.defenderRerolls);
    results.push(evaluateCombat(attackDice, simulation.attackerSuccess, defenseDice, simulation.defenderSuccess));
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
 * @param attackDice Dice rolls of the attacker
 * @param attackSuccess Hit requirement of the attacker
 * @param defenseDice Dice rolls of the defender
 * @param defenseSuccess Hit requirements of the defender
 * @returns {uwCombatResult} Computed result of the combat
 */
function evaluateCombat(attackDice: number[], attackSuccess: number, defenseDice: number[], defenseSuccess: number): uwCombatResult {
  const attackSuccesses = attackDice.reduce((wins, cur) => cur >= attackSuccess ? wins + 1 : wins, 0);
  const attackCrits = attackDice.reduce((wins, cur) => cur === 6 ? wins + 1 : wins, 0);
  const defenseSuccesses = defenseDice.reduce((wins, cur) => cur >= defenseSuccess ? wins + 1 : wins, 0);
  const defenseCrits = defenseDice.reduce((wins, cur) => cur === 6 ? wins + 1 : wins, 0);
  return {
    winner: attackSuccesses == defenseSuccesses && attackSuccesses > 0
      ? CombatWinner.Tie
      : attackSuccesses > defenseSuccesses
        ? CombatWinner.Attacker
        : CombatWinner.Defender,
    critWinner: attackCrits == defenseCrits
      ? CombatWinner.Tie
      : attackCrits > defenseCrits
        ? CombatWinner.Attacker
        : CombatWinner.Defender,
  };
}

export function calculateUWAttack(combatDef: uwCombatDef): uwCombatCalcResult {
  const attackerOdds = diceProbDist(combatDef.attackerDice, combatDef.attackerSuccess);
  const defenderOdds = diceProbDist(combatDef.defenderDice, combatDef.defenderSuccess);
  const outcomeOdds = arrayMult(attackerOdds, defenderOdds);
  
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

  return {
    success: successOdds,
    successOverrun: .204,
    successStandfast: .019,
    tie: tieOdds,
    tieOverrun: .056,
    tieStandfast: .056,
    failure: failureOdds,
  }
}

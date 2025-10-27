import { dicePool, reroll } from './dice';

// All requirements for defining a UWs combat
export interface underworldsMC {
  simulations: number;
  attackerDice: number;
  attackerSuccess: number;
  attackerRerolls: number;
  defenderDice: number;
  defenderSuccess: number;
  defenderRerolls: number;
}

// All possibilities results for a UWs combat
export enum CombatWinner {
  Attacker = 'attacker',
  Defender = 'defender',
  Tie = 'tie',
}

// Relevent results of a UWs combat
export interface uwCombatResult {
  winner: CombatWinner;
  critWinner: CombatWinner;
}

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

export function simulateUWAttacks(simulation: underworldsMC): simulationResults {
  // roll the dice
  let results = [];
  for (let i = 0; i < simulation.simulations; i++) {
    let attackDice = reroll(dicePool(simulation.attackerDice), simulation.attackerSuccess, simulation.attackerRerolls);
    let defenseDice = reroll(dicePool(simulation.defenderDice), simulation.defenderSuccess, simulation.defenderRerolls);
    results.push(evaluateCombat(attackDice, simulation.attackerSuccess, defenseDice, simulation.defenderSuccess));
  }

  // summarize the results
  const attackerWins = results.filter((val) => val.winner === CombatWinner.Attacker);
  const defenderWins = results.filter((val) => val.winner === CombatWinner.Defender);
  const ties = results.filter((val) => val.winner === CombatWinner.Tie);
  let summary = {
    attackerWins: {
      count: attackerWins.length,
      attackerCritWins: attackerWins.filter((val) => val.critWinner === CombatWinner.Attacker).length,
      defenderCritWins: attackerWins.filter((val) => val.critWinner === CombatWinner.Defender).length,
    },
    defenderWins: {
      count: defenderWins.length,
      attackerCritWins: defenderWins.filter((val) => val.critWinner === CombatWinner.Attacker).length,
      defenderCritWins: defenderWins.filter((val) => val.critWinner === CombatWinner.Defender).length,
    },
    ties: {
      count: ties.length,
      attackerCritWins: ties.filter((val) => val.critWinner === CombatWinner.Attacker).length,
      defenderCritWins: ties.filter((val) => val.critWinner === CombatWinner.Defender).length,
    },
    numSimulations: simulation.simulations
  }
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
  }
}

import { dicePool, reroll } from './dice';

export interface underworldsMC {
  simulations: number;
  attackerDice: number;
  attackerSuccess: number;
  attackerRerolls: number;
  defenderDice: number;
  defenderSuccess: number;
  defenderRerolls: number;
}

export enum CombatWinner {
  Attacker = 'attacker',
  Defender = 'defender',
  Tie = 'tie',
}

export interface uwCombatResult {
  winner: CombatWinner;
  critWinner: CombatWinner;
}

export function simulateUWAttacks(simulation: underworldsMC) {
  // roll the dice
  let results = [];
  for (let i = 0; i < simulation.simulations; i++) {
    let attackDice = reroll(dicePool(simulation.attackerDice), simulation.attackerSuccess, simulation.attackerRerolls);
    let defenseDice = reroll(dicePool(simulation.defenderDice), simulation.defenderSuccess, simulation.defenderRerolls);
    results.push(evaluateAttack(attackDice, simulation.attackerSuccess, defenseDice, simulation.defenderSuccess));
  }
  
  // summarize the results
  const attackerWins = results.filter((val) => val.winner === CombatWinner.Attacker);
  const defenderWins = results.filter((val) => val.winner === CombatWinner.Defender);
  const ties = results.filter((val) => val.winner === CombatWinner.Tie);
  let summary = {
    attackerWins: attackerWins.length,
    defenderWins: defenderWins.length,
    ties: ties.length,
    numSimulations: simulation.simulations
  }
  return summary;
}

function evaluateAttack(attackDice: number[], attackSuccess: number, defenseDice: number[], defenseSuccess: number): uwCombatResult {
  const attackSuccesses = attackDice.reduce((wins, cur) => cur >= attackSuccess ? wins + 1 : 0, 0);
  const attackCrits = attackDice.reduce((wins, cur) => cur === 6 ? wins + 1 : 0, 0);
  const defenseSuccesses = defenseDice.reduce((wins, cur) => cur >= defenseSuccess ? wins + 1 : 0, 0);
  const defenseCrits = defenseDice.reduce((wins, cur) => cur === 6 ? wins + 1 : 0, 0);
  return {
    winner: attackSuccesses == defenseSuccesses
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

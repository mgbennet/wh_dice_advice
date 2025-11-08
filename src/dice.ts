/**
 * Simulates a roll of a six-sided die (d6).
 * @returns {number} A random number between 1 and 6.
 */
export function d6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Rolls a specified number of d6s and returns the results in an array.
 * @param numDice The number of dice to roll.
 * @returns {number[]} An array of the dice roll results.
 */
export function dicePool(numDice: number): number[] {
  return Array.from({ length: numDice }, () => d6());
}

/**
 * Given a dice pool, uses a specified number of rerolls to try and improve results.
 * Dice that have been re rolled cannot be rerolled again.
 * @param dicePool A dice pool to be given rerolls. Un-ordered.
 * @param successTarget Successful result for a roll. Results equal or above will no be rerolled.
 * @param rerolls How many rerolls can be used.
 * @returns {number[]} The dice pool after rerolls have been done.
 */
export function reroll(dicePool: number[], successTarget: number, rerolls: number): number[] {
  const rerolledPool: number[] = [];
  let usedRerolls = 0;
  for (let i = 0; i < dicePool.length; i++) {
    if (dicePool[i] < successTarget && usedRerolls < rerolls) {
      usedRerolls++;
      rerolledPool.push(d6());
    } else {
      rerolledPool.push(dicePool[i]);
    }
  }
  return rerolledPool;
}

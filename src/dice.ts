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
 * Dice that have been rerolled cannot be rerolled again.
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

/**
 * Given a pool of dice, makes conditional changes to the results. Useful for rules that
 * let you change the results of dice after they have been rolled, like "You may change a
 * success to a critical success".
 * @param dicePool The dice pool to be checked and changed.
 * @param condition A function run against each dice result. If true, makes the change.
 * @param changeTo The result that the dice should be changed to.
 * @param numChanges The maximum number of changes that can be made.
 * @returns {number[]} A copy of the dice pool with any changes allowed
 */
export function changeDiceResults(
  dicePool: number[],
  condition: (n: number) => boolean,
  changeTo: number,
  numChanges: number,
) {
  let changedCount = 0;
  const newPool = dicePool.slice();
  for (let d = 0; d < dicePool.length; d++) {
    if (condition(dicePool[d])) {
      newPool[d] = changeTo;
      if (++changedCount >= numChanges)
        break;
    }
  }
  return newPool;
};

/**
 * The probability mass function. Given t trials with p probability of success,
 * returns the odds of getting s successes.
 * For example, to calculate the odds of getting 3 successes on 4 dice hitting on
 * a 4+, call binomialProbability(4, .5, 3)
 * @param t Number of trials
 * @param p Probability of success, from 0 to 1.0
 * @param s The target number of successes to get
 * @returns {number} The calculated odds
 */
export function binomialProbability(t: number, p: number, s: number): number {
  return fact(t) / (fact(s) * fact(t - s)) * p ** s * (1 - p) ** (t - s);
}

/**
 * The probability mass function for multiple events. Calculated the probability of
 * a specific spread of outcomes.
 * For example, to calculate the odds of getting 2 success and 1 crit on 4 dice hitting
 * on a 4+, call multinomialProbability([1, 2, 1], [(1/6), (2/6), (3/6)])
 * @param probs Probabilities of each outcome possibility. Should add up to 1.0
 * @param events Number of events for each outcome possibility.
 * @returns {number} The calculated odds of these outcomes occuring
 */
export function multinomialProbability(probs: number[], events: number[]): number {
  if (probs.length !== events.length) {
    throw new Error("multinomialProbability: probs and events must be arrays of the same length");
  }
  const total = events.reduce((prev, cur) => prev + cur);
  const factorialSide = fact(total) / (events.reduce((prev, cur) => prev * fact(cur || 1), 1));
  const oddsSide = probs.reduce((prev, cur, curInd) => prev * cur ** events[curInd], 1);
  return factorialSide * oddsSide;
}

// factorial function
export function fact(n: number): number {
  return n > 1 ? n * fact(n - 1) : 1;
}

/**
 * Calculates the odds for each possible outcome from rolling n dice and trying to get
 * target or higher, rerolling misses once up to rerolls times.
 * @param n Number of dice
 * @param target Success target, out of 6
 * @param rerolls Number of rerolls. No rerolling rerolled dice
 * @returns {number[]} Array of odds for each possible outcome
 */
export function diceProbDist(n: number, target: number, rerolls: number = 0): number[] {
  let result: number[] = [];
  for (let i = 0; i <= n; i++) {
    result.push(binomialProbability(n, (7 - target) / 6, i));
  }
  if (rerolls > 0) {
    const rerolledResult = new Array(result.length).fill(0);
    for (let i = 0; i < result.length; i++) {
      const rerollDist = diceProbDist(Math.min(rerolls, result.length - i - 1), target, 0);
      rerollDist.forEach((val, j) => {
        rerolledResult[i + j] = rerolledResult[i + j] + result[i] * val;
      });
    }
    result = rerolledResult;
  }
  return result;
}

/**
 * Calculates the odds of each possible outcome of rolling n dice and trying to get
 * target or higher, rerolling misses once up to rerolls times. Gives a break down of
 * the number of crits vs the number of regular hits.
 * @param n Number of dice
 * @param target Success target, out of 6
 * @param rerolls Number of rerolls. No rerolling rerolled dice.
 * @param hitsToCrits Can a normal hit be changed to a crit
 * @returns {number[][]} Trianglular shaped matrix of odds for each combination of crits, hits,
 * and misses. x axis is number of crits, y is number of hits.
 */
export function critProbDist(n: number, target: number, rerolls = 0, hitsToCrits = 0): number[][] {
  let result: number[][] = [];
  const regHitOdds = (6 - target) / 6;
  for (let crits = 0; crits <= n; crits++) {
    result.push([]);
    for (let hits = 0; hits <= n - crits; hits++) {
      result[crits].push(
        multinomialProbability(
          [1 / 6, regHitOdds, 1 - regHitOdds - 1 / 6],
          [crits, hits, n - crits - hits],
        ),
      );
    }
  }
  if (rerolls > 0) {
    const rerolledResult = new Array(result.length).fill([]);
    result.forEach((row, i) => rerolledResult[i] = (new Array(row.length).fill(0)));
    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < result[i].length; j++) {
        const rerollDist = critProbDist(Math.min(rerolls, result.length - j - i - 1), target, 0);
        rerollDist.forEach((rerollRow, r_i) => {
          rerollRow.forEach((val, r_j) => {
            rerolledResult[i + r_i][j + r_j] = rerolledResult[i + r_i][j + r_j] + result[i][j] * val;
          });
        });
      }
    }
    result = rerolledResult;
  }
  if (hitsToCrits) {
    for (let critI = result.length - 2; critI >= 0; critI--) {
      for (let hitI = 1; hitI < result[critI].length; hitI++) {
        const shiftBy = Math.min(hitsToCrits, hitI);
        result[critI + shiftBy][hitI - shiftBy] += result[critI][hitI];
        result[critI][hitI] = 0;
      }
    }
  }
  return result;
}

/**
 * Does matrix multiplication between two arrays.
 */
export function arrayMult(arr1: number[], arr2: number[]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < arr1.length; i++) {
    result.push([]);
    for (let j = 0; j < arr2.length; j++) {
      result[i].push(arr1[i] * arr2[j]);
    }
  }
  return result;
}

/**
 * The probability mass function. Given t trials with p probability of success,
 * returns the odds of getting s successes.
 * @param t Number of trials
 * @param p Probability of success, from 0 to 1.0
 * @param s The target number of successes to get
 * @returns {number} The calculated odds
 */
export function binomialProbability(t: number, p: number, s: number): number {
  return factorial(t) / (factorial(s)*factorial(t - s)) * p**s * (1 - p)**(t - s); 
}

export function multinomialProbability(probs: number[], events: number[]): number {
  if (probs.length !== events.length) {
    throw new Error("multinomialProbability: probs and events must be arrays of the same length");
  }
  const total = events.reduce((prev, cur) => prev + cur);
  const factorialSide = factorial(total) / (events.reduce((prev, cur) => prev*factorial(cur || 1), 1));
  const oddsSide = probs.reduce((prev, cur, curInd) => prev * cur**events[curInd], 1);
  return factorialSide * oddsSide;
}

export function factorial(n: number): number {
  return n > 1 ? n * factorial(n - 1) : 1;
}

export function diceProbDist(n: number, target: number, rerolls: number): number[] {
  let result = [];
  for (let i = 0; i <= n; i++) {
    result.push(binomialProbability(n, (7 - target) / 6, i));
  }
  return result;
}

export function critProbDist(n: number, target: number): number[][] {
  let result: number[][] = [];
  const regHitOdds = (6 - target) / 6
  for (let crits = 0; crits <= n; crits++) {
    result.push([]);
    for (let hits = 0; hits <= n - crits; hits++) {
      result[crits].push(multinomialProbability([1/6, regHitOdds, 1 - regHitOdds - 1/6], [crits, hits, n - crits - hits]));
    }
  }
  return result;
}

/**
 * Does matrix multiplication between two arrays.
 */
export function arrayMult(arr1: number[], arr2: number[]): number[][] {
  let result: number[][] = [];
  for (let i = 0; i < arr1.length; i++) {
    result.push([]);
    for (let j = 0; j < arr2.length; j++) {
      result[i].push(arr1[i] * arr2[j]);
    }
  }
  return result;
}

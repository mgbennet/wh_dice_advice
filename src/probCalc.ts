/**
 * The probability mass function. Given t trials with p probability of success,
 * returns the odds of getting s successes.
 * @param t Number of trials
 * @param p Probability of success, from 0 to 1.0
 * @param s The target number of successes to get
 * @returns {number} The calculated odds
 */
export function probability(t: number, p: number, s: number): number {
  return factorial(t) / (factorial(s)*factorial(t - s)) * p**s * (1 - p)**(t - s); 
}

export function factorial(n: number): number {
    return n > 1 ? n * factorial(n - 1) : 1;
}

export function diceProbDist(n: number, target: number): number[] {
    let result = [];
    for (let i = 0; i <= n; i++) {
        result.push(probability(n, (7 - target) / 6, i));
    }
    return result;
}

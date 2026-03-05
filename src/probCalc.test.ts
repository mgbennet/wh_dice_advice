import { expect, test } from "vitest";
import * as pc from "./probCalc";

test("binomialProbability", () => {
  expect(pc.binomialProbability(4, 0.5, 3)).toBe(0.25);
  expect(pc.binomialProbability(4, 1.0, 1)).toBe(0.0);
  expect(pc.binomialProbability(4, 1.0, 4)).toBe(1.0);
});

test("diceProbDist", () => {
  expect(pc.diceProbDist(2, 4, 0)).toEqual([0.25, 0.5, 0.25]);
  expect(pc.diceProbDist(3, 4, 0)).toEqual([0.125, 0.375, 0.375, 0.125]);
  expect(pc.diceProbDist(2, 1, 0)).toEqual([0.0, 0.0, 1.0]);
  expect(pc.diceProbDist(2, 6, 0)).toAlmostEqualArray([
    ((5 / 6) * (5 / 6)),
    ((5 / 6) * (1 / 6)) * 2,
    ((1 / 6) * (1 / 6)),
  ], 0.00000001);
  expect(pc.diceProbDist(2, 7, 0)).toEqual([1.0, 0.0, 0.0]);
  expect(pc.diceProbDist(2, 7, 2)).toEqual([1.0, 0.0, 0.0]);

  expect(pc.diceProbDist(2, 4, 1)).toEqual([0.125, 0.375, 0.5]);
  expect(pc.diceProbDist(2, 4, 2)).toEqual([0.0625, 0.375, 0.5625]);
  expect(pc.diceProbDist(2, 4, 3)).toEqual([0.0625, 0.375, 0.5625]);

  expect(pc.diceProbDist(2, 4, 0, 1)).toEqual([0.0, 0.25, 0.75]);
  expect(pc.diceProbDist(2, 4, 0, 2)).toEqual([0.0, 0.0, 1.0]);
  expect(pc.diceProbDist(2, 4, 0, 3)).toEqual([0.0, 0.0, 1.0]);
});

test("critProbDist", () => {
  // helper function for running toAlmostEqualArray on an array of arrays
  const critProbTest = (result: number[][], expected: number[][]) => {
    expect(result.length).toEqual(expected.length);
    for (const i in result) {
      expect(result[i]).toAlmostEqualArray(expected[i], 0.00000001);
    }
  };
  critProbTest(pc.critProbDist(2, 4, 0), [
    [(1 / 4), (1 / 3), (1 / 9)],
    [(1 / 6), (1 / 9)],
    [(1 / 36)],
  ]);
  critProbTest(pc.critProbDist(2, 4, 1), [
    [(1 / 8), (1 / 4), (2 / 9)],
    [(1 / 8), (2 / 9)],
    [(1 / 18)],
  ]);

  critProbTest(pc.critProbDist(2, 4, 0, 1), [
    [(1 / 4), 0, 0],
    [(1 / 6 + 1 / 3), (1 / 9)],
    [(1 / 36 + 1 / 9)],
  ]);
  critProbTest(pc.critProbDist(2, 4, 0, 2), [
    [(1 / 4), 0, 0],
    [(1 / 6 + 1 / 3), 0],
    [(1 / 36 + 2 / 9)],
  ]);
  critProbTest(pc.critProbDist(2, 4, 0, 3), [
    [(1 / 4), 0, 0],
    [(1 / 6 + 1 / 3), 0],
    [(1 / 36 + 2 / 9)],
  ]);

  critProbTest(pc.critProbDist(2, 4, 0, 0, 1), [
    [0, (1 / 4), (4 / 9)],
    [0, (5 / 18)],
    [(1 / 36)],
  ]);
  critProbTest(pc.critProbDist(2, 4, 0, 0, 2), [
    [0, 0, (25 / 36)],
    [0, (5 / 18)],
    [(1 / 36)],
  ]);
  critProbTest(pc.critProbDist(2, 4, 0, 0, 3), [
    [0, 0, (25 / 36)],
    [0, (5 / 18)],
    [(1 / 36)],
  ]);

  critProbTest(pc.critProbDist(2, 4, 0, 1, 1), [
    [0, (1 / 4), 0],
    [0, (11 / 18)],
    [(5 / 36)],
  ]);

  critProbTest(pc.critProbDist(2, 7, 0, 0, 0), [
    [1.0, 0, 0],
    [0, 0],
    [0],
  ]);
  critProbTest(pc.critProbDist(2, 7, 1, 1, 0), [
    [1.0, 0, 0],
    [0, 0],
    [0],
  ]);
  critProbTest(pc.critProbDist(2, 7, 1, 0, 1), [
    [0, 1.0, 0],
    [0, 0],
    [0],
  ]);
});

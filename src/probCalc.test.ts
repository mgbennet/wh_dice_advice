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
  ], 0.000001);

  expect(pc.diceProbDist(2, 4, 1)).toEqual([0.125, 0.375, 0.5]);
  expect(pc.diceProbDist(2, 4, 2)).toEqual([0.0625, 0.375, 0.5625]);
  expect(pc.diceProbDist(2, 4, 3)).toEqual([0.0625, 0.375, 0.5625]);

  expect(pc.diceProbDist(2, 4, 0, 1)).toEqual([0.0, 0.25, 0.75]);
  expect(pc.diceProbDist(2, 4, 0, 2)).toEqual([0.0, 0.0, 1.0]);
  expect(pc.diceProbDist(2, 4, 0, 3)).toEqual([0.0, 0.0, 1.0]);
});

test("critProbDist", () => {
  const probs = pc.critProbDist(2, 4, 0);
  const expected = [
    [0.25, (1 / 3), (1 / 9)],
    [(1 / 6), (1 / 9)],
    [(1 / 36)],
  ];
  for (let i = 0; i < probs.length; i++) {
    expect(probs[i]).toAlmostEqualArray(expected[i], 0.00000001);
  }
});

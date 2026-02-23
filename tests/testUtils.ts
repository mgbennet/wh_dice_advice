import { expect } from "vitest";

expect.extend({
  toAlmostEqualArray: (received: number[], expected: number[], epislon = 0.000005) => {
    if (received.length !== expected.length) {
      return {
        pass: false,
        message: () =>
          `Array lengths differ: ${received.length} !== ${expected.length}`,
      };
    }
    for (let i = 0; i < received.length; i++) {
      if (Math.abs(received[i] - expected[i]) > epislon) {
        return {
          pass: false,
          message: () =>
            `Arrays differ at index ${i}: ${received[i]} !== ${expected[i]} (ε=${epislon})\nRecieved array: ${received}\nExpected array: ${expected}`,
        };
      }
    }

    return {
      pass: true,
      message: () => "Arrays are almost equal",
    };
  },
});

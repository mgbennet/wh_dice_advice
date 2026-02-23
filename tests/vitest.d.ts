import "vitest";

interface CustomMatchers<R = unknown> {
  toAlmostEqualArray: (arr: number[], epsilon?: number) => R;
}

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

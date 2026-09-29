import { describe, it, expect } from "vitest";
import {
  equalSplits,
  exactSplits,
  percentSplits,
  calculateSplits,
} from "../src/services/splits.js";
import { simplifyDebts } from "../src/services/debtSimplifier.js";
import { computeBalances } from "../src/services/balances.js";
describe("split calculations", () => {
  it("assigns equal remainders by user id", () =>
    expect(equalSplits(10000, [3, 1, 2])).toEqual([
      { userId: 1, sharePaise: 3334 },
      { userId: 2, sharePaise: 3333 },
      { userId: 3, sharePaise: 3333 },
    ]));
  it("rejects invalid exact total", () =>
    expect(() => exactSplits(100, [{ userId: 1, sharePaise: 99 }])).toThrow());
  it("allocates percent rounding", () =>
    expect(
      percentSplits(101, [
        { userId: 2, percent: 50 },
        { userId: 1, percent: 50 },
      ]).reduce((a, s) => a + s.sharePaise, 0),
    ).toBe(101));
});
describe("equal split rounding", () => {
  const total = (splits) => splits.reduce((sum, s) => sum + s.sharePaise, 0);

  it("splits evenly when the amount divides without remainder", () =>
    expect(equalSplits(900, [1, 2, 3])).toEqual([
      { userId: 1, sharePaise: 300 },
      { userId: 2, sharePaise: 300 },
      { userId: 3, sharePaise: 300 },
    ]));

  it("gives leftover paise to the lowest user ids", () =>
    expect(equalSplits(100, [5, 2, 1])).toEqual([
      { userId: 1, sharePaise: 34 },
      { userId: 2, sharePaise: 33 },
      { userId: 5, sharePaise: 33 },
    ]));

  it("returns the full amount to a single participant", () =>
    expect(equalSplits(500, [7])).toEqual([{ userId: 7, sharePaise: 500 }]));

  it("is independent of participant order", () =>
    expect(equalSplits(10000, [3, 1, 2])).toEqual(
      equalSplits(10000, [2, 3, 1]),
    ));

  it("preserves the exact total when the amount does not divide evenly", () => {
    for (const amount of [1, 7, 99, 101, 999, 100000, 999999])
      for (const size of [2, 3, 7, 11]) {
        const userIds = Array.from({ length: size }, (_, i) => i + 1);
        expect(total(equalSplits(amount, userIds))).toBe(amount);
      }
  });

  it("rejects an amount that is not a positive integer", () => {
    expect(() => equalSplits(0, [1, 2])).toThrow();
    expect(() => equalSplits(-100, [1, 2])).toThrow();
    expect(() => equalSplits(10.5, [1, 2])).toThrow();
  });

  it("rejects an empty participant list", () =>
    expect(() => equalSplits(100, [])).toThrow());
});
describe("exact and percent split validation", () => {
  const total = (splits) => splits.reduce((sum, s) => sum + s.sharePaise, 0);

  it("accepts exact shares that total the amount", () =>
    expect(
      exactSplits(100, [
        { userId: 1, sharePaise: 60 },
        { userId: 2, sharePaise: 40 },
      ]),
    ).toEqual([
      { userId: 1, sharePaise: 60 },
      { userId: 2, sharePaise: 40 },
    ]));

  it("rejects exact shares that exceed the amount", () =>
    expect(() =>
      exactSplits(100, [
        { userId: 1, sharePaise: 70 },
        { userId: 2, sharePaise: 40 },
      ]),
    ).toThrow());

  it("rejects a negative exact share", () =>
    expect(() =>
      exactSplits(100, [
        { userId: 1, sharePaise: 120 },
        { userId: 2, sharePaise: -20 },
      ]),
    ).toThrow());

  it("rejects a non-integer exact share", () =>
    expect(() => exactSplits(100, [{ userId: 1, sharePaise: 99.5 }])).toThrow());

  it("rejects an empty exact participant list", () =>
    expect(() => exactSplits(100, [])).toThrow());

  it("does not mutate the caller exact split objects", () => {
    const input = [{ userId: 1, sharePaise: 100 }];
    exactSplits(100, input)[0].sharePaise = 0;
    expect(input[0].sharePaise).toBe(100);
  });

  it("accepts percentages that total 100", () =>
    expect(
      percentSplits(1000, [
        { userId: 1, percent: 60 },
        { userId: 2, percent: 40 },
      ]),
    ).toEqual([
      { userId: 1, percent: 60, sharePaise: 600 },
      { userId: 2, percent: 40, sharePaise: 400 },
    ]));

  it("rejects percentages totalling more than 100", () =>
    expect(() =>
      percentSplits(100, [
        { userId: 1, percent: 60 },
        { userId: 2, percent: 41 },
      ]),
    ).toThrow());

  it("rejects percentages totalling less than 100", () =>
    expect(() =>
      percentSplits(100, [
        { userId: 1, percent: 60 },
        { userId: 2, percent: 39 },
      ]),
    ).toThrow());

  it("rejects a negative percentage", () =>
    expect(() =>
      percentSplits(100, [
        { userId: 1, percent: 120 },
        { userId: 2, percent: -20 },
      ]),
    ).toThrow());

  it("rejects a non-integer percentage", () =>
    expect(() =>
      percentSplits(100, [
        { userId: 1, percent: 33.33 },
        { userId: 2, percent: 66.67 },
      ]),
    ).toThrow());

  it("rejects an empty percent participant list", () =>
    expect(() => percentSplits(100, [])).toThrow());

  it("gives leftover percent paise to the lowest user id", () =>
    expect(
      percentSplits(10001, [
        { userId: 3, percent: 34 },
        { userId: 1, percent: 33 },
        { userId: 2, percent: 33 },
      ]),
    ).toEqual([
      { userId: 1, percent: 33, sharePaise: 3301 },
      { userId: 2, percent: 33, sharePaise: 3300 },
      { userId: 3, percent: 34, sharePaise: 3400 },
    ]));

  it("preserves the exact total after percent rounding", () => {
    for (const amount of [1, 7, 99, 101, 999, 100000, 999999])
      expect(
        total(
          percentSplits(amount, [
            { userId: 1, percent: 34 },
            { userId: 2, percent: 33 },
            { userId: 3, percent: 33 },
          ]),
        ),
      ).toBe(amount);
  });
});

describe("calculateSplits dispatch", () => {
  it("routes equal splits through the equal calculator", () =>
    expect(
      calculateSplits(100, "EQUAL", [{ userId: 1 }, { userId: 2 }]),
    ).toEqual([
      { userId: 1, sharePaise: 50 },
      { userId: 2, sharePaise: 50 },
    ]));

  it("routes exact splits through the exact calculator", () =>
    expect(
      calculateSplits(100, "EXACT", [
        { userId: 1, sharePaise: 60 },
        { userId: 2, sharePaise: 40 },
      ]),
    ).toEqual([
      { userId: 1, sharePaise: 60 },
      { userId: 2, sharePaise: 40 },
    ]));

  it("routes percent splits through the percent calculator", () =>
    expect(
      calculateSplits(100, "PERCENT", [
        { userId: 1, percent: 60 },
        { userId: 2, percent: 40 },
      ]),
    ).toEqual([
      { userId: 1, percent: 60, sharePaise: 60 },
      { userId: 2, percent: 40, sharePaise: 40 },
    ]));

  it("rejects an unknown split type", () =>
    expect(() => calculateSplits(100, "RATIO", [{ userId: 1 }])).toThrow());
});

describe("debts and balances", () => {
  it("is deterministic and settles in n-1 transactions", () =>
    expect(simplifyDebts({ 1: -50, 2: -50, 3: 100 })).toEqual([
      { from: 1, to: 3, amount: 50 },
      { from: 2, to: 3, amount: 50 },
    ]));
  it("preserves sum-zero invariant", () => {
    const b = computeBalances(
      [{ userId: 1 }, { userId: 2 }],
      [
        {
          paidById: 1,
          amountPaise: 100,
          splits: [
            { userId: 1, sharePaise: 50 },
            { userId: 2, sharePaise: 50 },
          ],
        },
      ],
      [],
    );
    expect(b).toEqual({ 1: 50, 2: -50 });
  });
});

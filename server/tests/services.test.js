import { describe, it, expect } from "vitest";
import {
  equalSplits,
  exactSplits,
  percentSplits,
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

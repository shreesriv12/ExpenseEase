import { describe, expect, it, vi, beforeEach } from "vitest";
const prisma = {
  groupMember: { findUnique: vi.fn(), findMany: vi.fn() },
  expense: { findMany: vi.fn() },
  settlement: { findMany: vi.fn() },
};
vi.mock("../src/config/prisma.js", () => ({ prisma }));
const data = await import("../src/services/groupData.js");
beforeEach(() => vi.resetAllMocks());
describe("persisted balance view", () => {
  it("returns balances and simplified transfers", async () => {
    prisma.groupMember.findUnique.mockResolvedValue({ role: "MEMBER" });
    prisma.groupMember.findMany.mockResolvedValue([
      { userId: 1, user: { id: 1, name: "A" } },
      { userId: 2, user: { id: 2, name: "B" } },
    ]);
    prisma.expense.findMany.mockResolvedValue([
      {
        paidById: 1,
        amountPaise: 100,
        splits: [
          { userId: 1, sharePaise: 50 },
          { userId: 2, sharePaise: 50 },
        ],
      },
    ]);
    prisma.settlement.findMany.mockResolvedValue([]);
    const result = await data.balances(1, 1);
    expect(result.members.map((m) => m.netPaise)).toEqual([50, -50]);
    expect(result.simplifiedSettlements).toEqual([
      { from: 2, to: 1, amount: 50 },
    ]);
  });
});

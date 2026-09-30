import { prisma } from "../config/prisma.js";
import { requireMembership } from "./groups.js";
import { computeBalances, simplifyDebts } from "./balances.js";
const fail = (status, code, message) =>
  Object.assign(new Error(message), { status, code });
async function records(groupId, userId) {
  await requireMembership(groupId, userId);
  const [members, expenses, settlements] = await Promise.all([
    prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.expense.findMany({ where: { groupId }, include: { splits: true } }),
    prisma.settlement.findMany({ where: { groupId } }),
  ]);
  return { members, expenses, settlements };
}
export async function balances(groupId, userId) {
  const data = await records(groupId, userId);
  const net = computeBalances(data.members, data.expenses, data.settlements);
  return {
    members: data.members.map((member) => ({
      user: member.user,
      role: member.role,
      netPaise: net[member.userId],
    })),
    simplifiedSettlements: simplifyDebts(net),
  };
}
export async function createSettlement(groupId, actorId, data) {
  await requireMembership(groupId, actorId);
  if (data.fromUserId === data.toUserId)
    throw fail(400, "VALIDATION_ERROR", "Settlement users must differ");
  const members = await prisma.groupMember.findMany({
    where: { groupId, userId: { in: [data.fromUserId, data.toUserId] } },
  });
  if (members.length !== 2)
    throw fail(400, "INVALID_MEMBER", "Settlement users must be group members");
  return prisma.$transaction(async (tx) => {
    const settlement = await tx.settlement.create({
      data: { groupId, ...data },
    });
    await tx.activity.create({
      data: {
        groupId,
        actorId,
        type: "SETTLEMENT_RECORDED",
        message: "Recorded settlement",
      },
    });
    return settlement;
  });
}
export async function activity(groupId, userId) {
  await requireMembership(groupId, userId);
  return prisma.activity.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
  });
}
export async function dashboard(userId) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });
  const totals = await Promise.all(
    memberships.map(async (item) => {
      const value = await balances(item.groupId, userId);
      return value.members.find((member) => member.user.id === userId).netPaise;
    }),
  );
  return {
    youOwePaise: totals.filter((n) => n < 0).reduce((sum, n) => sum - n, 0),
    youAreOwedPaise: totals.filter((n) => n > 0).reduce((sum, n) => sum + n, 0),
  };
}

import { prisma } from "../config/prisma.js";
import { calculateSplits } from "./splits.js";
import { requireMembership } from "./groups.js";
const fail = (status, code, message) =>
  Object.assign(new Error(message), { status, code });
async function people(groupId, paidById, participants) {
  const ids = [...new Set([paidById, ...participants.map((p) => p.userId)])];
  const rows = await prisma.groupMember.findMany({
    where: { groupId, userId: { in: ids } },
  });
  if (rows.length !== ids.length)
    throw fail(
      400,
      "INVALID_MEMBER",
      "Payer and participants must be group members",
    );
}
async function access(id, userId) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw fail(404, "NOT_FOUND", "Expense not found");
  return {
    expense,
    membership: await requireMembership(expense.groupId, userId),
  };
}
export async function listExpenses(groupId, userId) {
  await requireMembership(groupId, userId);
  return prisma.expense.findMany({
    where: { groupId },
    include: {
      splits: true,
      paidBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { date: "desc" },
  });
}
export async function createExpense(groupId, userId, data) {
  await requireMembership(groupId, userId);
  await people(groupId, data.paidById, data.participants);
  const splits = calculateSplits(
    data.amountPaise,
    data.splitType,
    data.participants,
  );
  return prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        groupId,
        description: data.description,
        amountPaise: data.amountPaise,
        category: data.category,
        date: new Date(data.date),
        paidById: data.paidById,
        createdById: userId,
        splitType: data.splitType,
        splits: {
          create: splits.map((s) => ({
            ...s,
            percent:
              data.splitType === "PERCENT"
                ? data.participants.find((p) => p.userId === s.userId).percent
                : null,
          })),
        },
      },
      include: { splits: true },
    });
    await tx.activity.create({
      data: {
        groupId,
        actorId: userId,
        type: "EXPENSE_CREATED",
        message: "Added expense: " + expense.description,
      },
    });
    return expense;
  });
}
export async function updateExpense(id, userId, data) {
  const { expense, membership } = await access(id, userId);
  if (expense.createdById !== userId && membership.role !== "ADMIN")
    throw fail(
      403,
      "FORBIDDEN",
      "Only the creator or group admin can edit this expense",
    );
  await people(expense.groupId, data.paidById, data.participants);
  const splits = calculateSplits(
    data.amountPaise,
    data.splitType,
    data.participants,
  );
  return prisma.$transaction(async (tx) => {
    const updated = await tx.expense.update({
      where: { id },
      data: {
        description: data.description,
        amountPaise: data.amountPaise,
        category: data.category,
        date: new Date(data.date),
        paidById: data.paidById,
        splitType: data.splitType,
        splits: {
          deleteMany: {},
          create: splits.map((s) => ({
            ...s,
            percent:
              data.splitType === "PERCENT"
                ? data.participants.find((p) => p.userId === s.userId).percent
                : null,
          })),
        },
      },
      include: { splits: true },
    });
    await tx.activity.create({
      data: {
        groupId: expense.groupId,
        actorId: userId,
        type: "EXPENSE_UPDATED",
        message: "Updated expense: " + updated.description,
      },
    });
    return updated;
  });
}
export async function deleteExpense(id, userId) {
  const { expense, membership } = await access(id, userId);
  if (expense.createdById !== userId && membership.role !== "ADMIN")
    throw fail(
      403,
      "FORBIDDEN",
      "Only the creator or group admin can delete this expense",
    );
  return prisma.$transaction(async (tx) => {
    await tx.expense.delete({ where: { id } });
    await tx.activity.create({
      data: {
        groupId: expense.groupId,
        actorId: userId,
        type: "EXPENSE_DELETED",
        message: "Deleted expense: " + expense.description,
      },
    });
  });
}

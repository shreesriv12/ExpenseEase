import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

export async function resetDatabase() {
  await prisma.activity.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
}

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

export async function registerUser({
  name,
  email,
  password = "Passw0rd!",
}) {
  const response = await request(app)
    .post("/api/auth/register")
    .send({ name, email, password });
  return response.body;
}

export async function createGroup({
  name = "Goa Weekend",
  adminId,
  memberIds = [],
}) {
  return prisma.group.create({
    data: {
      name,
      createdById: adminId,
      members: {
        create: [...new Set([adminId, ...memberIds])].map((userId, index) => ({
          userId,
          role: index === 0 ? "ADMIN" : "MEMBER",
        })),
      },
    },
    include: { members: true },
  });
}

export async function createExpense({
  groupId,
  paidById,
  createdById = paidById,
  amountPaise,
  splits,
  description = "Test expense",
  category = "Food",
  splitType = "EQUAL",
  date = "2026-09-01T00:00:00.000Z",
}) {
  return prisma.expense.create({
    data: {
      groupId,
      description,
      amountPaise,
      category,
      splitType,
      date: new Date(date),
      paidById,
      createdById,
      splits: { create: splits },
    },
    include: { splits: true },
  });
}

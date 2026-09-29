import { z } from "zod";
import * as service from "../services/expenses.js";
const participant = z.object({
  userId: z.number().int().positive(),
  sharePaise: z.number().int().nonnegative().optional(),
  percent: z.number().int().nonnegative().optional(),
});
const input = z
  .object({
    description: z.string().trim().min(1).max(200),
    amountPaise: z.number().int().positive(),
    category: z.string().trim().min(1).max(50),
    date: z.string().datetime(),
    paidById: z.number().int().positive(),
    splitType: z.enum(["EQUAL", "EXACT", "PERCENT"]),
    participants: z.array(participant).min(1),
  })
  .superRefine((data, ctx) => {
    if (
      new Set(data.participants.map((p) => p.userId)).size !==
      data.participants.length
    )
      ctx.addIssue({ code: "custom", message: "Participants must be unique" });
  });
const id = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1)
    throw Object.assign(new Error("Invalid id"), {
      status: 400,
      code: "VALIDATION_ERROR",
    });
  return n;
};
export async function list(req, res) {
  res.json({
    expenses: await service.listExpenses(id(req.params.id), req.user.id),
  });
}
export async function create(req, res) {
  res.status(201).json({
    expense: await service.createExpense(
      id(req.params.id),
      req.user.id,
      input.parse(req.body),
    ),
  });
}
export async function update(req, res) {
  res.json({
    expense: await service.updateExpense(
      id(req.params.id),
      req.user.id,
      input.parse(req.body),
    ),
  });
}
export async function remove(req, res) {
  await service.deleteExpense(id(req.params.id), req.user.id);
  res.status(204).end();
}

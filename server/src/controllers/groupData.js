import { z } from "zod";
import * as service from "../services/groupData.js";
const id = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1)
    throw Object.assign(new Error("Invalid id"), {
      status: 400,
      code: "VALIDATION_ERROR",
    });
  return n;
};
const settlement = z.object({
  fromUserId: z.number().int().positive(),
  toUserId: z.number().int().positive(),
  amountPaise: z.number().int().positive(),
  note: z.string().trim().max(300).optional(),
});
export async function balances(req, res) {
  res.json(await service.balances(id(req.params.id), req.user.id));
}
export async function createSettlement(req, res) {
  res.status(201).json({
    settlement: await service.createSettlement(
      id(req.params.id),
      req.user.id,
      settlement.parse(req.body),
    ),
  });
}
export async function activity(req, res) {
  res.json({
    activity: await service.activity(id(req.params.id), req.user.id),
  });
}
export async function dashboard(req, res) {
  res.json(await service.dashboard(req.user.id));
}

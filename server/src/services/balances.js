import { simplifyDebts } from "./debtSimplifier.js";
export function computeBalances(members, expenses, settlements) {
  const balances = Object.fromEntries(members.map((m) => [m.userId, 0]));
  for (const e of expenses) {
    balances[e.paidById] += e.amountPaise;
    for (const s of e.splits) balances[s.userId] -= s.sharePaise;
  }
  for (const s of settlements) {
    balances[s.fromUserId] += s.amountPaise;
    balances[s.toUserId] -= s.amountPaise;
  }
  if (Object.values(balances).reduce((a, b) => a + b, 0) !== 0)
    throw new Error("Balance invariant failed");
  return balances;
}
export { simplifyDebts };

export function simplifyDebts(netBalances) {
  const creditors = [],
    debtors = [];
  for (const [id, value] of Object.entries(netBalances)) {
    if (value > 0) creditors.push({ id: Number(id), amount: value });
    if (value < 0) debtors.push({ id: Number(id), amount: -value });
  }
  const byAmount = (a, b) => b.amount - a.amount || a.id - b.id;
  const result = [];
  while (creditors.length && debtors.length) {
    creditors.sort(byAmount);
    debtors.sort(byAmount);
    const c = creditors[0],
      d = debtors[0],
      amount = Math.min(c.amount, d.amount);
    result.push({ from: d.id, to: c.id, amount });
    c.amount -= amount;
    d.amount -= amount;
    if (!c.amount) creditors.shift();
    if (!d.amount) debtors.shift();
  }
  return result;
}

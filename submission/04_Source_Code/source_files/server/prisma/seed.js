import bcrypt from "bcrypt";
import { prisma } from "../src/config/prisma.js";

const password = "DemoPass123!";
const people = [
  { name: "Aarav Mehta", email: "aarav.demo@expenseease.local" },
  { name: "Diya Nair", email: "diya.demo@expenseease.local" },
  { name: "Kabir Shah", email: "kabir.demo@expenseease.local" },
];

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);
  const users = await Promise.all(people.map(({ name, email }) => prisma.user.upsert({ where: { email }, update: { name, passwordHash }, create: { name, email, passwordHash } })));
  const [aarav, diya, kabir] = users;
  const existing = await prisma.group.findFirst({ where: { name: "Goa Weekend Demo", createdById: aarav.id } });
  if (existing) {
    console.info("Demo data already exists; no records were changed.");
    return;
  }
  await prisma.group.create({
    data: {
      name: "Goa Weekend Demo",
      description: "Sample data for local development and mid-semester demonstration.",
      createdById: aarav.id,
      members: { create: [{ userId: aarav.id, role: "ADMIN" }, { userId: diya.id }, { userId: kabir.id }] },
      expenses: { create: [
        { description: "Hotel booking", amountPaise: 120000, category: "Travel", date: new Date("2026-09-20T10:00:00.000Z"), paidById: aarav.id, createdById: aarav.id, splitType: "EQUAL", splits: { create: users.map((user) => ({ userId: user.id, sharePaise: 40000 })) } },
        { description: "Dinner at the beach", amountPaise: 185000, category: "Food", date: new Date("2026-09-21T14:00:00.000Z"), paidById: diya.id, createdById: diya.id, splitType: "EXACT", splits: { create: [{ userId: aarav.id, sharePaise: 60000 }, { userId: diya.id, sharePaise: 50000 }, { userId: kabir.id, sharePaise: 75000 }] } },
        { description: "Water sports", amountPaise: 100000, category: "Activities", date: new Date("2026-09-22T09:00:00.000Z"), paidById: kabir.id, createdById: kabir.id, splitType: "PERCENT", splits: { create: [{ userId: aarav.id, sharePaise: 50000, percent: 50 }, { userId: diya.id, sharePaise: 30000, percent: 30 }, { userId: kabir.id, sharePaise: 20000, percent: 20 }] } },
      ] },
      settlements: { create: { fromUserId: diya.id, toUserId: aarav.id, amountPaise: 10000, note: "Partial settlement for the hotel" } },
      activities: { create: { actorId: aarav.id, type: "DEMO_DATA_CREATED", message: "Created sample demo data" } },
    },
  });
  console.info("Demo data created. Development-only password for all accounts: DemoPass123!");
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());

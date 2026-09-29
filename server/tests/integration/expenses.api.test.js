import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";
import {
  bearer,
  clearGroupData,
  createGroup,
  registerUser,
  resetDatabase,
} from "../helpers/database.js";

let admin;
let member;
let outsider;
let group;

const payload = (overrides = {}) => ({
  description: "Dinner",
  amountPaise: 10000,
  category: "Food",
  date: "2026-09-01T00:00:00.000Z",
  paidById: admin.user.id,
  splitType: "EQUAL",
  participants: [{ userId: admin.user.id }, { userId: member.user.id }],
  ...overrides,
});

const postExpense = (body, token = admin.token) =>
  request(app)
    .post(`/api/groups/${group.id}/expenses`)
    .set(bearer(token))
    .send(body);

beforeAll(async () => {
  await resetDatabase();
  admin = await registerUser({ name: "Asha", email: "asha@test.local" });
  member = await registerUser({ name: "Bharat", email: "bharat@test.local" });
  outsider = await registerUser({ name: "Chitra", email: "chitra@test.local" });
});

beforeEach(async () => {
  await clearGroupData();
  group = await createGroup({
    adminId: admin.user.id,
    memberIds: [member.user.id],
  });
});

describe("POST /api/groups/:id/expenses with an equal split", () => {
  it("stores shares that total the amount exactly", async () => {
    const response = await postExpense(
      payload({ amountPaise: 10000 }),
    );

    expect(response.status).toBe(201);
    const stored = await prisma.expense.findUnique({
      where: { id: response.body.expense.id },
      include: { splits: true },
    });
    expect(stored.splitType).toBe("EQUAL");
    expect(stored.splits.reduce((n, s) => n + s.sharePaise, 0)).toBe(10000);
    expect(stored.splits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: admin.user.id,
          sharePaise: 5000,
        }),
        expect.objectContaining({
          userId: member.user.id,
          sharePaise: 5000,
        }),
      ]),
    );
  });

  it("distributes the remainder deterministically by user id", async () => {
    const response = await postExpense(payload({ amountPaise: 100 }));

    const stored = await prisma.expense.findUnique({
      where: { id: response.body.expense.id },
      include: { splits: true },
    });
    const byId = Object.fromEntries(
      stored.splits.map((s) => [s.userId, s.sharePaise]),
    );
    expect(byId[Math.min(admin.user.id, member.user.id)]).toBe(50);
  });

  it("records an activity entry for the new expense", async () => {
    const response = await postExpense(payload());

    const activity = await prisma.activity.findFirst({
      where: { groupId: group.id },
      orderBy: { id: "desc" },
    });
    expect(activity.type).toBe("EXPENSE_CREATED");
    expect(activity.message).toContain("Dinner");
    expect(activity.actorId).toBe(admin.user.id);
    expect(response.status).toBe(201);
  });
});

describe("POST /api/groups/:id/expenses with an exact split", () => {
  it("stores the submitted shares unchanged", async () => {
    const response = await postExpense(
      payload({
        splitType: "EXACT",
        participants: [
          { userId: admin.user.id, sharePaise: 6000 },
          { userId: member.user.id, sharePaise: 4000 },
        ],
      }),
    );

    expect(response.status).toBe(201);
    const stored = await prisma.expense.findUnique({
      where: { id: response.body.expense.id },
      include: { splits: true },
    });
    expect(stored.splits.reduce((n, s) => n + s.sharePaise, 0)).toBe(10000);
  });

  it("rejects shares that do not total the amount", async () => {
    const response = await postExpense(
      payload({
        splitType: "EXACT",
        participants: [
          { userId: admin.user.id, sharePaise: 6000 },
          { userId: member.user.id, sharePaise: 3000 },
        ],
      }),
    );

    expect(response.status).toBe(400);
    await expect(prisma.expense.count()).resolves.toBe(0);
  });

  it("rejects a negative share", async () => {
    const response = await postExpense(
      payload({
        splitType: "EXACT",
        participants: [
          { userId: admin.user.id, sharePaise: 12000 },
          { userId: member.user.id, sharePaise: -2000 },
        ],
      }),
    );

    expect(response.status).toBe(400);
  });
});

describe("POST /api/groups/:id/expenses with a percentage split", () => {
  it("stores the percentage and the derived share", async () => {
    const response = await postExpense(
      payload({
        splitType: "PERCENT",
        participants: [
          { userId: admin.user.id, percent: 60 },
          { userId: member.user.id, percent: 40 },
        ],
      }),
    );

    expect(response.status).toBe(201);
    const stored = await prisma.expense.findUnique({
      where: { id: response.body.expense.id },
      include: { splits: true },
    });
    expect(stored.splits.reduce((n, s) => n + s.sharePaise, 0)).toBe(10000);
    const byId = Object.fromEntries(
      stored.splits.map((s) => [s.userId, s.percent]),
    );
    expect(byId[admin.user.id]).toBe(60);
    expect(byId[member.user.id]).toBe(40);
  });

  it("rejects percentages that do not total 100", async () => {
    const response = await postExpense(
      payload({
        splitType: "PERCENT",
        participants: [
          { userId: admin.user.id, percent: 60 },
          { userId: member.user.id, percent: 39 },
        ],
      }),
    );

    expect(response.status).toBe(400);
    await expect(prisma.expense.count()).resolves.toBe(0);
  });

  it("rejects a non-integer percentage", async () => {
    const response = await postExpense(
      payload({
        splitType: "PERCENT",
        participants: [
          { userId: admin.user.id, percent: 33.33 },
          { userId: member.user.id, percent: 66.67 },
        ],
      }),
    );

    expect(response.status).toBe(400);
  });
});

describe("POST /api/groups/:id/expenses input validation", () => {
  it("rejects a participant who is not a group member", async () => {
    const response = await postExpense(
      payload({
        participants: [{ userId: admin.user.id }, { userId: outsider.user.id }],
      }),
    );

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_MEMBER");
    await expect(prisma.expense.count()).resolves.toBe(0);
  });

  it("rejects a payer who is not a group member", async () => {
    const response = await postExpense(
      payload({ paidById: outsider.user.id }),
    );

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_MEMBER");
  });

  it("rejects duplicate participants", async () => {
    const response = await postExpense(
      payload({
        participants: [{ userId: admin.user.id }, { userId: admin.user.id }],
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects an empty participant list", async () => {
    const response = await postExpense(payload({ participants: [] }));

    expect(response.status).toBe(400);
  });

  it("rejects a zero amount", async () => {
    const response = await postExpense(payload({ amountPaise: 0 }));

    expect(response.status).toBe(400);
  });

  it("rejects a negative amount", async () => {
    const response = await postExpense(payload({ amountPaise: -100 }));

    expect(response.status).toBe(400);
  });

  it("rejects a fractional paise amount", async () => {
    const response = await postExpense(payload({ amountPaise: 10.5 }));

    expect(response.status).toBe(400);
  });

  it("rejects a blank description", async () => {
    const response = await postExpense(payload({ description: "   " }));

    expect(response.status).toBe(400);
  });

  it("rejects a date that is not an ISO datetime", async () => {
    const response = await postExpense(payload({ date: "2026-09-01" }));

    expect(response.status).toBe(400);
  });

  it("rejects an unknown split type", async () => {
    const response = await postExpense(payload({ splitType: "RATIO" }));

    expect(response.status).toBe(400);
  });

  it("refuses a non-member", async () => {
    const response = await postExpense(payload(), outsider.token);

    expect(response.status).toBe(403);
    await expect(prisma.expense.count()).resolves.toBe(0);
  });

  it("requires authentication", async () => {
    const response = await request(app)
      .post(`/api/groups/${group.id}/expenses`)
      .send(payload());

    expect(response.status).toBe(401);
  });

  it("rejects a non-numeric group id", async () => {
    const response = await request(app)
      .post("/api/groups/not-a-number/expenses")
      .set(bearer(admin.token))
      .send(payload());

    expect(response.status).toBe(400);
  });
});

describe("GET /api/groups/:id/expenses", () => {
  it("returns the group expenses to a member", async () => {
    await postExpense(payload({ description: "Dinner" }));
    const response = await request(app)
      .get(`/api/groups/${group.id}/expenses`)
      .set(bearer(member.token));

    expect(response.status).toBe(200);
    expect(response.body.expenses).toHaveLength(1);
    expect(response.body.expenses[0].description).toBe("Dinner");
  });

  it("returns an empty list for a group with no expenses", async () => {
    const response = await request(app)
      .get(`/api/groups/${group.id}/expenses`)
      .set(bearer(admin.token));

    expect(response.body.expenses).toEqual([]);
  });

  it("refuses a non-member", async () => {
    const response = await request(app)
      .get(`/api/groups/${group.id}/expenses`)
      .set(bearer(outsider.token));

    expect(response.status).toBe(403);
  });

  it("requires authentication", async () => {
    const response = await request(app).get(
      `/api/groups/${group.id}/expenses`,
    );

    expect(response.status).toBe(401);
  });
});

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";
import {
  bearer,
  clearGroupData,
  createExpense,
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

describe("PUT /api/expenses/:id", () => {
  const updateBody = (overrides = {}) => ({
    description: "Dinner updated",
    amountPaise: 12000,
    category: "Food",
    date: "2026-09-02T00:00:00.000Z",
    paidById: admin.user.id,
    splitType: "EQUAL",
    participants: [{ userId: admin.user.id }, { userId: member.user.id }],
    ...overrides,
  });

  const putExpense = (id, body, token = admin.token) =>
    request(app).put(`/api/expenses/${id}`).set(bearer(token)).send(body);

  let expense;

  beforeEach(async () => {
    expense = await createExpense({
      groupId: group.id,
      paidById: admin.user.id,
      createdById: admin.user.id,
      amountPaise: 10000,
      splits: [
        { userId: admin.user.id, sharePaise: 5000 },
        { userId: member.user.id, sharePaise: 5000 },
      ],
    });
  });

  it("lets the creator update their own expense and replaces the splits", async () => {
    const response = await putExpense(expense.id, updateBody());

    expect(response.status).toBe(200);
    const stored = await prisma.expense.findUnique({
      where: { id: expense.id },
      include: { splits: true },
    });
    expect(stored.description).toBe("Dinner updated");
    expect(stored.amountPaise).toBe(12000);
    expect(stored.splits.reduce((n, s) => n + s.sharePaise, 0)).toBe(12000);
    expect(stored.splits).toHaveLength(2);
  });

  it("lets a group admin update another member's expense", async () => {
    const other = await createExpense({
      groupId: group.id,
      paidById: member.user.id,
      createdById: member.user.id,
      amountPaise: 10000,
      splits: [{ userId: member.user.id, sharePaise: 10000 }],
    });

    const response = await putExpense(other.id, updateBody());

    expect(response.status).toBe(200);
  });

  it("refuses a plain member editing another member's expense", async () => {
    const response = await putExpense(expense.id, updateBody(), member.token);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    const stored = await prisma.expense.findUnique({
      where: { id: expense.id },
    });
    expect(stored.description).toBe("Test expense");
  });

  it("refuses a non-member", async () => {
    const response = await putExpense(expense.id, updateBody(), outsider.token);

    expect(response.status).toBe(403);
  });

  it("returns 404 for an expense that does not exist", async () => {
    const response = await putExpense(9999, updateBody());

    expect(response.status).toBe(404);
  });

  it("records an activity entry for the update", async () => {
    await putExpense(expense.id, updateBody());

    const activity = await prisma.activity.findFirst({
      where: { groupId: group.id, type: "EXPENSE_UPDATED" },
    });
    expect(activity).toBeTruthy();
    expect(activity.message).toContain("Dinner updated");
  });

  it("leaves the stored expense unchanged when the new split is invalid", async () => {
    const response = await putExpense(
      expense.id,
      updateBody({
        splitType: "EXACT",
        participants: [
          { userId: admin.user.id, sharePaise: 100 },
          { userId: member.user.id, sharePaise: 100 },
        ],
      }),
    );

    expect(response.status).toBe(400);
    const stored = await prisma.expense.findUnique({
      where: { id: expense.id },
      include: { splits: true },
    });
    expect(stored.amountPaise).toBe(10000);
    expect(stored.splits).toHaveLength(2);
  });

  it("requires authentication", async () => {
    const response = await request(app)
      .put(`/api/expenses/${expense.id}`)
      .send(updateBody());

    expect(response.status).toBe(401);
  });
});

describe("DELETE /api/expenses/:id", () => {
  let expense;

  beforeEach(async () => {
    expense = await createExpense({
      groupId: group.id,
      paidById: admin.user.id,
      createdById: admin.user.id,
      amountPaise: 10000,
      splits: [{ userId: admin.user.id, sharePaise: 10000 }],
    });
  });

  const deleteExpense = (id, token) =>
    request(app).delete(`/api/expenses/${id}`).set(bearer(token));

  it("lets the creator delete their own expense", async () => {
    const response = await deleteExpense(expense.id, admin.token);

    expect(response.status).toBe(204);
    await expect(prisma.expense.count()).resolves.toBe(0);
    await expect(prisma.expenseSplit.count()).resolves.toBe(0);
  });

  it("lets a group admin delete another member's expense", async () => {
    const other = await createExpense({
      groupId: group.id,
      paidById: member.user.id,
      createdById: member.user.id,
      amountPaise: 10000,
      splits: [{ userId: member.user.id, sharePaise: 10000 }],
    });

    const response = await deleteExpense(other.id, admin.token);

    expect(response.status).toBe(204);
  });

  it("refuses a plain member deleting another member's expense", async () => {
    const response = await deleteExpense(expense.id, member.token);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    await expect(prisma.expense.count()).resolves.toBe(1);
  });

  it("refuses a non-member", async () => {
    const response = await deleteExpense(expense.id, outsider.token);

    expect(response.status).toBe(403);
    await expect(prisma.expense.count()).resolves.toBe(1);
  });

  it("records an activity entry for the deletion", async () => {
    await deleteExpense(expense.id, admin.token);

    const activity = await prisma.activity.findFirst({
      where: { groupId: group.id, type: "EXPENSE_DELETED" },
    });
    expect(activity).toBeTruthy();
    expect(activity.message).toContain("Test expense");
  });

  it("returns 404 for an expense that does not exist", async () => {
    const response = await deleteExpense(9999, admin.token);

    expect(response.status).toBe(404);
  });

  it("requires authentication", async () => {
    const response = await request(app).delete(`/api/expenses/${expense.id}`);

    expect(response.status).toBe(401);
    await expect(prisma.expense.count()).resolves.toBe(1);
  });
});

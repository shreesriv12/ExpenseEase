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

const ids = () => ({
  asha: admin.user.id,
  bharat: member.user.id,
  chitra: outsider.user.id,
});

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

const equalDinner = () =>
  createExpense({
    groupId: group.id,
    paidById: admin.user.id,
    createdById: admin.user.id,
    amountPaise: 10000,
    splits: [
      { userId: admin.user.id, sharePaise: 5000 },
      { userId: member.user.id, sharePaise: 5000 },
    ],
  });

describe("GET /api/groups/:id/balances", () => {
  it("returns net balances and a simplified suggestion", async () => {
    await equalDinner();
    const { asha, bharat } = ids();

    const response = await request(app)
      .get(`/api/groups/${group.id}/balances`)
      .set(bearer(member.token));

    expect(response.status).toBe(200);
    const net = Object.fromEntries(
      response.body.members.map((m) => [m.user.id, m.netPaise]),
    );
    expect(net[asha]).toBe(5000);
    expect(net[bharat]).toBe(-5000);
    expect(response.body.simplifiedSettlements).toEqual([
      { from: bharat, to: asha, amount: 5000 },
    ]);
  });

  it("keeps the sum of member balances at zero", async () => {
    await equalDinner();

    const response = await request(app)
      .get(`/api/groups/${group.id}/balances`)
      .set(bearer(admin.token));

    const total = response.body.members.reduce((n, m) => n + m.netPaise, 0);
    expect(total).toBe(0);
  });

  it("reports zero balances and no suggestions for an empty group", async () => {
    const response = await request(app)
      .get(`/api/groups/${group.id}/balances`)
      .set(bearer(admin.token));

    expect(response.body.members.every((m) => m.netPaise === 0)).toBe(true);
    expect(response.body.simplifiedSettlements).toEqual([]);
  });

  it("refuses a non-member", async () => {
    const response = await request(app)
      .get(`/api/groups/${group.id}/balances`)
      .set(bearer(outsider.token));

    expect(response.status).toBe(403);
  });

  it("requires authentication", async () => {
    const response = await request(app).get(
      `/api/groups/${group.id}/balances`,
    );

    expect(response.status).toBe(401);
  });
});

describe("POST /api/groups/:id/settlements", () => {
  const postSettlement = (body, token = member.token) =>
    request(app)
      .post(`/api/groups/${group.id}/settlements`)
      .set(bearer(token))
      .send(body);

  it("records a settlement and clears the resulting debt", async () => {
    await equalDinner();
    const { asha, bharat } = ids();

    const response = await postSettlement({
      fromUserId: bharat,
      toUserId: asha,
      amountPaise: 5000,
      note: "Paid by UPI",
    });

    expect(response.status).toBe(201);
    await expect(prisma.settlement.count()).resolves.toBe(1);

    const balances = await request(app)
      .get(`/api/groups/${group.id}/balances`)
      .set(bearer(admin.token));
    expect(
      balances.body.members.every((m) => m.netPaise === 0),
    ).toBe(true);
    expect(balances.body.simplifiedSettlements).toEqual([]);
  });

  it("records an activity entry", async () => {
    await equalDinner();
    const { asha, bharat } = ids();

    await postSettlement({ fromUserId: bharat, toUserId: asha, amountPaise: 5000 });

    const activity = await prisma.activity.findFirst({
      where: { groupId: group.id, type: "SETTLEMENT_RECORDED" },
    });
    expect(activity).toBeTruthy();
  });

  it("rejects a settlement between the same member", async () => {
    const { bharat } = ids();
    const response = await postSettlement({
      fromUserId: bharat,
      toUserId: bharat,
      amountPaise: 5000,
    });

    expect(response.status).toBe(400);
    await expect(prisma.settlement.count()).resolves.toBe(0);
  });

  it("rejects a settlement with a non-member", async () => {
    const { bharat, chitra } = ids();
    const response = await postSettlement({
      fromUserId: bharat,
      toUserId: chitra,
      amountPaise: 5000,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_MEMBER");
  });

  it("rejects a non-member recording a settlement", async () => {
    const { asha, bharat } = ids();
    const response = await postSettlement(
      { fromUserId: bharat, toUserId: asha, amountPaise: 5000 },
      outsider.token,
    );

    expect(response.status).toBe(403);
  });

  it("rejects a zero settlement amount", async () => {
    const { asha, bharat } = ids();
    const response = await postSettlement({
      fromUserId: bharat,
      toUserId: asha,
      amountPaise: 0,
    });

    expect(response.status).toBe(400);
  });

  it("rejects a negative settlement amount", async () => {
    const { asha, bharat } = ids();
    const response = await postSettlement({
      fromUserId: bharat,
      toUserId: asha,
      amountPaise: -100,
    });

    expect(response.status).toBe(400);
  });

  it("rejects a note longer than 300 characters", async () => {
    const { asha, bharat } = ids();
    const response = await postSettlement({
      fromUserId: bharat,
      toUserId: asha,
      amountPaise: 5000,
      note: "x".repeat(301),
    });

    expect(response.status).toBe(400);
  });

  it("requires authentication", async () => {
    const { asha, bharat } = ids();
    const response = await request(app)
      .post(`/api/groups/${group.id}/settlements`)
      .send({ fromUserId: bharat, toUserId: asha, amountPaise: 5000 });

    expect(response.status).toBe(401);
  });
});

describe("GET /api/groups/:id/activity", () => {
  it("returns entries newest first", async () => {
    const { asha } = ids();
    await prisma.activity.create({
      data: {
        groupId: group.id,
        actorId: asha,
        type: "EXPENSE_CREATED",
        message: "Older entry",
        createdAt: new Date("2026-09-01T00:00:00.000Z"),
      },
    });
    await prisma.activity.create({
      data: {
        groupId: group.id,
        actorId: asha,
        type: "EXPENSE_UPDATED",
        message: "Newer entry",
        createdAt: new Date("2026-09-02T00:00:00.000Z"),
      },
    });

    const response = await request(app)
      .get(`/api/groups/${group.id}/activity`)
      .set(bearer(admin.token));

    expect(response.status).toBe(200);
    expect(response.body.activity.map((a) => a.message)).toEqual([
      "Newer entry",
      "Older entry",
    ]);
  });

  it("returns an empty list for a group with no activity", async () => {
    const response = await request(app)
      .get(`/api/groups/${group.id}/activity`)
      .set(bearer(admin.token));

    expect(response.body.activity).toEqual([]);
  });

  it("refuses a non-member", async () => {
    const response = await request(app)
      .get(`/api/groups/${group.id}/activity`)
      .set(bearer(outsider.token));

    expect(response.status).toBe(403);
  });

  it("requires authentication", async () => {
    const response = await request(app).get(
      `/api/groups/${group.id}/activity`,
    );

    expect(response.status).toBe(401);
  });
});

describe("GET /api/dashboard/summary", () => {
  it("sums what the user is owed and owes across groups", async () => {
    const { asha, chitra } = ids();
    await equalDinner();
    const second = await createGroup({
      name: "Trekk",
      adminId: outsider.user.id,
      memberIds: [admin.user.id],
    });
    await createExpense({
      groupId: second.id,
      paidById: chitra,
      createdById: chitra,
      amountPaise: 10000,
      splits: [
        { userId: asha, sharePaise: 5000 },
        { userId: chitra, sharePaise: 5000 },
      ],
    });

    const response = await request(app)
      .get("/api/dashboard/summary")
      .set(bearer(admin.token));

    expect(response.status).toBe(200);
    expect(response.body.youAreOwedPaise).toBe(5000);
    expect(response.body.youOwePaise).toBe(5000);
  });

  it("reports zero for a user with no groups", async () => {
    const response = await request(app)
      .get("/api/dashboard/summary")
      .set(bearer(outsider.token));

    expect(response.body).toEqual({ youOwePaise: 0, youAreOwedPaise: 0 });
  });

  it("requires authentication", async () => {
    const response = await request(app).get("/api/dashboard/summary");

    expect(response.status).toBe(401);
  });
});

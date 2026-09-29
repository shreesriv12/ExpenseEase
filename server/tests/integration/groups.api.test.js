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

describe("POST /api/groups", () => {
  it("creates a group and makes the creator an admin", async () => {
    const response = await request(app)
      .post("/api/groups")
      .set(bearer(admin.token))
      .send({ name: "Flat 4B", description: "Shared costs" });

    expect(response.status).toBe(201);
    const created = await prisma.group.findUnique({
      where: { id: response.body.group.id },
      include: { members: true },
    });
    expect(created.members).toHaveLength(1);
    expect(created.members[0]).toMatchObject({
      userId: admin.user.id,
      role: "ADMIN",
    });
  });

  it("rejects a group with a blank name", async () => {
    const response = await request(app)
      .post("/api/groups")
      .set(bearer(admin.token))
      .send({ name: "   " });

    expect(response.status).toBe(400);
    await expect(prisma.group.count()).resolves.toBe(1);
  });

  it("requires authentication", async () => {
    const response = await request(app)
      .post("/api/groups")
      .send({ name: "Flat 4B" });

    expect(response.status).toBe(401);
  });
});

describe("GET /api/groups", () => {
  it("returns only the groups the caller belongs to", async () => {
    const response = await request(app)
      .get("/api/groups")
      .set(bearer(member.token));

    expect(response.status).toBe(200);
    expect(response.body.groups.map((g) => g.id)).toEqual([group.id]);
  });

  it("returns an empty list for a user with no groups", async () => {
    const response = await request(app)
      .get("/api/groups")
      .set(bearer(outsider.token));

    expect(response.body.groups).toEqual([]);
  });

  it("requires authentication", async () => {
    const response = await request(app).get("/api/groups");

    expect(response.status).toBe(401);
  });
});

describe("GET /api/groups/:id", () => {
  it("returns the group to a member", async () => {
    const response = await request(app)
      .get(`/api/groups/${group.id}`)
      .set(bearer(member.token));

    expect(response.status).toBe(200);
    expect(response.body.group.members).toHaveLength(2);
  });

  it("refuses a non-member", async () => {
    const response = await request(app)
      .get(`/api/groups/${group.id}`)
      .set(bearer(outsider.token));

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("refuses a non-member even when the group does not exist", async () => {
    const response = await request(app)
      .get("/api/groups/9999")
      .set(bearer(outsider.token));

    expect(response.status).toBe(403);
  });

  it("rejects a non-numeric group id", async () => {
    const response = await request(app)
      .get("/api/groups/not-a-number")
      .set(bearer(admin.token));

    expect(response.status).toBe(400);
  });
});

describe("POST /api/groups/:id/members", () => {
  it("lets an admin add a registered user", async () => {
    const response = await request(app)
      .post(`/api/groups/${group.id}/members`)
      .set(bearer(admin.token))
      .send({ email: "chitra@test.local" });

    expect(response.status).toBe(201);
    await expect(prisma.groupMember.count()).resolves.toBe(3);
  });

  it("refuses a non-admin member", async () => {
    const response = await request(app)
      .post(`/api/groups/${group.id}/members`)
      .set(bearer(member.token))
      .send({ email: "chitra@test.local" });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    await expect(prisma.groupMember.count()).resolves.toBe(2);
  });

  it("refuses a user who is not a member of the group", async () => {
    const response = await request(app)
      .post(`/api/groups/${group.id}/members`)
      .set(bearer(outsider.token))
      .send({ email: "chitra@test.local" });

    expect(response.status).toBe(403);
    await expect(prisma.groupMember.count()).resolves.toBe(2);
  });

  it("refuses to add the same member twice", async () => {
    const response = await request(app)
      .post(`/api/groups/${group.id}/members`)
      .set(bearer(admin.token))
      .send({ email: "bharat@test.local" });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("DUPLICATE_MEMBER");
  });

  it("refuses to add someone who has not registered", async () => {
    const response = await request(app)
      .post(`/api/groups/${group.id}/members`)
      .set(bearer(admin.token))
      .send({ email: "ghost@test.local" });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("USER_NOT_FOUND");
  });

  it("rejects a malformed email", async () => {
    const response = await request(app)
      .post(`/api/groups/${group.id}/members`)
      .set(bearer(admin.token))
      .send({ email: "not-an-email" });

    expect(response.status).toBe(400);
  });

  it("requires authentication", async () => {
    const response = await request(app)
      .post(`/api/groups/${group.id}/members`)
      .send({ email: "chitra@test.local" });

    expect(response.status).toBe(401);
  });
});

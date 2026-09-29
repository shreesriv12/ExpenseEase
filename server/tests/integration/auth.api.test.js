import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";
import { bearer, resetDatabase } from "../helpers/database.js";

const credentials = {
  name: "Asha",
  email: "asha@test.local",
  password: "Passw0rd!",
};

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe("POST /api/auth/register", () => {
  it("creates a user and returns a token", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(credentials);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      name: credentials.name,
      email: credentials.email,
    });
    expect(response.body.token).toEqual(expect.any(String));
    await expect(prisma.user.count()).resolves.toBe(1);
  });

  it("never returns the password hash to the client", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(credentials);

    expect(response.body.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain("$2");
  });

  it("stores the password as a bcrypt hash", async () => {
    await request(app).post("/api/auth/register").send(credentials);

    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });
    expect(user.passwordHash).not.toBe(credentials.password);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const response = await request(app)
      .post("/api/auth/register")
      .send({ ...credentials, name: "Someone Else" });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("DUPLICATE_EMAIL");
    await expect(prisma.user.count()).resolves.toBe(1);
  });

  it("rejects a password shorter than eight characters", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ ...credentials, password: "Pass123" });

    expect(response.status).toBe(400);
    await expect(prisma.user.count()).resolves.toBe(0);
  });

  it("rejects a missing name", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: credentials.email, password: credentials.password });

    expect(response.status).toBe(400);
    await expect(prisma.user.count()).resolves.toBe(0);
  });

  it("rejects a missing password", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: credentials.name, email: credentials.email });

    expect(response.status).toBe(400);
    await expect(prisma.user.count()).resolves.toBe(0);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(credentials);
  });

  it("returns a token for correct credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.email).toBe(credentials.email);
  });

  it("rejects a wrong password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "WrongPass1!" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(response.body.token).toBeUndefined();
  });

  it("rejects an unknown email", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.local", password: credentials.password });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("does not reveal whether the email exists", async () => {
    const unknown = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.local", password: "WrongPass1!" });
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "WrongPass1!" });

    expect(unknown.body).toEqual(wrongPassword.body);
  });
});

describe("GET /api/auth/me", () => {
  let token;

  beforeEach(async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(credentials);
    token = response.body.token;
  });

  it("returns the authenticated user", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set(bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(credentials.email);
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("rejects a request with no token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects a malformed token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set(bearer("not-a-real-token"));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects a token signed with a different secret", async () => {
    const forged = jwt.sign({ id: 1, email: credentials.email }, "wrong-secret", {
      expiresIn: "7d",
    });
    const response = await request(app).get("/api/auth/me").set(bearer(forged));

    expect(response.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const expired = jwt.sign(
      { id: 1, email: credentials.email },
      process.env.JWT_SECRET,
      { expiresIn: "-1s" },
    );
    const response = await request(app)
      .get("/api/auth/me")
      .set(bearer(expired));

    expect(response.status).toBe(401);
  });
});

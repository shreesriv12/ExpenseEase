import express from "express";
import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { errors } from "../src/middleware/errors.js";
import { asyncRoute } from "../src/utils/asyncRoute.js";

const appFor = (thrown) => {
  const app = express();
  app.get(
    "/boom",
    asyncRoute(async () => {
      throw thrown;
    }),
  );
  app.use(errors);
  return app;
};

describe("error handler", () => {
  it("returns 500 and hides internals for an unexpected error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await request(
      appFor(new Error("SQLITE_CONSTRAINT: table expense")),
    ).get("/boom");

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe("INTERNAL_ERROR");
    expect(response.body.error.message).not.toContain("SQLITE");
    consoleError.mockRestore();
  });

  it("returns 500 for an error that carries a 500 status", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = Object.assign(new Error("db down"), { status: 500 });
    const response = await request(appFor(err)).get("/boom");

    expect(response.status).toBe(500);
    expect(response.body.error.message).not.toContain("db down");
    consoleError.mockRestore();
  });

  it("keeps the status and message of a client error", async () => {
    const err = Object.assign(new Error("You are not a member"), {
      status: 403,
      code: "FORBIDDEN",
    });
    const response = await request(appFor(err)).get("/boom");

    expect(response.status).toBe(403);
    expect(response.body.error).toEqual({
      code: "FORBIDDEN",
      message: "You are not a member",
    });
  });

  it("reports a schema failure as a 400 naming the field", async () => {
    const schema = z.object({ amountPaise: z.number().int().positive() });
    const response = await request(
      appFor(
        (() => {
          try {
            schema.parse({ amountPaise: -1 });
          } catch (e) {
            return e;
          }
        })(),
      ),
    ).get("/boom");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.message).toContain("amountPaise");
  });
});

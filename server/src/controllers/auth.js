import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });
const tokenFor = (u) =>
  jwt.sign(
    { id: u.id, email: u.email },
    process.env.JWT_SECRET || "change-me",
    { expiresIn: "7d" },
  );
const registerInput = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});
const loginInput = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});
export async function register(req, res) {
  const { name, email, password } = registerInput.parse(req.body);
  if (await prisma.user.findUnique({ where: { email } }))
    return res.status(409).json({
      error: { code: "DUPLICATE_EMAIL", message: "Email already registered" },
    });
  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
  });
  res.status(201).json({ user: publicUser(user), token: tokenFor(user) });
}
export async function login(req, res) {
  const { email, password } = loginInput.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (
    !user ||
    !(await bcrypt.compare(password || "", user.passwordHash))
  )
    return res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Email or password is incorrect",
      },
    });
  res.json({ user: publicUser(user), token: tokenFor(user) });
}
export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ user: publicUser(user) });
}

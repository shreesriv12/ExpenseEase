import { prisma } from "../src/config/prisma.js";

export default async function teardown() {
  await prisma.$disconnect();
}

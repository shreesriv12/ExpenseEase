import { prisma } from "../config/prisma.js";

function httpError(status, code, message) {
  return Object.assign(new Error(message), { status, code });
}

// Single source of truth for the member shape. Every group response must
// expose members as { userId, role, user: { id, name, email } } so the
// client can read member.user.id / member.user.name consistently.
const memberUser = { user: { select: { id: true, name: true, email: true } } };
// Used where members are a nested relation on Group.
const membersRelation = { include: memberUser };

export async function requireMembership(groupId, userId) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership)
    throw httpError(403, "FORBIDDEN", "You are not a member of this group");
  return membership;
}

export async function listGroups(userId) {
  return prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: { members: membersRelation },
    orderBy: { createdAt: "desc" },
  });
}

export async function createGroup(userId, data) {
  return prisma.group.create({
    data: {
      name: data.name,
      description: data.description || null,
      createdById: userId,
      members: { create: { userId, role: "ADMIN" } },
    },
    include: { members: membersRelation },
  });
}

export async function getGroup(groupId, userId) {
  await requireMembership(groupId, userId);
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: membersRelation },
  });
  if (!group) throw httpError(404, "NOT_FOUND", "Group not found");
  return group;
}

export async function addMember(groupId, actorId, email) {
  const actor = await requireMembership(groupId, actorId);
  if (actor.role !== "ADMIN")
    throw httpError(403, "FORBIDDEN", "Only group admins can add members");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    throw httpError(
      404,
      "USER_NOT_FOUND",
      "User must register before being added",
    );
  const exists = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });
  if (exists)
    throw httpError(409, "DUPLICATE_MEMBER", "User is already a group member");
  return prisma.groupMember.create({
    data: { groupId, userId: user.id },
    include: memberUser,
  });
}

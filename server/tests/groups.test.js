import { describe, expect, it, vi, beforeEach } from 'vitest';

const prisma = {
  groupMember: { findUnique: vi.fn(), create: vi.fn() },
  user: { findUnique: vi.fn() },
  group: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
};
vi.mock('../src/config/prisma.js', () => ({ prisma }));
const groups = await import('../src/services/groups.js');

beforeEach(() => vi.resetAllMocks());
describe('group service', () => {
  it('makes the creator an admin', async () => {
    prisma.group.create.mockResolvedValue({ id: 1, name: 'Trip' });
    await groups.createGroup(7, { name: 'Trip' });
    expect(prisma.group.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ members: { create: { userId: 7, role: 'ADMIN' } } }) }));
  });
  it('rejects a non-admin adding members', async () => {
    prisma.groupMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
    await expect(groups.addMember(1, 2, 'new@example.com')).rejects.toMatchObject({ status: 403 });
  });
  it('requires a registered user and prevents duplicates', async () => {
    prisma.groupMember.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
    prisma.user.findUnique.mockResolvedValue({ id: 8 });
    prisma.groupMember.findUnique.mockResolvedValueOnce({ userId: 8 });
    await expect(groups.addMember(1, 2, 'new@example.com')).rejects.toMatchObject({ code: 'DUPLICATE_MEMBER' });
  });
});

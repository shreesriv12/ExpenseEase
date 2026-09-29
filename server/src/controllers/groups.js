import { z } from 'zod';
import * as groups from '../services/groups.js';

const groupInput = z.object({ name: z.string().trim().min(1).max(100), description: z.string().trim().max(500).optional() });
const memberInput = z.object({ email: z.string().email() });
const id = value => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw Object.assign(new Error('Invalid id'), { status: 400, code: 'VALIDATION_ERROR' });
  return parsed;
};

export async function list(req, res) { res.json({ groups: await groups.listGroups(req.user.id) }); }
export async function create(req, res) { res.status(201).json({ group: await groups.createGroup(req.user.id, groupInput.parse(req.body)) }); }
export async function get(req, res) { res.json({ group: await groups.getGroup(id(req.params.id), req.user.id) }); }
export async function addMember(req, res) {
  const member = await groups.addMember(id(req.params.id), req.user.id, memberInput.parse(req.body).email);
  res.status(201).json({ member });
}

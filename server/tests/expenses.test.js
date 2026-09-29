import { describe, expect, it, vi, beforeEach } from 'vitest';
const prisma={groupMember:{findUnique:vi.fn(),findMany:vi.fn()},expense:{findUnique:vi.fn()}};
vi.mock('../src/config/prisma.js',()=>({prisma}));
const expenses=await import('../src/services/expenses.js');
beforeEach(()=>vi.resetAllMocks());
describe('expense authorization',()=>{
 it('rejects non-members before listing',async()=>{prisma.groupMember.findUnique.mockResolvedValue(null);await expect(expenses.listExpenses(1,2)).rejects.toMatchObject({status:403});});
 it('rejects a member changing another users expense',async()=>{prisma.expense.findUnique.mockResolvedValue({id:3,groupId:1,createdById:7});prisma.groupMember.findUnique.mockResolvedValue({role:'MEMBER'});await expect(expenses.updateExpense(3,2,{})).rejects.toMatchObject({status:403});});
 it('allows a creator to delete and records activity',async()=>{prisma.expense.findUnique.mockResolvedValue({id:3,groupId:1,createdById:2,description:'Lunch'});prisma.groupMember.findUnique.mockResolvedValue({role:'MEMBER'});const tx={expense:{delete:vi.fn()},activity:{create:vi.fn()}};prisma.$transaction=vi.fn(fn=>fn(tx));await expenses.deleteExpense(3,2);expect(tx.expense.delete).toHaveBeenCalledWith({where:{id:3}});expect(tx.activity.create).toHaveBeenCalled();});
});

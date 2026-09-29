import { Router } from 'express';
import * as controller from '../controllers/expenses.js';
import { auth } from '../middleware/auth.js';
export const expenseRoutes=Router();
expenseRoutes.get('/groups/:id/expenses',auth,controller.list);
expenseRoutes.post('/groups/:id/expenses',auth,controller.create);
expenseRoutes.put('/expenses/:id',auth,controller.update);
expenseRoutes.delete('/expenses/:id',auth,controller.remove);

import { Router } from 'express';
import * as controller from '../controllers/groupData.js';
import { auth } from '../middleware/auth.js';
export const groupDataRoutes=Router();
groupDataRoutes.get('/groups/:id/balances',auth,controller.balances);
groupDataRoutes.post('/groups/:id/settlements',auth,controller.createSettlement);
groupDataRoutes.get('/groups/:id/activity',auth,controller.activity);
groupDataRoutes.get('/dashboard/summary',auth,controller.dashboard);

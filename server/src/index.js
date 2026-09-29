import 'dotenv/config';import { app } from './app.js';app.listen(process.env.PORT||3001,()=>console.info('ExpenseEase API ready'));

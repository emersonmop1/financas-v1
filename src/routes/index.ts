import { Router } from 'express';
import authRoutes from './auth.routes';
import accountRoutes from './account.routes';
import transactionRoutes from './transaction.routes';
import categoryRoutes from './category.routes';
import reportRoutes from './report.routes';
import creditCardRoutes from './creditCard.routes';
import goalRoutes from './goal.routes';
import invoiceRoutes from './invoice.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/reports', reportRoutes);
router.use('/credit-cards', creditCardRoutes);
router.use('/goals', goalRoutes);
router.use('/invoices', invoiceRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

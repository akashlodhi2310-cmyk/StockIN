/**
 * subscription.routes.ts
 *
 * User-facing subscription and payment routes.
 * All routes require standard authentication (requireAuth).
 * 
 * GET  /api/v1/subscription/status    — Get current plan + usage
 * GET  /api/v1/subscription/payments  — Get user's own payment requests
 * POST /api/v1/subscription/payment   — Submit a new payment request
 * POST /api/v1/subscription/payment/:id/cancel — Cancel pending payment
 */

import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { getUsageStats, getUserSubscription } from '../services/subscriptionPlan.service';
import { submitPayment, getUserPayments, cancelPayment } from '../services/planPayments.service';
import { getPlatformSettings } from '../services/platformSettings.service';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/subscription/status
// Returns: current plan, usage counts, limits, and payment config
// ─────────────────────────────────────────────────────────────────────────────
router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [subscription, usage, settings] = await Promise.all([
      getUserSubscription(userId),
      getUsageStats(userId),
      getPlatformSettings(),
    ]);

    const s = settings as any;

    sendSuccess(res, {
      subscription,
      usage: {
        productsUsed: usage.productsUsed,
        invoicesUsed: usage.invoicesUsed,
        maxProducts: usage.limits.maxProducts,
        maxInvoices: usage.limits.maxInvoices,
        canCreateProduct: usage.canCreateProduct,
        canCreateInvoice: usage.canCreateInvoice,
        isPro: usage.limits.isPro,
        planName: usage.limits.planName,
      },
      paymentConfig: {
        upiId: s.payment_upi_id || '',
        qrCodeUrl: s.payment_qr_code_url || '',
        proPrice: s.pro_price ?? 999,
        paymentInstructions: s.payment_instructions || '',
      },
    });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch subscription status', 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/subscription/payments
// Returns the user's own payment history
// ─────────────────────────────────────────────────────────────────────────────
router.get('/payments', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payments = await getUserPayments(req.user!.id);
    sendSuccess(res, payments);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch payment history', 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/subscription/payment
// Submit a new payment request (UTR + optional proof)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/payment', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { amount, utrNumber, paymentDate, proofUrl } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      sendError(res, 'Valid payment amount is required', 400);
      return;
    }

    const payment = await submitPayment(userId, {
      amount: Number(amount),
      utrNumber: utrNumber?.toString().trim() || undefined,
      paymentDate: paymentDate || undefined,
      proofUrl: proofUrl || undefined,
    });

    sendSuccess(res, payment, 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to submit payment', 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/subscription/payment/:id/cancel
// Cancel a pending payment request
// ─────────────────────────────────────────────────────────────────────────────
router.post('/payment/:id/cancel', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const paymentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await cancelPayment(paymentId, req.user!.id);
    sendSuccess(res, { success: true, message: 'Payment request cancelled.' });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to cancel payment', 500);
  }
});

export default router;

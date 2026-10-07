import { Router, Response } from 'express';
import { requireMasterAdmin } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { getPlatformSettings, updatePlatformSettings } from '../services/platformSettings.service';
import { listAllUsers, updateUserStatus, deleteUserAccount } from '../services/userManagement.service';
import { listAllBusinesses, updateBusinessStatus } from '../services/businessManagement.service';
import { getPlatformAnalytics } from '../services/analytics.service';
import { getStorageOverview } from '../services/storageManagement.service';
import { getAnnouncements, createAnnouncement, toggleAnnouncement, deleteAnnouncement } from '../services/announcements.service';
import { getAuditLogs } from '../services/auditLog.service';
import { getLiveDiagnostics } from '../services/systemHealth.service';

const router = Router();

// Apply Master Admin middleware to ALL routes in this file
router.use(requireMasterAdmin);

// GET /api/v1/admin/auth/verify
// Checks if caller has verified Master Admin access
router.get('/auth/verify', (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, {
    authenticated: true,
    user: req.user,
    role: 'master_admin',
  });
});

// GET /api/v1/admin/settings
router.get('/settings', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await getPlatformSettings();
    sendSuccess(res, settings);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch settings', 500);
  }
});

// PATCH /api/v1/admin/settings
router.patch('/settings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updates = req.body || {};
    const updated = await updatePlatformSettings(updates, {
      id: req.user?.id,
      email: req.user?.email,
      ip: req.ip,
    });
    sendSuccess(res, updated);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update settings', 500);
  }
});

// GET /api/v1/admin/analytics
router.get('/analytics', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = await getPlatformAnalytics();
    sendSuccess(res, analytics);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch analytics', 500);
  }
});

// GET /api/v1/admin/users
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const users = await listAllUsers({ search, status });
    sendSuccess(res, users);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch users', 500);
  }
});

// PATCH /api/v1/admin/users/:id/status
router.patch('/users/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { isSuspended, reason } = req.body;
    if (typeof isSuspended !== 'boolean') {
      sendError(res, 'isSuspended (boolean) is required', 400);
      return;
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await updateUserStatus(id, isSuspended, reason, {
      id: req.user?.id,
      email: req.user?.email,
      ip: req.ip,
    });
    sendSuccess(res, { success: true });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update user status', 500);
  }
});

// DELETE /api/v1/admin/users/:id
router.delete('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteUserAccount(id, {
      id: req.user?.id,
      email: req.user?.email,
      ip: req.ip,
    });
    sendSuccess(res, { success: true });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to delete user', 500);
  }
});

// GET /api/v1/admin/businesses
router.get('/businesses', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const businesses = await listAllBusinesses({ search, status });
    sendSuccess(res, businesses);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch businesses', 500);
  }
});

// PATCH /api/v1/admin/businesses/:id/status
router.patch('/businesses/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { isSuspended, reason } = req.body;
    if (typeof isSuspended !== 'boolean') {
      sendError(res, 'isSuspended (boolean) is required', 400);
      return;
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await updateBusinessStatus(id, isSuspended, reason, {
      id: req.user?.id,
      email: req.user?.email,
      ip: req.ip,
    });
    sendSuccess(res, { success: true });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update business status', 500);
  }
});

// GET /api/v1/admin/storage
router.get('/storage', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const storage = await getStorageOverview();
    sendSuccess(res, storage);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch storage usage', 500);
  }
});

// GET /api/v1/admin/announcements
router.get('/announcements', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const announcements = await getAnnouncements();
    sendSuccess(res, announcements);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch announcements', 500);
  }
});

// POST /api/v1/admin/announcements
router.post('/announcements', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, message, type, target, target_id, expires_at } = req.body;
    if (!title || !message) {
      sendError(res, 'Title and message are required', 400);
      return;
    }
    const created = await createAnnouncement({
      title,
      message,
      type: type || 'info',
      target: target || 'all',
      target_id: target_id || null,
      is_active: true,
      expires_at: expires_at || null,
    }, {
      id: req.user?.id,
      email: req.user?.email,
      ip: req.ip,
    });
    sendSuccess(res, created, 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create announcement', 500);
  }
});

// PATCH /api/v1/admin/announcements/:id/toggle
router.patch('/announcements/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      sendError(res, 'is_active (boolean) is required', 400);
      return;
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await toggleAnnouncement(id, is_active, {
      id: req.user?.id,
      email: req.user?.email,
      ip: req.ip,
    });
    if (!updated) {
      sendError(res, 'Announcement not found', 404);
      return;
    }
    sendSuccess(res, updated);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update announcement', 500);
  }
});

// DELETE /api/v1/admin/announcements/:id
router.delete('/announcements/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const success = await deleteAnnouncement(id, {
      id: req.user?.id,
      email: req.user?.email,
      ip: req.ip,
    });
    if (!success) {
      sendError(res, 'Announcement not found', 404);
      return;
    }
    sendSuccess(res, { success: true });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to delete announcement', 500);
  }
});

// GET /api/v1/admin/audit-logs
router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string || '50', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);
    const action = req.query.action as string | undefined;
    const search = req.query.search as string | undefined;
    const result = await getAuditLogs({ limit, offset, action, search });
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch audit logs', 500);
  }
});

// GET /api/v1/admin/health & /health-diagnostics
const handleHealthDiagnostics = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const diagnostics = await getLiveDiagnostics();
    sendSuccess(res, diagnostics);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to run health diagnostics', 500);
  }
};
router.get('/health', handleHealthDiagnostics);
router.get('/health-diagnostics', handleHealthDiagnostics);

// GET /api/v1/admin/feature-flags
router.get('/feature-flags', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await getPlatformSettings();
    sendSuccess(res, settings.feature_flags);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch feature flags', 500);
  }
});

// PATCH /api/v1/admin/feature-flags
router.patch('/feature-flags', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const flags = req.body || {};
    const updated = await updatePlatformSettings({ feature_flags: flags }, {
      id: req.user?.id,
      email: req.user?.email,
      ip: req.ip,
    });
    sendSuccess(res, updated.feature_flags);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update feature flags', 500);
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { getPlatformSettings, getPublicSettingsView } from '../services/platformSettings.service';
import { getAnnouncements } from '../services/announcements.service';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// GET /api/v1/platform/config
// Public endpoint for both frontend and admin-frontend
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const settings = await getPlatformSettings();
    sendSuccess(res, getPublicSettingsView(settings));
  } catch (err: any) {
    sendError(res, err.message || 'Failed to retrieve platform configuration', 500);
  }
});

// GET /api/v1/platform/announcements
// Returns currently active announcements
router.get('/announcements', async (_req: Request, res: Response) => {
  try {
    const announcements = await getAnnouncements({ activeOnly: true });
    sendSuccess(res, announcements);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to retrieve announcements', 500);
  }
});

// POST & GET /api/v1/platform/check-registration
// Validates whether new registrations are permitted
const handleCheckRegistration = async (_req: Request, res: Response) => {
  try {
    const settings = await getPlatformSettings();
    if (!settings.allow_new_registrations) {
      res.status(403).json({
        success: false,
        code: 'REGISTRATION_DISABLED',
        message: 'New registrations are currently disabled by the administrator.',
      });
      return;
    }
    sendSuccess(res, { allowed: true });
  } catch (err: any) {
    sendError(res, err.message || 'Check failed', 500);
  }
};
router.post('/check-registration', handleCheckRegistration);
router.get('/check-registration', handleCheckRegistration);

// POST & GET /api/v1/platform/check-login
// Validates whether login is permitted
const handleCheckLogin = async (req: Request, res: Response) => {
  try {
    const settings = await getPlatformSettings();
    const email = (req.body?.email || req.query?.email) as string | undefined;

    const adminEmails = (process.env.MASTER_ADMIN_EMAILS || 'lodhi@gmail.com')
      .toLowerCase()
      .split(',')
      .map(e => e.trim());

    const isMasterAdminEmail = email && adminEmails.includes(email.toLowerCase());

    if (!settings.allow_user_login && !isMasterAdminEmail) {
      res.status(403).json({
        success: false,
        code: 'LOGIN_DISABLED',
        message: 'User login is currently disabled by the administrator.',
      });
      return;
    }
    sendSuccess(res, { allowed: true });
  } catch (err: any) {
    sendError(res, err.message || 'Check failed', 500);
  }
};
router.post('/check-login', handleCheckLogin);
router.get('/check-login', handleCheckLogin);

export default router;

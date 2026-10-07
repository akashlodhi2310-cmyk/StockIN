import { Response, NextFunction } from 'express';
import { getSupabaseAdmin, getSupabaseAnon } from '../services/supabase.service';
import { AuthenticatedRequest } from '../types';
import { sendError } from '../utils/response';
import { getPlatformSettings } from '../services/platformSettings.service';
import { isUserSuspended } from '../services/userManagement.service';
import { createAuditLog } from '../services/auditLog.service';
import { logger } from '../utils/logger';

export async function isMasterAdmin(userId: string, email?: string): Promise<boolean> {
  const adminEmails = (process.env.MASTER_ADMIN_EMAILS || 'lodhi@gmail.com')
    .toLowerCase()
    .split(',')
    .map(e => e.trim());

  if (email && adminEmails.includes(email.toLowerCase())) {
    return true;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) return true;
  } catch {}

  return false;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Missing or invalid Authorization header', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const supabase = getSupabaseAnon();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      sendError(res, 'Unauthorized or expired session token', 401);
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    sendError(res, message, 401);
  }
}

export async function requireMasterAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Master Admin authorization required', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      sendError(res, 'Invalid or expired Master Admin token', 401);
      return;
    }

    const authorized = await isMasterAdmin(user.id, user.email);
    if (!authorized) {
      logger.warn(`Unauthorized Master Admin access attempt by user ${user.id} (${user.email})`);
      await createAuditLog({
        admin_id: user.id,
        admin_email: user.email || null,
        action: 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
        target_type: 'api',
        target_id: req.originalUrl,
        ip_address: req.ip,
      });

      res.status(403).json({
        success: false,
        code: 'FORBIDDEN_NOT_MASTER_ADMIN',
        error: 'Forbidden: You do not possess Master Admin privileges.',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: 'master_admin',
    };
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Master Admin verification failed';
    sendError(res, message, 401);
  }
}

// Middleware: Rejects non-admin requests if maintenance mode is enabled
export async function enforceMaintenanceMode(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const settings = await getPlatformSettings();
  if (!settings.maintenance_mode) {
    return next();
  }

  // Check if caller is Master Admin (exempt from maintenance mode)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const supabase = getSupabaseAdmin();
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user && await isMasterAdmin(user.id, user.email)) {
        return next();
      }
    } catch {}
  }

  res.status(503).json({
    success: false,
    code: 'MAINTENANCE_MODE_ACTIVE',
    message: settings.maintenance_message || 'Platform is temporarily under maintenance. Please try again later.',
  });
}

// Middleware: Rejects requests from suspended users
export async function enforceUserSuspension(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.user?.id) {
    if (isUserSuspended(req.user.id)) {
      res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        error: 'Your account has been suspended by the platform administrator.',
      });
      return;
    }
  }
  next();
}

import { getSupabaseAdmin } from './supabase.service';
import { getPlatformSettings } from './platformSettings.service';
import { getAuditLogs } from './auditLog.service';

export interface HealthDiagnostics {
  status: 'healthy' | 'degraded' | 'maintenance';
  timestamp: string;
  uptimeSeconds: number;
  memoryUsageMb: number;
  environment: string;
  nodeVersion: string;
  components: {
    backendApi: { status: 'online' | 'offline'; responseTimeMs: number };
    database: { status: 'online' | 'degraded' | 'offline'; responseTimeMs: number; details?: string };
    authService: { status: 'online' | 'offline'; responseTimeMs: number };
    storageService: { status: 'online' | 'offline'; responseTimeMs: number };
  };
  platformControls: {
    maintenanceMode: boolean;
    allowRegistrations: boolean;
    allowUserLogin: boolean;
    systemAlertActive: boolean;
  };
  recentLogs: Array<{
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    source: string;
    message: string;
  }>;
}

export async function getLiveDiagnostics(): Promise<HealthDiagnostics> {
  const startTime = Date.now();
  const supabase = getSupabaseAdmin();
  const settings = await getPlatformSettings();

  // 1. Check Database latency
  let dbStatus: 'online' | 'degraded' | 'offline' = 'online';
  let dbLatency = 0;
  let dbDetails = 'Connected to PostgreSQL';
  try {
    const t0 = Date.now();
    const { error } = await supabase.from('platform_settings').select('id').limit(1);
    dbLatency = Date.now() - t0;
    if (error && error.code !== 'PGRST116') {
      dbStatus = 'degraded';
      dbDetails = error.message;
    }
  } catch (err: any) {
    dbStatus = 'offline';
    dbDetails = err.message || 'Connection timeout';
  }

  // 2. Check Auth Service latency
  let authStatus: 'online' | 'offline' = 'online';
  let authLatency = 0;
  try {
    const t0 = Date.now();
    await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    authLatency = Date.now() - t0;
  } catch {
    authStatus = 'offline';
  }

  // 3. Check Storage Service latency
  let storageStatus: 'online' | 'offline' = 'online';
  let storageLatency = 0;
  try {
    const t0 = Date.now();
    await supabase.storage.listBuckets();
    storageLatency = Date.now() - t0;
  } catch {
    storageStatus = 'offline';
  }

  // 4. Read recent audit events as live system logs
  const { logs: auditList } = await getAuditLogs({ limit: 10 });
  const recentLogs = auditList.map(l => ({
    timestamp: l.created_at,
    level: (l.action.includes('SUSPEND') || l.action.includes('DELETED') ? 'WARN' : 'INFO') as 'INFO' | 'WARN',
    source: 'ADMIN_AUDIT',
    message: `${l.action} by ${l.admin_email || 'System'} ${l.target_type ? `[${l.target_type}]` : ''}`,
  }));

  if (recentLogs.length === 0) {
    recentLogs.push({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      source: 'SERVER',
      message: 'StockIN companion daemon running normally',
    });
  }

  const memory = process.memoryUsage();
  const memoryMb = parseFloat((memory.rss / (1024 * 1024)).toFixed(1));

  const overallStatus = settings.maintenance_mode
    ? 'maintenance'
    : dbStatus === 'offline' || authStatus === 'offline'
    ? 'degraded'
    : 'healthy';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMb: memoryMb,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    components: {
      backendApi: {
        status: 'online',
        responseTimeMs: Math.max(1, Date.now() - startTime),
      },
      database: {
        status: dbStatus,
        responseTimeMs: Math.max(1, dbLatency),
        details: dbDetails,
      },
      authService: {
        status: authStatus,
        responseTimeMs: Math.max(1, authLatency),
      },
      storageService: {
        status: storageStatus,
        responseTimeMs: Math.max(1, storageLatency),
      },
    },
    platformControls: {
      maintenanceMode: settings.maintenance_mode,
      allowRegistrations: settings.allow_new_registrations,
      allowUserLogin: settings.allow_user_login,
      systemAlertActive: settings.system_alert_enabled,
    },
    recentLogs,
  };
}

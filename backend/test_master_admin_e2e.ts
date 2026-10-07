import { getSupabaseAnon } from './src/services/supabase.service';

const BACKEND_URL = 'http://localhost:3001';

async function runTests() {
  console.log('=== STARTING MASTER ADMIN E2E TEST SUITE ===\n');

  // 1. Authenticate as Master Admin
  console.log('1. Authenticating as Master Admin (lodhi@gmail.com)...');
  const sbAnon = getSupabaseAnon();
  const { data: authData, error: authError } = await sbAnon.auth.signInWithPassword({
    email: 'lodhi@gmail.com',
    password: 'MasterAdmin@2026!'
  });

  if (authError || !authData.session) {
    console.error('FAILED to authenticate Master Admin:', authError);
    process.exit(1);
  }
  const token = authData.session.access_token;
  console.log('✓ Master Admin JWT obtained successfully.\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Test Master Admin Settings GET
  console.log('2. Fetching platform settings (GET /api/v1/admin/settings)...');
  const settingsRes = await fetch(`${BACKEND_URL}/api/v1/admin/settings`, { headers });
  const settingsJson = await settingsRes.json();
  console.log(`Status: ${settingsRes.status}`);
  if (!settingsJson.success) throw new Error('Settings GET failed');
  console.log('Current settings:', JSON.stringify(settingsJson.data, null, 2));
  console.log('✓ Platform settings retrieved.\n');

  // 3. Test Master Admin Settings PATCH (Toggle maintenance, alert, feature flags)
  console.log('3. Updating platform settings (PATCH /api/v1/admin/settings)...');
  const patchRes = await fetch(`${BACKEND_URL}/api/v1/admin/settings`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      maintenance_mode: true,
      maintenance_message: 'StockIN is undergoing emergency scheduled maintenance.',
      allow_new_registrations: false,
      system_alert_enabled: true,
      system_alert_message: 'Global Maintenance Alert Test',
      system_alert_severity: 'warning'
    })
  });
  const patchJson = await patchRes.json();
  console.log(`Status: ${patchRes.status}`);
  if (!patchJson.success) throw new Error('Settings PATCH failed');
  console.log('✓ Platform settings updated.\n');

  // 4. Verify public platform config reflects changes
  console.log('4. Verifying public platform config (GET /api/v1/platform/config)...');
  const publicConfigRes = await fetch(`${BACKEND_URL}/api/v1/platform/config`);
  const publicConfig = await publicConfigRes.json();
  console.log('Public config maintenance_mode:', publicConfig.data.maintenance_mode);
  console.log('Public config allow_new_registrations:', publicConfig.data.allow_new_registrations);
  console.log('Public config system_alert_message:', publicConfig.data.system_alert_message);
  if (publicConfig.data.maintenance_mode !== true || publicConfig.data.allow_new_registrations !== false) {
    throw new Error('Public config does not match saved settings!');
  }
  console.log('✓ Public config matches database/backend settings.\n');

  // 5. Test Registration blocked check
  console.log('5. Testing check-registration endpoint (GET /api/v1/platform/check-registration)...');
  const regCheckRes = await fetch(`${BACKEND_URL}/api/v1/platform/check-registration`);
  const regCheck = await regCheckRes.json();
  console.log('Registration check result:', regCheck);
  if (regCheck.code !== 'REGISTRATION_DISABLED') throw new Error('Registration should be disallowed');
  console.log('✓ Registration blocking verified.\n');

  // 6. Test Users API
  console.log('6. Fetching users list (GET /api/v1/admin/users)...');
  const usersRes = await fetch(`${BACKEND_URL}/api/v1/admin/users`, { headers });
  const usersJson = await usersRes.json();
  console.log(`Status: ${usersRes.status}, Total users: ${usersJson.data?.length}`);
  if (!usersJson.success) throw new Error('Users GET failed');
  console.log('✓ Users list retrieved.\n');

  // 7. Test Businesses API
  console.log('7. Fetching businesses list (GET /api/v1/admin/businesses)...');
  const bizRes = await fetch(`${BACKEND_URL}/api/v1/admin/businesses`, { headers });
  const bizJson = await bizRes.json();
  console.log(`Status: ${bizRes.status}, Total businesses: ${bizJson.data?.length}`);
  if (!bizJson.success) throw new Error('Businesses GET failed');
  console.log('✓ Businesses list retrieved.\n');

  // 8. Test Analytics API
  console.log('8. Fetching analytics KPIs (GET /api/v1/admin/analytics)...');
  const analyticsRes = await fetch(`${BACKEND_URL}/api/v1/admin/analytics`, { headers });
  const analyticsJson = await analyticsRes.json();
  console.log(`Status: ${analyticsRes.status}`);
  console.log('Analytics KPIs:', analyticsJson.data?.kpis);
  if (!analyticsJson.success || !analyticsJson.data?.kpis) throw new Error('Analytics GET failed');
  console.log('✓ Analytics retrieved.\n');

  // 9. Test Storage API
  console.log('9. Fetching storage metrics (GET /api/v1/admin/storage)...');
  const storageRes = await fetch(`${BACKEND_URL}/api/v1/admin/storage`, { headers });
  const storageJson = await storageRes.json();
  console.log(`Status: ${storageRes.status}`);
  console.log('Storage totals:', {
    totalStorageBytes: storageJson.data?.totalStorageBytes,
    totalStorageMb: storageJson.data?.totalStorageMb,
    bucketCount: storageJson.data?.buckets?.length,
    largestFilesCount: storageJson.data?.largestFiles?.length
  });
  if (!storageJson.success || typeof storageJson.data?.totalStorageBytes !== 'number') throw new Error('Storage GET failed');
  console.log('✓ Storage metrics retrieved.\n');

  // 10. Test System Health API
  console.log('10. Fetching system health (GET /api/v1/admin/health)...');
  const healthRes = await fetch(`${BACKEND_URL}/api/v1/admin/health`, { headers });
  const healthJson = await healthRes.json();
  console.log(`Status: ${healthRes.status}`);
  console.log('Health checks:', healthJson.data?.checks);
  if (!healthJson.success) throw new Error('Health check failed');
  console.log('✓ System health diagnostics verified.\n');

  // 11. Test Announcements creation and retrieval
  console.log('11. Creating broadcast announcement (POST /api/v1/admin/announcements)...');
  const annCreateRes = await fetch(`${BACKEND_URL}/api/v1/admin/announcements`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Scheduled System Maintenance Tonight',
      message: 'All servers will undergo brief performance optimization.',
      type: 'warning',
      target: 'all'
    })
  });
  const annCreateJson = await annCreateRes.json();
  console.log(`Status: ${annCreateRes.status}`);
  if (!annCreateJson.success) throw new Error('Announcement creation failed');
  console.log('✓ Announcement created.\n');

  console.log('12. Fetching public announcements (GET /api/v1/platform/announcements)...');
  const publicAnnRes = await fetch(`${BACKEND_URL}/api/v1/platform/announcements`);
  const publicAnnJson = await publicAnnRes.json();
  console.log(`Status: ${publicAnnRes.status}, count: ${publicAnnJson.data?.length}`);
  if (!publicAnnJson.data?.some((a: any) => a.title.includes('Scheduled System Maintenance'))) {
    throw new Error('Newly created announcement not found in public feed!');
  }
  console.log('✓ Public announcement feed verified.\n');

  // 13. Test Audit Logs API
  console.log('13. Fetching audit logs (GET /api/v1/admin/audit-logs)...');
  const auditRes = await fetch(`${BACKEND_URL}/api/v1/admin/audit-logs`, { headers });
  const auditJson = await auditRes.json();
  console.log(`Status: ${auditRes.status}, total logs: ${auditJson.data?.length}`);
  console.log('Latest log action:', auditJson.data?.[0]?.action);
  if (!auditJson.success || auditJson.data?.length === 0) throw new Error('Audit logs verification failed');
  console.log('✓ Audit logging verified.\n');

  // 14. Reset Maintenance mode to false so the platform remains operational
  console.log('14. Restoring platform settings back to operational...');
  const resetRes = await fetch(`${BACKEND_URL}/api/v1/admin/settings`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      maintenance_mode: false,
      allow_new_registrations: true,
      system_alert_enabled: false
    })
  });
  const resetJson = await resetRes.json();
  if (!resetJson.success) throw new Error('Reset failed');
  console.log('✓ Settings restored to operational state.\n');

  console.log('🎉 ALL 14 MASTER ADMIN API TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});

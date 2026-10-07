import { getSupabaseAdmin } from './supabase.service';
import { getPlatformSettings } from './platformSettings.service';
import { logger } from '../utils/logger';

export interface StorageStats {
  totalStorageBytes: number;
  totalStorageMb: number;
  maxStorageLimitMb: number;
  totalFileCount: number;
  databaseSizeBytes: number;
  databaseSizeMb: number;
  buckets: Array<{
    id: string;
    name: string;
    isPublic: boolean;
    fileCount: number;
    totalSizeBytes: number;
  }>;
  largestFiles: Array<{
    name: string;
    bucketId: string;
    sizeBytes: number;
    sizeFormatted: string;
    createdAt: string;
    mimeType?: string;
  }>;
  usageByTenant: Array<{
    tenantName: string;
    fileCount: number;
    storageUsedMb: number;
    quotaMb: number;
    percentage: number;
    status: 'normal' | 'warning' | 'critical';
  }>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export async function getStorageOverview(): Promise<StorageStats> {
  const supabase = getSupabaseAdmin();
  const settings = await getPlatformSettings();

  let buckets: any[] = [];
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (!error && data) {
      buckets = data;
    }
  } catch (err) {
    logger.warn('Failed to list storage buckets', err);
  }

  // If no buckets exist yet, note standard bucket
  if (buckets.length === 0) {
    buckets = [{ id: 'documents', name: 'documents', public: false, created_at: new Date().toISOString() }];
  }

  let totalBytes = 0;
  let totalFiles = 0;
  const largestFiles: any[] = [];
  const bucketSummaries: any[] = [];

  for (const b of buckets) {
    let bucketBytes = 0;
    let bucketFiles = 0;

    try {
      const { data: files } = await supabase.storage.from(b.id).list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (files) {
        for (const file of files) {
          if (file.id && file.metadata) {
            const size = file.metadata.size || 0;
            bucketBytes += size;
            bucketFiles += 1;
            largestFiles.push({
              name: file.name,
              bucketId: b.id,
              sizeBytes: size,
              sizeFormatted: formatBytes(size),
              createdAt: file.created_at || new Date().toISOString(),
              mimeType: file.metadata.mimetype,
            });
          }
        }
      }
    } catch {}

    totalBytes += bucketBytes;
    totalFiles += bucketFiles;

    bucketSummaries.push({
      id: b.id,
      name: b.name,
      isPublic: b.public || false,
      fileCount: bucketFiles,
      totalSizeBytes: bucketBytes,
    });
  }

  largestFiles.sort((a, b) => b.sizeBytes - a.sizeBytes);

  // Estimate DB size based on row counts
  let dbRows = 0;
  try {
    const [pRes, bRes, iRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('business_settings').select('*', { count: 'exact', head: true }),
      supabase.from('invoices').select('*', { count: 'exact', head: true }),
    ]);
    dbRows = (pRes.count || 0) + (bRes.count || 0) + (iRes.count || 0);
  } catch {}

  const estimatedDbBytes = Math.max(1024 * 1024 * 5, dbRows * 1024 * 2); // At least 5MB base catalog

  return {
    totalStorageBytes: totalBytes,
    totalStorageMb: parseFloat((totalBytes / (1024 * 1024)).toFixed(2)),
    maxStorageLimitMb: settings.max_storage_per_business_mb * 10,
    totalFileCount: totalFiles,
    databaseSizeBytes: estimatedDbBytes,
    databaseSizeMb: parseFloat((estimatedDbBytes / (1024 * 1024)).toFixed(2)),
    buckets: bucketSummaries,
    largestFiles: largestFiles.slice(0, 10),
    usageByTenant: [
      {
        tenantName: 'Active Tenants Pool',
        fileCount: totalFiles,
        storageUsedMb: parseFloat((totalBytes / (1024 * 1024)).toFixed(2)),
        quotaMb: settings.max_storage_per_business_mb,
        percentage: Math.min(100, parseFloat(((totalBytes / (1024 * 1024 * settings.max_storage_per_business_mb)) * 100).toFixed(1))),
        status: (totalBytes / (1024 * 1024)) > settings.max_storage_per_business_mb * 0.85 ? 'critical' : 'normal',
      },
    ],
  };
}

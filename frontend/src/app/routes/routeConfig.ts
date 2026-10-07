/**
 * src/app/routes/routeConfig.ts
 *
 * Route path constants and definitions
 */

export const ROUTES = {
  // Public / Auth Routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Protected App Routes
  ROOT: '/',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_OF_SERVICE: '/terms-of-service',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  STOCK: '/stock',
  STOCK_IN: '/stock-in',
  BILLING: '/billing',
  QUOTATIONS: '/quotations',
  INVOICES: '/invoices',
  CUSTOMERS: '/customers',
  PAYMENTS: '/payments',
  REPORTS: '/reports',
  HISTORY: '/history',
  SETTINGS: '/settings',

  // Master Admin Route
  MASTER_ADMIN: '/master-admin',

  // Subscription / Upgrade
  UPGRADE: '/upgrade',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];

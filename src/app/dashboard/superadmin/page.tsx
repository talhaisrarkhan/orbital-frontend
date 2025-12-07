import { CONFIG } from 'src/config-global';

import { SuperAdminDashboardView } from 'src/sections/superadmin/view/superadmin-dashboard-view';

// ----------------------------------------------------------------------

export const metadata = { title: `SuperAdmin Dashboard - ${CONFIG.appName}` };

export default function SuperAdminDashboardPage() {
  return <SuperAdminDashboardView />;
}

import { CONFIG } from 'src/config-global';

import { AdminDashboardView } from 'src/sections/admin/view/admin-dashboard-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Dashboard | Admin - ${CONFIG.appName}` };

export default function AdminDashboardPage() {
  return <AdminDashboardView />;
}

import { CONFIG } from 'src/config-global';

import { CompanyListView } from 'src/sections/superadmin/company/view/company-list-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Companies | Dashboard - ${CONFIG.appName}` };

export default function CompanyListPage() {
  return <CompanyListView />;
}

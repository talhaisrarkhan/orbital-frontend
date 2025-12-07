import { CONFIG } from 'src/config-global';

import { CompanyCreateView } from 'src/sections/superadmin/company/view/company-create-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Create a new company | Dashboard - ${CONFIG.appName}` };

export default function CompanyCreatePage() {
  return <CompanyCreateView />;
}

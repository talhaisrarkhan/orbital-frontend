import { CONFIG } from 'src/config-global';

import { OrganizationView } from 'src/sections/organization';

// ----------------------------------------------------------------------

export const metadata = { title: `Organization - ${CONFIG.appName}` };

export default function Page() {
  return <OrganizationView />;
}

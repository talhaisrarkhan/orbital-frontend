import { CONFIG } from 'src/config-global';

import { ProjectListView } from 'src/sections/project';

// ----------------------------------------------------------------------

export const metadata = { title: `Projects | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <ProjectListView />;
}

import { CONFIG } from 'src/config-global';

import { ProjectDetailsView } from 'src/sections/project';

// ----------------------------------------------------------------------

export const metadata = { title: `Project Details | Dashboard - ${CONFIG.appName}` };

type Props = {
  params: { id: string };
};

export default function Page({ params }: Props) {
  const { id } = params;

  return <ProjectDetailsView projectId={id} />;
}

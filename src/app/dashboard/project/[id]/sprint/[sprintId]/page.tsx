import { CONFIG } from 'src/config-global';

import { SprintDetailsView } from 'src/sections/project';

// ----------------------------------------------------------------------

export const metadata = { title: `Sprint Details | Dashboard - ${CONFIG.appName}` };

type Props = {
  params: { id: string; sprintId: string };
};

export default function Page({ params }: Props) {
  const { id, sprintId } = params;

  return <SprintDetailsView projectId={id} sprintId={sprintId} />;
}

'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TeamNewEditForm } from '../team-new-edit-form';
import { useGetTeam } from 'src/api/team';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function TeamEditView({ id }: Props) {
  const { team } = useGetTeam(id);

  return (
    <DashboardContent>
      {/* <CustomBreadcrumbs
        heading="Edit"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Teams', href: paths.dashboard.team.root },
          { name: team?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      /> */}

      <TeamNewEditForm currentTeam={team} />
    </DashboardContent>
  );
}

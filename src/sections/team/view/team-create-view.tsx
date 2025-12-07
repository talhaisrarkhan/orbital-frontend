'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TeamNewEditForm } from '../team-new-edit-form';

// ----------------------------------------------------------------------

export function TeamCreateView() {
  return (
    <DashboardContent>
      {/* <CustomBreadcrumbs
        heading="Create a new team"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Teams', href: paths.dashboard.team.root },
          { name: 'New team' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      /> */}

      <TeamNewEditForm />
    </DashboardContent>
  );
}

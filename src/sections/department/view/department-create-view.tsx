'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DepartmentNewEditForm } from '../department-new-edit-form';

// ----------------------------------------------------------------------

export function DepartmentCreateView() {
  return (
    <DashboardContent>
      {/* <CustomBreadcrumbs
        heading="Create a new department"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Departments', href: paths.dashboard.department.root },
          { name: 'New department' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      /> */}

      <DepartmentNewEditForm />
    </DashboardContent>
  );
}

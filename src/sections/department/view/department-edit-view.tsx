'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DepartmentNewEditForm } from '../department-new-edit-form';
import { useGetDepartment } from 'src/api/department';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function DepartmentEditView({ id }: Props) {
  const { department } = useGetDepartment(id);

  return (
    <DashboardContent>
      {/* <CustomBreadcrumbs
        heading="Edit"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Departments', href: paths.dashboard.department.root },
          { name: department?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      /> */}

      <DepartmentNewEditForm currentDepartment={department} />
    </DashboardContent>
  );
}

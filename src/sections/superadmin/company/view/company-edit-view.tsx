'use client';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { getCompany } from 'src/api/company';
import type { ICompanyItem } from 'src/types/company';

import { CompanyNewEditForm } from '../company-new-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function CompanyEditView({ id }: Props) {
  const [currentCompany, setCurrentCompany] = useState<ICompanyItem | undefined>(undefined);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await getCompany(id);
        setCurrentCompany(data);
      } catch (error) {
        console.error('Failed to fetch company:', error);
      }
    };

    if (id) {
      fetchCompany();
    }
  }, [id]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Companies', href: '/dashboard/superadmin/companies' },
          { name: currentCompany?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CompanyNewEditForm currentCompany={currentCompany} />
    </DashboardContent>
  );
}

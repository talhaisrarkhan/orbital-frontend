import { CONFIG } from 'src/config-global';

import { CompanyEditView } from 'src/sections/superadmin/company/view/company-edit-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit company | Dashboard - ${CONFIG.appName}` };

type Props = {
  params: {
    id: string;
  };
};

export default function CompanyEditPage({ params }: Props) {
  const { id } = params;

  return <CompanyEditView id={id} />;
}

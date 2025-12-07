import { CONFIG } from 'src/config-global';

import { UserManagementView } from 'src/sections/admin/user/view/user-management-view';

// ----------------------------------------------------------------------

export const metadata = { title: `User Management | Admin - ${CONFIG.appName}` };

export default function UserManagementPage() {
  return <UserManagementView />;
}

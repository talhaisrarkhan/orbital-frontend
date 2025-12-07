import { CONFIG } from 'src/config-global';
import { DashboardLayout } from 'src/layouts/dashboard';

import { AuthGuard } from 'src/auth/guard';

import { NotificationProvider } from 'src/sections/notifications/notification-provider';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  if (CONFIG.auth.skip) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return (
    <AuthGuard>
      <NotificationProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </NotificationProvider>
    </AuthGuard>
  );
}

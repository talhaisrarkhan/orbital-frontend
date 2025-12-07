'use client';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';
import { UserRole, ROLE_DISPLAY_NAMES } from 'src/auth/rbac';

// ----------------------------------------------------------------------

export function SuperAdminDashboardView() {
  const router = useRouter();
  const { user } = useAuthContext();

  const handleNavigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  const superAdminCards = [
    {
      title: 'Company Management',
      description: 'Create, edit, and manage all companies on the platform',
      icon: 'solar:buildings-2-bold-duotone',
      color: 'primary',
      path: '/dashboard/companies',
      stats: { label: 'Total Companies', value: '0' },
    },
    {
      title: 'User Management',
      description: 'Manage all users across all companies',
      icon: 'solar:users-group-rounded-bold-duotone',
      color: 'info',
      path: '/dashboard/user/list',
      stats: { label: 'Total Users', value: '0' },
    },
    {
      title: 'System Settings',
      description: 'Configure platform-wide settings and preferences',
      icon: 'solar:settings-bold-duotone',
      color: 'warning',
      path: '/dashboard/system-settings',
      stats: { label: 'Active Settings', value: '0' },
    },
    {
      title: 'Platform Analytics',
      description: 'View analytics and insights across all companies',
      icon: 'solar:chart-bold-duotone',
      color: 'success',
      path: '/dashboard/platform-analytics',
      stats: { label: 'Active Sessions', value: '0' },
    },
  ];

  return (
    <DashboardContent maxWidth="xl">
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            SuperAdmin Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Welcome back, {user?.displayName || user?.email}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Role: {user?.role ? ROLE_DISPLAY_NAMES[user.role as UserRole] : 'Unknown'}
          </Typography>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {superAdminCards.map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.title}>
              <Card>
                <CardHeader
                  avatar={
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        display: 'flex',
                        borderRadius: 1.5,
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${card.color}.lighter`,
                        color: `${card.color}.main`,
                      }}
                    >
                      <Iconify icon={card.icon} width={24} />
                    </Box>
                  }
                  title={
                    <Typography variant="h3" sx={{ mb: 0.5 }}>
                      {card.stats.value}
                    </Typography>
                  }
                  subheader={
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {card.stats.label}
                    </Typography>
                  }
                />
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Management Cards */}
        <Grid container spacing={3}>
          {superAdminCards.map((card) => (
            <Grid item xs={12} md={6} key={card.title}>
              <Card>
                <CardHeader
                  avatar={
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        display: 'flex',
                        borderRadius: 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${card.color}.lighter`,
                        color: `${card.color}.main`,
                      }}
                    >
                      <Iconify icon={card.icon} width={32} />
                    </Box>
                  }
                  title={card.title}
                  subheader={card.description}
                />
                <CardContent>
                  <Button
                    variant="contained"
                    color={card.color as any}
                    onClick={() => handleNavigate(card.path)}
                    endIcon={<Iconify icon="solar:alt-arrow-right-bold" />}
                  >
                    Manage
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Additional Actions */}
        <Box sx={{ mt: 5 }}>
          <Card>
            <CardHeader
              title="Quick Actions"
              subheader="Common administrative tasks"
            />
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={() => handleNavigate('/dashboard/companies/new')}
                >
                  Create New Company
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:user-plus-bold" />}
                  onClick={() => handleNavigate('/dashboard/user/new')}
                >
                  Add New User
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:document-text-bold" />}
                  onClick={() => handleNavigate('/dashboard/reports')}
                >
                  Generate Report
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:settings-bold" />}
                  onClick={() => handleNavigate('/dashboard/system-settings')}
                >
                  System Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </DashboardContent>
  );
}

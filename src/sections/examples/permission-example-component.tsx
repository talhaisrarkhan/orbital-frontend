'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';

import { usePermissions } from 'src/auth/hooks/use-permissions';
import { UserRole, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from 'src/auth/rbac';

// ----------------------------------------------------------------------

/**
 * Example component demonstrating how to use the permission system
 * This can be used as a reference for implementing role-based features
 */
export function PermissionExampleComponent() {
  const permissions = usePermissions();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Permission System Examples
      </Typography>

      {/* Current User Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Current User Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2">
              <strong>Role:</strong>{' '}
              {permissions.role ? ROLE_DISPLAY_NAMES[permissions.role as UserRole] : 'Not authenticated'}
            </Typography>
            {permissions.role && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {ROLE_DESCRIPTIONS[permissions.role as UserRole]}
              </Typography>
            )}
            {permissions.companyId && (
              <Typography variant="body2">
                <strong>Company ID:</strong> {permissions.companyId}
              </Typography>
            )}
            {permissions.departmentId && (
              <Typography variant="body2">
                <strong>Department ID:</strong> {permissions.departmentId}
              </Typography>
            )}
            {permissions.teamId && (
              <Typography variant="body2">
                <strong>Team ID:</strong> {permissions.teamId}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Role-based Rendering Examples */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Role-based Rendering Examples
          </Typography>

          {/* Example 1: SuperAdmin only */}
          {permissions.isSuperAdmin && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">SuperAdmin Only Content</Typography>
              <Typography variant="body2">
                This content is only visible to SuperAdmins
              </Typography>
            </Alert>
          )}

          {/* Example 2: Admin or higher */}
          {permissions.isAdmin && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Admin+ Content</Typography>
              <Typography variant="body2">
                This content is visible to Admins and SuperAdmins
              </Typography>
            </Alert>
          )}

          {/* Example 3: Department Head or higher */}
          {permissions.isDepartmentHead && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Department Head+ Content</Typography>
              <Typography variant="body2">
                This content is visible to Department Heads and above
              </Typography>
            </Alert>
          )}

          {/* Example 4: Team Lead or higher */}
          {permissions.isTeamLead && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Team Lead+ Content</Typography>
              <Typography variant="body2">
                This content is visible to Team Leads and above
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Permission Check Examples */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Permission Check Examples
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Check specific role */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Has SuperAdmin Role:
              </Typography>
              <Chip
                label={permissions.hasRole(UserRole.SUPERADMIN) ? 'Yes' : 'No'}
                color={permissions.hasRole(UserRole.SUPERADMIN) ? 'success' : 'default'}
                size="small"
              />
            </Box>

            {/* Check any of multiple roles */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Has Admin or SuperAdmin Role:
              </Typography>
              <Chip
                label={
                  permissions.hasAnyRole([UserRole.ADMIN, UserRole.SUPERADMIN]) ? 'Yes' : 'No'
                }
                color={
                  permissions.hasAnyRole([UserRole.ADMIN, UserRole.SUPERADMIN])
                    ? 'success'
                    : 'default'
                }
                size="small"
              />
            </Box>

            {/* Check minimum role */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Has Team Lead Role or Higher:
              </Typography>
              <Chip
                label={permissions.hasMinimumRole(UserRole.TEAM_LEAD) ? 'Yes' : 'No'}
                color={permissions.hasMinimumRole(UserRole.TEAM_LEAD) ? 'success' : 'default'}
                size="small"
              />
            </Box>

            {/* Check route access */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Can Access SuperAdmin Dashboard:
              </Typography>
              <Chip
                label={permissions.canAccessRoute('/dashboard/superadmin') ? 'Yes' : 'No'}
                color={permissions.canAccessRoute('/dashboard/superadmin') ? 'success' : 'default'}
                size="small"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Action Buttons with Permissions */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Action Buttons with Permission Checks
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* SuperAdmin only button */}
            <Button
              variant="contained"
              disabled={!permissions.isSuperAdmin}
              color="primary"
            >
              SuperAdmin Action
            </Button>

            {/* Admin or higher button */}
            <Button
              variant="contained"
              disabled={!permissions.isAdmin}
              color="secondary"
            >
              Admin Action
            </Button>

            {/* Department Head or higher button */}
            <Button
              variant="contained"
              disabled={!permissions.isDepartmentHead}
              color="warning"
            >
              Department Head Action
            </Button>

            {/* Team Lead or higher button */}
            <Button
              variant="contained"
              disabled={!permissions.isTeamLead}
              color="info"
            >
              Team Lead Action
            </Button>

            {/* Available to all authenticated users */}
            <Button variant="contained" color="success">
              Employee Action
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

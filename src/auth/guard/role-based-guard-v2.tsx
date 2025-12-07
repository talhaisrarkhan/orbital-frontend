'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { m } from 'framer-motion';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { ForbiddenIllustration } from 'src/assets/illustrations';

import { varBounce, MotionContainer } from 'src/components/animate';

import type { UserRole } from '../types/user-role';
import { ROLE_DISPLAY_NAMES } from '../types/user-role';
import { hasAnyRole, hasMinimumRole } from '../utils/permissions';

// ----------------------------------------------------------------------

export type RoleBasedGuardProp = {
  sx?: SxProps<Theme>;
  currentRole?: string;
  hasContent?: boolean;
  acceptRoles?: UserRole[];
  minimumRole?: UserRole;
  children: React.ReactNode;
};

export function RoleBasedGuard({
  sx,
  children,
  hasContent,
  currentRole,
  acceptRoles,
  minimumRole,
}: RoleBasedGuardProp) {
  const router = useRouter();

  // Check permissions based on either acceptRoles or minimumRole
  const hasPermission = () => {
    if (!currentRole) return false;

    // If acceptRoles is provided, check if user has any of those roles
    if (acceptRoles && acceptRoles.length > 0) {
      return hasAnyRole(currentRole, acceptRoles);
    }

    // If minimumRole is provided, check if user has minimum required role
    if (minimumRole) {
      return hasMinimumRole(currentRole, minimumRole);
    }

    // If neither is provided, allow access
    return true;
  };

  const permitted = hasPermission();

  if (!permitted) {
    return hasContent ? (
      <Container component={MotionContainer} sx={{ textAlign: 'center', ...sx }}>
        <m.div variants={varBounce().in}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Permission Denied
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <Typography sx={{ color: 'text.secondary', mb: 1 }}>
            You do not have permission to access this page.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            Your role: <strong>{currentRole ? ROLE_DISPLAY_NAMES[currentRole as UserRole] : 'Unknown'}</strong>
          </Typography>
          {acceptRoles && acceptRoles.length > 0 && (
            <Typography variant="body2" sx={{ color: 'text.disabled', mt: 1 }}>
              Required roles: <strong>{acceptRoles.map(role => ROLE_DISPLAY_NAMES[role]).join(', ')}</strong>
            </Typography>
          )}
          {minimumRole && (
            <Typography variant="body2" sx={{ color: 'text.disabled', mt: 1 }}>
              Minimum required role: <strong>{ROLE_DISPLAY_NAMES[minimumRole]}</strong>
            </Typography>
          )}
        </m.div>

        <m.div variants={varBounce().in}>
          <ForbiddenIllustration sx={{ my: { xs: 5, sm: 10 } }} />
        </m.div>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => router.push(paths.dashboard.root)}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outlined"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </Box>
      </Container>
    ) : null;
  }

  return <> {children} </>;
}

'use client';

import type { ISprint } from 'src/types/project';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { alpha, useTheme } from '@mui/material/styles';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { toast } from 'src/components/snackbar';

import { completeSprint, activateSprint, deleteSprint } from 'src/api/project';

// ----------------------------------------------------------------------

type Props = {
  sprints: ISprint[];
  onViewSprint: (sprintId: string) => void;
  onRefresh: () => void;
  canManageSprint?: boolean;
};

export function SprintTimeline({ sprints, onViewSprint, onRefresh, canManageSprint = false }: Props) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSprint, setSelectedSprint] = useState<ISprint | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, sprint: ISprint) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedSprint(sprint);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedSprint(null);
  };

  const handleCompleteSprint = async () => {
    if (!selectedSprint) return;
    try {
      await completeSprint(selectedSprint.id);
      toast.success('Sprint completed successfully!');
      onRefresh();
    } catch (error) {
      toast.error('Failed to complete sprint');
    }
    handleCloseMenu();
  };

  const handleActivateSprint = async () => {
    if (!selectedSprint) return;
    try {
      await activateSprint(selectedSprint.id);
      toast.success('Sprint activated successfully!');
      onRefresh();
    } catch (error) {
      toast.error('Failed to activate sprint');
    }
    handleCloseMenu();
  };

  const handleDeleteSprint = async () => {
    if (!selectedSprint) return;
    try {
      await deleteSprint(selectedSprint.id);
      toast.success('Sprint deleted successfully!');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete sprint');
    }
    handleCloseMenu();
  };

  const getSprintProgress = (sprint: ISprint) => {
    if (!sprint.tasks || sprint.tasks.length === 0) return 0;
    const completedTasks = sprint.tasks.filter((t) => t.status === 'done').length;
    return (completedTasks / sprint.tasks.length) * 100;
  };

  const getSprintDaysRemaining = (sprint: ISprint) => {
    const now = new Date();
    const endDate = new Date(sprint.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!sprints || sprints.length === 0) {
    return (
      <EmptyContent
        filled
        title="No Sprints Yet"
        description="Create your first sprint to start planning your work"
        sx={{ py: 10 }}
      />
    );
  }

  const activeSprint = sprints.find((s) => s.isActive);
  const plannedSprints = sprints.filter((s) => !s.isActive && !s.isCompleted);
  const completedSprints = sprints.filter((s) => s.isCompleted);

  return (
    <Stack spacing={4}>
      {/* Active Sprint */}
      {activeSprint && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Iconify icon="solar:play-circle-bold-duotone" width={24} color="warning.main" />
            <Typography variant="h6">Active Sprint</Typography>
          </Stack>
          <SprintCard
            sprint={activeSprint}
            variant="active"
            onView={() => onViewSprint(activeSprint.id)}
            onMenu={(e) => handleOpenMenu(e, activeSprint)}
            progress={getSprintProgress(activeSprint)}
            daysRemaining={getSprintDaysRemaining(activeSprint)}
            canManageSprint={canManageSprint}
          />
        </Box>
      )}

      {/* Planned Sprints */}
      {plannedSprints.length > 0 && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Iconify icon="solar:calendar-bold-duotone" width={24} color="info.main" />
            <Typography variant="h6">Planned Sprints</Typography>
          </Stack>
          <Stack spacing={2}>
            {plannedSprints.map((sprint) => (
              <SprintCard
                key={sprint.id}
                sprint={sprint}
                variant="planned"
                onView={() => onViewSprint(sprint.id)}
                onMenu={(e) => handleOpenMenu(e, sprint)}
                progress={getSprintProgress(sprint)}
                canManageSprint={canManageSprint}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Completed Sprints */}
      {completedSprints.length > 0 && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Iconify icon="solar:check-circle-bold-duotone" width={24} color="success.main" />
            <Typography variant="h6">Completed Sprints</Typography>
          </Stack>
          <Stack spacing={2}>
            {completedSprints.map((sprint) => (
              <SprintCard
                key={sprint.id}
                sprint={sprint}
                variant="completed"
                onView={() => onViewSprint(sprint.id)}
                onMenu={(e) => handleOpenMenu(e, sprint)}
                progress={getSprintProgress(sprint)}
                canManageSprint={canManageSprint}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Context Menu - Only shown if user can manage sprints */}
      {canManageSprint && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {selectedSprint && !selectedSprint.isActive && !selectedSprint.isCompleted && (
            <MenuItem onClick={handleActivateSprint}>
              <Iconify icon="solar:play-bold-duotone" sx={{ mr: 1 }} />
              Activate Sprint
            </MenuItem>
          )}
          {selectedSprint && selectedSprint.isActive && (
            <MenuItem onClick={handleCompleteSprint}>
              <Iconify icon="solar:check-circle-bold-duotone" sx={{ mr: 1 }} />
              Complete Sprint
            </MenuItem>
          )}
          <Divider />
          <MenuItem onClick={handleDeleteSprint} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold-duotone" sx={{ mr: 1 }} />
            Delete Sprint
          </MenuItem>
        </Menu>
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------

type SprintCardProps = {
  sprint: ISprint;
  variant: 'active' | 'planned' | 'completed';
  onView: () => void;
  onMenu: (event: React.MouseEvent<HTMLElement>) => void;
  progress: number;
  daysRemaining?: number;
  canManageSprint?: boolean;
};

function SprintCard({ sprint, variant, onView, onMenu, progress, daysRemaining, canManageSprint = false }: SprintCardProps) {
  const theme = useTheme();

  const variantConfig = {
    active: {
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.08),
      borderColor: alpha(theme.palette.warning.main, 0.24),
    },
    planned: {
      color: theme.palette.info.main,
      bgColor: alpha(theme.palette.info.main, 0.08),
      borderColor: alpha(theme.palette.info.main, 0.24),
    },
    completed: {
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.08),
      borderColor: alpha(theme.palette.success.main, 0.24),
    },
  };

  const config = variantConfig[variant];

  return (
    <Card
      sx={{
        p: 3,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        '&:hover': {
          transform: 'translateX(8px)',
          boxShadow: theme.shadows[8],
          borderColor: config.color,
        },
      }}
      onClick={onView}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ flexGrow: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant="h6">{sprint.name}</Typography>
              {variant === 'active' && (
                <Chip
                  label="Active"
                  size="small"
                  color="warning"
                  sx={{ height: 20, '& .MuiChip-label': { px: 1 } }}
                />
              )}
              {variant === 'completed' && (
                <Chip
                  label="Completed"
                  size="small"
                  color="success"
                  sx={{ height: 20, '& .MuiChip-label': { px: 1 } }}
                />
              )}
            </Stack>
            {sprint.goal && (
              <Typography variant="body2" color="text.secondary">
                {sprint.goal}
              </Typography>
            )}
          </Box>
          {canManageSprint && (
            <IconButton size="small" onClick={onMenu}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          )}
        </Stack>

        {/* Dates */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Iconify icon="solar:calendar-bold-duotone" width={16} color="text.secondary" />
            <Typography variant="caption" color="text.secondary">
              {fDate(sprint.startDate)} - {fDate(sprint.endDate)}
            </Typography>
          </Stack>
          {variant === 'active' && daysRemaining !== undefined && (
            <Chip
              label={`${daysRemaining} days left`}
              size="small"
              color={daysRemaining < 3 ? 'error' : 'default'}
              variant="outlined"
              sx={{ height: 20, '& .MuiChip-label': { px: 1 } }}
            />
          )}
        </Stack>

        {/* Progress */}
        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="caption" fontWeight="bold" color={config.color}>
              {Math.round(progress)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: alpha(config.color, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                bgcolor: config.color,
              },
            }}
          />
        </Box>

        {/* Stats */}
        <Stack direction="row" spacing={3}>
          <Box>
            <Typography variant="h6" color={config.color}>
              {sprint.tasks?.length || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Tasks
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" color="success.main">
              {sprint.tasks?.filter((t) => t.status === 'done').length || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
          </Box>
          {sprint.velocity && (
            <Box>
              <Typography variant="h6" color="info.main">
                {sprint.velocity}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Velocity
              </Typography>
            </Box>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

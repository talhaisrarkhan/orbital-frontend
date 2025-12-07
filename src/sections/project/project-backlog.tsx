'use client';

import type { ITask } from 'src/types/project';

import { useState } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';

import { endpoints, fetcher } from 'src/utils/axios';
import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { TaskDialog } from './task-dialog';
import { useProjectPermissions } from 'src/hooks/use-project-permissions';

// ----------------------------------------------------------------------

type Props = {
  projectId: string;
  projectManagerId?: number;
};

const PRIORITY_COLORS = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error',
} as const;

export function ProjectBacklog({ projectId, projectManagerId }: Props) {
  const theme = useTheme();
  const [openAddTask, setOpenAddTask] = useState(false);
  const { canManageBacklog } = useProjectPermissions(projectManagerId);

  const { data: backlogTasks, isLoading } = useSWR<ITask[]>(
    [endpoints.task.list, { projectId, isBacklog: true }],
    ([url, params]) => fetcher([url, { params }])
  );

  if (isLoading) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading backlog...
        </Typography>
      </Box>
    );
  }

  if (!backlogTasks || backlogTasks.length === 0) {
    return (
      <EmptyContent
        filled
        title="No Backlog Items"
        description="All tasks are assigned to sprints"
        action={
          canManageBacklog && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setOpenAddTask(true)}
              sx={{ mt: 2 }}
            >
              Add Task
            </Button>
          )
        }
        sx={{ py: 10 }}
      />
    );
  }

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Project Backlog</Typography>
        {canManageBacklog && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setOpenAddTask(true)}
          >
            Add Task
          </Button>
        )}
      </Stack>

      <Stack spacing={2}>
      {backlogTasks.map((task) => (
        <Card
          key={task.id}
          sx={{
            p: 2.5,
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              boxShadow: theme.shadows[4],
              transform: 'translateX(4px)',
            },
          }}
        >
          <Stack direction="row" alignItems="flex-start" spacing={2}>
            {/* Priority Indicator */}
            <Box
              sx={{
                width: 4,
                height: 40,
                borderRadius: 1,
                bgcolor:
                  task.priority === 'critical' || task.priority === 'high'
                    ? 'error.main'
                    : task.priority === 'medium'
                      ? 'warning.main'
                      : 'info.main',
                flexShrink: 0,
              }}
            />

            {/* Content */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    {task.title}
                  </Typography>
                  {task.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {task.description}
                    </Typography>
                  )}
                </Box>
                <IconButton size="small">
                  <Iconify icon="eva:more-vertical-fill" />
                </IconButton>
              </Stack>

              {/* Meta Info */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                flexWrap="wrap"
                sx={{ mt: 1.5 }}
              >
                <Chip
                  label={task.priority}
                  size="small"
                  color={PRIORITY_COLORS[task.priority]}
                  sx={{ height: 20, textTransform: 'capitalize' }}
                />

                {task.storyPoints && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Iconify icon="solar:star-bold-duotone" width={14} color="warning.main" />
                    <Typography variant="caption">{task.storyPoints} pts</Typography>
                  </Stack>
                )}

                {task.dueDate && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Iconify icon="solar:calendar-bold-duotone" width={14} color="text.secondary" />
                    <Typography variant="caption" color="text.secondary">
                      {fDate(task.dueDate)}
                    </Typography>
                  </Stack>
                )}

                {task.assignee && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Avatar
                      src={task.assignee.profilePicture}
                      alt={task.assignee.name}
                      sx={{ width: 20, height: 20 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {task.assignee.name}
                    </Typography>
                  </Stack>
                )}

                {task.tags && task.tags.length > 0 && (
                  <Stack direction="row" spacing={0.5}>
                    {task.tags.slice(0, 3).map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, '& .MuiChip-label': { px: 1 } }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Box>
          </Stack>
        </Card>
      ))}
    </Stack>

    <TaskDialog
      open={openAddTask}
      onClose={() => setOpenAddTask(false)}
      projectId={projectId}
      isBacklog={true}
    />
    </>
  );
}

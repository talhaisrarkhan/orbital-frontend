'use client';



import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { alpha, useTheme } from '@mui/material/styles';

import { SprintBacklog } from '../sprint-backlog';

import { paths } from 'src/routes/paths';

import { endpoints, fetcher } from 'src/utils/axios';
import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { BoardDialog } from '../board-dialog';
import { KanbanBoard } from '../kanban/kanban-board';

import { useSocketRoom } from 'src/hooks/use-socket';
import { useProjectPermissions } from 'src/hooks/use-project-permissions';
import type { ISprint, IBoard, ITask, IProject } from 'src/types/project';

// ----------------------------------------------------------------------

type Props = {
  projectId: string;
  sprintId: string;
};

export function SprintDetailsView({ projectId, sprintId }: Props) {
  const theme = useTheme();
  const [openBoardDialog, setOpenBoardDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState('board');

  const { data: sprint, isLoading: sprintLoading, mutate: mutateSprint } = useSWR<ISprint>(
    endpoints.sprint.details(sprintId),
    fetcher
  );

  const { data: project } = useSWR<IProject>(
    endpoints.project.details(projectId),
    fetcher
  );

  const { canManageSprint, canManageBacklog } = useProjectPermissions(project?.projectManagerId);

  const { data: boards, mutate: mutateBoards } = useSWR<IBoard[]>(
    sprint ? [endpoints.board.list, { sprintId }] : null,
    ([url, params]) => fetcher([url, { params }])
  );

  // Memoize event handlers
  const handleSprintUpdated = useCallback((updatedSprint: ISprint) => {
    if (updatedSprint.id === sprintId) {
      mutateSprint(updatedSprint, false);
    }
  }, [sprintId, mutateSprint]);

  const handleTaskCreated = useCallback((newTask: ITask) => {
    if (newTask.sprintId !== sprintId) return;
    
    mutateSprint((currentSprint) => {
      if (!currentSprint) return currentSprint;
      return {
        ...currentSprint,
        tasks: [...(currentSprint.tasks || []), newTask],
      };
    }, false);
  }, [sprintId, mutateSprint]);

  const handleTaskUpdated = useCallback((updatedTask: ITask) => {
    if (updatedTask.sprintId !== sprintId) return;

    mutateSprint((currentSprint) => {
      if (!currentSprint) return currentSprint;
      return {
        ...currentSprint,
        tasks: (currentSprint.tasks || []).map((t) =>
          t.id === updatedTask.id ? updatedTask : t
        ),
      };
    }, false);
  }, [sprintId, mutateSprint]);

  const handleTaskMoved = useCallback((movedTask: ITask) => {
    if (movedTask.sprintId !== sprintId) return;

    mutateSprint((currentSprint) => {
      if (!currentSprint) return currentSprint;
      return {
        ...currentSprint,
        tasks: (currentSprint.tasks || []).map((t) =>
          t.id === movedTask.id ? movedTask : t
        ),
      };
    }, false);
  }, [sprintId, mutateSprint]);

  const handleTaskDeleted = useCallback(({ taskId }: { taskId: string }) => {
    mutateSprint((currentSprint) => {
      if (!currentSprint) return currentSprint;
      return {
        ...currentSprint,
        tasks: (currentSprint.tasks || []).filter((t) => t.id !== taskId),
      };
    }, false);
  }, [mutateSprint]);

  // Use optimized socket room hook
  // Note: We rely on KanbanBoard components to join the board rooms where task events are emitted.
  // However, since the socket is shared, we can listen to these events here as well.
  useSocketRoom({
    room: sprintId,
    joinEvent: 'join:sprint',
    events: {
      'sprint.updated': handleSprintUpdated,
      'task.created': handleTaskCreated,
      'task.updated': handleTaskUpdated,
      'task.moved': handleTaskMoved,
      'task.deleted': handleTaskDeleted,
    },
  });

  const getSprintProgress = () => {
    if (!sprint?.tasks || sprint.tasks.length === 0) return 0;
    const completedTasks = sprint.tasks.filter((t) => t.status === 'done').length;
    return (completedTasks / sprint.tasks.length) * 100;
  };

  const getDaysRemaining = () => {
    if (!sprint) return 0;
    const now = new Date();
    const endDate = new Date(sprint.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (sprintLoading || !sprint) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Loading sprint...
          </Typography>
          <LinearProgress sx={{ maxWidth: 400, mx: 'auto' }} />
        </Box>
      </Container>
    );
  }

  const daysRemaining = getDaysRemaining();
  const progress = getSprintProgress();


  const handleChangeTab = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  // ... (keep existing hooks)

  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading={sprint.name}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Projects', href: paths.dashboard.project.list },
          { name: 'Project', href: paths.dashboard.project.details(projectId) },
          { name: sprint.name },
        ]}
        action={
          currentTab === 'board' && canManageSprint && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setOpenBoardDialog(true)}
            >
              New Board
            </Button>
          )
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Sprint Header */}
      <Card
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.warning.main,
            0.08
          )} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.24)}`,
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                    color: 'white',
                  }}
                >
                  <Iconify icon="solar:clipboard-list-bold-duotone" width={32} />
                </Box>
                <Box>
                  <Typography variant="h4">{sprint.name}</Typography>
                  {sprint.isActive && (
                    <Chip
                      label="Active Sprint"
                      size="small"
                      color="warning"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>
              </Stack>

              {sprint.goal && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Goal:</strong> {sprint.goal}
                </Typography>
              )}

              <Stack direction="row" alignItems="center" spacing={2}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify icon="solar:calendar-bold-duotone" width={16} color="text.secondary" />
                  <Typography variant="body2" color="text.secondary">
                    {fDate(sprint.startDate)} - {fDate(sprint.endDate)}
                  </Typography>
                </Stack>
                {sprint.isActive && (
                  <Chip
                    label={`${daysRemaining} days remaining`}
                    size="small"
                    color={daysRemaining < 3 ? 'error' : 'default'}
                    variant="outlined"
                  />
                )}
              </Stack>

              {/* Progress */}
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Sprint Progress
                  </Typography>
                  <Typography variant="caption" fontWeight="bold" color="warning.main">
                    {Math.round(progress)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: 'warning.main',
                    },
                  }}
                />
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Tasks
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {sprint.tasks?.length || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Completed Tasks
                </Typography>
                <Typography variant="h4" color="success.main">
                  {sprint.tasks?.filter((t) => t.status === 'done').length || 0}
                </Typography>
              </Box>
              {sprint.velocity && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Velocity
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {sprint.velocity} pts
                  </Typography>
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Card>

      <Tabs 
        value={currentTab} 
        onChange={handleChangeTab} 
        sx={{ 
          mb: 3,
          '& .MuiTab-root': {
            minHeight: 48,
            minWidth: 120,
          }
        }}
      >
        <Tab 
          value="board" 
          label="Board" 
          icon={<Iconify icon="solar:kanban-bold-duotone" width={24} />} 
          iconPosition="start"
        />
        <Tab 
          value="backlog" 
          label="Backlog" 
          icon={<Iconify icon="solar:list-bold-duotone" width={24} />} 
          iconPosition="start"
        />
      </Tabs>

      {currentTab === 'board' && (
        <>
          {boards && boards.length > 0 ? (
            <Stack spacing={4}>
              {boards.map((board) => (
                <Box key={board.id}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="h6">{board.name}</Typography>
                    {board.description && (
                      <Typography variant="body2" color="text.secondary">
                        {board.description}
                      </Typography>
                    )}
                  </Stack>
                  <KanbanBoard 
                    boardId={board.id} 
                    projectId={projectId} 
                    sprintId={sprintId} 
                    projectManagerId={project?.projectManagerId}
                  />
                </Box>
              ))}
            </Stack>
          ) : (
            <Card sx={{ p: 10, textAlign: 'center' }}>
              <Iconify
                icon="solar:clipboard-list-bold-duotone"
                width={64}
                color="text.disabled"
                sx={{ mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No Boards Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create a board to start organizing your tasks
              </Typography>
              {canManageSprint && (
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={() => setOpenBoardDialog(true)}
                >
                  Create Board
                </Button>
              )}
            </Card>
          )}
        </>
      )}

      {currentTab === 'backlog' && (
        <SprintBacklog 
          sprintId={sprintId} 
          projectId={projectId} 
          projectManagerId={project?.projectManagerId}
        />
      )}

      <BoardDialog
        open={openBoardDialog}
        onClose={() => {
          setOpenBoardDialog(false);
          mutateBoards();
        }}
        projectId={projectId}
        sprintId={sprintId}
      />
    </Container>
  );
}

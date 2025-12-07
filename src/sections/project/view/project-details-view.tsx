'use client';

import type { IProject, ISprint } from 'src/types/project';

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
import Avatar from '@mui/material/Avatar';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { endpoints, fetcher } from 'src/utils/axios';
import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Label } from 'src/components/label';

import { SprintDialog } from '../sprint-dialog';
import { SprintTimeline } from '../sprint-timeline';
import { ProjectBacklog } from '../project-backlog';
import { ProjectTeamView } from './project-team-view';
import { ProjectTimelineView } from '../project-timeline-view';
import { ProjectCalendarView } from '../project-calendar-view';

import { useSocketRoom } from 'src/hooks/use-socket';
import { useProjectPermissions } from 'src/hooks/use-project-permissions';

// ----------------------------------------------------------------------

type Props = {
  projectId: string;
};

export function ProjectDetailsView({ projectId }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('sprints');
  const [openSprintDialog, setOpenSprintDialog] = useState(false);

  const { data: project, isLoading, mutate: mutateProject } = useSWR<IProject>(
    endpoints.project.details(projectId),
    fetcher
  );

  const { canManageSprint } = useProjectPermissions(project?.projectManagerId);

  const { data: sprints, mutate: mutateSprints } = useSWR<ISprint[]>(
    project ? [endpoints.sprint.list, { projectId }] : null,
    ([url, params]) => fetcher([url, { params }])
  );

  // Memoize event handlers
  const handleProjectUpdated = useCallback((data: any) => {
    // Check if it's a member update event
    if (data.action && ['member_added', 'member_removed', 'member_role_updated'].includes(data.action)) {
       mutateProject((current) => {
          if (!current) return current;
          
          let newMembers = [...(current.members || [])];
          
          if (data.action === 'member_added') {
             if (!newMembers.find(m => m.id === data.member.id)) {
                 newMembers.push(data.member);
             }
          } else if (data.action === 'member_removed') {
             newMembers = newMembers.filter(m => m.id !== data.memberId);
          } else if (data.action === 'member_role_updated') {
             newMembers = newMembers.map(m => m.id === data.member.id ? data.member : m);
          }
          
          return { ...current, members: newMembers };
       }, false);
       return;
    }

    if (data.id === projectId) {
      mutateProject(data, false);
    }
  }, [projectId, mutateProject]);

  const handleSprintUpdated = useCallback((updatedSprint: ISprint) => {
    mutateSprints((currentSprints) => {
      if (!currentSprints) return currentSprints;
      return currentSprints.map((s) => (s.id === updatedSprint.id ? updatedSprint : s));
    }, false);
  }, [mutateSprints]);

  // Use optimized socket room hook
  useSocketRoom({
    room: projectId,
    joinEvent: 'join:project',
    leaveEvent: 'leave:project',
    events: {
      'project.updated': handleProjectUpdated,
      'sprint.updated': handleSprintUpdated,
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  const handleViewSprint = (sprintId: string) => {
    router.push(paths.dashboard.project.sprint(projectId, sprintId));
  };

  const activeSprint = sprints?.find((s) => s.isActive);
  const completedSprints = sprints?.filter((s) => s.isCompleted) || [];
  const plannedSprints = sprints?.filter((s) => !s.isActive && !s.isCompleted) || [];

  if (isLoading || !project) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Loading project...
          </Typography>
          <LinearProgress sx={{ maxWidth: 400, mx: 'auto' }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading={project.name}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Projects', href: paths.dashboard.project.root },
          { name: project.name },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            {canManageSprint && currentTab === 'sprints' && (
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => setOpenSprintDialog(true)}
                sx={{
                  bgcolor: 'primary.main',
                  boxShadow: theme.customShadows.primary,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: theme.customShadows.primary,
                  },
                }}
              >
                New Sprint
              </Button>
            )}
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Project Header Card */}
      <Card
        sx={{
          p: 3,
          mb: 5,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: theme.customShadows.z4,
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    boxShadow: theme.customShadows.primary,
                  }}
                >
                  {project.code.substring(0, 2).toUpperCase()}
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {project.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Iconify icon="solar:hashtag-square-bold-duotone" width={16} />
                    {project.code}
                  </Typography>
                </Box>
              </Stack>

              {project.description && (
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600, lineHeight: 1.6 }}>
                  {project.description}
                </Typography>
              )}

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={project.projectType}
                  size="small"
                  color="primary"
                  variant="soft"
                  sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                />
                <Chip
                  label={project.status}
                  size="small"
                  color={
                    project.status === 'active'
                      ? 'success'
                      : project.status === 'completed'
                        ? 'info'
                        : 'default'
                  }
                  variant="soft"
                  sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                />
                {project.gitIntegrationEnabled && (
                  <Chip
                    icon={<Iconify icon="mdi:git" />}
                    label="Git Enabled"
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: alpha(theme.palette.grey[500], 0.24) }}
                  />
                )}
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={3} sx={{ height: '100%', justifyContent: 'center' }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.neutral, 0.5) }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                  Project Manager
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar
                    src={project.projectManager?.profilePicture}
                    alt={project.projectManager?.name}
                    sx={{ width: 40, height: 40, border: `2px solid ${theme.palette.background.paper}` }}
                  />
                  <Box>
                    <Typography variant="subtitle2">
                      {project.projectManager?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {project.projectManager?.email}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Stack direction="row" spacing={3} sx={{ px: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Start Date
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {fDate(project.startDate)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    End Date
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {fDate(project.endDate)}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        sx={{
          mb: { xs: 3, md: 5 },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: 1.5,
          },
          '& .MuiTab-root': {
            minHeight: 48,
            minWidth: 120,
            borderRadius: 1,
            mx: 0.5,
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
            '&.Mui-selected': {
              color: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
          },
        }}
      >
        <Tab
          value="sprints"
          label="Sprints"
          icon={<Iconify icon="solar:clipboard-list-bold-duotone" width={24} />}
          iconPosition="start"
        />
        <Tab
          value="backlog"
          label="Backlog"
          icon={<Iconify icon="solar:inbox-archive-bold-duotone" width={24} />}
          iconPosition="start"
        />
        <Tab
          value="timeline"
          label="Timeline"
          icon={<Iconify icon="solar:chart-square-bold-duotone" width={24} />}
          iconPosition="start"
        />
        <Tab
          value="calendar"
          label="Calendar"
          icon={<Iconify icon="solar:calendar-bold-duotone" width={24} />}
          iconPosition="start"
        />
        <Tab
          value="team"
          label="Team"
          icon={<Iconify icon="solar:users-group-rounded-bold-duotone" width={24} />}
          iconPosition="start"
        />
      </Tabs>

      {currentTab === 'sprints' && (
        <SprintTimeline
          sprints={sprints || []}
          onViewSprint={handleViewSprint}
          onRefresh={mutateSprints}
        />
      )}

      {currentTab === 'backlog' && (
        <ProjectBacklog 
          projectId={projectId} 
          projectManagerId={project?.projectManagerId} 
        />
      )}

      {currentTab === 'timeline' && (
        <ProjectTimelineView projectId={projectId} />
      )}

      {currentTab === 'calendar' && (
        <ProjectCalendarView projectId={projectId} />
      )}

      {currentTab === 'team' && (
        <ProjectTeamView
          projectId={projectId}
          members={project.members || []}
          onUpdate={() => mutateProject()}
        />
      )}

      <SprintDialog
        open={openSprintDialog}
        onClose={() => {
          setOpenSprintDialog(false);
          mutateSprints();
        }}
        projectId={projectId}
      />
    </Container>
  );
}

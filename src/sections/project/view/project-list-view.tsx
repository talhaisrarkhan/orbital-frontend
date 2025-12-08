'use client';

import type { IProject } from 'src/types/project';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { endpoints, fetcher } from 'src/utils/axios';
import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProjectDialog } from '../project-dialog';

import { useSocketRoom } from 'src/hooks/use-socket';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const PROJECT_TYPE_COLORS = {
  internal: 'primary',
  client: 'success',
  hr: 'warning',
  research: 'info',
  other: 'default',
} as const;

const PROJECT_STATUS_COLORS = {
  planned: 'default',
  active: 'success',
  halted: 'warning',
  completed: 'info',
} as const;

// ----------------------------------------------------------------------

export function ProjectListView() {
  const theme = useTheme();
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState(false);
  const { user } = useAuthContext();

  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);

  const { data: projects, isLoading, mutate } = useSWR<IProject[]>(
    endpoints.project.list,
    fetcher
  );

  // Memoize event handlers
  const handleProjectUpdated = useCallback((updatedProject: IProject) => {
    mutate((currentProjects) => {
      if (!currentProjects) return currentProjects;
      return currentProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p));
    }, false);
  }, [mutate]);

  const handleProjectCreated = useCallback((newProject: IProject) => {
    mutate((currentProjects) => {
      if (!currentProjects) return currentProjects;
      return [...currentProjects, newProject];
    }, false);
  }, [mutate]);

  // Use optimized socket room hook
  // Note: For list view, we listen to global project events without joining a specific room
  useSocketRoom({
    room: null, // No specific room for list view
    events: {
      'project.updated': handleProjectUpdated,
      'project.created': handleProjectCreated,
    },
  });

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    mutate();
  };

  const handleViewProject = (projectId: string) => {
    router.push(paths.dashboard.project.details(projectId));
  };

  const getProjectProgress = (project: IProject) => {
    if (!project.sprints || project.sprints.length === 0) return 0;
    const completedSprints = project.sprints.filter((s) => s.isCompleted).length;
    return (completedSprints / project.sprints.length) * 100;
  };

  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading="Projects"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Projects' },
        ]}
        action={
          isAdmin ? (
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleOpenDialog}
            >
              New Project
            </Button>
          ) : undefined
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {isLoading ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Loading projects...
          </Typography>
          <LinearProgress sx={{ maxWidth: 400, mx: 'auto' }} />
        </Box>
      ) : !projects || projects.length === 0 ? (
        <EmptyContent
          filled
          title="No Projects Yet"
          description={isAdmin ? "Get started by creating your first project" : "No projects available"}
          action={
            isAdmin ? (
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleOpenDialog}
              >
                Create Project
              </Button>
            ) : undefined
          }
          sx={{ py: 10 }}
        />
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'visible',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[20],
                    '& .project-actions': {
                      opacity: 1,
                    },
                  },
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.05
                  )} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
                onClick={() => handleViewProject(project.id)}
              >
                {/* Header */}
                <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                    }}
                  >
                    {project.code.substring(0, 2).toUpperCase()}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="h6" noWrap sx={{ mb: 0.5 }}>
                      {project.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {project.code}
                    </Typography>
                  </Box>
                  <Box
                    className="project-actions"
                    sx={{
                      opacity: 0,
                      transition: 'opacity 0.3s',
                    }}
                  >
                    <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                      <Iconify icon="eva:more-vertical-fill" />
                    </IconButton>
                  </Box>
                </Stack>

                {/* Description */}
                {project.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {project.description}
                  </Typography>
                )}

                {/* Tags */}
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    label={project.projectType}
                    size="small"
                    color={PROJECT_TYPE_COLORS[project.projectType]}
                    sx={{ textTransform: 'capitalize' }}
                  />
                  <Chip
                    label={project.status}
                    size="small"
                    color={PROJECT_STATUS_COLORS[project.status]}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Stack>

                {/* Progress */}
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {Math.round(getProjectProgress(project))}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={getProjectProgress(project)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      },
                    }}
                  />
                </Box>

                {/* Stats */}
                <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h6" color="primary.main">
                      {project.sprints?.length || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sprints
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" color="success.main">
                      {project.tasks?.filter((t) => t.status === 'done').length || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                  {project.budget && (
                    <Box>
                      <Typography variant="h6" color="warning.main">
                        {fCurrency(project.budget)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Budget
                      </Typography>
                    </Box>
                  )}
                </Stack>

                {/* Footer */}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mt: 'auto', pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      src={project.projectManager?.profilePicture}
                      alt={project.projectManager?.name}
                      sx={{ width: 24, height: 24 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {project.projectManager?.name || 'Unassigned'}
                    </Typography>
                  </Stack>
                  {project.gitIntegrationEnabled && (
                    <Iconify icon="mdi:git" width={20} color="text.secondary" />
                  )}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <ProjectDialog open={openDialog} onClose={handleCloseDialog} />
    </Container>
  );
}

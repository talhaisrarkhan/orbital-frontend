'use client';

import type { IProjectTimeline } from 'src/types/project';

import { useMemo, useState } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';

import { endpoints, fetcher } from 'src/utils/axios';
import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { TaskDetailsDrawer } from './task-details-drawer';

// ----------------------------------------------------------------------

type Props = {
  projectId: string;
};

type TimelineItem = {
  id: string;
  title: string;
  type: 'sprint' | 'task';
  startDate: Date;
  endDate: Date;
  status?: string;
  assignee?: number;
  parentId?: string;
};

export function ProjectTimelineView({ projectId }: Props) {
  const theme = useTheme();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: timeline, isLoading, mutate } = useSWR<IProjectTimeline>(
    endpoints.project.timeline(projectId),
    fetcher
  );

  // Calculate timeline range and items
  const { timelineRange, items, dayWidth } = useMemo(() => {
    if (!timeline) return { timelineRange: { start: new Date(), end: new Date() }, items: [], dayWidth: 0 };

    const allDates: Date[] = [];
    const timelineItems: TimelineItem[] = [];

    // Process sprints and tasks
    timeline.sprints.forEach((sprint) => {
      const sprintStart = new Date(sprint.startDate);
      const sprintEnd = new Date(sprint.endDate);
      allDates.push(sprintStart, sprintEnd);

      timelineItems.push({
        id: sprint.id,
        title: sprint.name,
        type: 'sprint',
        startDate: sprintStart,
        endDate: sprintEnd,
      });

      sprint.tasks.forEach((task) => {
        if (task.startDate && task.dueDate) {
          const taskStart = new Date(task.startDate);
          const taskEnd = new Date(task.dueDate);
          allDates.push(taskStart, taskEnd);

          timelineItems.push({
            id: task.id,
            title: task.title,
            type: 'task',
            startDate: taskStart,
            endDate: taskEnd,
            status: task.status,
            assignee: task.assignee,
            parentId: sprint.id,
          });
        }
      });
    });

    const start = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
    const end = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date();

    // Add padding
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 7);

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const calculatedDayWidth = Math.max(40, 1200 / totalDays); // Minimum 40px per day

    return {
      timelineRange: { start, end },
      items: timelineItems,
      dayWidth: calculatedDayWidth,
    };
  }, [timeline]);

  const getItemPosition = (item: TimelineItem) => {
    const startOffset = Math.ceil((item.startDate.getTime() - timelineRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      left: startOffset * dayWidth,
      width: Math.max(duration * dayWidth, dayWidth), // Minimum one day width
    };
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'done':
        return theme.palette.success.main;
      case 'in_progress':
        return theme.palette.warning.main;
      case 'review':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Generate month headers
  const monthHeaders = useMemo(() => {
    const headers: { label: string; left: number; width: number }[] = [];
    const current = new Date(timelineRange.start);
    
    while (current <= timelineRange.end) {
      const monthStart = new Date(current);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const displayEnd = monthEnd > timelineRange.end ? timelineRange.end : monthEnd;
      
      const startOffset = Math.ceil((monthStart.getTime() - timelineRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const duration = Math.ceil((displayEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      headers.push({
        label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        left: startOffset * dayWidth,
        width: duration * dayWidth,
      });
      
      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }
    
    return headers;
  }, [timelineRange, dayWidth]);

  if (isLoading) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Loading timeline...
        </Typography>
        <LinearProgress sx={{ maxWidth: 400, mx: 'auto' }} />
      </Box>
    );
  }

  if (!timeline || timeline.sprints.length === 0) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <Iconify icon="solar:calendar-bold-duotone" width={64} sx={{ mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" color="text.secondary">
          No timeline data available
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
          Create sprints and tasks to see the project timeline
        </Typography>
      </Box>
    );
  }

  const totalWidth = Math.ceil((timelineRange.end.getTime() - timelineRange.start.getTime()) / (1000 * 60 * 60 * 24)) * dayWidth;

  return (
    <Stack spacing={3}>
      {/* Timeline Header */}
      <Card sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Iconify icon="solar:calendar-bold-duotone" width={24} />
          <Box>
            <Typography variant="h6">{timeline.project.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {fDate(timelineRange.start)} - {fDate(timelineRange.end)}
            </Typography>
          </Box>
        </Stack>
      </Card>

      {/* Legend */}
      <Card sx={{ p: 2 }}>
        <Stack direction="row" spacing={3} flexWrap="wrap">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 0.5,
                bgcolor: alpha(theme.palette.primary.main, 0.8),
              }}
            />
            <Typography variant="body2">Sprint</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 0.5,
                bgcolor: theme.palette.success.main,
              }}
            />
            <Typography variant="body2">Done</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 0.5,
                bgcolor: theme.palette.warning.main,
              }}
            />
            <Typography variant="body2">In Progress</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 0.5,
                bgcolor: theme.palette.info.main,
              }}
            />
            <Typography variant="body2">Review</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 0.5,
                bgcolor: theme.palette.grey[500],
              }}
            />
            <Typography variant="body2">To Do</Typography>
          </Stack>
        </Stack>
      </Card>

      {/* Gantt Chart */}
      <Card sx={{ overflow: 'auto' }}>
        <Box sx={{ minWidth: totalWidth + 300, p: 3 }}>
          {/* Month Headers */}
          <Box sx={{ position: 'relative', height: 40, mb: 2, ml: '250px' }}>
            {monthHeaders.map((header, index) => (
              <Box
                key={index}
                sx={{
                  position: 'absolute',
                  left: header.left,
                  width: header.width,
                  height: '100%',
                  borderLeft: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                }}
              >
                <Typography variant="caption" fontWeight="bold">
                  {header.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Timeline Items */}
          <Stack spacing={1}>
            {timeline.sprints.map((sprint) => {
              const sprintItem = items.find((i) => i.id === sprint.id && i.type === 'sprint');
              if (!sprintItem) return null;

              const sprintPosition = getItemPosition(sprintItem);
              const sprintTasks = items.filter((i) => i.parentId === sprint.id);

              return (
                <Box key={sprint.id}>
                  {/* Sprint Row */}
                  <Stack direction="row" alignItems="center" sx={{ mb: 0.5 }}>
                    <Box sx={{ width: 250, pr: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify icon="solar:clipboard-list-bold-duotone" width={16} />
                        <Typography variant="subtitle2" noWrap>
                          {sprint.name}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {fDate(sprint.startDate)} - {fDate(sprint.endDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'relative', flex: 1, height: 32 }}>
                      <Tooltip title={`${sprint.name}: ${fDate(sprint.startDate)} - ${fDate(sprint.endDate)}`}>
                        <Box
                          sx={{
                            position: 'absolute',
                            left: sprintPosition.left,
                            width: sprintPosition.width,
                            height: '100%',
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.primary.main, 0.8),
                            display: 'flex',
                            alignItems: 'center',
                            px: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: theme.palette.primary.main,
                            },
                          }}
                        >
                          <Typography variant="caption" color="white" noWrap>
                            {sprint.tasks.length} tasks
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Box>
                  </Stack>

                  {/* Task Rows */}
                  {sprintTasks.map((task) => {
                    const taskPosition = getItemPosition(task);
                    return (
                      <Stack key={task.id} direction="row" alignItems="center" sx={{ ml: 3, mb: 0.5 }}>
                        <Box sx={{ width: 220, pr: 2 }}>
                          <Typography variant="body2" noWrap>
                            {task.title}
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            {task.status && (
                              <Chip
                                label={task.status.replace('_', ' ')}
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '0.65rem',
                                  textTransform: 'capitalize',
                                  bgcolor: alpha(getStatusColor(task.status), 0.1),
                                  color: getStatusColor(task.status),
                                }}
                              />
                            )}
                          </Stack>
                        </Box>
                        <Box sx={{ position: 'relative', flex: 1, height: 24 }}>
                          <Tooltip title={`${task.title}: ${fDate(task.startDate)} - ${fDate(task.endDate)}`}>
                            <Box
                              onClick={() => setSelectedTaskId(task.id)}
                              sx={{
                                position: 'absolute',
                                left: taskPosition.left,
                                width: taskPosition.width,
                                height: '100%',
                                borderRadius: 0.5,
                                bgcolor: getStatusColor(task.status),
                                cursor: 'pointer',
                                '&:hover': {
                                  opacity: 0.8,
                                  transform: 'translateY(-2px)',
                                  boxShadow: theme.shadows[4],
                                },
                                transition: 'all 0.2s',
                              }}
                            />
                          </Tooltip>
                        </Box>
                      </Stack>
                    );
                  })}
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Card>

      <TaskDetailsDrawer
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={() => mutate()}
      />
    </Stack>
  );
}

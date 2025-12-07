'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha, useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';

import { endpoints, fetcher } from 'src/utils/axios';
import { IProjectTimeline } from 'src/types/project';
import { fDate } from 'src/utils/format-time';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

type Props = {
  projectId: string;
};

const GANTT_HEADER_HEIGHT = 56;
const GANTT_ROW_HEIGHT = 48;
const DAY_WIDTH = 50;

export function ProjectTimelineView({ projectId }: Props) {
  const theme = useTheme();
  
  const { data, isLoading } = useSWR<IProjectTimeline>(
    endpoints.project.timeline(projectId),
    fetcher
  );

  const timelineData = useMemo(() => {
    if (!data) return null;

    // Calculate min start and max end dates
    let minDate = dayjs();
    let maxDate = dayjs().add(30, 'day');

    if (data.project.startDate) {
      minDate = dayjs(data.project.startDate);
    }

    data.sprints.forEach(sprint => {
      const start = dayjs(sprint.startDate);
      const end = dayjs(sprint.endDate);
      if (start.isBefore(minDate)) minDate = start;
      if (end.isAfter(maxDate)) maxDate = end;
    });

    // Add some padding
    minDate = minDate.subtract(7, 'day');
    maxDate = maxDate.add(7, 'day');

    const totalDays = maxDate.diff(minDate, 'day') + 1;

    return {
      minDate,
      maxDate,
      totalDays,
      sprints: data.sprints,
    };
  }, [data]);

  if (isLoading) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading timeline...
        </Typography>
        <LinearProgress sx={{ maxWidth: 400, mx: 'auto', mt: 2 }} />
      </Box>
    );
  }

  if (!data || !timelineData || data.sprints.length === 0) {
    return (
      <EmptyContent
        filled
        title="No Timeline Data"
        description="Create sprints and tasks to see the project timeline"
        sx={{ py: 10 }}
      />
    );
  }

  const { minDate, totalDays, sprints } = timelineData;

  const getPosition = (date: string) => {
    const diff = dayjs(date).diff(minDate, 'day');
    return diff * DAY_WIDTH;
  };

  const getWidth = (start: string, end: string) => {
    const diff = dayjs(end).diff(dayjs(start), 'day') + 1;
    return diff * DAY_WIDTH;
  };

  return (
    <Card sx={{ height: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6">Project Timeline</Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <Box sx={{ minWidth: totalDays * DAY_WIDTH, position: 'relative' }}>
          
          {/* Header (Dates) */}
          <Stack direction="row" sx={{ height: GANTT_HEADER_HEIGHT, borderBottom: `1px solid ${theme.palette.divider}`, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 9 }}>
            {Array.from({ length: totalDays }).map((_, index) => {
              const date = minDate.add(index, 'day');
              const isToday = date.isSame(dayjs(), 'day');
              
              return (
                <Box
                  key={index}
                  sx={{
                    width: DAY_WIDTH,
                    flexShrink: 0,
                    borderRight: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: isToday ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {date.format('ddd')}
                  </Typography>
                  <Typography variant="body2" fontWeight={isToday ? 'bold' : 'normal'}>
                    {date.format('D')}
                  </Typography>
                </Box>
              );
            })}
          </Stack>

          {/* Grid Lines */}
          <Box sx={{ position: 'absolute', top: GANTT_HEADER_HEIGHT, bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}>
            {Array.from({ length: totalDays }).map((_, index) => (
              <Box
                key={index}
                sx={{
                  position: 'absolute',
                  left: index * DAY_WIDTH,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  bgcolor: theme.palette.divider,
                  opacity: 0.5,
                }}
              />
            ))}
          </Box>

          {/* Content */}
          <Box sx={{ py: 2 }}>
            {sprints.map((sprint) => (
              <Box key={sprint.id} sx={{ mb: 3 }}>
                {/* Sprint Bar */}
                <Box
                  sx={{
                    position: 'relative',
                    height: GANTT_ROW_HEIGHT,
                    mb: 1,
                  }}
                >
                  <Tooltip title={`${sprint.name}: ${fDate(sprint.startDate)} - ${fDate(sprint.endDate)}`}>
                    <Box
                      sx={{
                        position: 'absolute',
                        left: getPosition(sprint.startDate),
                        width: getWidth(sprint.startDate, sprint.endDate),
                        height: 32,
                        top: 8,
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        border: `1px solid ${theme.palette.primary.main}`,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        px: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                    >
                      <Typography variant="subtitle2" color="primary.dark">
                        {sprint.name}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>

                {/* Tasks */}
                {sprint.tasks.map((task) => {
                  if (!task.startDate || !task.dueDate) return null;
                  
                  const statusColor = 
                    task.status === 'done' ? theme.palette.success.main :
                    task.status === 'in_progress' ? theme.palette.warning.main :
                    task.status === 'review' ? theme.palette.info.main :
                    theme.palette.text.secondary;

                  return (
                    <Box
                      key={task.id}
                      sx={{
                        position: 'relative',
                        height: GANTT_ROW_HEIGHT - 10,
                        mb: 0.5,
                      }}
                    >
                      <Tooltip title={`${task.title}: ${fDate(task.startDate)} - ${fDate(task.dueDate)}`}>
                        <Box
                          sx={{
                            position: 'absolute',
                            left: getPosition(task.startDate),
                            width: Math.max(getWidth(task.startDate, task.dueDate), DAY_WIDTH), // Min width
                            height: 24,
                            top: 6,
                            bgcolor: alpha(statusColor, 0.9),
                            borderRadius: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            px: 1,
                            boxShadow: theme.shadows[2],
                            cursor: 'pointer',
                          }}
                        >
                          <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.title}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>

        </Box>
      </Box>
    </Card>
  );
}

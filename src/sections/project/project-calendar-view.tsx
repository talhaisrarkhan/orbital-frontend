'use client';

import type { IProjectCalendarResponse, IProjectCalendarEvent } from 'src/types/project';

import { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';

import { endpoints, fetcher } from 'src/utils/axios';
import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { TaskDetailsDrawer } from './task-details-drawer';

// ----------------------------------------------------------------------

type Props = {
  projectId: string;
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function ProjectCalendarView({ projectId }: Props) {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Calculate date range for the current month view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Extend to include previous/next month days to fill the calendar grid
    const startDay = start.getDay();
    const calendarStart = new Date(start);
    calendarStart.setDate(start.getDate() - startDay);
    
    const endDay = end.getDay();
    const calendarEnd = new Date(end);
    calendarEnd.setDate(end.getDate() + (6 - endDay));
    
    return {
      start: calendarStart.toISOString().split('T')[0],
      end: calendarEnd.toISOString().split('T')[0],
      calendarStart,
      calendarEnd,
    };
  }, [currentDate]);

  const { data: calendarData, isLoading, mutate } = useSWR<IProjectCalendarResponse>(
    [endpoints.project.calendar(projectId), { start: dateRange.start, end: dateRange.end }],
    ([url, params]) => fetcher([url, { params }])
  );

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(dateRange.calendarStart);
    
    while (current <= dateRange.calendarEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [dateRange]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    if (!calendarData) return new Map<string, IProjectCalendarEvent[]>();
    
    const map = new Map<string, IProjectCalendarEvent[]>();
    const allEvents = [...calendarData.sprints, ...calendarData.tasks];
    
    allEvents.forEach((event) => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      const current = new Date(startDate);
      
      while (current <= endDate) {
        const dateKey = current.toISOString().split('T')[0];
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(event);
        current.setDate(current.getDate() + 1);
      }
    });
    
    return map;
  }, [calendarData]);

  const handlePreviousMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  if (isLoading) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Loading calendar...
        </Typography>
        <LinearProgress sx={{ maxWidth: 400, mx: 'auto' }} />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Calendar Header */}
      <Card sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Iconify icon="solar:calendar-bold-duotone" width={24} />
            <Typography variant="h6">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={handleToday} size="small">
              <Typography variant="caption" fontWeight="bold">
                Today
              </Typography>
            </IconButton>
            <IconButton onClick={handlePreviousMonth} size="small">
              <Iconify icon="solar:alt-arrow-left-bold" />
            </IconButton>
            <IconButton onClick={handleNextMonth} size="small">
              <Iconify icon="solar:alt-arrow-right-bold" />
            </IconButton>
          </Stack>
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
                bgcolor: '#3b82f6',
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
                bgcolor: '#10b981',
              }}
            />
            <Typography variant="body2">Task (Done)</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 0.5,
                bgcolor: '#f59e0b',
              }}
            />
            <Typography variant="body2">Task (Other)</Typography>
          </Stack>
        </Stack>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <Box sx={{ p: 2 }}>
          {/* Day Headers */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 1,
              mb: 1,
            }}
          >
            {DAYS_OF_WEEK.map((day) => (
              <Box
                key={day}
                sx={{
                  textAlign: 'center',
                  py: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Calendar Days */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 1,
            }}
          >
            {calendarDays.map((day, index) => {
              const dateKey = day.toISOString().split('T')[0];
              const events = eventsByDate.get(dateKey) || [];
              const isTodayDate = isToday(day);
              const isCurrentMonthDate = isCurrentMonth(day);

              return (
                <Box
                  key={index}
                  sx={{
                    minHeight: 120,
                    p: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    bgcolor: isTodayDate
                      ? alpha(theme.palette.primary.main, 0.08)
                      : 'background.paper',
                    opacity: isCurrentMonthDate ? 1 : 0.5,
                    position: 'relative',
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={isTodayDate ? 'bold' : 'normal'}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: isTodayDate ? theme.palette.primary.main : 'transparent',
                      color: isTodayDate ? 'white' : 'text.primary',
                      mb: 0.5,
                    }}
                  >
                    {day.getDate()}
                  </Typography>

                  <Stack spacing={0.5}>
                    {events.slice(0, 3).map((event, eventIndex) => (
                      <Chip
                        key={`${event.id}-${eventIndex}`}
                        label={event.title}
                        size="small"
                        onClick={() => event.type === 'task' && setSelectedTaskId(event.id)}
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          bgcolor: event.color,
                          color: 'white',
                          cursor: event.type === 'task' ? 'pointer' : 'default',
                          '&:hover': event.type === 'task' ? {
                            opacity: 0.8,
                            transform: 'scale(1.02)',
                          } : {},
                          transition: 'all 0.2s',
                          '& .MuiChip-label': {
                            px: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      />
                    ))}
                    {events.length > 3 && (
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
                        +{events.length - 3} more
                      </Typography>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Card>

      {/* Events Summary */}
      {calendarData && (calendarData.sprints.length > 0 || calendarData.tasks.length > 0) && (
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Events This Month
          </Typography>
          <Stack spacing={2}>
            {calendarData.sprints.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Sprints ({calendarData.sprints.length})
                </Typography>
                <Stack spacing={1}>
                  {calendarData.sprints.map((sprint) => (
                    <Stack
                      key={sprint.id}
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: alpha(sprint.color, 0.08),
                        border: `1px solid ${alpha(sprint.color, 0.2)}`,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: sprint.color,
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {sprint.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fDate(sprint.start)} - {fDate(sprint.end)}
                        </Typography>
                      </Box>
                      <Chip label="Sprint" size="small" />
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}

            {calendarData.tasks.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Tasks ({calendarData.tasks.length})
                </Typography>
                <Stack spacing={1}>
                  {calendarData.tasks.slice(0, 10).map((task) => (
                    <Stack
                      key={task.id}
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      onClick={() => setSelectedTaskId(task.id)}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: alpha(task.color, 0.08),
                        border: `1px solid ${alpha(task.color, 0.2)}`,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: alpha(task.color, 0.16),
                          transform: 'translateX(4px)',
                        },
                        transition: 'all 0.2s',
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: task.color,
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {task.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fDate(task.start)} - {fDate(task.end)}
                        </Typography>
                      </Box>
                      {task.assignee && (
                        <Chip
                          label={task.assignee.name}
                          size="small"
                          avatar={
                            task.assignee.profilePicture ? (
                              <img src={task.assignee.profilePicture} alt={task.assignee.name} />
                            ) : undefined
                          }
                        />
                      )}
                    </Stack>
                  ))}
                  {calendarData.tasks.length > 10 && (
                    <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                      +{calendarData.tasks.length - 10} more tasks
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </Card>
      )}

      <TaskDetailsDrawer
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={() => mutate()}
      />
    </Stack>
  );
}

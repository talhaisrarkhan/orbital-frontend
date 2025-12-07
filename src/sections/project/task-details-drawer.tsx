'use client';

import type { ITask, ITaskHistory } from 'src/types/project';

import { useState } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import { alpha, useTheme } from '@mui/material/styles';

import { endpoints, fetcher } from 'src/utils/axios';
import { fDate, fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { TaskChat } from 'src/sections/chat/task-chat';
import { TaskDialog } from './task-dialog';

// ----------------------------------------------------------------------

type Props = {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
};

export function TaskDetailsDrawer({ taskId, open, onClose, onUpdate }: Props) {
  const theme = useTheme();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('details');

  const { data: task, isLoading, mutate } = useSWR<ITask>(
    taskId ? endpoints.task.details(taskId) : null,
    fetcher
  );

  const { data: history } = useSWR<ITaskHistory[]>(
    taskId ? endpoints.task.history(taskId) : null,
    fetcher
  );

  const handleEditClose = () => {
    setEditDialogOpen(false);
    mutate();
    onUpdate?.();
  };

  const handleChangeTab = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  function getStatusColor(status: string): keyof Theme['palette'] {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'blocked':
        return 'warning';
      default:
        return 'grey'; // safe fallback
    }
  }


  const getHistoryIcon = (field: string) => {
    switch (field) {
      case 'status':
        return 'solar:check-circle-bold-duotone';
      case 'assignedTo':
        return 'solar:user-bold-duotone';
      case 'priority':
        return 'solar:flag-bold-duotone';
      case 'title':
        return 'solar:pen-bold-duotone';
      case 'description':
        return 'solar:document-text-bold-duotone';
      case 'boardColumn':
        return 'solar:move-bold-duotone';
      default:
        return 'solar:history-bold-duotone';
    }
  };

  const formatHistoryValue = (field: string, value: string | undefined) => {
    if (!value) return 'None';
    
    switch (field) {
      case 'status':
        return value.replace('_', ' ').toUpperCase();
      case 'priority':
        return value.toUpperCase();
      default:
        return value;
    }
  };

  if (isLoading) {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 600 } },
        }}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Loading task details...
          </Typography>
          <LinearProgress />
        </Box>
      </Drawer>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 680 },
            backgroundImage: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.paper, 1)})`,
          },
        }}
      >
        <Stack spacing={0} sx={{ height: '100%' }}>
          {/* Enhanced Header with Gradient */}
          <Box
            sx={{
              position: 'relative',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.dark, 0.12)} 100%)`,
              borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              p: 3,
              pb: 0,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                  }}
                >
                  <Iconify icon="solar:document-text-bold-duotone" width={24} sx={{ color: 'white' }} />
                </Box>
                <Typography variant="h5" fontWeight={700}>
                  Task Details
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <IconButton
                  onClick={() => setEditDialogOpen(true)}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.16),
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <Iconify icon="solar:pen-bold-duotone" />
                </IconButton>
                <IconButton
                  onClick={onClose}
                  sx={{
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                      color: 'error.main',
                      transform: 'rotate(90deg)',
                    },
                    transition: 'all 0.3s',
                  }}
                >
                  <Iconify icon="solar:close-circle-bold-duotone" />
                </IconButton>
              </Stack>
            </Stack>

            {/* Task Title and Chips */}
            <Typography variant="h6" sx={{ mb: 2, lineHeight: 1.4 }}>
              {task.title}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 3 }}>
              <Chip
                label={task.priority}
                size="small"
                color={getPriorityColor(task.priority) as any}
                icon={<Iconify icon="solar:flag-bold" width={16} />}
                sx={{
                  textTransform: 'capitalize',
                  fontWeight: 600,
                  height: 28,
                  boxShadow: `0 2px 8px ${alpha(theme.palette[getPriorityColor(task.priority) as 'error' | 'warning' | 'info'].main, 0.3)}`,
                }}
              />
              <Chip
                label={task.status.replace('_', ' ')}
                size="small"
                color={getStatusColor(task.status) as any}
                icon={<Iconify icon="solar:check-circle-bold" width={16} />}
                sx={{
                  textTransform: 'capitalize',
                  fontWeight: 600,
                  height: 28,
                  boxShadow: `0 2px 8px ${alpha(theme.palette[getStatusColor(task.status) as 'success' | 'warning' | 'info' | 'default'].main || theme.palette.grey[500], 0.3)}`,
                }}
              />
              {task.storyPoints && (
                <Chip
                  icon={<Iconify icon="solar:star-bold" width={16} />}
                  label={`${task.storyPoints} points`}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 28,
                    fontWeight: 600,
                    borderWidth: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                    borderColor: theme.palette.warning.main,
                    color: 'warning.dark',
                  }}
                />
              )}
            </Stack>

            <Tabs 
              value={currentTab} 
              onChange={handleChangeTab}
              sx={{
                '& .MuiTab-root': {
                  minHeight: 48,
                  minWidth: 100,
                }
              }}
            >
              <Tab 
                value="details" 
                label="Details" 
                icon={<Iconify icon="solar:document-text-bold-duotone" width={20} />} 
                iconPosition="start"
              />
              <Tab 
                value="chat" 
                label="Discussion" 
                icon={<Iconify icon="solar:chat-round-dots-bold-duotone" width={20} />} 
                iconPosition="start"
              />
              <Tab 
                value="history" 
                label="History" 
                icon={<Iconify icon="solar:history-bold-duotone" width={20} />} 
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Scrollable Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {currentTab === 'details' && (
              <Box sx={{ p: 3 }}>
                <Stack spacing={3}>
                  {/* Description Card */}
                  {task.description && (
                    <Card
                      sx={{
                        p: 2.5,
                        bgcolor: alpha(theme.palette.grey[500], 0.04),
                        border: `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
                        borderRadius: 2,
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            color: 'info.main',
                            flexShrink: 0,
                          }}
                        >
                          <Iconify icon="solar:document-text-bold-duotone" width={18} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Description
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            {task.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </Card>
                  )}

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <Card
                      sx={{
                        p: 2.5,
                        bgcolor: alpha(theme.palette.grey[500], 0.04),
                        border: `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
                        borderRadius: 2,
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                            color: 'secondary.main',
                            flexShrink: 0,
                          }}
                        >
                          <Iconify icon="solar:tag-bold-duotone" width={18} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                            Tags
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                            {task.tags.map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderRadius: 1.5,
                                  fontWeight: 500,
                                  borderColor: alpha(theme.palette.primary.main, 0.3),
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                    borderColor: theme.palette.primary.main,
                                  },
                                }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </Card>
                  )}

                  {/* Metadata Grid */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                    {/* Creator & Assignee */}
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
                          People
                        </Typography>
                        <Stack spacing={2}>
                          {task.creator && (
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.background.neutral, 0.5) }}>
                              <Avatar 
                                src={task.creator.profilePicture} 
                                alt={task.creator.name}
                                sx={{ width: 40, height: 40, border: `2px solid ${theme.palette.background.paper}` }} 
                              />
                              <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  Created by
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {task.creator.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {fDateTime(task.createdAt)}
                                </Typography>
                              </Box>
                            </Stack>
                          )}

                          {task.assignee ? (
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.background.neutral, 0.5) }}>
                              <Avatar 
                                src={task.assignee.profilePicture} 
                                alt={task.assignee.name}
                                sx={{ width: 40, height: 40, border: `2px solid ${theme.palette.background.paper}` }}
                              />
                              <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  Assigned to
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {task.assignee.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {task.assignee.email}
                                </Typography>
                              </Box>
                            </Stack>
                          ) : (
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.background.neutral, 0.5), borderStyle: 'dashed', borderWidth: 1, borderColor: 'divider' }}>
                              <Avatar sx={{ width: 40, height: 40, bgcolor: 'transparent', border: `1px dashed ${theme.palette.divider}`, color: 'text.disabled' }}>
                                <Iconify icon="solar:user-rounded-bold" />
                              </Avatar>
                              <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  Assigned to
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                  Unassigned
                                </Typography>
                              </Box>
                            </Stack>
                          )}
                        </Stack>
                      </Box>
                    </Stack>

                    {/* Dates */}
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
                          Timeline
                        </Typography>
                        <Stack spacing={2}>
                          <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.04), border: `1px solid ${alpha(theme.palette.info.main, 0.08)}` }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'white',
                                color: 'info.main',
                                boxShadow: theme.customShadows.z8,
                              }}
                            >
                              <Iconify icon="solar:calendar-bold-duotone" width={20} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Start Date
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {task.startDate ? fDate(task.startDate) : 'Not set'}
                              </Typography>
                            </Box>
                          </Stack>

                          <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.04), border: `1px solid ${alpha(theme.palette.warning.main, 0.08)}` }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'white',
                                color: 'warning.main',
                                boxShadow: theme.customShadows.z8,
                              }}
                            >
                              <Iconify icon="solar:calendar-mark-bold-duotone" width={20} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Due Date
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {task.dueDate ? fDate(task.dueDate) : 'Not set'}
                              </Typography>
                            </Box>
                          </Stack>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            )}

            {currentTab === 'chat' && (
              <TaskChat taskId={task.id} />
            )}

            {currentTab === 'history' && (
              <Box sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                  <Iconify icon="solar:history-bold-duotone" width={24} color="primary.main" />
                  <Typography variant="h6">Activity History</Typography>
                </Stack>

                {history && history.length > 0 ? (
                  <Timeline
                    sx={{
                      p: 0,
                      m: 0,
                      '& .MuiTimelineItem-root': {
                        '&:before': { display: 'none' },
                      },
                    }}
                  >
                    {history.map((item, index) => (
                      <TimelineItem key={item.id}>
                        <TimelineSeparator>
                          <TimelineDot 
                            sx={{ 
                              bgcolor: alpha(theme.palette.primary.main, 0.1), 
                              borderWidth: 2, 
                              borderColor: 'primary.main',
                              color: 'primary.main',
                              m: 0,
                              boxShadow: 'none',
                            }}
                          >
                            <Iconify icon={getHistoryIcon(item.field)} width={16} />
                          </TimelineDot>
                          {index < history.length - 1 && (
                            <TimelineConnector sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), width: 2 }} />
                          )}
                        </TimelineSeparator>
                        <TimelineContent sx={{ py: 0, px: 3, pb: 4 }}>
                          <Card
                            sx={{
                              p: 2,
                              bgcolor: 'background.paper',
                              border: `1px solid ${theme.palette.divider}`,
                              boxShadow: 'none',
                              '&:hover': {
                                boxShadow: theme.customShadows.z4,
                                borderColor: 'primary.main',
                              },
                              transition: 'all 0.2s',
                            }}
                          >
                            <Stack spacing={1.5}>
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                  <Avatar
                                    src={item.updater?.profilePicture}
                                    alt={item.updater?.name}
                                    sx={{ width: 24, height: 24 }}
                                  />
                                  <Typography variant="subtitle2">
                                    {item.updater?.name || 'Unknown'}
                                  </Typography>
                                </Stack>
                                <Typography variant="caption" color="text.secondary" sx={{ bgcolor: alpha(theme.palette.grey[500], 0.08), px: 1, py: 0.5, borderRadius: 1 }}>
                                  {fDateTime(item.createdAt)}
                                </Typography>
                              </Stack>

                              <Typography variant="body2" color="text.secondary">
                                Changed <strong>{item.field}</strong>
                                {item.oldValue && (
                                  <>
                                    {' '}from <Chip label={formatHistoryValue(item.field, item.oldValue)} size="small" sx={{ height: 20, fontSize: '0.75rem' }} />
                                  </>
                                )}
                                {item.newValue && (
                                  <>
                                    {' '}to <Chip label={formatHistoryValue(item.field, item.newValue)} size="small" color="primary" sx={{ height: 20, fontSize: '0.75rem' }} />
                                  </>
                                )}
                              </Typography>

                              {item.remark && (
                                <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.grey[500], 0.04), borderRadius: 1, borderLeft: `3px solid ${theme.palette.grey[400]}` }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    {item.remark}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          </Card>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                ) : (
                  <Stack alignItems="center" justifyContent="center" sx={{ py: 8, bgcolor: alpha(theme.palette.grey[500], 0.04), borderRadius: 2, border: `1px dashed ${theme.palette.divider}` }}>
                    <Box sx={{ p: 2, borderRadius: '50%', bgcolor: alpha(theme.palette.grey[500], 0.08), mb: 2 }}>
                      <Iconify icon="solar:history-bold-duotone" width={32} color="text.disabled" />
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary">
                      No activity history yet
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      Changes to this task will appear here
                    </Typography>
                  </Stack>
                )}
              </Box>
            )}
          </Box>
        </Stack>
      </Drawer>

      {task && (
        <TaskDialog
          open={editDialogOpen}
          onClose={handleEditClose}
          projectId={task.projectId}
          boardId={task.boardId || undefined}
          sprintId={task.sprintId || undefined}
          columnId={task.boardColumnId || undefined}
          task={task}
          isBacklog={task.isBacklog}
        />
      )}
    </>
  );
}

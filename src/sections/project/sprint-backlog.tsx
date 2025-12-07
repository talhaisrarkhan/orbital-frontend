'use client';

import type { ITask } from 'src/types/project';

import { useState } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { alpha, useTheme } from '@mui/material/styles';

import { endpoints, fetcher } from 'src/utils/axios';
import { fDate } from 'src/utils/format-time';
import { addTaskToSprintBacklog, moveTaskToBoard } from 'src/api/project';
import type { IBoard } from 'src/types/project';
import { toast } from 'src/components/snackbar';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { TaskDialog } from './task-dialog';
import { useProjectPermissions } from 'src/hooks/use-project-permissions';

// ----------------------------------------------------------------------

type Props = {
  sprintId: string;
  projectId: string;
  projectManagerId?: number;
};

const PRIORITY_COLORS = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error',
} as const;

export function SprintBacklog({ sprintId, projectId, projectManagerId }: Props) {
  const theme = useTheme();
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openCreateTask, setOpenCreateTask] = useState(false);
  const [moveToBoardTaskId, setMoveToBoardTaskId] = useState<string | null>(null);
  const { canManageBacklog } = useProjectPermissions(projectManagerId);

  const { data: backlogTasks, isLoading, mutate } = useSWR<ITask[]>(
    endpoints.sprint.backlog(sprintId),
    fetcher
  );

  const handleTaskAdded = () => {
    mutate();
    setOpenAddDialog(false);
  };

  const handleTaskCreated = () => {
    mutate();
    setOpenCreateTask(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading sprint backlog...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Sprint Backlog</Typography>
          {canManageBacklog && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => setOpenCreateTask(true)}
              >
                Create Task
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:import-bold-duotone" />}
                onClick={() => setOpenAddDialog(true)}
              >
                Add from Project Backlog
              </Button>
            </Stack>
          )}
        </Stack>

        {!backlogTasks || backlogTasks.length === 0 ? (
          <EmptyContent
            filled
            title="No Sprint Backlog Items"
            description="Create tasks or add them from the project backlog"
            sx={{ py: 5 }}
          />
        ) : (
          <Stack spacing={2}>
            {backlogTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                theme={theme} 
                onMoveToBoard={canManageBacklog ? () => setMoveToBoardTaskId(task.id) : undefined}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <TaskDialog
        open={openCreateTask}
        onClose={() => {
          setOpenCreateTask(false);
          mutate();
        }}
        projectId={projectId}
        sprintId={sprintId}
        isBacklog={true}
      />

      <AddToSprintBacklogDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        projectId={projectId}
        sprintId={sprintId}
        onSuccess={handleTaskAdded}
      />

      {moveToBoardTaskId && (
        <MoveToBoardDialog
          open={!!moveToBoardTaskId}
          onClose={() => setMoveToBoardTaskId(null)}
          taskId={moveToBoardTaskId}
          sprintId={sprintId}
          onSuccess={() => {
            mutate();
            setMoveToBoardTaskId(null);
          }}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------

function TaskCard({ task, theme, onMoveToBoard }: { task: ITask; theme: any; onMoveToBoard?: () => void }) {
  return (
    <Card
      sx={{
        p: 2,
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
            {onMoveToBoard && (
              <IconButton onClick={onMoveToBoard} size="small" sx={{ ml: 1 }}>
                <Iconify icon="solar:export-bold-duotone" />
              </IconButton>
            )}
          </Stack>

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
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

type AddDialogProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  sprintId: string;
  onSuccess: () => void;
};

function AddToSprintBacklogDialog({ open, onClose, projectId, sprintId, onSuccess }: AddDialogProps) {
  const theme = useTheme();
  const [addingTaskId, setAddingTaskId] = useState<string | null>(null);

  // Fetch project backlog tasks (tasks not in any sprint or board)
  // Assuming isBacklog=true fetches project backlog
  const { data: projectBacklog, isLoading } = useSWR<ITask[]>(
    open ? [endpoints.task.list, { projectId, isBacklog: true }] : null,
    ([url, params]) => fetcher([url, { params }])
  );

  const handleAddTask = async (taskId: string) => {
    try {
      setAddingTaskId(taskId);
      await addTaskToSprintBacklog(sprintId, taskId);
      toast.success('Task added to sprint backlog');
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add task');
    } finally {
      setAddingTaskId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add to Sprint Backlog</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography>Loading tasks...</Typography>
          </Box>
        ) : !projectBacklog || projectBacklog.length === 0 ? (
          <EmptyContent
            title="No Tasks Available"
            description="There are no tasks in the project backlog."
            sx={{ py: 5 }}
          />
        ) : (
          <Stack spacing={2} sx={{ pt: 1, pb: 2 }}>
            {projectBacklog.map((task) => (
              <Stack
                key={task.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              >
                <Box>
                  <Typography variant="subtitle2">{task.title}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip
                      label={task.priority}
                      size="small"
                      color={PRIORITY_COLORS[task.priority]}
                      sx={{ height: 20, textTransform: 'capitalize' }}
                    />
                    {task.storyPoints && (
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                        <Iconify icon="solar:star-bold-duotone" width={14} sx={{ mr: 0.5 }} />
                        {task.storyPoints}
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <LoadingButton
                  variant="outlined"
                  size="small"
                  loading={addingTaskId === task.id}
                  onClick={() => handleAddTask(task.id)}
                >
                  Add
                </LoadingButton>
              </Stack>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

type MoveDialogProps = {
  open: boolean;
  onClose: () => void;
  taskId: string;
  sprintId: string;
  onSuccess: () => void;
};

function MoveToBoardDialog({ open, onClose, taskId, sprintId, onSuccess }: MoveDialogProps) {
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: boards } = useSWR<IBoard[]>(
    open ? [endpoints.board.list, { sprintId }] : null,
    ([url, params]) => fetcher([url, { params }])
  );

  const selectedBoard = boards?.find((b) => b.id === selectedBoardId);

  const handleSubmit = async () => {
    if (!selectedBoardId || !selectedColumnId) return;
    try {
      setIsSubmitting(true);
      await moveTaskToBoard(sprintId, {
        taskId,
        boardId: selectedBoardId,
        boardColumnId: selectedColumnId,
        orderIndex: 0,
      });
      toast.success('Task moved to board');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to move task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Move to Board</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <TextField
            select
            label="Select Board"
            value={selectedBoardId}
            onChange={(e) => {
                setSelectedBoardId(e.target.value);
                setSelectedColumnId('');
            }}
            fullWidth
          >
            {boards?.map((board) => (
              <MenuItem key={board.id} value={board.id}>
                {board.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Select Column"
            value={selectedColumnId}
            onChange={(e) => setSelectedColumnId(e.target.value)}
            fullWidth
            disabled={!selectedBoardId}
          >
            {selectedBoard?.columns?.map((column) => (
              <MenuItem key={column.id} value={column.id}>
                {column.title}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <LoadingButton
            variant="contained"
            loading={isSubmitting}
            onClick={handleSubmit}
            disabled={!selectedBoardId || !selectedColumnId}
        >
            Move
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

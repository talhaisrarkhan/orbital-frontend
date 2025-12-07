'use client';

import type { ITask, ITaskCreatePayload, IProjectMember } from 'src/types/project';

import { z as zod } from 'zod';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import useSWR from 'swr';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

import { endpoints, fetcher } from 'src/utils/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { createTask, updateTask, getProjectMembers } from 'src/api/project';

// ----------------------------------------------------------------------

export type TaskSchemaType = zod.infer<typeof TaskSchema>;

export const TaskSchema = zod.object({
  title: zod.string().min(1, { message: 'Title is required!' }),
  description: zod.string().optional(),
  priority: zod.enum(['low', 'medium', 'high', 'critical']),
  storyPoints: zod.number().optional(),
  assignedTo: zod.string().optional(),
  dueDate: zod.string().optional(),
  tags: zod.string().optional(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  boardId?: string;
  projectId: string;
  sprintId?: string;
  columnId?: string;
  task?: ITask | null;
  isBacklog?: boolean;
};

export function TaskDialog({
  open,
  onClose,
  boardId,
  projectId,
  sprintId,
  columnId,
  task,
  isBacklog,
}: Props) {
  const { data: projectMembers } = useSWR<IProjectMember[]>(
    projectId ? `/projects/${projectId}/members` : null,
    () => getProjectMembers(projectId)
  );

  const defaultValues = useMemo(
    () => ({
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || 'medium',
      storyPoints: task?.storyPoints || 0,
      assignedTo: task?.assignedTo?.toString() || '',
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      tags: task?.tags?.join(', ') || '',
    }),
    [task]
  );

  const methods = useForm<TaskSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(TaskSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        boardId: boardId || '', // Handle optional boardId
        projectId: projectId,
        boardColumnId: columnId,
        sprintId: sprintId,
        title: data.title,
        description: data.description,
        priority: data.priority as any,
        storyPoints: data.storyPoints,
        assignedTo: data.assignedTo ? parseInt(data.assignedTo, 10) : undefined,
        dueDate: data.dueDate || undefined,
        isBacklog: isBacklog, // Add isBacklog to payload
        tags: data.tags
          ? data.tags
              .split(',')
              .map((t) => t.trim())
              .filter((t) => t)
          : undefined,
      };

      if (task) {
        await updateTask(task.id, payload);
        toast.success('Task updated successfully!');
      } else {
        await createTask(payload);
        toast.success('Task created successfully!');
      }

      reset();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(task ? 'Update failed!' : 'Create failed!');
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Field.Text name="title" label="Task Title" placeholder="Enter task title" />

            <Field.Text
              name="description"
              label="Description"
              placeholder="Describe the task"
              multiline
              rows={4}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field.Select name="priority" label="Priority">
                  <MenuItem value="low">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip label="Low" size="small" color="info" />
                    </Stack>
                  </MenuItem>
                  <MenuItem value="medium">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip label="Medium" size="small" color="warning" />
                    </Stack>
                  </MenuItem>
                  <MenuItem value="high">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip label="High" size="small" color="error" />
                    </Stack>
                  </MenuItem>
                  <MenuItem value="critical">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip label="Critical" size="small" color="error" />
                    </Stack>
                  </MenuItem>
                </Field.Select>
              </Grid>
              <Grid item xs={12} md={6}>
                <Field.Text
                  name="storyPoints"
                  label="Story Points"
                  type="number"
                  placeholder="e.g., 5"
                />
              </Grid>
            </Grid>

            <Field.Select name="assignedTo" label="Assign To">
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {projectMembers?.map((member) => (
                <MenuItem key={member?.user?.id} value={member?.user?.id?.toString()}>
                  {member?.user?.name} ({member?.user?.email})  {member?.role}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text
              name="dueDate"
              label="Due Date"
              type="date"
              InputLabelProps={{ shrink: true }}
            />

            <Field.Text
              name="tags"
              label="Tags"
              placeholder="backend, api, authentication (comma separated)"
              helperText="Enter tags separated by commas"
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {task ? 'Save Changes' : 'Create Task'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

'use client';

import type { ISprint, ISprintCreatePayload } from 'src/types/project';

import { z as zod } from 'zod';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { createSprint, updateSprint, createBoard } from 'src/api/project';

// ----------------------------------------------------------------------

export type SprintSchemaType = zod.infer<typeof SprintSchema>;

export const SprintSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  goal: zod.string().optional(),
  startDate: zod.string().min(1, { message: 'Start date is required!' }),
  endDate: zod.string().min(1, { message: 'End date is required!' }),
  velocity: zod.number().optional(),
  isActive: zod.boolean(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  sprint?: ISprint | null;
};

export function SprintDialog({ open, onClose, projectId, sprint }: Props) {
  const defaultValues = useMemo(
    () => ({
      name: sprint?.name || '',
      goal: sprint?.goal || '',
      startDate: sprint?.startDate
        ? new Date(sprint.startDate).toISOString().split('T')[0]
        : '',
      endDate: sprint?.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : '',
      velocity: sprint?.velocity || 0,
      isActive: sprint?.isActive || false,
    }),
    [sprint]
  );

  const methods = useForm<SprintSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(SprintSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: ISprintCreatePayload = {
        projectId,
        name: data.name,
        goal: data.goal,
        startDate: data.startDate,
        endDate: data.endDate,
        velocity: data.velocity,
        isActive: data.isActive,
      };

      if (sprint) {
        await updateSprint(sprint.id, payload);
        toast.success('Sprint updated successfully!');
      } else {
        // Create sprint
        const newSprint = await createSprint(payload);
        
        // Automatically create a board for the sprint with default columns
        await createBoard({
          projectId,
          sprintId: newSprint.id,
          name: `${data.name} Board`,
          description: 'Sprint board for task management',
          columns: [
            { title: 'To Do', orderIndex: 0 },
            { title: 'In Progress', wipLimit: 3, orderIndex: 1 },
            { title: 'Review', orderIndex: 2 },
            { title: 'Done', orderIndex: 3 },
          ],
        });
        
        toast.success('Sprint and board created successfully!');
      }

      reset();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(sprint ? 'Update failed!' : 'Create failed!');
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{sprint ? 'Edit Sprint' : 'Create New Sprint'}</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Field.Text name="name" label="Sprint Name" placeholder="e.g., Sprint 1" />

            <Field.Text
              name="goal"
              label="Sprint Goal"
              placeholder="What do you want to achieve?"
              multiline
              rows={2}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field.Text
                  name="startDate"
                  label="Start Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field.Text
                  name="endDate"
                  label="End Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Field.Text
              name="velocity"
              label="Velocity (Story Points)"
              type="number"
              placeholder="Expected story points"
            />

            <Field.Switch name="isActive" label="Set as Active Sprint" />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {sprint ? 'Save Changes' : 'Create Sprint'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

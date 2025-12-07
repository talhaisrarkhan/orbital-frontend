'use client';

import type { IBoardColumn } from 'src/types/project';

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

import { addBoardColumn, updateBoardColumn } from 'src/api/project';

// ----------------------------------------------------------------------

export type ColumnSchemaType = zod.infer<typeof ColumnSchema>;

export const ColumnSchema = zod.object({
  title: zod.string().min(1, { message: 'Title is required!' }),
  wipLimit: zod.number().optional(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  boardId: string;
  column?: IBoardColumn | null;
  columnCount?: number;
};

export function ColumnDialog({ open, onClose, boardId, column, columnCount = 0 }: Props) {
  const defaultValues = useMemo(
    () => ({
      title: column?.title || '',
      wipLimit: column?.wipLimit || 0,
    }),
    [column]
  );

  const methods = useForm<ColumnSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(ColumnSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (column) {
        // Update existing column
        await updateBoardColumn(column.id, {
          title: data.title,
          wipLimit: data.wipLimit || undefined,
        });
        toast.success('Column updated successfully!');
      } else {
        // Create new column
        await addBoardColumn(boardId, {
          title: data.title,
          wipLimit: data.wipLimit || undefined,
          orderIndex: columnCount, // Add at the end
        });
        toast.success('Column created successfully!');
      }

      reset();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(column ? 'Update failed!' : 'Create failed!');
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{column ? 'Edit Column' : 'Create New Column'}</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Field.Text 
              name="title" 
              label="Column Title" 
              placeholder="e.g., Testing, Deployment" 
            />

            <Field.Text
              name="wipLimit"
              label="WIP Limit (Work In Progress)"
              type="number"
              placeholder="e.g., 3"
              helperText="Optional: Limit the number of tasks in this column"
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {column ? 'Save Changes' : 'Create Column'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

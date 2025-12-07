'use client';

import type { IBoard, IBoardCreatePayload } from 'src/types/project';

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

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { createBoard, updateBoard } from 'src/api/project';

// ----------------------------------------------------------------------

export type BoardSchemaType = zod.infer<typeof BoardSchema>;

export const BoardSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  description: zod.string().optional(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  sprintId?: string;
  board?: IBoard | null;
};

export function BoardDialog({ open, onClose, projectId, sprintId, board }: Props) {
  const defaultValues = useMemo(
    () => ({
      name: board?.name || '',
      description: board?.description || '',
    }),
    [board]
  );

  const methods = useForm<BoardSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(BoardSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: IBoardCreatePayload = {
        projectId,
        sprintId,
        name: data.name,
        description: data.description,
        columns: board
          ? undefined
          : [
              { title: 'To Do', orderIndex: 0 },
              { title: 'In Progress', wipLimit: 3, orderIndex: 1 },
              { title: 'Review', orderIndex: 2 },
              { title: 'Done', orderIndex: 3 },
            ],
      };

      if (board) {
        await updateBoard(board.id, payload);
        toast.success('Board updated successfully!');
      } else {
        await createBoard(payload);
        toast.success('Board created successfully!');
      }

      reset();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(board ? 'Update failed!' : 'Create failed!');
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{board ? 'Edit Board' : 'Create New Board'}</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Field.Text name="name" label="Board Name" placeholder="e.g., Development Board" />

            <Field.Text
              name="description"
              label="Description"
              placeholder="Brief description of the board"
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {board ? 'Save Changes' : 'Create Board'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
